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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const meetingId = params.id;
    const formData = await req.formData();
    
    const nome = formData.get('nome') as string;
    const descricao = formData.get('descricao') as string;
    const arquivo = formData.get('arquivo') as File;

    // Validações de entrada
    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome do material é obrigatório' },
        { status: 400 }
      );
    }

    if (!arquivo) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Validar tipo e tamanho do arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(arquivo.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Formatos aceitos: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG, GIF' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (arquivo.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 50MB' },
        { status: 400 }
      );
    }

    // Validar nome do arquivo
    const fileName = arquivo.name;
    if (!fileName || fileName.trim() === '') {
      return NextResponse.json(
        { error: 'Nome do arquivo é inválido' },
        { status: 400 }
      );
    }

    // Verificar se a reunião existe
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
    const fileExtension = fileName.split('.').pop() || 'pdf';
    const uniqueFileName = `${timestamp}_${sanitizedName}.${fileExtension}`;

    try {
      // Converter arquivo para buffer
      const arrayBuffer = await arquivo.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // Validar se o buffer não está vazio
      if (fileBuffer.length === 0) {
        return NextResponse.json(
          { error: 'Arquivo está vazio ou corrompido' },
          { status: 400 }
        );
      }

      // Fazer upload para MinIO com nova estrutura organizada
      const filePath = await uploadMaterialApoio(
        uniqueFileName,
        fileBuffer,
        arquivo.type,
        meeting.smallGroup.ministryId,
        meeting.smallGroupId,
        meetingId
      );
      
      // Validar se o upload foi bem-sucedido
      if (!filePath || filePath.trim() === '') {
        throw new Error('Falha no upload: caminho do arquivo não foi retornado');
      }
      
      // Gerar URL permanente para download
      const minioEndpoint = process.env.MINIO_ENDPOINT;
      if (!minioEndpoint) {
        throw new Error('Configuração do MinIO não encontrada');
      }
      
      const arquivoUrl = `https://${minioEndpoint}/sistemalider/${filePath}`;

      // Validar URL gerada
      try {
        new URL(arquivoUrl);
      } catch (urlError) {
        throw new Error('URL gerada é inválida');
      }

      // Salvar metadados no banco usando transação
      const material = await prisma.$transaction(async (tx) => {
        // Verificar se já existe um material com o mesmo nome na mesma reunião
        const existingMaterial = await tx.materialApoio.findFirst({
          where: {
            nome,
            meetingId,
            usuarioId: session.user.id
          }
        });

        if (existingMaterial) {
          throw new Error('Já existe um material com este nome nesta reunião');
        }

        // Criar o material
        const newMaterial = await tx.materialApoio.create({
          data: {
            nome: nome.trim(),
            descricao: descricao?.trim() || null,
            arquivoUrl,
            usuarioId: session.user.id,
            ministerioId: meeting.smallGroup.ministryId,
            smallGroupId: meeting.smallGroupId,
            meetingId
          }
        });

        return newMaterial;
      });

      console.log(`✅ Material de apoio criado com sucesso: ${material.id} - ${material.nome}`);
      console.log(`📁 Arquivo salvo em: ${filePath}`);
      console.log(`🔗 URL: ${arquivoUrl}`);

      return NextResponse.json({
        materialId: material.id,
        arquivoUrl,
        message: 'Material de apoio enviado com sucesso'
      });

    } catch (uploadError) {
      console.error('❌ Erro durante upload/salvamento:', uploadError);
      
      // Se houve erro após criar o registro no banco, tentar limpar
      // (isso seria melhor com uma transação completa incluindo MinIO)
      
      return NextResponse.json(
        { 
          error: uploadError instanceof Error 
            ? uploadError.message 
            : 'Erro durante o upload do arquivo'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erro ao processar upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}