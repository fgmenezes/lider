import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID do grupo não informado' }, { status: 400 });
  }

  // Autoriza: ADMIN, MASTER do ministério, ou LEADER do grupo
  const group = await prisma.smallGroup.findUnique({
    where: { id },
    include: {
      ministry: true,
      leaders: true,
    },
  });
  if (!group) {
    return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
  }

  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN';
  const isMaster = user.masterMinistryId && user.masterMinistryId === group.ministryId;
  const isLeader = group.leaders.some((l) => l.userId === user.id);
  if (!isAdmin && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para acessar este grupo' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get('memberId') || undefined;
  const categoria = searchParams.get('categoria') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const where: any = {
    member: {
      smallGroupMemberships: {
        some: { smallGroupId: id },
      },
    },
  };

  if (memberId) where.memberId = memberId;
  if (categoria) where.categoria = categoria;
  if (from || to) {
    where.createdAt = {} as any;
    if (from) (where.createdAt as any).gte = new Date(from);
    if (to) (where.createdAt as any).lte = new Date(to);
  }

  // Contar total para paginação
  const total = await prisma.memberObservacao.count({ where });

  // Validar e ajustar parâmetros de paginação
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  const skip = (validPage - 1) * validLimit;

  // Validar campo de ordenação
  const validSortBy = ['createdAt', 'updatedAt', 'categoria', 'autor.name', 'member.name'].includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

  // Construir orderBy
  let orderBy: any = {};
  if (validSortBy === 'autor.name') {
    orderBy = { autor: { name: validSortOrder } };
  } else if (validSortBy === 'member.name') {
    orderBy = { member: { name: validSortOrder } };
  } else {
    orderBy = { [validSortBy]: validSortOrder };
  }

  const observacoes = await prisma.memberObservacao.findMany({
    where,
    include: {
      autor: { select: { id: true, name: true, email: true, role: true } },
      member: { select: { id: true, name: true } },
    },
    orderBy,
    skip,
    take: validLimit,
  });

  return NextResponse.json({ 
    observacoes,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
      hasNext: validPage < Math.ceil(total / validLimit),
      hasPrev: validPage > 1
    }
  });
}


