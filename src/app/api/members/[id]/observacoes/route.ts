import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Listar observações do membro
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const memberId = params.id;

  // Autorização: ADMIN, MASTER do ministério do membro, ou LEADER de um PG do qual o membro participa
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      ministry: { select: { id: true } },
      smallGroupMemberships: {
        include: { smallGroup: { include: { leaders: true } } }
      }
    }
  });
  if (!member) {
    return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
  }
  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN';
  const isMaster = user.masterMinistryId && user.masterMinistryId === member.ministryId;
  const isLeader = member.smallGroupMemberships?.some((m: any) => m.smallGroup?.leaders?.some((l: any) => l.userId === user.id));
  if (!isAdmin && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para visualizar observações deste membro' }, { status: 403 });
  }

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

  // Autorização para criar: ADMIN, MASTER do ministério do membro, ou LEADER de um PG do qual o membro participa
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      ministry: { select: { id: true } },
      smallGroupMemberships: {
        include: { smallGroup: { include: { leaders: true } } }
      }
    }
  });
  if (!member) {
    return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
  }
  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN';
  const isMaster = user.masterMinistryId && user.masterMinistryId === member.ministryId;
  const isLeader = member.smallGroupMemberships?.some((m: any) => m.smallGroup?.leaders?.some((l: any) => l.userId === user.id));
  if (!isAdmin && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para adicionar observações' }, { status: 403 });
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