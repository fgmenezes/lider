
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMemberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  ministryId: z.string().min(1).optional(),
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, ministryId: true, masterMinistryId: true }
    });
    if (!user) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });

    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        ministry: { select: { id: true, name: true, church: { select: { name: true } } } },
        smallGroupMemberships: { select: { id: true, role: true, joinedAt: true, smallGroup: { select: { id: true, name: true } } } }
      }
    });
    if (!member) return NextResponse.json({ message: 'Membro não encontrado' }, { status: 404 });

    if (user.role === 'MASTER' && member.ministryId !== user.masterMinistryId) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }
    if (user.role === 'LEADER' && member.ministryId !== user.ministryId) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    // Buscar dados relacionados (responsáveis, irmãos e primos)
    const [responsaveis, irmaos, primos] = await Promise.all([
      prisma.responsavel.findMany({ where: { memberId: params.id } }),
      prisma.memberIrmao.findMany({ where: { memberId: params.id }, include: { irmao: { select: { id: true, name: true } } } }),
      prisma.memberPrimo.findMany({ where: { memberId: params.id }, include: { primo: { select: { id: true, name: true } } } })
    ]);

    // Retornar membro com dados relacionados
    const memberWithRelations = {
      ...member,
      responsaveis,
      irmaos: irmaos.map(i => i.irmao),
      primos: primos.map(p => p.primo)
    };

    return NextResponse.json({ member: memberWithRelations });

  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });

    const body = await req.json();
    const validatedData = updateMemberSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, ministryId: true, masterMinistryId: true }
    });
    if (!user) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });

    const existingMember = await prisma.member.findUnique({ where: { id: params.id }, select: { ministryId: true } });
    if (!existingMember) return NextResponse.json({ message: 'Membro não encontrado' }, { status: 404 });

    if ((user.role === 'MASTER' && validatedData.ministryId && validatedData.ministryId !== user.masterMinistryId) ||
        (user.role === 'LEADER' && validatedData.ministryId && validatedData.ministryId !== user.ministryId)) {
      return NextResponse.json({ message: 'Não é possível alterar o ministério do membro' }, { status: 403 });
    }

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

    const member = await prisma.member.update({
      where: { id: params.id },
      data: updateData,
      include: {
        ministry: { select: { id: true, name: true, church: { select: { name: true } } } },
        smallGroupMemberships: { select: { id: true, role: true, joinedAt: true, smallGroup: { select: { id: true, name: true } } } }
      }
    });

    // Registrar atividade de atualização
    await prisma.atividade.create({
      data: {
        tipo: 'MEMBRO',
        acao: 'ATUALIZAR',
        descricao: `Membro atualizado: ${member.name}`,
        detalhes: JSON.stringify({
          memberId: member.id,
          memberName: member.name,
          updatedFields: Object.keys(updateData),
          changes: updateData
        }),
        entidadeId: member.id,
        usuarioId: session.user.id,
        ministryId: member.ministryId,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    if (validatedData.responsaveis) {
      await prisma.responsavel.deleteMany({ where: { memberId: params.id } });
      if (validatedData.responsaveis.length > 0) {
        await prisma.responsavel.createMany({
          data: validatedData.responsaveis.map(r => ({
            memberId: params.id,
            nome: r.nome,
            celular: r.celular,
            tipo: r.tipo
          }))
        });
      }
    }

    if (validatedData.irmaosIds) {
      await prisma.memberIrmao.deleteMany({ where: { memberId: params.id } });
      if (validatedData.irmaosIds.length > 0) {
        await prisma.memberIrmao.createMany({ data: validatedData.irmaosIds.map(id => ({ memberId: params.id, irmaoId: id })) });
      }
    }

    if (validatedData.primosIds) {
      await prisma.memberPrimo.deleteMany({ where: { memberId: params.id } });
      if (validatedData.primosIds.length > 0) {
        await prisma.memberPrimo.createMany({ data: validatedData.primosIds.map(id => ({ memberId: params.id, primoId: id })) });
      }
    }

    const [responsaveis, irmaos, primos] = await Promise.all([
      prisma.responsavel.findMany({ where: { memberId: params.id } }),
      prisma.memberIrmao.findMany({ where: { memberId: params.id }, include: { irmao: true } }),
      prisma.memberPrimo.findMany({ where: { memberId: params.id }, include: { primo: true } })
    ]);

    return NextResponse.json({ message: 'Membro atualizado com sucesso', member: { ...member, responsaveis, irmaos: irmaos.map(i => i.irmao), primos: primos.map(p => p.primo) } });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Dados inválidos', errors: error.errors }, { status: 400 });
    }
    console.error('Erro ao atualizar membro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, ministryId: true, masterMinistryId: true }
    });
    if (!user) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });

    const existingMember = await prisma.member.findUnique({ 
      where: { id: params.id }, 
      select: { 
        ministryId: true, 
        name: true, 
        email: true 
      } 
    });
    if (!existingMember) return NextResponse.json({ message: 'Membro não encontrado' }, { status: 404 });

    if ((user.role === 'MASTER' && existingMember.ministryId !== user.masterMinistryId) ||
        (user.role === 'LEADER' && existingMember.ministryId !== user.ministryId)) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    // Remover todas as relações do membro antes de excluí-lo
    await prisma.responsavel.deleteMany({ where: { memberId: params.id } });
    await prisma.memberIrmao.deleteMany({ where: { memberId: params.id } });
    await prisma.memberPrimo.deleteMany({ where: { memberId: params.id } });
    await prisma.memberObservacao.deleteMany({ where: { memberId: params.id } });
    await prisma.smallGroupMember.deleteMany({ where: { memberId: params.id } });
    await prisma.smallGroupAttendance.deleteMany({ where: { memberId: params.id } });
    
    // Remover referências onde este membro é irmão ou primo de outros
    await prisma.memberIrmao.deleteMany({ where: { irmaoId: params.id } });
    await prisma.memberPrimo.deleteMany({ where: { primoId: params.id } });
    
    await prisma.member.delete({ where: { id: params.id } });

    // Registrar atividade de exclusão
    await prisma.atividade.create({
      data: {
        tipo: 'MEMBRO',
        acao: 'EXCLUIR',
        descricao: `Membro excluído: ${existingMember.name}`,
        detalhes: `Email: ${existingMember.email || 'N/A'}`,
        entidadeId: params.id,
        usuarioId: session.user.id,
        ministryId: existingMember.ministryId,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      }
    });

    return NextResponse.json({ message: 'Membro excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir membro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
