import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateEventFinanceSchema } from '@/lib/events/validations';

interface RouteParams {
  params: { id: string; financeId: string };
}

// PUT /api/events/[id]/finance/[financeId] - Atualizar entrada financeira
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
    const data = CreateEventFinanceSchema.parse({
      ...body,
      eventId: params.id
    });

    // Verificar se a entrada financeira existe
    const finance = await prisma.eventFinance.findUnique({
      where: { id: params.financeId },
      include: {
        event: {
          include: {
            leaders: true
          }
        }
      }
    });

    if (!finance) {
      return NextResponse.json({ error: 'Entrada financeira não encontrada' }, { status: 404 });
    }

    if (finance.eventId !== params.id) {
      return NextResponse.json({ error: 'Entrada financeira não pertence a este evento' }, { status: 400 });
    }

    // Verificar permissão
    const isEventLeader = finance.event.leaders.some(
      leader => leader.userId === session.user.id
    );

    const hasMinistryPermission = await prisma.ministry.findFirst({
      where: {
        id: finance.event.ministryId,
        OR: [
          { leaders: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!isEventLeader && !hasMinistryPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar esta entrada financeira' },
        { status: 403 }
      );
    }

    const updatedFinance = await prisma.eventFinance.update({
      where: { id: params.financeId },
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date
      }
    });

    return NextResponse.json(updatedFinance);
  } catch (error) {
    console.error('Erro ao atualizar entrada financeira:', error);
    
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

// DELETE /api/events/[id]/finance/[financeId] - Deletar entrada financeira
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se a entrada financeira existe
    const finance = await prisma.eventFinance.findUnique({
      where: { id: params.financeId },
      include: {
        event: {
          include: {
            leaders: true
          }
        }
      }
    });

    if (!finance) {
      return NextResponse.json({ error: 'Entrada financeira não encontrada' }, { status: 404 });
    }

    if (finance.eventId !== params.id) {
      return NextResponse.json({ error: 'Entrada financeira não pertence a este evento' }, { status: 400 });
    }

    // Verificar permissão
    const isEventLeader = finance.event.leaders.some(
      leader => leader.userId === session.user.id
    );

    const hasMinistryPermission = await prisma.ministry.findFirst({
      where: {
        id: finance.event.ministryId,
        OR: [
          { leaders: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!isEventLeader && !hasMinistryPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar esta entrada financeira' },
        { status: 403 }
      );
    }

    await prisma.eventFinance.delete({
      where: { id: params.financeId }
    });

    return NextResponse.json({ message: 'Entrada financeira deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar entrada financeira:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}