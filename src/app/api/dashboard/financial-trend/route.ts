import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    
    // Calcular datas para comparação
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Definir filtros baseados no papel do usuário
    let whereClause: any = {};
    
    if (user.role === 'LEADER') {
      whereClause.ministryId = user.ministryId;
    } else if (user.role === 'MASTER') {
      whereClause.ministryId = user.masterMinistryId;
    }
    // ADMIN pode ver todas as finanças (sem filtro adicional)

    // Buscar finanças do mês atual
    const currentMonthFinances = await prisma.finance.findMany({
      where: {
        date: {
          gte: currentMonth
        },
        ...whereClause
      },
      select: {
        type: true,
        amount: true
      }
    });

    // Buscar finanças do mês anterior
    const previousMonthFinances = await prisma.finance.findMany({
      where: {
        date: {
          gte: previousMonth,
          lte: previousMonthEnd
        },
        ...whereClause
      },
      select: {
        type: true,
        amount: true
      }
    });

    // Calcular totais do mês atual
    const currentIncome = currentMonthFinances
      .filter(f => f.type === 'ENTRADA')
      .reduce((sum, f) => sum + Number(f.amount), 0);
    
    const currentExpenses = currentMonthFinances
      .filter(f => f.type === 'SAIDA')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    // Calcular totais do mês anterior
    const previousIncome = previousMonthFinances
      .filter(f => f.type === 'ENTRADA')
      .reduce((sum, f) => sum + Number(f.amount), 0);
    
    const previousExpenses = previousMonthFinances
      .filter(f => f.type === 'SAIDA')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    // Calcular crescimento percentual
    const incomeGrowth = previousIncome > 0 
      ? ((currentIncome - previousIncome) / previousIncome) * 100 
      : currentIncome > 0 ? 100 : 0;

    const expenseGrowth = previousExpenses > 0 
      ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 
      : currentExpenses > 0 ? 100 : 0;

    // Buscar dados dos últimos 6 meses para o mini gráfico
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const monthFinances = await prisma.finance.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd
          },
          ...whereClause
        },
        select: {
          type: true,
          amount: true
        }
      });

      const monthIncome = monthFinances
        .filter(f => f.type === 'ENTRADA')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      
      const monthExpenses = monthFinances
        .filter(f => f.type === 'SAIDA')
        .reduce((sum, f) => sum + Number(f.amount), 0);

      const monthBalance = monthIncome - monthExpenses;

      monthlyData.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthBalance
      });
    }

    return NextResponse.json({
      incomeGrowth: Math.round(incomeGrowth * 10) / 10, // Arredondar para 1 casa decimal
      expenseGrowth: Math.round(expenseGrowth * 10) / 10,
      currentMonth: {
        income: currentIncome,
        expenses: currentExpenses,
        balance: currentIncome - currentExpenses
      },
      previousMonth: {
        income: previousIncome,
        expenses: previousExpenses,
        balance: previousIncome - previousExpenses
      },
      monthlyData
    });

  } catch (error) {
    console.error('Erro ao buscar tendências financeiras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}