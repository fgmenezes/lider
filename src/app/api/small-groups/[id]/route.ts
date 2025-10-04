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
    try {
      // Extrair apenas a data (sem horário) do campo date
      let meetingDate;
      if (meeting.date instanceof Date) {
        // Se já é um objeto Date, usar apenas a parte da data
        meetingDate = new Date(meeting.date.getFullYear(), meeting.date.getMonth(), meeting.date.getDate());
      } else {
        // Se é string, converter
        meetingDate = new Date(meeting.date);
        meetingDate = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
      }

      // Adicionar horário de início se disponível
      if (meeting.startTime) {
        const [hours, minutes] = meeting.startTime.split(':');
        meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        // Se não tem horário, assumir 00:00
        meetingDate.setHours(0, 0, 0, 0);
      }

      // Calcular horário de término
      let meetingEndTime = new Date(meetingDate);
      if (meeting.endTime) {
        const [hours, minutes] = meeting.endTime.split(':');
        meetingEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        // Se não tem horário de fim, assumir 2 horas após o início
        meetingEndTime.setHours(meetingEndTime.getHours() + 2);
      }
      
      const hasAttendances = meeting.attendances && meeting.attendances.length > 0;
      
      let newStatus = meeting.status;
      
      // Lógica para determinar o status correto
      if (now < meetingDate) {
        // Reunião ainda não começou
        newStatus = 'AGENDADA';
      } else if (now >= meetingDate && now <= meetingEndTime) {
        // Reunião está no horário de acontecer
        newStatus = hasAttendances ? 'EM_ANDAMENTO' : 'AGENDADA';
      } else {
        // Reunião já passou do horário - SEMPRE finalizar
        newStatus = 'FINALIZADA';
      }
      
      // Se o status mudou, atualizar no banco
      if (newStatus !== meeting.status) {
        meetingsToUpdate.push({
          id: meeting.id,
          status: newStatus
        });
        meeting.status = newStatus; // Atualizar no objeto retornado
      }
    } catch (error) {
      console.error(`Erro ao processar reunião ${meeting.id}:`, error);
      // Continuar processando outras reuniões mesmo se uma falhar
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

// DELETE: Exclui um pequeno grupo e todos os dados relacionados (cascata)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID do grupo não informado.' }, { status: 400 });
    }

    // Buscar o grupo para verificar permissões
    const group = await prisma.smallGroup.findUnique({
      where: { id },
      include: {
        leaders: { include: { user: true } },
        ministry: true
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Verificar permissões (apenas MASTER do ministério ou ADMIN podem excluir)
    const user = session.user;
    const isAdmin = user.role === 'ADMIN';
    const isMaster = user.role === 'MASTER' && user.masterMinistryId === group.ministryId;
    
    if (!isAdmin && !isMaster) {
      return NextResponse.json({ 
        error: 'Sem permissão para excluir este grupo. Apenas administradores e coordenadores do ministério podem excluir grupos.' 
      }, { status: 403 });
    }

    // Exclui o grupo e todos os dados relacionados (cascata)
    await prisma.smallGroup.delete({ where: { id } });

    // Registrar atividade de exclusão
    await prisma.atividade.create({
      data: {
        tipo: 'PEQUENO_GRUPO',
        acao: 'EXCLUIR',
        descricao: `Pequeno grupo excluído: ${group.name}`,
        detalhes: `Ministério: ${group.ministry.name}`,
        entidadeId: id,
        usuarioId: session.user.id,
        ministryId: group.ministryId,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      }
    });

    return NextResponse.json({ success: true, message: 'Grupo excluído com sucesso' });
  } catch (error: any) {
    console.error('[SmallGroup] Erro ao excluir grupo:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}