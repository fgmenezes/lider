import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Buscar o usuário para obter o papel e ministryId (se aplicável)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, ministryId: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    let totalMembers = 0;
    let totalSmallGroups = 0;
    let totalEventsThisMonth = 0;

    if (user.role === Role.ADMIN) {
      // Para Admin, contar globalmente (exemplo - ajuste conforme a necessidade de métricas globais)
      totalMembers = await prisma.member.count();
      totalSmallGroups = await prisma.smallGroup.count();
      
      // Contar eventos neste mês (globalmente)
       const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
       const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      totalEventsThisMonth = await prisma.event.count({
         where: {
           date: {
             gte: startOfMonth,
             lte: endOfMonth,
           },
         },
      });

    } else if (user.role === Role.MASTER || user.role === Role.LEADER) {
      // Para Líder Master e Líder, contar dentro do ministério associado
      if (!user.ministryId) {
         return NextResponse.json({ message: 'Usuário não associado a um ministério' }, { status: 400 });
      }

      totalMembers = await prisma.member.count({
        where: { ministryId: user.ministryId }
      });
      totalSmallGroups = await prisma.smallGroup.count({
        where: { ministryId: user.ministryId }
      });

       // Contar eventos neste mês (por ministério)
       const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
       const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

       totalEventsThisMonth = await prisma.event.count({
         where: {
           ministryId: user.ministryId,
           date: {
             gte: startOfMonth,
             lte: endOfMonth,
           },
         },
       });
    }

    // Retornar as métricas como JSON
    return NextResponse.json({
      totalMembers,
      totalSmallGroups,
      totalEventsThisMonth,
    });

  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
} 