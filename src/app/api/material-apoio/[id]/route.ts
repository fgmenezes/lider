import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import minioClient from '@/lib/minio';

const BUCKET_NAME = 'sistemalider';

// DELETE: Remove arquivo de material de apoio
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const materialId = params.id;
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar o material de apoio com todas as relações necessárias
    const material = await prisma.materialApoio.findUnique({
      where: { id: materialId },
      include: {
        meeting: {
          include: {
            smallGroup: {
              include: {
                leaders: { include: { user: true } }
              }
            }
          }
        },
        usuario: true
      }
    });

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 });
    }

    // Verificar permissões (apenas o autor, MASTER ou LEADER do grupo podem deletar)
    const isAuthor = material.usuarioId === session.user.id;
    const isLeader = material.meeting.smallGroup.leaders.some(
      leader => leader.userId === session.user.id
    );
    const isMaster = session.user.role === 'MASTER';

    if (!isAuthor && !isLeader && !isMaster) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar este material' },
        { status: 403 }
      );
    }

    // Log da operação de exclusão
    console.log(`Iniciando exclusão do material de apoio:`, {
      materialId,
      nome: material.nome,
      arquivoUrl: material.arquivoUrl,
      usuarioId: session.user.id,
      isAuthor,
      isLeader,
      isMaster
    });

    let minioDeleteSuccess = false;
    let minioError = null;

    // Tentar remover o arquivo do MinIO primeiro
    try {
      // Extrair o caminho do arquivo da URL completa
      const url = new URL(material.arquivoUrl);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      
      // Encontrar o índice do bucket na URL
      const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // Pegar o caminho do arquivo após o nome do bucket
        const objectPath = pathParts.slice(bucketIndex + 1).join('/');
        
        console.log(`Tentando remover objeto do MinIO:`, {
          bucket: BUCKET_NAME,
          objectPath,
          originalUrl: material.arquivoUrl
        });
        
        // Verificar se o objeto existe antes de tentar remover
        let objectExists = false;
        try {
          await minioClient.statObject(BUCKET_NAME, objectPath);
          objectExists = true;
          console.log(`Objeto encontrado no MinIO: ${objectPath}`);
        } catch (statError: any) {
          console.log(`Objeto não encontrado no MinIO: ${objectPath}`, {
            error: statError.message || statError
          });
        }
        
        // Remover o objeto do MinIO (mesmo se não existir, para garantir)
        try {
          await minioClient.removeObject(BUCKET_NAME, objectPath);
          minioDeleteSuccess = true;
          console.log(`Objeto removido com sucesso do MinIO: ${objectPath}`);
        } catch (removeError: any) {
          minioError = removeError;
          console.error(`Erro ao remover objeto do MinIO:`, {
            error: removeError.message || removeError,
            objectPath,
            bucket: BUCKET_NAME
          });
        }
        
      } else {
        minioError = new Error('Não foi possível extrair o caminho do objeto da URL');
        console.error('Erro na extração do caminho do objeto:', {
          url: material.arquivoUrl,
          pathParts: pathParts,
          bucketName: BUCKET_NAME,
          bucketIndex
        });
      }
    } catch (urlError: any) {
      minioError = urlError;
      console.error('Erro ao processar URL do arquivo:', {
        error: urlError.message || urlError,
        url: material.arquivoUrl
      });
    }

    // Usar transação para garantir consistência na exclusão do banco
    try {
      await prisma.$transaction(async (tx) => {
        // Verificar se o material ainda existe (pode ter sido deletado por outro processo)
        const materialExists = await tx.materialApoio.findUnique({
          where: { id: materialId }
        });

        if (!materialExists) {
          throw new Error('Material não encontrado durante a transação');
        }

        // Deletar registro do banco
        await tx.materialApoio.delete({
          where: { id: materialId }
        });

        console.log(`Material removido do banco de dados: ${materialId}`);
      });

      // Log do resultado final
      const result = {
        materialId,
        nome: material.nome,
        minioDeleteSuccess,
        databaseDeleteSuccess: true,
        minioError: minioError?.message || null
      };

      console.log('Exclusão do material concluída:', result);

      // Retornar resposta baseada no resultado
      if (minioDeleteSuccess) {
        return NextResponse.json({
          message: 'Material de apoio deletado com sucesso',
          details: result
        });
      } else {
        return NextResponse.json({
          message: 'Material removido do banco de dados, mas houve problema na remoção do arquivo',
          warning: 'O arquivo pode ainda existir no storage',
          details: result
        }, { status: 207 }); // 207 Multi-Status para indicar sucesso parcial
      }

    } catch (dbError: any) {
      console.error('Erro ao deletar material do banco de dados:', {
        error: dbError.message || dbError,
        materialId
      });
      
      // Se falhou no banco mas conseguiu no MinIO, temos um problema
      if (minioDeleteSuccess) {
        console.error('INCONSISTÊNCIA: Arquivo removido do MinIO mas falha no banco de dados');
      }
      
      throw dbError; // Re-throw para ser capturado pelo catch externo
    }

  } catch (error: any) {
    console.error('Erro geral ao deletar material de apoio:', {
      error: error.message || error,
      materialId,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Falha na exclusão do material de apoio',
        materialId
      },
      { status: 500 }
    );
  }
}