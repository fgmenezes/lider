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
    
    // Obter o mês e ano atual
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() retorna 0-11, precisamos 1-12
    
    // Buscar membros aniversariantes do mês
    const birthdayMembers = await prisma.member.findMany({
      where: {
        dataNascimento: {
          not: null
        },
        ...(user.role === 'LEADER' ? {
          ministry: {
            leaders: {
              some: {
                id: user.id
              }
            }
          }
        } : {})
      },
      select: {
        id: true,
        name: true,
        dataNascimento: true,
        phone: true,
        ministry: {
          select: {
            id: true,
            name: true
          }
        },
        smallGroupMemberships: {
          select: {
            smallGroup: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Buscar líderes aniversariantes do mês
    const birthdayLeaders = await prisma.user.findMany({
      where: {
        dataNascimento: {
          not: null
        },
        role: {
          in: ['LEADER', 'MASTER', 'ADMIN']
        },
        ...(user.role === 'LEADER' ? {
          OR: [
            {
              ministry: {
                leaders: {
                  some: {
                    id: user.id
                  }
                }
              }
            },
            {
              masterMinistry: {
                leaders: {
                  some: {
                    id: user.id
                  }
                }
              }
            }
          ]
        } : {})
      },
      select: {
        id: true,
        name: true,
        dataNascimento: true,
        celular: true,
        role: true,
        ministry: {
          select: {
            id: true,
            name: true
          }
        },
        masterMinistry: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Filtrar membros que fazem aniversário no mês atual
    const currentMonthMemberBirthdays = birthdayMembers
      .filter(member => {
        if (!member.dataNascimento) return false;
        const birthMonth = member.dataNascimento.getMonth() + 1;
        return birthMonth === currentMonth;
      })
      .map(member => {
        const birthDay = member.dataNascimento!.getDate();
        const age = now.getFullYear() - member.dataNascimento!.getFullYear();
        
        // Verificar se o aniversário já passou este ano
        const birthdayThisYear = new Date(now.getFullYear(), currentMonth - 1, birthDay);
        const hasPassedThisYear = now >= birthdayThisYear;
        
        return {
          id: member.id,
          name: member.name,
          dataNascimento: member.dataNascimento,
          birthDay,
          age: hasPassedThisYear ? age : age - 1,
          phone: member.phone,
          ministry: member.ministry,
          smallGroup: member.smallGroupMemberships[0]?.smallGroup || null,
          type: 'MEMBRO',
          daysUntilBirthday: hasPassedThisYear ? 
            Math.ceil((new Date(now.getFullYear() + 1, currentMonth - 1, birthDay).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) :
            Math.ceil((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
      });

    // Filtrar líderes que fazem aniversário no mês atual
    const currentMonthLeaderBirthdays = birthdayLeaders
      .filter(leader => {
        if (!leader.dataNascimento) return false;
        const birthMonth = leader.dataNascimento.getMonth() + 1;
        return birthMonth === currentMonth;
      })
      .map(leader => {
        const birthDay = leader.dataNascimento!.getDate();
        const age = now.getFullYear() - leader.dataNascimento!.getFullYear();
        
        // Verificar se o aniversário já passou este ano
        const birthdayThisYear = new Date(now.getFullYear(), currentMonth - 1, birthDay);
        const hasPassedThisYear = now >= birthdayThisYear;
        
        return {
          id: leader.id,
          name: leader.name,
          dataNascimento: leader.dataNascimento,
          birthDay,
          age: hasPassedThisYear ? age : age - 1,
          phone: leader.celular,
          ministry: leader.ministry || leader.masterMinistry,
          smallGroup: null,
          type: leader.role === 'ADMIN' ? 'ADMIN' : leader.role === 'MASTER' ? 'LÍDER MASTER' : 'LÍDER',
          daysUntilBirthday: hasPassedThisYear ? 
            Math.ceil((new Date(now.getFullYear() + 1, currentMonth - 1, birthDay).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) :
            Math.ceil((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
      });

    // Combinar membros e líderes
    const allBirthdays = [...currentMonthMemberBirthdays, ...currentMonthLeaderBirthdays]
      .sort((a, b) => {
        // Ordenar por dia do aniversário
        return a.birthDay - b.birthDay;
      });

    // Separar aniversariantes por categorias
    const today = now.getDate();
    const todayBirthdays = allBirthdays.filter(person => person.birthDay === today);
    const upcomingBirthdays = allBirthdays.filter(person => person.birthDay > today);
    const pastBirthdays = allBirthdays.filter(person => person.birthDay < today);

    return NextResponse.json({
      total: allBirthdays.length,
      totalMembers: currentMonthMemberBirthdays.length,
      totalLeaders: currentMonthLeaderBirthdays.length,
      today: todayBirthdays,
      upcoming: upcomingBirthdays,
      past: pastBirthdays,
      all: allBirthdays,
      members: currentMonthMemberBirthdays,
      leaders: currentMonthLeaderBirthdays,
      month: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    });

  } catch (error) {
    console.error('Erro ao buscar aniversariantes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}