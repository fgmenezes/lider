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
        ministry: { select: { id: true, name: true, church: { select: { name: true } } } },
        masterMinistry: { select: { id: true, name: true, church: { select: { name: true } } } },
      },
    });
    if (!user) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    
    // Determinar qual ministério exibir com base no papel do usuário
    let displayMinistry = user.ministry;
    if (user.role === 'MASTER' && user.masterMinistry) {
      displayMinistry = user.masterMinistry;
    }
    
    // Adicionar campo status para compatibilidade com frontend
    const userWithStatus = { 
      ...user, 
      status: user.isActive ? 'Ativo' : 'Inativo',
      ministry: displayMinistry 
    };
    return NextResponse.json({ user: userWithStatus });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    const userToEdit = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true, ministryId: true, masterMinistry: { select: { id: true } } }
    });
    if (!userToEdit) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }
    // ADMIN pode editar qualquer usuário
    if (session.user?.role === Role.ADMIN) {
      const body = await req.json();
      let hashedPassword = undefined;
      if (body.password) {
        hashedPassword = await hash(body.password, 10);
      }
      let dataNascimentoToSave = undefined;
      if (body.dataNascimento) {
        const date = new Date(body.dataNascimento);
        if (!isNaN(date.getTime())) {
          dataNascimentoToSave = date;
        }
      }
      const updateData: any = {
        name: body.name,
        email: body.email,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        role: body.role,
        ministryId: body.ministryId || undefined,
        isActive: body.isActive !== undefined ? body.isActive : true,
        dataIngresso: body.dataIngresso ? new Date(body.dataIngresso) : undefined,
        celular: body.celular,
        cep: body.cep,
        rua: body.rua,
        numero: body.numero,
        complemento: body.complemento,
        bairro: body.bairro,
        municipio: body.municipio,
        estado: body.estado,
        sexo: body.sexo,
        estadoCivil: body.estadoCivil,
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
    }
    // MASTER não pode editar a si mesmo
    if (session.user?.role === Role.MASTER && session.user.id === params.id) {
      return NextResponse.json({ message: 'Você não pode editar seu próprio usuário MASTER.' }, { status: 403 });
    }
    // MASTER pode editar qualquer LIDER ou MASTER do seu próprio ministério, exceto a si mesmo e ADMIN
    if (session.user?.role === Role.MASTER) {
      const masterMinistryId = session.user.masterMinistry?.id || session.user.masterMinistryId;
      if (
        (userToEdit.ministryId === masterMinistryId || userToEdit.masterMinistry?.id === masterMinistryId) &&
        userToEdit.role !== Role.ADMIN &&
        session.user.id !== params.id
      ) {
        const body = await req.json();
        let hashedPassword = undefined;
        if (body.password) {
          hashedPassword = await hash(body.password, 10);
        }
        let dataNascimentoToSave = undefined;
        if (body.dataNascimento) {
          const date = new Date(body.dataNascimento);
          if (!isNaN(date.getTime())) {
            dataNascimentoToSave = date;
          }
        }
        const updateData: any = {
          name: body.name,
          email: body.email,
          ...(hashedPassword ? { password: hashedPassword } : {}),
          role: body.role,
          ministryId: body.ministryId || undefined,
          isActive: body.isActive !== undefined ? body.isActive : true,
          dataIngresso: body.dataIngresso ? new Date(body.dataIngresso) : undefined,
          celular: body.celular,
          cep: body.cep,
          rua: body.rua,
          numero: body.numero,
          complemento: body.complemento,
          bairro: body.bairro,
          municipio: body.municipio,
          estado: body.estado,
          sexo: body.sexo,
          estadoCivil: body.estadoCivil,
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
      } else {
        return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
      }
    }
    // Outros perfis não podem editar
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true, ministryId: true, masterMinistry: { select: { id: true } } }
    });
    if (!userToDelete) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }
    // ADMIN pode excluir qualquer usuário
    if (session.user?.role === Role.ADMIN) {
      await prisma.user.delete({ where: { id: params.id } });
      return NextResponse.json({ message: 'Usuário excluído com sucesso' });
    }
    // MASTER não pode excluir a si mesmo
    if (session.user?.role === Role.MASTER && session.user.id === params.id) {
      return NextResponse.json({ message: 'Você não pode excluir seu próprio usuário MASTER.' }, { status: 403 });
    }
    // MASTER pode excluir qualquer LIDER ou MASTER do seu próprio ministério, exceto a si mesmo
    if (session.user?.role === Role.MASTER) {
      const masterMinistryId = session.user.masterMinistry?.id || session.user.masterMinistryId;
      if (
        (userToDelete.ministryId === masterMinistryId || userToDelete.masterMinistry?.id === masterMinistryId) &&
        userToDelete.role !== Role.ADMIN &&
        session.user.id !== params.id
      ) {
        await prisma.user.delete({ where: { id: params.id } });
        return NextResponse.json({ message: 'Usuário excluído com sucesso' });
      } else {
        return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
      }
    }
    // Outros perfis não podem excluir
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir usuário' }, { status: 500 });
  }
}