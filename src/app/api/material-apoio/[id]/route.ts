import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Client } from 'minio';

// Configuração do MinIO
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT?.replace('https://', '').replace('http://', '') || 'localhost',
  port: process.env.MINIO_ENDPOINT?.includes('https://') ? 443 : 9000,
  useSSL: process.env.MINIO_ENDPOINT?.includes('https://') || false,
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || ''
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'material-apoio';

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
      // Deletar arquivo do MinIO
      await minioClient.removeObject(BUCKET_NAME, material.arquivoUrl);
    } catch (minioError) {
      console.error('Erro ao deletar arquivo do MinIO:', minioError);
      // Continuar com a deleção do registro mesmo se houver erro no MinIO
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