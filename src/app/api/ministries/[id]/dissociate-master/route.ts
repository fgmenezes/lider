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
    const ministry = await prisma.ministry.update({
      where: { id: params.id },
      data: { master: { disconnect: true } },
      include: { church: true, master: true, members: true },
    });
    return NextResponse.json({ ministry });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao desassociar líder master' }, { status: 500 });
  }
} 