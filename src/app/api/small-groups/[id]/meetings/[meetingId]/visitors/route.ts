import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createVisitorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  invitedById: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Listar visitantes da reunião
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: smallGroupId, meetingId } = params;

    // Verificar se o usuário tem permissão para acessar este grupo
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ministry: true,
        masterMinistry: true,
        smallGroupLeaderships: {
          where: { smallGroupId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se a reunião existe e pertence ao grupo
    const meeting = await prisma.smallGroupMeeting.findFirst({
      where: {
        id: meetingId,
        smallGroupId,
      },
      include: {
        smallGroup: {
          include: {
            ministry: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar permissões
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.role === 'MASTER' && user.masterMinistryId === meeting.smallGroup.ministryId;
    const isLeader = user.role === 'LEADER' && (
      user.ministryId === meeting.smallGroup.ministryId ||
      user.smallGroupLeaderships.length > 0
    );

    if (!isAdmin && !isMaster && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para acessar esta reunião' }, { status: 403 });
    }

    // Buscar visitantes da reunião
    const visitors = await prisma.smallGroupVisitor.findMany({
      where: {
        meetingId,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(visitors);
  } catch (error) {
    console.error('Erro ao buscar visitantes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo visitante
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: smallGroupId, meetingId } = params;
    const body = await request.json();

    // Validar dados de entrada
    const validatedData = createVisitorSchema.parse(body);

    // Verificar se o usuário tem permissão para acessar este grupo
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ministry: true,
        masterMinistry: true,
        smallGroupLeaderships: {
          where: { smallGroupId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se a reunião existe e pertence ao grupo
    const meeting = await prisma.smallGroupMeeting.findFirst({
      where: {
        id: meetingId,
        smallGroupId,
      },
      include: {
        smallGroup: {
          include: {
            ministry: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar permissões
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.role === 'MASTER' && user.masterMinistryId === meeting.smallGroup.ministryId;
    const isLeader = user.role === 'LEADER' && (
      user.ministryId === meeting.smallGroup.ministryId ||
      user.smallGroupLeaderships.length > 0
    );

    if (!isAdmin && !isMaster && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para registrar visitantes nesta reunião' }, { status: 403 });
    }

    // Verificar se o membro que convidou existe (se fornecido)
    if (validatedData.invitedById) {
      const invitingMember = await prisma.member.findFirst({
        where: {
          id: validatedData.invitedById,
          ministryId: meeting.smallGroup.ministryId,
        },
      });

      if (!invitingMember) {
        return NextResponse.json({ error: 'Membro responsável pelo convite não encontrado' }, { status: 404 });
      }
    }

    // Criar visitante
    const visitor = await prisma.smallGroupVisitor.create({
      data: {
        meetingId,
        smallGroupId,
        ministryId: meeting.smallGroup.ministryId,
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        invitedById: validatedData.invitedById,
        notes: validatedData.notes,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(visitor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar visitante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}