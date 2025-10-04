import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: smallGroupId, userId } = params;
    const body = await request.json();
    
    const { role, since, until, reason } = body;

    if (!role || !since) {
      return NextResponse.json({ error: 'Role e data de início são obrigatórios' }, { status: 400 });
    }

    // Verificar se o usuário tem permissão para atualizar este grupo
    const group = await prisma.smallGroup.findUnique({
      where: { id: smallGroupId },
      include: {
        leaders: { include: { user: true } },
        ministry: true
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    const user = session.user as any;
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.masterMinistryId && user.masterMinistryId === group.ministryId;
    const isGroupLeader = group.leaders.some((l: any) => l.userId === user.id);

    if (!isAdmin && !isMaster && !isGroupLeader) {
      return NextResponse.json({ error: 'Sem permissão para atualizar líderes deste grupo' }, { status: 403 });
    }

    // Verificar se o líder existe no grupo
    const existingLeader = await prisma.smallGroupLeader.findFirst({
      where: { smallGroupId, userId }
    });

    if (!existingLeader) {
      return NextResponse.json({ error: 'Líder não encontrado neste grupo' }, { status: 404 });
    }

    // Validar se não há conflito com LIDER_PRINCIPAL
    if (role === 'LIDER_PRINCIPAL') {
      const existingPrincipal = await prisma.smallGroupLeader.findFirst({
        where: {
          smallGroupId,
          role: 'LIDER_PRINCIPAL'
        }
      });

      if (existingPrincipal) {
        return NextResponse.json({ error: 'Já existe um Líder Principal neste grupo' }, { status: 400 });
      }
    }

    // Atualizar o role do líder
    const updatedLeader = await prisma.smallGroupLeader.update({
      where: { id: existingLeader.id },
      data: {
        role,
        reason: reason || null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Role do líder atualizado com sucesso',
      leader: updatedLeader
    });
  } catch (error) {
    console.error('Erro ao atualizar role do líder:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}