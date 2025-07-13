import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { hash } from 'bcrypt';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        dataIngresso: true,
        celular: true,
        cep: true,
        rua: true,
        numero: true,
        complemento: true,
        bairro: true,
        municipio: true,
        estado: true,
        sexo: true,
        estadoCivil: true,
        dataNascimento: true,
        ministry: { select: { id: true, name: true } },
      },
    });
    if (!user) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      name, email, password, role, ministryId, isActive,
      dataIngresso, celular, cep, rua, numero, complemento, bairro, municipio, estado,
      sexo, estadoCivil, dataNascimento
    } = body;
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await hash(password, 10);
    }
    let dataNascimentoToSave = undefined;
    if (dataNascimento) {
      const date = new Date(dataNascimento);
      if (!isNaN(date.getTime())) {
        dataNascimentoToSave = date;
      }
    }
    const updateData: any = {
      name,
      email,
      ...(hashedPassword ? { password: hashedPassword } : {}),
      role,
      ministryId: ministryId || undefined,
      isActive: isActive !== undefined ? isActive : true,
      dataIngresso: dataIngresso ? new Date(dataIngresso) : undefined,
      celular,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      municipio,
      estado,
      sexo,
      estadoCivil,
    };
    if (typeof dataNascimentoToSave !== 'undefined') {
      updateData.dataNascimento = dataNascimentoToSave;
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        dataIngresso: true,
        celular: true,
        cep: true,
        rua: true,
        numero: true,
        complemento: true,
        bairro: true,
        municipio: true,
        estado: true,
        sexo: true,
        estadoCivil: true,
        dataNascimento: true,
        ministry: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir usuário' }, { status: 500 });
  }
} 