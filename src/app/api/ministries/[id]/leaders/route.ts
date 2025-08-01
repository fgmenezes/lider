import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const excludeIds = (searchParams.get('excludeIds') || '').split(',').filter(Boolean);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const skip = (page - 1) * perPage;

    // Buscar usuários MASTER ou LEADER do ministério
    const whereClause: any = {
      OR: [
        { role: 'MASTER', masterMinistryId: params.id },
        { role: 'LEADER', ministryId: params.id },
      ],
    };
    if (search) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { celular: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }
    if (excludeIds.length > 0) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        { id: { notIn: excludeIds } },
      ];
    }
    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip,
        take: perPage,
        select: { id: true, name: true, email: true, celular: true, role: true },
      }),
    ]);
    const totalPages = Math.ceil(total / perPage);
    return NextResponse.json({
      leaders: users,
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
    console.error('Erro ao buscar líderes elegíveis:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 