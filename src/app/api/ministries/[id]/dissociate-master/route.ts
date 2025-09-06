import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    const { masterId, userId } = await req.json();
    const targetUserId = masterId || userId;
    if (!targetUserId) {
      return NextResponse.json({ message: 'masterId ou userId obrigatório' }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: targetUserId },
      data: { masterMinistryId: null, role: 'LEADER' },
    });
    return NextResponse.json({ message: 'Líder master desassociado com sucesso!' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao desassociar líder master' }, { status: 500 });
  }
}