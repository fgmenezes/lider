import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const churches = await prisma.church.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ churches });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar igrejas' }, { status: 500 });
  }
} 