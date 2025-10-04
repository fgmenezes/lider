import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AddEventLeaderSchema } from '@/lib/events/validations';

interface RouteParams {
  params: { id: string };
}

// GET /api/events/[id]/leaders - Listar líderes do evento
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o evento existe e se o usuário tem permissão
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        leaders: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    const isEventLeader = event.leaders.some(
      leader => leader.userId === session.user.id
    );

    const hasMinistryPermission = await prisma.ministry.findFirst({
      where: {
        id: event.ministryId,
        OR: [
          { leaders: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!isEventLeader && !hasMinistryPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para ver os líderes deste evento' },
        { status: 403 }
      );
    }

    const leaders = await prisma.eventLeader.findMany({
      where: { eventId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            celular: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ leaders });
  } catch (error) {
    console.error('Erro ao buscar líderes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/leaders - Adicionar líder ao evento
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = AddEventLeaderSchema.parse({
      ...body,
      eventId: params.id
    });

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        leaders: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Verificar permissão (apenas líderes principais podem adicionar outros líderes)
    const isMainLeader = event.leaders.some(
      leader => leader.userId === session.user.id && leader.role === 'LEADER'
    );

    const hasMinistryPermission = await prisma.ministry.findFirst({
      where: {
        id: event.ministryId,
        OR: [
          { leaders: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!isMainLeader && !hasMinistryPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para adicionar líderes a este evento' },
        { status: 403 }
      );
    }

    // Verificar se o usuário já é líder do evento
    const existingLeader = await prisma.eventLeader.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: data.userId
        }
      }
    });

    if (existingLeader) {
      return NextResponse.json(
        { error: 'Este usuário já é líder do evento' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const leader = await prisma.eventLeader.create({
      data: {
        eventId: params.id,
        userId: data.userId,
        role: data.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            celular: true
          }
        }
      }
    });

    return NextResponse.json(leader, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar líder:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}