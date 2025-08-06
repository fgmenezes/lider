import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Esquema de validação para criação de membro (sem senha)
const createMemberSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = createMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { name, email } = validation.data;

    // Usa findFirst porque o campo email não é único no banco
    const existingUser = await prisma.member.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 });
    }

    const newMember = await prisma.member.create({
      data: {
        name,
        email,
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
