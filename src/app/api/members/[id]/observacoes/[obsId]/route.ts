import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT: Editar uma observação
export async function PUT(req: NextRequest, { params }: { params: { id: string, obsId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { texto, categoria } = await req.json();
  if (!texto || texto.trim().length === 0) {
    return NextResponse.json({ error: 'Texto da observação é obrigatório' }, { status: 400 });
  }
  // Só permite editar se for o autor ou líder master (validação extra pode ser feita aqui)
  const obs = await prisma.memberObservacao.findUnique({ where: { id: params.obsId } });
  if (!obs) return NextResponse.json({ error: 'Observação não encontrada' }, { status: 404 });
  if (obs.autorId !== session.user.id && session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
  }
  const updated = await prisma.memberObservacao.update({
    where: { id: params.obsId },
    data: { texto, categoria: categoria || null },
    include: { autor: { select: { id: true, name: true, email: true, role: true } } },
  });
  return NextResponse.json({ observacao: updated });
}

// DELETE: Remover uma observação
export async function DELETE(req: NextRequest, { params }: { params: { id: string, obsId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  // Só permite remover se for o autor ou líder master
  const obs = await prisma.memberObservacao.findUnique({ where: { id: params.obsId } });
  if (!obs) return NextResponse.json({ error: 'Observação não encontrada' }, { status: 404 });
  if (obs.autorId !== session.user.id && session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Sem permissão para remover' }, { status: 403 });
  }
  await prisma.memberObservacao.delete({ where: { id: params.obsId } });
  return NextResponse.json({ success: true });
} 