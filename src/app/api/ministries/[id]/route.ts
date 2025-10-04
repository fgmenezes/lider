import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const ministry = await prisma.ministry.findUnique({
      where: { id: params.id },
      include: {
        church: true,
        masters: true, // corrigido
        members: true,
      },
    });
    if (!ministry) return NextResponse.json({ message: 'Ministério não encontrado' }, { status: 404 });
    
    // Retornando diretamente o objeto ministry para simplificar o acesso aos dados
    return NextResponse.json(ministry);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar ministério' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { name, churchId, masterId, status } = body;

    const data: any = {
      name,
      church: churchId ? { connect: { id: churchId } } : undefined,
      masters: masterId ? { connect: { id: masterId } } : undefined, // corrigido
    };

    if (typeof status !== 'undefined') {
      data.status = status;
    }

    const ministry = await prisma.ministry.update({
      where: { id: params.id },
      data,
      include: { church: true, masters: true, members: true }, // corrigido
    });

    return NextResponse.json({ ministry });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar ministério' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    // Buscar dados do ministério antes de excluir
    const ministry = await prisma.ministry.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        church: { select: { name: true } }
      }
    });

    if (!ministry) {
      return NextResponse.json({ message: 'Ministério não encontrado' }, { status: 404 });
    }

    await prisma.ministry.delete({ where: { id: params.id } });

    // Registrar atividade de exclusão
    await prisma.atividade.create({
      data: {
        tipo: 'MINISTERIO',
        acao: 'EXCLUIR',
        descricao: `Ministério excluído: ${ministry.name}`,
        detalhes: `Igreja: ${ministry.church?.name || 'N/A'}`,
        entidadeId: params.id,
        usuarioId: session.user.id,
        ministryId: null, // Ministério foi excluído
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      }
    });

    return NextResponse.json({ message: 'Ministério excluído com sucesso' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir ministério' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!req.url.endsWith('/dissociate-master')) {
    return NextResponse.json({ message: 'Rota não encontrada' }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    const { masterId } = await req.json();
    if (!masterId) {
      return NextResponse.json({ message: 'masterId é obrigatório' }, { status: 400 });
    }

    // Remove o master específico do ministério
    await prisma.user.update({
      where: { id: masterId },
      data: { masterMinistryId: null, role: 'LEADER' }
    });

    // Retorna o ministério atualizado
    const ministry = await prisma.ministry.findUnique({
      where: { id: params.id },
      include: { church: true, masters: true, members: true }
    });
    
    return NextResponse.json({ ministry });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao desassociar líder master' }, { status: 500 });
  }
}
