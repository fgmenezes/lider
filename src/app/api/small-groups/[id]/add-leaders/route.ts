import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id: smallGroupId } = params;
    const { userIds, role } = await request.json(); // role opcional
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum líder selecionado' }, { status: 400 });
    }
    // Buscar IDs já associados
    const existing = await prisma.smallGroupLeader.findMany({
      where: { smallGroupId, userId: { in: userIds } },
      select: { userId: true },
    });
    const already = new Set(existing.map(e => e.userId));
    const toAdd = userIds.filter((id: string) => !already.has(id));
    if (toAdd.length === 0) {
      return NextResponse.json({ message: 'Todos os líderes já estão associados.' });
    }
    // Criar associações
    await prisma.smallGroupLeader.createMany({
      data: toAdd.map((userId: string) => ({
        smallGroupId,
        userId,
        role: role || 'LIDER',
      })),
      skipDuplicates: true,
    });
    return NextResponse.json({ message: 'Líderes associados com sucesso.' });
  } catch (error) {
    console.error('Erro ao associar líderes:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 