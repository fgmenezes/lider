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
    let totalLeaders = 0;
    let totalMasters = 0;
    let nextMeetings7Days = 0;
    let birthdayMembersThisMonth = 0;
    let avgAttendance = null;
    let totalVisitorsThisMonth = 0;
    let totalReceitasMes = 0;
    let totalDespesasMes = 0;
    let saldoMes = 0;
    let saldoAcumulado = 0;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    if (user.role === Role.ADMIN) {
      totalMembers = await prisma.member.count();
      totalSmallGroups = await prisma.smallGroup.count();
      totalLeaders = await prisma.user.count({ where: { role: Role.LEADER } });
      totalMasters = await prisma.user.count({ where: { role: Role.MASTER } });
      totalEventsThisMonth = await prisma.event.count({
        where: { startDate: { gte: startOfMonth, lte: endOfMonth } },
      });
      nextMeetings7Days = await prisma.smallGroupMeeting.count({
        where: { date: { gte: today, lte: sevenDaysFromNow } },
      });
      birthdayMembersThisMonth = await prisma.member.count({
         where: {
          dataNascimento: {
             gte: startOfMonth,
             lte: endOfMonth,
           },
         },
      });
      // Visitantes e frequência média (se houver dados)
      totalVisitorsThisMonth = await prisma.smallGroupVisitor.count({
        where: {
          meeting: {
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        },
      });
      // Frequência média: Exemplo básico (ajuste conforme modelo de presenças)
      const totalPresencas = await prisma.smallGroupAttendance.count({
        where: {
          meeting: {
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          present: true,
        },
      });
      const totalReunioes = await prisma.smallGroupMeeting.count({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
      });
      avgAttendance = totalReunioes > 0 ? Math.round((totalPresencas / totalReunioes) * 100) : null;
      totalReceitasMes = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: {
          type: 'ENTRADA',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }).then(r => r._sum.amount || 0);
      totalDespesasMes = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: {
          type: 'SAIDA',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }).then(r => r._sum.amount || 0);
      saldoMes = totalReceitasMes - totalDespesasMes;
      
      // Calcular saldo acumulado corretamente (ENTRADA - SAIDA)
      const totalEntradasAcumuladasAdmin = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: { 
          type: 'ENTRADA'
        },
      }).then(r => r._sum.amount || 0);
      
      const totalSaidasAcumuladasAdmin = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: { 
          type: 'SAIDA'
        },
      }).then(r => r._sum.amount || 0);
      
      saldoAcumulado = totalEntradasAcumuladasAdmin - totalSaidasAcumuladasAdmin;
    } else if (user.role === Role.MASTER) {
      const masterMinistryId = session.user.masterMinistryId;
      if (!masterMinistryId) {
         return NextResponse.json({ message: 'Usuário MASTER não associado a um ministério' }, { status: 400 });
      }
      totalMembers = await prisma.member.count({ where: { ministryId: masterMinistryId } });
      totalSmallGroups = await prisma.smallGroup.count({ where: { ministryId: masterMinistryId } });
      totalLeaders = await prisma.user.count({ where: { ministryId: masterMinistryId, role: Role.LEADER } });
      totalMasters = await prisma.user.count({ where: { masterMinistryId: masterMinistryId, role: Role.MASTER } });
      totalEventsThisMonth = await prisma.event.count({
        where: {
          ministryId: masterMinistryId,
          startDate: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      nextMeetings7Days = await prisma.smallGroupMeeting.count({
        where: {
          smallGroup: { ministryId: masterMinistryId },
          date: { gte: today, lte: sevenDaysFromNow },
        },
      });
      birthdayMembersThisMonth = await prisma.member.count({
         where: {
           ministryId: masterMinistryId,
          dataNascimento: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      totalVisitorsThisMonth = await prisma.smallGroupVisitor.count({
        where: {
          meeting: {
            smallGroup: { ministryId: masterMinistryId },
            date: { gte: startOfMonth, lte: endOfMonth },
           },
         },
       });
      const totalPresencas = await prisma.smallGroupAttendance.count({
        where: {
          meeting: {
            smallGroup: { ministryId: masterMinistryId },
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          present: true,
        },
      });
      const totalReunioes = await prisma.smallGroupMeeting.count({
        where: {
          smallGroup: { ministryId: masterMinistryId },
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      avgAttendance = totalReunioes > 0 ? Math.round((totalPresencas / totalReunioes) * 100) : null;
      totalReceitasMes = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: {
          ministryId: masterMinistryId,
          type: 'ENTRADA',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }).then(r => r._sum.amount || 0);
      totalDespesasMes = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: {
          ministryId: masterMinistryId,
          type: 'SAIDA',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }).then(r => r._sum.amount || 0);
      saldoMes = totalReceitasMes - totalDespesasMes;
      
      // Calcular saldo acumulado corretamente (ENTRADA - SAIDA)
      const totalEntradasAcumuladasMaster = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: { 
          ministryId: masterMinistryId,
          type: 'ENTRADA'
        },
      }).then(r => r._sum.amount || 0);
      
      const totalSaidasAcumuladasMaster = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: { 
          ministryId: masterMinistryId,
          type: 'SAIDA'
        },
      }).then(r => r._sum.amount || 0);
      
      saldoAcumulado = totalEntradasAcumuladasMaster - totalSaidasAcumuladasMaster;
    } else if (user.role === Role.LEADER) {
      if (!user.ministryId) {
         return NextResponse.json({ message: 'Usuário não associado a um ministério' }, { status: 400 });
      }
      totalMembers = await prisma.member.count({ where: { ministryId: user.ministryId } });
      totalSmallGroups = await prisma.smallGroup.count({ where: { ministryId: user.ministryId } });
      totalLeaders = await prisma.user.count({ where: { ministryId: user.ministryId, role: Role.LEADER } });
      totalMasters = await prisma.user.count({ where: { masterMinistryId: user.ministryId, role: Role.MASTER } });
      totalEventsThisMonth = await prisma.event.count({
        where: {
          ministryId: user.ministryId,
          startDate: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      nextMeetings7Days = await prisma.smallGroupMeeting.count({
        where: {
          smallGroup: { ministryId: user.ministryId },
          date: { gte: today, lte: sevenDaysFromNow },
        },
      });
      birthdayMembersThisMonth = await prisma.member.count({
         where: {
           ministryId: user.ministryId,
          dataNascimento: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      totalVisitorsThisMonth = await prisma.smallGroupVisitor.count({
        where: {
          meeting: {
            smallGroup: { ministryId: user.ministryId },
            date: { gte: startOfMonth, lte: endOfMonth },
           },
         },
       });
      const totalPresencas = await prisma.smallGroupAttendance.count({
        where: {
          meeting: {
            smallGroup: { ministryId: user.ministryId },
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          present: true,
        },
      });
      const totalReunioes = await prisma.smallGroupMeeting.count({
        where: {
          smallGroup: { ministryId: user.ministryId },
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      avgAttendance = totalReunioes > 0 ? Math.round((totalPresencas / totalReunioes) * 100) : null;
      totalReceitasMes = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: {
          ministryId: user.ministryId,
          type: 'ENTRADA',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }).then(r => r._sum.amount || 0);
      totalDespesasMes = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: {
          ministryId: user.ministryId,
          type: 'SAIDA',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }).then(r => r._sum.amount || 0);
      saldoMes = totalReceitasMes - totalDespesasMes;
      
      // Calcular saldo acumulado corretamente (ENTRADA - SAIDA)
      const totalEntradasAcumuladas = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: { 
          ministryId: user.ministryId,
          type: 'ENTRADA'
        },
      }).then(r => r._sum.amount || 0);
      
      const totalSaidasAcumuladas = await prisma.finance.aggregate({
        _sum: { amount: true },
        where: { 
          ministryId: user.ministryId,
          type: 'SAIDA'
        },
      }).then(r => r._sum.amount || 0);
      
      saldoAcumulado = totalEntradasAcumuladas - totalSaidasAcumuladas;
    }

    return NextResponse.json({
      totalMembers,
      totalSmallGroups,
      totalEventsThisMonth,
      totalLeaders,
      totalMasters,
      nextMeetings7Days,
      birthdayMembersThisMonth,
      avgAttendance,
      totalVisitorsThisMonth,
      totalReceitasMes,
      totalDespesasMes,
      saldoMes,
      saldoAcumulado,
    });

  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}