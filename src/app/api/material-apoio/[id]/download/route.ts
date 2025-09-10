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

// GET: Gera presigned URL para download do arquivo
export async function GET(
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

    // Verificar permissões (todos podem visualizar/baixar)
    const userMinistryId = session.user.role === 'MASTER' 
      ? session.user.masterMinistryId 
      : session.user.ministryId;
    
    const isLeader = material.meeting.smallGroup.leaders.some(
      leader => leader.userId === session.user.id
    );
    
    if (material.meeting.smallGroup.ministryId !== userMinistryId && 
        !isLeader && 
        session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    try {
      // Verificar se o arquivo existe no MinIO
      await minioClient.statObject(BUCKET_NAME, material.arquivoUrl);
      
      // Gerar presigned URL para download (válido por 10 minutos)
      const presignedUrl = await minioClient.presignedGetObject(
        BUCKET_NAME,
        material.arquivoUrl,
        10 * 60 // 10 minutos
      );

      return NextResponse.json({
        downloadUrl: presignedUrl,
        fileName: material.nome,
        expiresIn: '10 minutos'
      });

    } catch (minioError) {
      console.error('Erro ao gerar URL de download:', minioError);
      return NextResponse.json(
        { error: 'Arquivo não encontrado no storage' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar download:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}