import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: groupId, meetingId } = params;
    const user = session.user;

    // Buscar a reunião com todas as informações necessárias
    const meeting = await prisma.smallGroupMeeting.findUnique({
      where: { id: meetingId },
      include: {
        smallGroup: {
          select: {
            id: true,
            name: true,
            rua: true,
            numero: true,
            complemento: true,
            bairro: true,
            municipio: true,
            estado: true,
            cep: true,
            ministryId: true,
            members: {
              include: {
                member: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              },
              where: {
                status: 'ATIVO'
              }
            },
            leaders: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        attendances: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        visitors: {
          include: {
            invitedBy: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar se o grupo pertence ao ID fornecido
    if (meeting.smallGroup.id !== groupId) {
      return NextResponse.json({ error: 'Reunião não pertence ao grupo especificado' }, { status: 400 });
    }

    // Verificar permissões
    const hasPermission = 
      user.role === Role.ADMIN ||
      (user.role === Role.MASTER && user.masterMinistryId === meeting.smallGroup.ministryId) ||
      (user.role === Role.LEADER && (
        user.ministryId === meeting.smallGroup.ministryId ||
        meeting.smallGroup.leaders.some(leader => leader.user.id === user.id)
      ));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para acessar esta reunião' }, { status: 403 });
    }

    // Calcular status automático da reunião
    const now = new Date();
    const meetingDate = new Date(meeting.date + 'T' + (meeting.startTime || '00:00:00'));
    let automaticStatus = meeting.status;

    // Se a reunião não foi cancelada manualmente, calcular status automático
    if (meeting.status !== 'CANCELADA') {
      const hasAttendances = meeting.attendances.length > 0;
      
      // Criar data de término baseada no horário de término ou 2 horas após o início
      let meetingEndTime;
      if (meeting.endTime) {
        meetingEndTime = new Date(meeting.date + 'T' + meeting.endTime);
      } else {
        // Se não há horário de término, assumir 2 horas após o início
        meetingEndTime = new Date(meetingDate.getTime() + 2 * 60 * 60 * 1000);
      }
      
      // Lógica de status baseada na data/hora atual
      if (now < meetingDate) {
        // Reunião ainda não começou
        automaticStatus = 'AGENDADA';
      } else if (now >= meetingDate && now <= meetingEndTime) {
        // Reunião está no horário de acontecer
        automaticStatus = hasAttendances ? 'EM_ANDAMENTO' : 'AGENDADA';
      } else {
        // Reunião já passou do horário
        automaticStatus = hasAttendances ? 'FINALIZADA' : 'AGENDADA';
      }
    }

    // Atualizar o status no banco se necessário
    if (automaticStatus !== meeting.status) {
      await prisma.smallGroupMeeting.update({
        where: { id: meetingId },
        data: { status: automaticStatus }
      });
      meeting.status = automaticStatus;
    }

    // Formatar dados para o frontend
    const formatLocalDate = (date: Date) => {
      // Usar UTC para evitar problemas de timezone
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedMeeting = {
      ...meeting,
      // startTime e endTime já são strings no banco, não precisam conversão
      startTime: meeting.startTime || null,
      date: formatLocalDate(meeting.date),
      endTime: meeting.endTime || null
    };

    return NextResponse.json({ meeting: formattedMeeting });
  } catch (error) {
    console.error('Erro ao buscar reunião:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: groupId, meetingId } = params;
    const user = session.user;
    const body = await request.json();
    const { date, location, type, theme, status } = body;

    // Buscar a reunião para verificar permissões
    const meeting = await prisma.smallGroupMeeting.findUnique({
      where: { id: meetingId },
      include: {
        smallGroup: {
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
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    if (meeting.smallGroup.id !== groupId) {
      return NextResponse.json({ error: 'Reunião não pertence ao grupo especificado' }, { status: 400 });
    }

    // Verificar permissões
    const hasPermission = 
      user.role === Role.ADMIN ||
      (user.role === Role.MASTER && user.masterMinistryId === meeting.smallGroup.ministryId) ||
      (user.role === Role.LEADER && (
        user.ministryId === meeting.smallGroup.ministryId ||
        meeting.smallGroup.leaders.some(leader => leader.user.id === user.id)
      ));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para editar esta reunião' }, { status: 403 });
    }

    // Atualizar a reunião
    const updatedMeeting = await prisma.smallGroupMeeting.update({
      where: { id: meetingId },
      data: {
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(type && { type }),
        ...(theme !== undefined && { theme }),
        ...(status && { status }),
      },
      include: {
        smallGroup: {
          include: {
            members: {
              include: {
                member: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              },
              where: {
                status: 'ATIVO'
              }
            }
          }
        },
        attendances: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Reunião atualizada com sucesso',
      meeting: updatedMeeting 
    });
  } catch (error) {
    console.error('Erro ao atualizar reunião:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}