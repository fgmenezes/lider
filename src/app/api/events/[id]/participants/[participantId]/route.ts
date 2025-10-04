import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateParticipationSchema } from '@/lib/events/validations';

interface RouteParams {
  params: { id: string; participantId: string };
}

// PUT /api/events/[id]/participants/[participantId] - Atualizar participante
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = UpdateParticipationSchema.parse(body);

    // Verificar se o participante existe
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: params.participantId },
      include: {
        event: {
          include: {
            leaders: true
          }
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 });
    }

    if (participant.eventId !== params.id) {
      return NextResponse.json({ error: 'Participante não pertence a este evento' }, { status: 400 });
    }

    // Verificar permissão
    const isEventLeader = participant.event.leaders.some(
      leader => leader.userId === session.user.id
    );

    const hasMinistryPermission = await prisma.ministry.findFirst({
      where: {
        id: participant.event.ministryId,
        OR: [
          { leaders: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!isEventLeader && !hasMinistryPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este participante' },
        { status: 403 }
      );
    }

    const updatedParticipant = await prisma.eventParticipant.update({
      where: { id: params.participantId },
      data: {
        status: data.status,
        attended: data.attended,
        notes: data.notes
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

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error('Erro ao atualizar participante:', error);
    
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

// DELETE /api/events/[id]/participants/[participantId] - Remover participante
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o participante existe
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: params.participantId },
      include: {
        event: {
          include: {
            leaders: true
          }
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 });
    }

    if (participant.eventId !== params.id) {
      return NextResponse.json({ error: 'Participante não pertence a este evento' }, { status: 400 });
    }

    // Verificar permissão
    const isEventLeader = participant.event.leaders.some(
      leader => leader.userId === session.user.id
    );

    const hasMinistryPermission = await prisma.ministry.findFirst({
      where: {
        id: participant.event.ministryId,
        OR: [
          { leaders: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!isEventLeader && !hasMinistryPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para remover este participante' },
        { status: 403 }
      );
    }

    await prisma.eventParticipant.delete({
      where: { id: params.participantId }
    });

    return NextResponse.json({ message: 'Participante removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover participante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}