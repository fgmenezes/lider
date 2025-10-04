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

  const { titulo, texto, categoria } = await req.json();

  if (!titulo || titulo.trim().length === 0) {
    return NextResponse.json({ error: 'Título da observação é obrigatório' }, { status: 400 });
  }

  if (!texto || texto.trim().length === 0) {
    return NextResponse.json({ error: 'Texto da observação é obrigatório' }, { status: 400 });
  }

  // Verificar se a observação existe
  const obs = await prisma.smallGroupObservacao.findUnique({ 
    where: { id: params.obsId },
    include: {
      smallGroup: {
        include: {
          leaders: { include: { user: true } }
        }
      }
    }
  });

  if (!obs) {
    return NextResponse.json({ error: 'Observação não encontrada' }, { status: 404 });
  }

  // Verificar se a observação pertence ao grupo especificado
  if (obs.smallGroupId !== params.id) {
    return NextResponse.json({ error: 'Observação não pertence ao grupo especificado' }, { status: 400 });
  }

  // Autorização: ADMIN pode editar qualquer observação, autor pode editar sua própria, 
  // MASTER pode editar observações do seu ministério, LEADER pode editar observações do seu grupo
  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN';
  const isAuthor = obs.autorId === user.id;
  const isMaster = user.role === 'MASTER' && user.masterMinistryId === obs.ministryId;
  const isLeader = obs.smallGroup.leaders?.some((l: any) => l.userId === user.id);

  if (!isAdmin && !isAuthor && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para editar esta observação' }, { status: 403 });
  }

  const updated = await prisma.smallGroupObservacao.update({
    where: { id: params.obsId },
    data: { 
      titulo: titulo.trim(), 
      texto: texto.trim(), 
      categoria: categoria || null 
    },
    include: { 
      autor: { select: { id: true, name: true, email: true, role: true } },
      smallGroup: { select: { id: true, name: true } },
      ministry: { select: { id: true, name: true } }
    },
  });

  return NextResponse.json({ observacao: updated });
}

// DELETE: Remover uma observação
export async function DELETE(req: NextRequest, { params }: { params: { id: string, obsId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Verificar se a observação existe
  const obs = await prisma.smallGroupObservacao.findUnique({ 
    where: { id: params.obsId },
    include: {
      smallGroup: {
        include: {
          leaders: { include: { user: true } }
        }
      }
    }
  });

  if (!obs) {
    return NextResponse.json({ error: 'Observação não encontrada' }, { status: 404 });
  }

  // Verificar se a observação pertence ao grupo especificado
  if (obs.smallGroupId !== params.id) {
    return NextResponse.json({ error: 'Observação não pertence ao grupo especificado' }, { status: 400 });
  }

  // Autorização: ADMIN pode excluir qualquer observação, autor pode excluir sua própria, 
  // MASTER pode excluir observações do seu ministério, LEADER pode excluir observações do seu grupo
  const user = session.user as any;
  const isAdmin = user.role === 'ADMIN';
  const isAuthor = obs.autorId === user.id;
  const isMaster = user.role === 'MASTER' && user.masterMinistryId === obs.ministryId;
  const isLeader = obs.smallGroup.leaders?.some((l: any) => l.userId === user.id);

  if (!isAdmin && !isAuthor && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para remover esta observação' }, { status: 403 });
  }

  await prisma.smallGroupObservacao.delete({ where: { id: params.obsId } });
  return NextResponse.json({ success: true });
}