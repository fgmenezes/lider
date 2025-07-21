import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Schema de validação para criação de membro
const createMemberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  ministryId: z.string().min(1, 'Ministério é obrigatório'),
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

// Schema de validação para atualização de membro
const updateMemberSchema = createMemberSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Sessão (session.user):', session?.user);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '10');
    const ministryId = searchParams.get('ministryId');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, ministryId: true, masterMinistryId: true }
    });
    console.log('Usuário do banco:', user);

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Construir filtros baseados no role do usuário
    let whereClause: any = {};
    
    if (user.role === 'ADMIN') {
      // Admin pode ver todos os membros
      if (ministryId) {
        whereClause.ministryId = ministryId;
      }
    } else if (user.role === 'MASTER') {
      // Líder Master pode ver membros do seu ministério
      whereClause.ministryId = user.masterMinistryId;
    } else {
      // Líder pode ver membros do seu ministério
      whereClause.ministryId = user.ministryId;
    }

    // Adicionar filtro de busca
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    console.log('Filtro whereClause:', whereClause);

    // Buscar membros com paginação
    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        include: {
          ministry: {
            select: {
              id: true,
              name: true,
              church: { select: { name: true } }
            }
          }
          // smallGroups removido
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.member.count({ where: whereClause })
    ]);

    // Buscar vínculos e responsáveis separadamente
    const memberIds = members.map(m => m.id);
    const [responsaveis, irmaos, primos] = await Promise.all([
      prisma.responsavel.findMany({ where: { memberId: { in: memberIds } } }),
      prisma.memberIrmao.findMany({ where: { memberId: { in: memberIds } }, include: { irmao: true } }),
      prisma.memberPrimo.findMany({ where: { memberId: { in: memberIds } }, include: { primo: true } })
    ]);

    // Montar resposta
    const membersWithRelations = members.map(m => ({
      ...m,
      responsaveis: responsaveis.filter(r => r.memberId === m.id),
      irmaos: irmaos.filter(i => i.memberId === m.id).map(i => i.irmao),
      primos: primos.filter(p => p.memberId === m.id).map(p => p.primo),
    }));

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      members: membersWithRelations,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Payload recebido no cadastro de membro:', body);
    
    // Validar dados de entrada
    const validatedData = createMemberSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, ministryId: true, masterMinistryId: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    let ministryId = validatedData.ministryId;
    
    if (user.role === 'ADMIN') {
      // Admin pode criar membros em qualquer ministério
      if (!ministryId) {
        return NextResponse.json({ message: 'Ministério é obrigatório' }, { status: 400 });
      }
    } else if (user.role === 'MASTER') {
      // Líder Master só pode criar membros no seu ministério
      ministryId = user.masterMinistryId;
      if (!ministryId) {
        return NextResponse.json({ message: 'Líder Master deve estar associado a um ministério' }, { status: 400 });
      }
    } else {
      // Líder só pode criar membros no seu ministério
      ministryId = user.ministryId;
      if (!ministryId) {
        return NextResponse.json({ message: 'Líder deve estar associado a um ministério' }, { status: 400 });
      }
    }

    // Verificar se o ministério existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: ministryId as string }
    });

    if (!ministry) {
      return NextResponse.json({ message: 'Ministério não encontrado' }, { status: 404 });
    }

    // Criar membro
    const member = await prisma.member.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        ministryId: ministryId as string,
        ...(validatedData.dataNascimento ? { dataNascimento: new Date(validatedData.dataNascimento) } : {}),
        ...(validatedData.sexo ? { sexo: validatedData.sexo } : {}),
        ...(validatedData.estadoCivil ? { estadoCivil: validatedData.estadoCivil } : {}),
        ...(validatedData.cep ? { cep: validatedData.cep } : {}),
        ...(validatedData.rua ? { rua: validatedData.rua } : {}),
        ...(validatedData.numero ? { numero: validatedData.numero } : {}),
        ...(validatedData.complemento ? { complemento: validatedData.complemento } : {}),
        ...(validatedData.bairro ? { bairro: validatedData.bairro } : {}),
        ...(validatedData.municipio ? { municipio: validatedData.municipio } : {}),
        ...(validatedData.estado ? { estado: validatedData.estado } : {}),
        ...(validatedData.batizado !== undefined ? { batizado: validatedData.batizado } : {}),
        ...(validatedData.dataIngresso ? { dataIngresso: new Date(validatedData.dataIngresso) } : {}),
        status: validatedData.status || 'ATIVO',
      }
    });

    // Criar responsáveis
    if (validatedData.responsaveis && validatedData.responsaveis.length > 0) {
      await prisma.responsavel.createMany({
        data: (validatedData.responsaveis as { nome: string; celular: string; tipo: string }[]).map((r) => ({ ...r, memberId: member.id }))
      });
    }

    // Criar vínculos de irmãos
    if (validatedData.irmaosIds && validatedData.irmaosIds.length > 0) {
      await prisma.memberIrmao.createMany({
        data: (validatedData.irmaosIds as string[]).map((irmaoId) => ({ memberId: member.id, irmaoId }))
      });
    }
    // Criar vínculos de primos
    if (validatedData.primosIds && validatedData.primosIds.length > 0) {
      await prisma.memberPrimo.createMany({
        data: (validatedData.primosIds as string[]).map((primoId) => ({ memberId: member.id, primoId }))
      });
    }

    // Buscar membro completo para retorno
    const memberWithRelations = await prisma.member.findUnique({
      where: { id: member.id },
      include: {
        ministry: { select: { id: true, name: true, church: { select: { name: true } } } },
        // smallGroups removido
      }
    });
    const [responsaveis, irmaos, primos] = await Promise.all([
      prisma.responsavel.findMany({ where: { memberId: member.id } }),
      prisma.memberIrmao.findMany({ where: { memberId: member.id }, include: { irmao: true } }),
      prisma.memberPrimo.findMany({ where: { memberId: member.id }, include: { primo: true } })
    ]);
    return NextResponse.json({
      message: 'Membro criado com sucesso',
      member: {
        ...memberWithRelations,
        responsaveis,
        irmaos: irmaos.map(i => i.irmao),
        primos: primos.map(p => p.primo),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar membro:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 