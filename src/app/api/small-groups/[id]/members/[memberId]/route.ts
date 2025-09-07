import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    console.log('=== PUT /api/small-groups/[id]/members/[memberId] ===');
    console.log('Params:', params);
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Erro: Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    console.log('Usuário autenticado:', {
      id: session.user.id,
      role: session.user.role,
      masterMinistryId: session.user.masterMinistryId,
      ministryId: session.user.ministryId
    });

    const { id: smallGroupId, memberId } = params;
    const body = await request.json();
    console.log('Body da requisição:', body);
    
    const { status, statusChangeReason, requiresApproval } = body;

    if (!status) {
      console.log('Erro: Status não fornecido');
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário tem permissão para atualizar este grupo
    console.log('Buscando grupo:', smallGroupId);
    const group = await prisma.smallGroup.findUnique({
      where: { id: smallGroupId },
      include: {
        leaders: { include: { user: true } },
        ministry: true
      }
    });
    
    console.log('Grupo encontrado:', group ? {
      id: group.id,
      name: group.name,
      ministryId: group.ministryId,
      leadersCount: group.leaders.length
    } : null);

    if (!group) {
      console.log('Erro: Grupo não encontrado');
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    const user = session.user as any;
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.masterMinistryId && user.masterMinistryId === group.ministryId;
    const isGroupLeader = group.leaders.some((l: any) => l.userId === user.id);
    
    console.log('Verificação de permissões:', {
      isAdmin,
      isMaster,
      isGroupLeader,
      userRole: user.role,
      userMasterMinistryId: user.masterMinistryId,
      userMinistryId: user.ministryId,
      groupMinistryId: group.ministryId,
      comparison: user.masterMinistryId === group.ministryId
    });

    if (!isAdmin && !isMaster && !isGroupLeader) {
      console.log('Erro: Sem permissão para atualizar membros');
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
      console.log('Erro: Motivo obrigatório para status críticos');
      return NextResponse.json({ error: 'Motivo é obrigatório para mudanças de status críticas' }, { status: 400 });
    }

    // Atualizar o status do membro
    console.log('Atualizando membro com dados:', {
      status,
      statusChangedAt: new Date(),
      statusChangeReason: statusChangeReason || null,
      requiresApproval: requiresApproval || false
    });
    
    const updatedMember = await prisma.smallGroupMember.update({
      where: { id: existingMember.id },
      data: {
        status,
        statusChangedAt: new Date(),
        statusChangeReason: statusChangeReason || null,
        requiresApproval: requiresApproval || false
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
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