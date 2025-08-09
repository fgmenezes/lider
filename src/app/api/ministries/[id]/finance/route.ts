import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Utilitário para verificar permissões (simplificado)
async function checkPermission(user: any, ministryId: string, method: string) {
  if (!user) return false;
  if (user.role === 'ADMIN' || (user.role === 'MASTER' && user.masterMinistryId === ministryId)) return true;
  if (user.role === 'LEADER' && user.ministryId === ministryId && method === 'GET') return true;
  // Aqui pode expandir para permissões customizadas
  return false;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const ministryId = params.id;
  if (!await checkPermission(user, ministryId, 'GET')) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  // Filtro por período (últimos 30 dias)
  const finances = await prisma.finance.findMany({
    where: {
      ministryId,
      // Removido o filtro de data para considerar todos os lançamentos
    },
    include: { responsavel: { select: { name: true } } },
    orderBy: [
      { date: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  // Calcular saldo
  const saldo = finances.reduce((acc: number, lanc: any) => acc + (lanc.type === 'ENTRADA' ? lanc.amount : -lanc.amount), 0);
  return NextResponse.json({ finances, saldo });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const ministryId = params.id;
  if (!await checkPermission(user, ministryId, 'POST')) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  if (!user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
  }
  const data = await req.json();
  const finance = await prisma.finance.create({
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount,
      type: data.type,
      date: new Date(data.date),
      category: data.category,
      ministryId,
      responsavelId: user.id,
    },
  });
  return NextResponse.json(finance, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const ministryId = params.id;
  if (!await checkPermission(user, ministryId, 'PUT')) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  const data = await req.json();
  const finance = await prisma.finance.update({
    where: { id: data.id, ministryId },
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount,
      type: data.type,
      date: new Date(data.date),
      category: data.category,
    },
  });
  return NextResponse.json(finance);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const ministryId = params.id;
  if (!await checkPermission(user, ministryId, 'DELETE')) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  const { id } = await req.json();
  await prisma.finance.delete({ where: { id, ministryId } });
  return NextResponse.json({ success: true });
} 