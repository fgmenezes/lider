import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: smallGroupId, memberId } = params;
    const body = await request.json();
    
    const { status, statusChangeReason, requiresApproval } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 });
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
      return NextResponse.json({ error: 'Sem permissão para atualizar membros deste grupo' }, { status: 403 });
    }

    // Verificar se o membro existe no grupo
    const existingMember = await prisma.smallGroupMember.findFirst({
      where: { smallGroupId, memberId }
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'Membro não encontrado neste grupo' }, { status: 404 });
    }

    // Validar status
    const validStatuses = ['ATIVO', 'INATIVO', 'TEMPORARIO', 'AFASTADO'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    // Validar se motivo é obrigatório para status críticos
    if ((status === 'INATIVO' || status === 'AFASTADO') && !statusChangeReason?.trim()) {
      return NextResponse.json({ error: 'Motivo é obrigatório para mudanças de status críticas' }, { status: 400 });
    }

    // Atualizar o status do membro
    const updatedMember = await prisma.smallGroupMember.update({
      where: { id: existingMember.id },
      data: {
        status,
        requiresApproval: requiresApproval || false
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Status do membro atualizado com sucesso',
      member: updatedMember
    });
  } catch (error) {
    console.error('Erro ao atualizar status do membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}