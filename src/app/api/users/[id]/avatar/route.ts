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

const BUCKET_NAME = 'sistemalider';

// POST: Upload de avatar do usuário
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = params.id;

    // Verificar se o usuário pode alterar o avatar (apenas o próprio usuário ou admin)
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP' 
      }, { status: 400 });
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Máximo 5MB' 
      }, { status: 400 });
    }

    try {
      // Remover avatar anterior se existir
      if (user.avatarKey) {
        try {
          await minioClient.removeObject(BUCKET_NAME, user.avatarKey);
        } catch (removeError) {
        }
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `avatars/${userId}/${timestamp}.${fileExtension}`;

      // Converter arquivo para buffer
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // Fazer upload para MinIO
      await minioClient.putObject(
        BUCKET_NAME, 
        fileName, 
        fileBuffer, 
        fileBuffer.length, 
        { 'Content-Type': file.type }
      );

      // Gerar URL do avatar
      const avatarUrl = `https://${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${fileName}`;

      // Atualizar usuário no banco
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl,
          avatarKey: fileName,
          avatarMimeType: file.type,
          avatarSize: file.size
        }
      });

      return NextResponse.json({
        message: 'Avatar atualizado com sucesso',
        avatarUrl,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          avatarUrl: updatedUser.avatarUrl
        }
      });

    } catch (uploadError) {
      console.error('Erro no upload do avatar:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do avatar' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar upload de avatar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Remover avatar do usuário
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = params.id;

    // Verificar permissões
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (!user.avatarKey) {
      return NextResponse.json({ error: 'Usuário não possui avatar' }, { status: 400 });
    }

    try {
      // Remover arquivo do MinIO
      await minioClient.removeObject(BUCKET_NAME, user.avatarKey);

      // Atualizar usuário no banco
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: null,
          avatarKey: null,
          avatarMimeType: null,
          avatarSize: null
        }
      });

      return NextResponse.json({
        message: 'Avatar removido com sucesso'
      });

    } catch (removeError) {
      console.error('Erro ao remover avatar:', removeError);
      return NextResponse.json(
        { error: 'Erro ao remover avatar' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar remoção de avatar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}