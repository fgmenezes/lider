import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET - Listar membros do grupo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: groupId } = params;
    const user = session.user;

    // Verificar se o usuário tem permissão para acessar este grupo
    const userWithPermissions = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ministry: true,
        masterMinistry: true,
        smallGroupLeaderships: {
          where: { smallGroupId: groupId },
        },
      },
    });

    if (!userWithPermissions) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar o grupo para verificar permissões
    const group = await prisma.smallGroup.findUnique({
      where: { id: groupId },
      include: {
        ministry: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const isAdmin = user.role === Role.ADMIN;
    const isMaster = user.role === Role.MASTER && user.masterMinistryId === group.ministryId;
    const isLeader = user.role === Role.LEADER && (
      user.ministryId === group.ministryId ||
      userWithPermissions.smallGroupLeaderships.length > 0
    );

    if (!isAdmin && !isMaster && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para acessar este grupo' }, { status: 403 });
    }

    // Buscar membros ativos do grupo
    const members = await prisma.smallGroupMember.findMany({
      where: {
        smallGroupId: groupId,
        status: 'ATIVO',
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        member: {
          name: 'asc',
        },
      },
    });

    // Transformar dados para o formato esperado pelo frontend
    const formattedMembers = members.map(member => ({
      id: member.id,
      name: member.member.name,
      email: member.member.email,
      status: member.status,
      member: {
        id: member.member.id,
        name: member.member.name,
        email: member.member.email,
      },
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}