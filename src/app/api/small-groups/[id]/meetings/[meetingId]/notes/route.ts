import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET - Listar notas da reunião
export async function GET(req: NextRequest, { params }: { params: { id: string; meetingId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id: groupId, meetingId } = params;
  if (!groupId || !meetingId) {
    return NextResponse.json({ error: 'IDs não informados' }, { status: 400 });
  }

  try {
    // Verificar se a reunião existe e se o usuário tem permissão
    const meeting = await prisma.smallGroupMeeting.findUnique({
      where: { id: meetingId },
      include: {
        smallGroup: {
          include: {
            leaders: true,
            ministry: true
          }
        }
      }
    });

    if (!meeting || meeting.smallGroupId !== groupId) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar permissões
    const user = session.user;
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.masterMinistryId && user.masterMinistryId === meeting.smallGroup.ministryId;
    const isLeader = meeting.smallGroup.leaders.some((l: { userId: string }) => l.userId === user.id);

    if (!isAdmin && !isMaster && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para acessar notas desta reunião' }, { status: 403 });
    }

    // Buscar notas da reunião
    const notes = await prisma.smallGroupMeetingNote.findMany({
      where: { meetingId },
      include: {
        author: {
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

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova nota
export async function POST(req: NextRequest, { params }: { params: { id: string; meetingId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id: groupId, meetingId } = params;
  if (!groupId || !meetingId) {
    return NextResponse.json({ error: 'IDs não informados' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Título e conteúdo são obrigatórios' }, { status: 400 });
    }

    // Verificar se a reunião existe e se o usuário tem permissão
    const meeting = await prisma.smallGroupMeeting.findUnique({
      where: { id: meetingId },
      include: {
        smallGroup: {
          include: {
            leaders: true,
            ministry: true
          }
        }
      }
    });

    if (!meeting || meeting.smallGroupId !== groupId) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar permissões
    const user = session.user;
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.masterMinistryId && user.masterMinistryId === meeting.smallGroup.ministryId;
    const isLeader = meeting.smallGroup.leaders.some((l: { userId: string }) => l.userId === user.id);

    if (!isAdmin && !isMaster && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para criar notas nesta reunião' }, { status: 403 });
    }

    // Criar a nota
    const note = await prisma.smallGroupMeetingNote.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        meetingId,
        smallGroupId: groupId,
        ministryId: meeting.smallGroup.ministryId,
        authorId: user.id
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

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar nota:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}