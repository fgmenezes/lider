import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateVisitorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  invitedById: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Buscar visitante específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; meetingId: string; visitorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: smallGroupId, meetingId, visitorId } = params;

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

    // Buscar visitante
    const visitor = await prisma.smallGroupVisitor.findFirst({
      where: {
        id: visitorId,
        meetingId,
        smallGroupId,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        meeting: {
          include: {
            smallGroup: {
              include: {
                ministry: true,
              },
            },
          },
        },
      },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitante não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.role === 'MASTER' && user.masterMinistryId === visitor.meeting.smallGroup.ministryId;
    const isLeader = user.role === 'LEADER' && (
      user.ministryId === visitor.meeting.smallGroup.ministryId ||
      user.smallGroupLeaderships.length > 0
    );

    if (!isAdmin && !isMaster && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para acessar este visitante' }, { status: 403 });
    }

    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Erro ao buscar visitante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar visitante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; meetingId: string; visitorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: smallGroupId, meetingId, visitorId } = params;
    const body = await request.json();

    // Validar dados de entrada
    const validatedData = updateVisitorSchema.parse(body);

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

    // Buscar visitante
    const visitor = await prisma.smallGroupVisitor.findFirst({
      where: {
        id: visitorId,
        meetingId,
        smallGroupId,
      },
      include: {
        meeting: {
          include: {
            smallGroup: {
              include: {
                ministry: true,
              },
            },
          },
        },
      },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitante não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.role === 'MASTER' && user.masterMinistryId === visitor.meeting.smallGroup.ministryId;
    const isLeader = user.role === 'LEADER' && (
      user.ministryId === visitor.meeting.smallGroup.ministryId ||
      user.smallGroupLeaderships.length > 0
    );

    if (!isAdmin && !isMaster && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para editar este visitante' }, { status: 403 });
    }

    // Verificar se o membro que convidou existe (se fornecido)
    if (validatedData.invitedById) {
      const invitingMember = await prisma.member.findFirst({
        where: {
          id: validatedData.invitedById,
          ministryId: visitor.meeting.smallGroup.ministryId,
        },
      });

      if (!invitingMember) {
        return NextResponse.json({ error: 'Membro responsável pelo convite não encontrado' }, { status: 404 });
      }
    }

    // Atualizar visitante
    const updatedVisitor = await prisma.smallGroupVisitor.update({
      where: { id: visitorId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
        ...(validatedData.email !== undefined && { email: validatedData.email || null }),
        ...(validatedData.invitedById !== undefined && { invitedById: validatedData.invitedById }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
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

    return NextResponse.json(updatedVisitor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar visitante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover visitante
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; meetingId: string; visitorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: smallGroupId, meetingId, visitorId } = params;

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

    // Buscar visitante
    const visitor = await prisma.smallGroupVisitor.findFirst({
      where: {
        id: visitorId,
        meetingId,
        smallGroupId,
      },
      include: {
        meeting: {
          include: {
            smallGroup: {
              include: {
                ministry: true,
              },
            },
          },
        },
      },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitante não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.role === 'MASTER' && user.masterMinistryId === visitor.meeting.smallGroup.ministryId;
    const isLeader = user.role === 'LEADER' && (
      user.ministryId === visitor.meeting.smallGroup.ministryId ||
      user.smallGroupLeaderships.length > 0
    );

    if (!isAdmin && !isMaster && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para remover este visitante' }, { status: 403 });
    }

    // Remover visitante
    await prisma.smallGroupVisitor.delete({
      where: { id: visitorId },
    });

    return NextResponse.json({ message: 'Visitante removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover visitante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}