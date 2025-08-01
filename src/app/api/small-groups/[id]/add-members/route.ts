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
    const { memberIds, role } = await request.json(); // role opcional
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum membro selecionado' }, { status: 400 });
    }
    // Buscar IDs já associados
    const existing = await prisma.smallGroupMember.findMany({
      where: { smallGroupId, memberId: { in: memberIds } },
      select: { memberId: true },
    });
    const already = new Set(existing.map(e => e.memberId));
    const toAdd = memberIds.filter((id: string) => !already.has(id));
    if (toAdd.length === 0) {
      return NextResponse.json({ message: 'Todos os membros já estão associados.' });
    }
    // Criar associações
    await prisma.smallGroupMember.createMany({
      data: toAdd.map((memberId: string) => ({
        smallGroupId,
        memberId,
        role: role || 'MEMBRO',
      })),
      skipDuplicates: true,
    });
    return NextResponse.json({ message: 'Membros associados com sucesso.' });
  } catch (error) {
    console.error('Erro ao associar membros:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 