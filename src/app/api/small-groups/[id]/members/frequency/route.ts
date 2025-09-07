import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: groupId } = params;
    const user = session.user;

    // Buscar o grupo para verificar permissões
    const group = await prisma.smallGroup.findUnique({
      where: { id: groupId },
      include: {
        leaders: {
          include: {
            user: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const hasPermission = 
      user.role === Role.ADMIN ||
      (user.role === Role.MASTER && user.masterMinistryId === group.ministryId) ||
      (user.role === Role.LEADER && (
        user.ministryId === group.ministryId ||
        group.leaders.some(leader => leader.user.id === user.id)
      ));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para acessar dados de frequência deste grupo' }, { status: 403 });
    }

    // Buscar dados de frequência dos membros
    const membersFrequency = await prisma.smallGroupMember.findMany({
      where: {
        smallGroupId: groupId,
        status: 'ATIVO'
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        smallGroup: {
          include: {
            meetings: {
              include: {
                attendances: {
                  where: {
                    memberId: {
                      in: [] // Será preenchido dinamicamente
                    }
                  }
                }
              },
              orderBy: {
                date: 'desc'
              },
              take: 10 // Últimas 10 reuniões para cálculo
            }
          }
        }
      }
    });

    // Calcular estatísticas de frequência para cada membro
    const frequencyData = await Promise.all(
      membersFrequency.map(async (memberData) => {
        const memberId = memberData.member.id;
        
        // Buscar presenças do membro nas últimas reuniões
        const attendances = await prisma.smallGroupAttendance.findMany({
          where: {
            memberId: memberId,
            meeting: {
              smallGroupId: groupId,
              date: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Últimos 90 dias
              }
            }
          },
          include: {
            meeting: {
              select: {
                id: true,
                date: true
              }
            }
          },
          orderBy: {
            meeting: {
              date: 'desc'
            }
          }
        });

        // Buscar total de reuniões do grupo nos últimos 90 dias
        const totalMeetings = await prisma.smallGroupMeeting.count({
          where: {
            smallGroupId: groupId,
            date: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          }
        });

        const presentCount = attendances.filter(att => att.present).length;
        const attendanceRate = totalMeetings > 0 ? (presentCount / totalMeetings) * 100 : 0;
        
        // Determinar status de frequência
        let frequencyStatus: 'alta' | 'media' | 'baixa';
        if (attendanceRate >= 80) {
          frequencyStatus = 'alta';
        } else if (attendanceRate >= 50) {
          frequencyStatus = 'media';
        } else {
          frequencyStatus = 'baixa';
        }

        // Calcular streak (sequência de presenças/ausências)
        const recentAttendances = attendances.slice(0, 5); // Últimas 5 reuniões
        let currentStreak = 0;
        let streakType: 'present' | 'absent' | null = null;
        
        for (const attendance of recentAttendances) {
          if (streakType === null) {
            streakType = attendance.present ? 'present' : 'absent';
            currentStreak = 1;
          } else if ((streakType === 'present' && attendance.present) || 
                     (streakType === 'absent' && !attendance.present)) {
            currentStreak++;
          } else {
            break;
          }
        }

        return {
          memberId: memberData.id,
          member: {
            id: memberData.member.id,
            name: memberData.member.name,
            email: memberData.member.email,
          },
          frequency: {
            status: frequencyStatus,
            attendanceRate: Math.round(attendanceRate),
            presentCount,
            totalMeetings,
            streak: {
              count: currentStreak,
              type: streakType
            },
            lastAttendances: recentAttendances.map(att => ({
              meetingId: att.meeting.id,
              date: att.meeting.date,
              present: att.present
            }))
          }
        };
      })
    );

    return NextResponse.json({ 
      membersFrequency: frequencyData,
      summary: {
        totalMembers: frequencyData.length,
        highFrequency: frequencyData.filter(m => m.frequency.status === 'alta').length,
        mediumFrequency: frequencyData.filter(m => m.frequency.status === 'media').length,
        lowFrequency: frequencyData.filter(m => m.frequency.status === 'baixa').length,
        averageAttendance: frequencyData.length > 0 
          ? Math.round(frequencyData.reduce((sum, m) => sum + m.frequency.attendanceRate, 0) / frequencyData.length)
          : 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados de frequência:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}