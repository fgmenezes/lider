import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// POST - Criar nova reunião
export async function POST(
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
    const body = await request.json();
    const { date, type, theme, location, endTime } = body;

    if (!date || !type) {
      return NextResponse.json({ error: 'Data e tipo são obrigatórios' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Sem permissão para criar reunião neste grupo' }, { status: 403 });
    }

    // Criar a reunião
    const meetingData: any = {
      smallGroupId: groupId,
      date: new Date(date),
      type,
      status: 'AGENDADA'
    };

    // Adicionar campos opcionais se fornecidos
    if (theme !== undefined) {
      meetingData.theme = theme;
    }
    if (location !== undefined) {
      meetingData.location = location;
    }
    if (endTime) {
      meetingData.endTime = new Date(endTime);
    }

    const meeting = await prisma.smallGroupMeeting.create({
      data: meetingData,
      include: {
        smallGroup: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Reunião criada com sucesso',
      meeting 
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}