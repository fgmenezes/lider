import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para atualização de membro
const updateMemberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  ministryId: z.string().min(1, 'Ministério é obrigatório').optional(),
  dataNascimento: z.string().optional(),
  sexo: z.string().optional(),
  estadoCivil: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  estado: z.string().optional(),
  batizado: z.boolean().optional(),
  dataIngresso: z.string().optional(),
  responsaveis: z.array(z.object({ nome: z.string(), celular: z.string(), tipo: z.string() })).optional(),
  irmaosIds: z.array(z.string()).optional(),
  primosIds: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, ministryId: true, masterMinistryId: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar membro
    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        ministry: {
          select: {
            id: true,
            name: true,
            church: { select: { name: true } }
          }
        },
        smallGroups: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json({ message: 'Membro não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    if (user.role === 'ADMIN') {
      // Admin pode ver qualquer membro
    } else if (user.role === 'MASTER') {
      // Líder Master só pode ver membros do seu ministério
      if (member.ministryId !== user.masterMinistryId) {
        return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
      }
    } else {
      // Líder só pode ver membros do seu ministério
      if (member.ministryId !== user.ministryId) {
        return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
      }
    }

    return NextResponse.json({ member });

  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = updateMemberSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, ministryId: true, masterMinistryId: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o membro existe
    const existingMember = await prisma.member.findUnique({
      where: { id: params.id },
      select: { ministryId: true }
    });

    if (!existingMember) {
      return NextResponse.json({ message: 'Membro não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    if (user.role === 'ADMIN') {
      // Admin pode editar qualquer membro
    } else if (user.role === 'MASTER') {
      // Líder Master só pode editar membros do seu ministério
      if (existingMember.ministryId !== user.masterMinistryId) {
        return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
      }
      // Se estiver tentando mudar o ministério, não permitir
      if (validatedData.ministryId && validatedData.ministryId !== user.masterMinistryId) {
        return NextResponse.json({ message: 'Não é possível alterar o ministério do membro' }, { status: 403 });
      }
    } else {
      // Líder só pode editar membros do seu ministério
      if (existingMember.ministryId !== user.ministryId) {
        return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
      }
      // Se estiver tentando mudar o ministério, não permitir
      if (validatedData.ministryId && validatedData.ministryId !== user.ministryId) {
        return NextResponse.json({ message: 'Não é possível alterar o ministério do membro' }, { status: 403 });
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.ministryId !== undefined) updateData.ministryId = validatedData.ministryId;
    if (validatedData.dataNascimento !== undefined) updateData.dataNascimento = validatedData.dataNascimento ? new Date(validatedData.dataNascimento) : null;
    if (validatedData.sexo !== undefined) updateData.sexo = validatedData.sexo;
    if (validatedData.estadoCivil !== undefined) updateData.estadoCivil = validatedData.estadoCivil;
    if (validatedData.cep !== undefined) updateData.cep = validatedData.cep;
    if (validatedData.rua !== undefined) updateData.rua = validatedData.rua;
    if (validatedData.numero !== undefined) updateData.numero = validatedData.numero;
    if (validatedData.complemento !== undefined) updateData.complemento = validatedData.complemento;
    if (validatedData.bairro !== undefined) updateData.bairro = validatedData.bairro;
    if (validatedData.municipio !== undefined) updateData.municipio = validatedData.municipio;
    if (validatedData.estado !== undefined) updateData.estado = validatedData.estado;
    if (validatedData.batizado !== undefined) updateData.batizado = validatedData.batizado;
    if (validatedData.dataIngresso !== undefined) updateData.dataIngresso = validatedData.dataIngresso ? new Date(validatedData.dataIngresso) : null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    // Atualizar membro
    const member = await prisma.member.update({
      where: { id: params.id },
      data: updateData,
      include: {
        ministry: {
          select: {
            id: true,
            name: true,
            church: { select: { name: true } }
          }
        },
        smallGroups: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Atualizar responsáveis
    if (validatedData.responsaveis) {
      await prisma.responsavel.deleteMany({ where: { memberId: params.id } });
      if (validatedData.responsaveis.length > 0) {
        await prisma.responsavel.createMany({
          data: (validatedData.responsaveis as { nome: string; celular: string; tipo: string }[]).map((r) => ({ ...r, memberId: params.id }))
        });
      }
    }
    // Atualizar vínculos de irmãos
    if (validatedData.irmaosIds) {
      await prisma.memberIrmao.deleteMany({ where: { memberId: params.id } });
      if (validatedData.irmaosIds.length > 0) {
        await prisma.memberIrmao.createMany({
          data: (validatedData.irmaosIds as string[]).map((irmaoId) => ({ memberId: params.id, irmaoId }))
        });
      }
    }
    // Atualizar vínculos de primos
    if (validatedData.primosIds) {
      await prisma.memberPrimo.deleteMany({ where: { memberId: params.id } });
      if (validatedData.primosIds.length > 0) {
        await prisma.memberPrimo.createMany({
          data: (validatedData.primosIds as string[]).map((primoId) => ({ memberId: params.id, primoId }))
        });
      }
    }
    // Buscar membro completo para retorno
    const memberWithRelations = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        ministry: { select: { id: true, name: true, church: { select: { name: true } } } },
        smallGroups: { select: { id: true, name: true } },
      }
    });
    const [responsaveis, irmaos, primos] = await Promise.all([
      prisma.responsavel.findMany({ where: { memberId: params.id } }),
      prisma.memberIrmao.findMany({ where: { memberId: params.id }, include: { irmao: true } }),
      prisma.memberPrimo.findMany({ where: { memberId: params.id }, include: { primo: true } })
    ]);
    return NextResponse.json({
      message: 'Membro atualizado com sucesso',
      member: {
        ...memberWithRelations,
        responsaveis,
        irmaos: irmaos.map(i => i.irmao),
        primos: primos.map(p => p.primo),
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar membro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, ministryId: true, masterMinistryId: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o membro existe
    const existingMember = await prisma.member.findUnique({
      where: { id: params.id },
      select: { ministryId: true }
    });

    if (!existingMember) {
      return NextResponse.json({ message: 'Membro não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    if (user.role === 'ADMIN') {
      // Admin pode excluir qualquer membro
    } else if (user.role === 'MASTER') {
      // Líder Master só pode excluir membros do seu ministério
      if (existingMember.ministryId !== user.masterMinistryId) {
        return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
      }
    } else {
      // Líder só pode excluir membros do seu ministério
      if (existingMember.ministryId !== user.ministryId) {
        return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
      }
    }

    // Excluir registros relacionados antes de deletar o membro
    await prisma.responsavel.deleteMany({ where: { memberId: params.id } });
    await prisma.memberIrmao.deleteMany({ where: { memberId: params.id } });
    await prisma.memberPrimo.deleteMany({ where: { memberId: params.id } });
    // Adicione aqui outros relacionamentos se necessário

    // Excluir membro
    await prisma.member.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Membro excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir membro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 