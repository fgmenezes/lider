import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID do grupo não informado' }, { status: 400 });
  }

  // Busca o grupo e inclui relações relevantes
  const group = await prisma.smallGroup.findUnique({
    where: { id },
    include: {
      ministry: true,
      leaders: {
        include: { user: true }
      },
      members: {
        include: { member: true }
      },
      meetings: true,
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
  }

  // Permissão: ADMIN, MASTER do ministério, ou LEADER do grupo
  const user = session.user;
  const isAdmin = user.role === 'ADMIN';
  const isMaster = user.masterMinistryId && user.masterMinistryId === group.ministryId;
  const isLeader = group.leaders.some((l: { userId: string }) => l.userId === user.id);

  if (!isAdmin && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para acessar este grupo' }, { status: 403 });
  }

  return NextResponse.json({ group });
} 