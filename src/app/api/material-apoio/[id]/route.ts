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
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const materialId = params.id;

    // Buscar o material de apoio
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

    try {
      // Extrair o caminho do arquivo da URL completa
      // URL formato: https://endpoint/bucket/path/to/file
      const url = new URL(material.arquivoUrl);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      
      // Encontrar o índice do bucket na URL
      const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // Pegar o caminho do arquivo após o nome do bucket
        const objectPath = pathParts.slice(bucketIndex + 1).join('/');
        
        console.log('Removendo arquivo do MinIO:', {
          bucket: BUCKET_NAME,
          objectPath: objectPath,
          originalUrl: material.arquivoUrl
        });
        
        // Verificar se o objeto existe antes de tentar remover
        try {
          await minioClient.statObject(BUCKET_NAME, objectPath);
          console.log('Objeto encontrado, procedendo com a remoção');
        } catch (statError) {
          console.warn('Objeto não encontrado no MinIO:', objectPath);
          // Continuar mesmo se o objeto não existir
        }
        
        // Remover o objeto do MinIO
        await minioClient.removeObject(BUCKET_NAME, objectPath);
        console.log('Arquivo removido do MinIO com sucesso:', objectPath);
        
      } else {
        console.warn('Não foi possível extrair o caminho do arquivo da URL:', {
          url: material.arquivoUrl,
          pathParts: pathParts,
          bucketName: BUCKET_NAME
        });
      }
    } catch (minioError) {
      console.error('Erro ao deletar arquivo do MinIO:', {
        error: minioError.message || minioError,
        url: material.arquivoUrl,
        bucket: BUCKET_NAME
      });
      // Continuar com a deleção do registro mesmo se houver erro no MinIO
      // para evitar registros órfãos no banco de dados
    }

    // Deletar registro do banco
    await prisma.materialApoio.delete({
      where: { id: materialId }
    });

    return NextResponse.json({
      message: 'Material de apoio deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar material de apoio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}