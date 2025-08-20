import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Esquema de validação para criação de membro (sem senha)
const createMemberSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
});

export async function POST(request: Request) {
  try {
    // Recupera a sessão do usuário autenticado
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Busca o usuário autenticado no banco de dados
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { ministryId: true },
    });

    if (!user || !user.ministryId) {
      return NextResponse.json({ error: 'Ministério do usuário não encontrado' }, { status: 400 });
    }

    const body = await request.json();
    const validation = createMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { name, email } = validation.data;

    // Verifica se já existe um membro com o mesmo e-mail no mesmo ministério
    const existingUser = await prisma.member.findFirst({
      where: {
        email,
        ministryId: user.ministryId,
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Usuário já existe neste ministério' }, { status: 409 });
    }

    // Cria novo membro vinculado ao ministério do usuário logado
    const newMember = await prisma.member.create({
      data: {
        name,
        email,
        ministryId: user.ministryId,
      },
    });

    return NextResponse.json(newMember, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// GET: Lista todos os membros do ministério do usuário autenticado
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Suporte a múltiplos perfis
    let ministryId = session.user.ministryId;
    if (session.user.role === 'MASTER') {
      ministryId = session.user.masterMinistryId;
    }
    
    // Permitir sobrescrever o ministryId para casos específicos (como seleção de membros para grupos)
    const { searchParams } = new URL(req.url);
    const overrideMinistryId = searchParams.get('ministryId');
    if (overrideMinistryId) {
      ministryId = overrideMinistryId;
    }

    if (!ministryId) {
      return NextResponse.json({ error: 'Usuário sem ministério associado' }, { status: 400 });
    }

    // Filtros via query string
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const sortField = searchParams.get('sortField') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const skip = (page - 1) * perPage;

    // Montar where dinâmico
    const where: any = { ministryId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    // Ordenação dinâmica
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
      prisma.member.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      members,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Erro ao listar membros:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
