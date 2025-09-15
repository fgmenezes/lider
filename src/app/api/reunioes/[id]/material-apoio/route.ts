import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadMaterialApoio, initializeBuckets } from '@/lib/minio';

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

    // Buscar materiais de apoio da reunião
    const materiais = await prisma.materialApoio.findMany({
      where: { meetingId },
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatar resposta com URLs de download seguras
    const materiaisFormatados = materiais.map(material => ({
      id: material.id,
      nome: material.nome,
      arquivoUrl: material.arquivoUrl,
      downloadUrl: `/api/reunioes/${meetingId}/material-apoio/${material.id}/download`,
      uploadedBy: material.usuario.name,
      uploadedAt: material.createdAt,
      canDelete: material.usuarioId === session.user.id || 
                session.user.role === 'MASTER' || 
                meeting.smallGroup.leaders.some(leader => leader.userId === session.user.id)
    }));

    return NextResponse.json({ materiais: materiaisFormatados });

  } catch (error) {
    console.error('Erro ao buscar material de apoio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST: Upload de material de apoio com nova estrutura
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Inicializar buckets do sistema
    await initializeBuckets();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const meetingId = params.id;
    const formData = await req.formData();
    const nome = formData.get('nome') as string;
    const descricao = formData.get('descricao') as string;
    const arquivo = formData.get('arquivo') as File;

    if (!nome || !arquivo) {
      return NextResponse.json(
        { error: 'Nome e arquivo são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo (apenas PDF)
    if (arquivo.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são permitidos' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 10MB para compatibilidade com o modal)
    if (arquivo.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB permitido' },
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

    try {
      // Converter arquivo para buffer
      const arrayBuffer = await arquivo.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      console.log('Fazendo upload do arquivo:', {
        nome,
        tamanho: arquivo.size,
        tipo: arquivo.type,
        ministerioId: meeting.smallGroup.ministryId,
        smallGroupId: meeting.smallGroupId,
        meetingId
      });

      // Fazer upload para MinIO com nova estrutura organizada
      const filePath = await uploadMaterialApoio(
        fileName,
        fileBuffer,
        arquivo.type,
        meeting.smallGroup.ministryId,
        meeting.smallGroupId,
        meetingId
      );
      
      // Gerar URL permanente para download
      const arquivoUrl = `https://${process.env.MINIO_ENDPOINT}/sistemalider/${filePath}`;
      console.log('Upload MinIO bem-sucedido:', arquivoUrl);

      // Salvar metadados no banco
      const material = await prisma.materialApoio.create({
        data: {
          nome,
          descricao: descricao || null, // Campo opcional
          arquivoUrl,
          usuarioId: session.user.id,
          ministerioId: meeting.smallGroup.ministryId,
          smallGroupId: meeting.smallGroupId,
          meetingId
        }
      });

      console.log('Material de apoio criado:', material.id);

      return NextResponse.json({
        materialId: material.id,
        arquivoUrl,
        message: 'Material de apoio enviado com sucesso'
      });

    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      return NextResponse.json(
        { error: 'Erro ao salvar no banco de dados' },
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