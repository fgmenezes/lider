import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { NextResponse } from 'next/server';

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
