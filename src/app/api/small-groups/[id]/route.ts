import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID do grupo não informado' }, { status: 400 });
  }

  // Busca o grupo e inclui relações relevantes
  const group = await prisma.smallGroup.findUnique({
    where: { id },
    include: {
      ministry: true,
      leaders: {
        include: { user: true }
      },
      members: {
        include: { member: true }
      },
      meetings: {
        include: {
          attendances: true
        },
        orderBy: {
          date: 'desc'
        }
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
  }

  // Permissão: ADMIN, MASTER do ministério, ou LEADER do grupo
  const user = session.user;
  const isAdmin = user.role === 'ADMIN';
  const isMaster = user.masterMinistryId && user.masterMinistryId === group.ministryId;
  const isLeader = group.leaders.some((l: { userId: string }) => l.userId === user.id);

  if (!isAdmin && !isMaster && !isLeader) {
    return NextResponse.json({ error: 'Sem permissão para acessar este grupo' }, { status: 403 });
  }

  // Atualizar status das reuniões automaticamente
  const now = new Date();
  const meetingsToUpdate = [];
  
  for (const meeting of group.meetings) {
    const meetingDate = new Date(meeting.date);
    const meetingEndTime = meeting.endTime ? new Date(meeting.endTime) : meetingDate;
    const hasAttendances = meeting.attendances && meeting.attendances.length > 0;
    
    let newStatus = meeting.status;
    
    // Lógica para determinar o status correto
    if (now > meetingEndTime || hasAttendances) {
      newStatus = 'FINALIZADA';
    } else if (now >= meetingDate && now <= meetingEndTime) {
      newStatus = 'EM_ANDAMENTO';
    } else if (now < meetingDate) {
      newStatus = 'AGENDADA';
    }
    
    // Se o status mudou, atualizar no banco
    if (newStatus !== meeting.status) {
      meetingsToUpdate.push({
        id: meeting.id,
        status: newStatus
      });
      meeting.status = newStatus; // Atualizar no objeto retornado
    }
  }
  
  // Atualizar status no banco de dados se necessário
  if (meetingsToUpdate.length > 0) {
    await Promise.all(
      meetingsToUpdate.map(meeting =>
        prisma.smallGroupMeeting.update({
          where: { id: meeting.id },
          data: { status: meeting.status }
        })
      )
    );
  }

  return NextResponse.json({ group });
}