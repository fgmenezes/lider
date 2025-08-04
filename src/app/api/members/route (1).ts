
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Esquema de validação para criação de membro
const createMemberSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export async function POST(request: Request) {
  const body = await request.json();

  const validation = createMemberSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
  }

  const { name, email, password } = validation.data;

  const existingUser = await prisma.member.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newMember = await prisma.member.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return NextResponse.json(newMember, { status: 201 });
}
