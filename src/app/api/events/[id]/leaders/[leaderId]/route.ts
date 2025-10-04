import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string; leaderId: string };
}

// DELETE /api/events/[id]/leaders/[leaderId] - Remover líder do evento
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o líder existe
    const leader = await prisma.eventLeader.findUnique({
      where: { id: params.leaderId },
      include: {
        event: {
          include: {
            leaders: true
          }
        }
      }
    });

    if (!leader) {
      return NextResponse.json({ error: 'Líder não encontrado' }, { status: 404 });
    }

    if (leader.eventId !== params.id) {
      return NextResponse.json({ error: 'Líder não pertence a este evento' }, { status: 400 });
    }

    // Verificar se há pelo menos 2 líderes (não pode remover o último)
    const totalLeaders = leader.event.leaders.length;
    if (totalLeaders <= 1) {
      return NextResponse.json(
        { error: 'Não é possível remover o último líder do evento' },
        { status: 400 }
      );
    }

    // Verificar permissão (apenas líderes principais podem remover outros líderes)
    const isMainLeader = leader.event.leaders.some(
      l => l.userId === session.user.id && l.role === 'LEADER'
    );

    const hasMinistryPermission = await prisma.ministry.findFirst({
      where: {
        id: leader.event.ministryId,
        leaders: { some: { id: session.user.id } }
      }
    });

    // O próprio usuário pode se remover se não for o último líder principal
    const isSelfRemoval = leader.userId === session.user.id;
    const mainLeadersCount = leader.event.leaders.filter(l => l.role === 'LEADER').length;
    const canSelfRemove = isSelfRemoval && (leader.role !== 'LEADER' || mainLeadersCount > 1);

    if (!isMainLeader && !hasMinistryPermission && !canSelfRemove) {
      return NextResponse.json(
        { error: 'Você não tem permissão para remover este líder' },
        { status: 403 }
      );
    }

    // Não permitir remoção do último líder principal
    if (leader.role === 'LEADER' && mainLeadersCount <= 1) {
      return NextResponse.json(
        { error: 'Não é possível remover o último líder principal do evento' },
        { status: 400 }
      );
    }

    await prisma.eventLeader.delete({
      where: { id: params.leaderId }
    });

    return NextResponse.json({ message: 'Líder removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover líder:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}