import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    console.log('=== PUT /api/small-groups/[id]/leaders/[userId] ===');
    console.log('Params:', params);
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Erro: Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    console.log('Usuário autenticado:', {
      id: session.user.id,
      role: session.user.role,
      masterMinistryId: session.user.masterMinistryId
    });

    const { id: smallGroupId, userId } = params;
    const body = await request.json();
    console.log('Body da requisição:', body);
    
    const { role, since, until, reason } = body;

    if (!role || !since) {
      console.log('Erro: Role ou data de início não fornecidos');
      return NextResponse.json({ error: 'Role e data de início são obrigatórios' }, { status: 400 });
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
      userMasterMinistryId: user.masterMinistryId,
      groupMinistryId: group.ministryId
    });

    if (!isAdmin && !isMaster && !isGroupLeader) {
      console.log('Erro: Sem permissão para atualizar líderes');
      return NextResponse.json({ error: 'Sem permissão para atualizar líderes deste grupo' }, { status: 403 });
    }

    // Verificar se o líder existe no grupo
    console.log('Buscando líder existente:', { smallGroupId, userId });
    const existingLeader = await prisma.smallGroupLeader.findFirst({
      where: { smallGroupId, userId }
    });
    
    console.log('Líder existente:', existingLeader ? {
      id: existingLeader.id,
      role: existingLeader.role,
      since: existingLeader.since
    } : null);

    if (!existingLeader) {
      console.log('Erro: Líder não encontrado neste grupo');
      return NextResponse.json({ error: 'Líder não encontrado neste grupo' }, { status: 404 });
    }

    // Validar se não há conflito com LIDER_PRINCIPAL
    if (role === 'LIDER_PRINCIPAL') {
      console.log('Verificando conflito com LIDER_PRINCIPAL');
      const existingPrincipal = await prisma.smallGroupLeader.findFirst({
        where: {
          smallGroupId,
          role: 'LIDER_PRINCIPAL',
          userId: { not: userId }
        }
      });
      
      console.log('Líder principal existente:', existingPrincipal);

      if (existingPrincipal) {
        console.log('Erro: Já existe um Líder Principal');
        return NextResponse.json({ error: 'Já existe um Líder Principal neste grupo' }, { status: 400 });
      }
    }

    // Atualizar o role do líder
    console.log('Atualizando líder com dados:', {
      role,
      since: new Date(since),
      until: until ? new Date(until) : null,
      reason: reason || null
    });
    
    const updatedLeader = await prisma.smallGroupLeader.update({
      where: { id: existingLeader.id },
      data: {
        role,
        since: new Date(since),
        until: until ? new Date(until) : null,
        reason: reason || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('Líder atualizado com sucesso:', updatedLeader.id);

    return NextResponse.json({ 
      message: 'Role do líder atualizado com sucesso',
      leader: updatedLeader
    });
  } catch (error) {
    console.error('Erro ao atualizar role do líder:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}