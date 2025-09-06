import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(
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
    const { attendanceData } = body;

    if (!attendanceData || typeof attendanceData !== 'object') {
      return NextResponse.json({ error: 'Dados de presença inválidos' }, { status: 400 });
    }

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
            },
            members: {
              include: {
                member: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              },
              where: {
                status: 'ATIVO'
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
      return NextResponse.json({ error: 'Sem permissão para registrar presença nesta reunião' }, { status: 403 });
    }

    // Verificar janela de tempo para registro de presença
    const meetingDate = new Date(meeting.date);
    const now = new Date();
    const timeDiffInHours = Math.abs(now.getTime() - meetingDate.getTime()) / (1000 * 60 * 60);
    
    // Permitir registro de presença até 2 horas antes e 4 horas depois da reunião
    const HOURS_BEFORE_ALLOWED = 2;
    const HOURS_AFTER_ALLOWED = 4;
    
    const isWithinTimeWindow = 
      (now >= new Date(meetingDate.getTime() - HOURS_BEFORE_ALLOWED * 60 * 60 * 1000)) &&
      (now <= new Date(meetingDate.getTime() + HOURS_AFTER_ALLOWED * 60 * 60 * 1000));
    
    // Admins podem registrar presença a qualquer momento
    if (user.role !== Role.ADMIN && !isWithinTimeWindow) {
      const beforeTime = new Date(meetingDate.getTime() - HOURS_BEFORE_ALLOWED * 60 * 60 * 1000);
      const afterTime = new Date(meetingDate.getTime() + HOURS_AFTER_ALLOWED * 60 * 60 * 1000);
      
      return NextResponse.json({ 
        error: `Registro de presença só é permitido entre ${beforeTime.toLocaleString('pt-BR')} e ${afterTime.toLocaleString('pt-BR')}` 
      }, { status: 400 });
    }

    // Validar se todos os membros pertencem ao grupo
    const validMemberIds = meeting.smallGroup.members.map(m => m.member.id);
    const providedMemberIds = Object.keys(attendanceData);
    
    for (const memberId of providedMemberIds) {
      if (!validMemberIds.includes(memberId)) {
        return NextResponse.json({ 
          error: `Membro com ID ${memberId} não pertence a este grupo` 
        }, { status: 400 });
      }
    }

    // Usar transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // Primeiro, remover todas as presenças existentes para esta reunião
      await tx.smallGroupAttendance.deleteMany({
        where: {
          meetingId: meetingId
        }
      });

      // Criar novos registros de presença
      const attendanceRecords = Object.entries(attendanceData).map(([memberId, present]) => ({
        meetingId: meetingId,
        memberId: memberId,
        present: Boolean(present),
        notes: null // Pode ser expandido no futuro para incluir notas
      }));

      if (attendanceRecords.length > 0) {
        await tx.smallGroupAttendance.createMany({
          data: attendanceRecords
        });
      }
    });

    // Buscar os dados atualizados para retornar
    const updatedAttendances = await prisma.smallGroupAttendance.findMany({
      where: {
        meetingId: meetingId
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Presença registrada com sucesso',
      attendances: updatedAttendances
    });
  } catch (error) {
    console.error('Erro ao registrar presença:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: 'Sem permissão para acessar dados de presença desta reunião' }, { status: 403 });
    }

    // Buscar dados de presença
    const attendances = await prisma.smallGroupAttendance.findMany({
      where: {
        meetingId: meetingId
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({ attendances });
  } catch (error) {
    console.error('Erro ao buscar dados de presença:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}