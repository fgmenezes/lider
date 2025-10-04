import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateEventFinanceSchema } from '@/lib/events/validations';

interface RouteParams {
  params: { id: string };
}

// GET /api/events/[id]/finance - Listar finanças do evento
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
        { error: 'Você não tem permissão para ver as finanças deste evento' },
        { status: 403 }
      );
    }

    const finances = await prisma.eventFinance.findMany({
      where: { eventId: params.id },
      orderBy: { date: 'desc' }
    });

    // Calcular totais
    const totalIncome = finances
      .filter(f => f.type === 'INCOME')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const totalExpense = finances
      .filter(f => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const balance = totalIncome - totalExpense;

    return NextResponse.json({
      finances,
      summary: {
        totalIncome,
        totalExpense,
        balance
      }
    });
  } catch (error) {
    console.error('Erro ao buscar finanças:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/finance - Adicionar entrada financeira
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
    const data = CreateEventFinanceSchema.parse({
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
        { error: 'Você não tem permissão para gerenciar as finanças deste evento' },
        { status: 403 }
      );
    }

    const finance = await prisma.eventFinance.create({
      data: {
        eventId: params.id,
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date,
        createdBy: session.user.id
      }
    });

    return NextResponse.json(finance, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar entrada financeira:', error);
    
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