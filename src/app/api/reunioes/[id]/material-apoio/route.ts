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

// GET: Lista arquivos de material de apoio da reunião
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const meetingId = params.id;

    // Verificar se a reunião existe e obter dados do pequeno grupo
    const meeting = await prisma.smallGroupMeeting.findUnique({
      where: { id: meetingId },
      include: {
        smallGroup: {
          include: {
            leaders: { include: { user: true } },
            ministry: true
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar permissões
    const userMinistryId = session.user.role === 'MASTER' 
      ? session.user.masterMinistryId 
      : session.user.ministryId;
    
    const isLeader = meeting.smallGroup.leaders.some(
      leader => leader.userId === session.user.id
    );
    
    if (meeting.smallGroup.ministryId !== userMinistryId && 
        !isLeader && 
        session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar arquivos de material de apoio
    const materials = await prisma.materialApoio.findMany({
      where: {
        meetingId
      },
      include: {
        usuario: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        date: meeting.date,
        smallGroupName: meeting.smallGroup.name
      },
      materials: materials.map(material => ({
        id: material.id,
        nome: material.nome,
        uploadedBy: material.usuario.name,
        uploadedAt: material.createdAt,
        canDelete: material.usuarioId === session.user.id || 
                  session.user.role === 'MASTER' || 
                  isLeader
      }))
    });

  } catch (error) {
    console.error('Erro ao buscar material de apoio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST: Gerar presigned URL para upload e salvar metadados
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const meetingId = params.id;
    const body = await req.json();
    const { nome, fileSize, fileType } = body;

    if (!nome || !fileSize || !fileType) {
      return NextResponse.json(
        { error: 'Nome, tamanho e tipo do arquivo são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo (apenas PDF)
    if (fileType !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são permitidos' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 5MB)
    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB permitido' },
        { status: 400 }
      );
    }

    // Verificar se a reunião existe e obter dados do pequeno grupo
    const meeting = await prisma.smallGroupMeeting.findUnique({
      where: { id: meetingId },
      include: {
        smallGroup: {
          include: {
            leaders: { include: { user: true } },
            ministry: true
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar permissões (apenas MASTER e LEADER podem adicionar)
    const userMinistryId = session.user.role === 'MASTER' 
      ? session.user.masterMinistryId 
      : session.user.ministryId;
    
    const isLeader = meeting.smallGroup.leaders.some(
      leader => leader.userId === session.user.id
    );
    
    if (session.user.role !== 'MASTER' && !isLeader) {
      return NextResponse.json(
        { error: 'Sem permissão para adicionar material de apoio' },
        { status: 403 }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const sanitizedName = nome.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}.pdf`;
    
    // Estrutura do caminho: ministerioId/smallGroupId/meetingId/arquivo.pdf
    const objectPath = `${meeting.smallGroup.ministryId}/${meeting.smallGroupId}/${meetingId}/${fileName}`;

    try {
      // Verificar se o bucket existe, criar se necessário
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
      if (!bucketExists) {
        await minioClient.makeBucket(BUCKET_NAME);
      }

      // Gerar presigned URL para upload (válido por 10 minutos)
      const presignedUrl = await minioClient.presignedPutObject(
        BUCKET_NAME,
        objectPath,
        10 * 60 // 10 minutos
      );

      // Salvar metadados no banco
      const material = await prisma.materialApoio.create({
        data: {
          nome,
          arquivoUrl: objectPath,
          usuarioId: session.user.id,
          ministerioId: meeting.smallGroup.ministryId,
          smallGroupId: meeting.smallGroupId,
          meetingId
        }
      });

      return NextResponse.json({
        materialId: material.id,
        uploadUrl: presignedUrl,
        message: 'URL de upload gerada com sucesso'
      });

    } catch (minioError) {
      console.error('Erro no MinIO:', minioError);
      return NextResponse.json(
        { error: 'Erro ao configurar upload de arquivo' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}