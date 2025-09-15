import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadFile } from '@/lib/minio';

// GET: Download de arquivo de material de apoio
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const meetingId = params.id;
    const materialId = params.materialId;

    // Buscar o material de apoio
    const material = await prisma.materialApoio.findUnique({
      where: { id: materialId },
      include: {
        meeting: {
          include: {
            smallGroup: {
              include: {
                leaders: { include: { user: true } },
                ministry: true
              }
            }
          }
        }
      }
    });

    if (!material || material.meetingId !== meetingId) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const userMinistryId = session.user.role === 'MASTER' 
      ? session.user.masterMinistryId 
      : session.user.ministryId;
    
    const isLeader = material.meeting.smallGroup.leaders.some(
      leader => leader.userId === session.user.id
    );
    
    const isMember = material.meeting.smallGroup.ministryId === userMinistryId;
    
    if (session.user.role !== 'MASTER' && !isLeader && !isMember) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este material' },
        { status: 403 }
      );
    }

    try {
      // Extrair o caminho do objeto da URL
      const objectPath = material.arquivoUrl.split(`/${process.env.MINIO_BUCKET}/`)[1];
      
      if (!objectPath) {
        return NextResponse.json(
          { error: 'URL do arquivo inválida' },
          { status: 400 }
        );
      }

      // Fazer download do MinIO
      const fileBuffer = await downloadFile(objectPath);
      
      // Retornar o arquivo
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${material.nome}.pdf"`,
          'Cache-Control': 'private, max-age=3600'
        }
      });

    } catch (minioError) {
      console.error('Erro ao baixar arquivo do MinIO:', minioError);
      return NextResponse.json(
        { error: 'Erro ao acessar arquivo' },
        { status: 500 }
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