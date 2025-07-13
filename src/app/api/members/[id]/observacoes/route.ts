import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Listar observações do membro
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const memberId = params.id;
  const observacoes = await prisma.memberObservacao.findMany({
    where: { memberId },
    include: { autor: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ observacoes });
}

// POST: Adicionar nova observação
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const memberId = params.id;
  const { texto, categoria } = await req.json();
  if (!texto || texto.trim().length === 0) {
    return NextResponse.json({ error: 'Texto da observação é obrigatório' }, { status: 400 });
  }
  const novaObs = await prisma.memberObservacao.create({
    data: {
      memberId,
      autorId: session.user.id,
      texto,
      categoria: categoria || null,
    },
    include: { autor: { select: { id: true, name: true, email: true, role: true } } },
  });
  return NextResponse.json({ observacao: novaObs });
} 