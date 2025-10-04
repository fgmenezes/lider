import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Listar observações do pequeno grupo
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const smallGroupId = params.id;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const categoria = searchParams.get('categoria');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Verificar se o pequeno grupo existe e obter permissões
  const smallGroup = await prisma.smallGroup.findUnique({
    where: { id: smallGroupId },
    include: {
      ministry: { select: { id: true } },
      leaders: { include: { user: true } }
    }
  });

  if (!smallGroup) {
    return NextResponse.json({ error: 'Pequeno grupo não encontrado' }, { status: 404 });
  }

  // Autorização: ADMIN, MASTER do ministério, ou LEADER do pequeno grupo
  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN';
  const isMaster = user.masterMinistryId && user.masterMinistryId === smallGroup.ministryId;
  const isLeader = smallGroup.leaders?.some((l: any) => l.userId === user.id);

  if (!isAdmin && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para visualizar observações deste grupo' }, { status: 403 });
  }

  // Construir filtros
  const where: any = { smallGroupId };

  if (categoria) where.categoria = categoria;
  if (from || to) {
    where.createdAt = {} as any;
    if (from) (where.createdAt as any).gte = new Date(from);
    if (to) (where.createdAt as any).lte = new Date(to);
  }

  // Contar total para paginação
  const total = await prisma.smallGroupObservacao.count({ where });

  // Validar e ajustar parâmetros de paginação
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  const skip = (validPage - 1) * validLimit;

  // Validar campo de ordenação
  const validSortBy = ['createdAt', 'updatedAt', 'categoria', 'titulo'].includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

  // Construir orderBy
  let orderBy: any = {};
  if (validSortBy === 'autor.name') {
    orderBy = { autor: { name: validSortOrder } };
  } else {
    orderBy = { [validSortBy]: validSortOrder };
  }

  const observacoes = await prisma.smallGroupObservacao.findMany({
    where,
    include: {
      autor: { select: { id: true, name: true, email: true, role: true } },
      smallGroup: { select: { id: true, name: true } },
      ministry: { select: { id: true, name: true } }
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

// POST: Adicionar nova observação
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const smallGroupId = params.id;
  const { titulo, texto, categoria } = await req.json();

  if (!titulo || titulo.trim().length === 0) {
    return NextResponse.json({ error: 'Título da observação é obrigatório' }, { status: 400 });
  }

  if (!texto || texto.trim().length === 0) {
    return NextResponse.json({ error: 'Texto da observação é obrigatório' }, { status: 400 });
  }

  // Verificar se o pequeno grupo existe e obter permissões
  const smallGroup = await prisma.smallGroup.findUnique({
    where: { id: smallGroupId },
    include: {
      ministry: { select: { id: true } },
      leaders: { include: { user: true } }
    }
  });

  if (!smallGroup) {
    return NextResponse.json({ error: 'Pequeno grupo não encontrado' }, { status: 404 });
  }

  // Autorização para criar: ADMIN, MASTER do ministério, ou LEADER do pequeno grupo
  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN';
  const isMaster = user.masterMinistryId && user.masterMinistryId === smallGroup.ministryId;
  const isLeader = smallGroup.leaders?.some((l: any) => l.userId === user.id);

  if (!isAdmin && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para adicionar observações' }, { status: 403 });
  }

  const novaObs = await prisma.smallGroupObservacao.create({
    data: {
      smallGroupId,
      ministryId: smallGroup.ministryId,
      autorId: session.user.id,
      titulo: titulo.trim(),
      texto: texto.trim(),
      categoria: categoria || null,
    },
    include: { 
      autor: { select: { id: true, name: true, email: true, role: true } },
      smallGroup: { select: { id: true, name: true } },
      ministry: { select: { id: true, name: true } }
    },
  });

  return NextResponse.json({ observacao: novaObs });
}