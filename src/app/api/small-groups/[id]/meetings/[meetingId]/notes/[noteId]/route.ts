import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// PUT - Editar nota
export async function PUT(req: NextRequest, { params }: { params: { id: string; meetingId: string; noteId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id: groupId, meetingId, noteId } = params;
  if (!groupId || !meetingId || !noteId) {
    return NextResponse.json({ error: 'IDs não informados' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Título e conteúdo são obrigatórios' }, { status: 400 });
    }

    // Verificar se a nota existe e se o usuário tem permissão
    const note = await prisma.smallGroupMeetingNote.findUnique({
      where: { id: noteId },
      include: {
        smallGroup: {
          include: {
            leaders: true,
            ministry: true
          }
        },
        author: true
      }
    });

    if (!note || note.meetingId !== meetingId || note.smallGroupId !== groupId) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
    }

    // Verificar permissões
    const user = session.user;
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.masterMinistryId && user.masterMinistryId === note.smallGroup.ministryId;
    const isLeader = note.smallGroup.leaders.some((l: { userId: string }) => l.userId === user.id);
    const isAuthor = note.authorId === user.id;

    if (!isAdmin && !isMaster && !isLeader && !isAuthor) {
      return NextResponse.json({ error: 'Sem permissão para editar esta nota' }, { status: 403 });
    }

    // Atualizar a nota
    const updatedNote = await prisma.smallGroupMeetingNote.update({
      where: { id: noteId },
      data: {
        title: title.trim(),
        content: content.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('Erro ao editar nota:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Excluir nota
export async function DELETE(req: NextRequest, { params }: { params: { id: string; meetingId: string; noteId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id: groupId, meetingId, noteId } = params;
  if (!groupId || !meetingId || !noteId) {
    return NextResponse.json({ error: 'IDs não informados' }, { status: 400 });
  }

  try {
    // Verificar se a nota existe e se o usuário tem permissão
    const note = await prisma.smallGroupMeetingNote.findUnique({
      where: { id: noteId },
      include: {
        smallGroup: {
          include: {
            leaders: true,
            ministry: true
          }
        },
        author: true
      }
    });

    if (!note || note.meetingId !== meetingId || note.smallGroupId !== groupId) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
    }

    // Verificar permissões
    const user = session.user;
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.masterMinistryId && user.masterMinistryId === note.smallGroup.ministryId;
    const isLeader = note.smallGroup.leaders.some((l: { userId: string }) => l.userId === user.id);
    const isAuthor = note.authorId === user.id;

    if (!isAdmin && !isMaster && !isLeader && !isAuthor) {
      return NextResponse.json({ error: 'Sem permissão para excluir esta nota' }, { status: 403 });
    }

    // Excluir a nota
    await prisma.smallGroupMeetingNote.delete({
      where: { id: noteId }
    });

    return NextResponse.json({ message: 'Nota excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir nota:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}