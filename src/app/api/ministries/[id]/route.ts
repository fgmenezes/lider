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
    
    return NextResponse.json({
      ministry: {
        id: ministry.id,
        name: ministry.name,
        church: ministry.church,
        churchName: ministry.churchName,
        churchPhone: ministry.churchPhone,
        churchEmail: ministry.churchEmail,
        pastorName: ministry.pastorName,
        pastorPhone: ministry.pastorPhone,
        pastorEmail: ministry.pastorEmail,
        cep: ministry.cep,
        rua: ministry.rua,
        numero: ministry.numero,
        complemento: ministry.complemento,
        bairro: ministry.bairro,
        municipio: ministry.municipio,
        estado: ministry.estado,
        masters: ministry.masters, // corrigido
        members: ministry.members,
        status: ministry.status,
        createdAt: ministry.createdAt,
        updatedAt: ministry.updatedAt,
      }
    });
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
    await prisma.ministry.delete({ where: { id: params.id } });
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
    const ministry = await prisma.ministry.update({
      where: { id: params.id },
      data: { masters: { set: [] } }, // desconecta todos os masters
      include: { church: true, masters: true, members: true }, // corrigido
    });
    return NextResponse.json({ ministry });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao desassociar líder master' }, { status: 500 });
  }
}
