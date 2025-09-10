import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Lista status de marcação de Bíblia para membros presentes na reunião
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const meetingId = params.id;

    // Verificar se a reunião existe e obter dados do pequeno grupo
    const meeting = await prisma.smallGroupMeeting.findUnique({
      where: { id: meetingId },
      include: {
        smallGroup: {
          include: {
            leaders: { include: { user: true } },
            ministry: true
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar permissões
    const userMinistryId = session.user.role === 'MASTER' 
      ? session.user.masterMinistryId 
      : session.user.ministryId;
    
    const isLeader = meeting.smallGroup.leaders.some(
      leader => leader.userId === session.user.id
    );
    
    if (meeting.smallGroup.ministryId !== userMinistryId && 
        !isLeader && 
        session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar membros presentes na reunião
    const attendances = await prisma.smallGroupAttendance.findMany({
      where: {
        meetingId,
        present: true
      },
      include: {
        member: true
      }
    });

    // Buscar registros de marcação de Bíblia existentes
    const bibliaRecords = await prisma.marcarBiblia.findMany({
      where: {
        meetingId
      }
    });

    // Combinar dados
    const membersWithBibleStatus = attendances.map(attendance => {
      const bibliaRecord = bibliaRecords.find(record => record.memberId === attendance.memberId);
      return {
        memberId: attendance.memberId,
        memberName: attendance.member.name,
        broughtBible: bibliaRecord?.broughtBible || false,
        recordId: bibliaRecord?.id || null
      };
    });

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        date: meeting.date,
        smallGroupName: meeting.smallGroup.name
      },
      members: membersWithBibleStatus
    });

  } catch (error) {
    console.error('Erro ao buscar dados de marcação de Bíblia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST: Salvar registros de marcação de Bíblia em lote
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const meetingId = params.id;
    const body = await req.json();
    const { records } = body; // Array de { memberId, broughtBible }

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Formato inválido. Esperado array de registros.' },
        { status: 400 }
      );
    }

    // Verificar se a reunião existe e obter dados do pequeno grupo
    const meeting = await prisma.smallGroupMeeting.findUnique({
      where: { id: meetingId },
      include: {
        smallGroup: {
          include: {
            leaders: { include: { user: true } },
            ministry: true
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Verificar permissões (apenas MASTER e LEADER podem marcar)
    const userMinistryId = session.user.role === 'MASTER' 
      ? session.user.masterMinistryId 
      : session.user.ministryId;
    
    const isLeader = meeting.smallGroup.leaders.some(
      leader => leader.userId === session.user.id
    );
    
    if (session.user.role !== 'MASTER' && !isLeader) {
      return NextResponse.json({ error: 'Sem permissão para marcar Bíblia' }, { status: 403 });
    }

    // Processar registros em lote usando transação
    const results = await prisma.$transaction(async (tx) => {
      const processedRecords = [];
      
      for (const record of records) {
        const { memberId, broughtBible } = record;
        
        // Verificar se o membro está presente na reunião
        const attendance = await tx.smallGroupAttendance.findFirst({
          where: {
            meetingId,
            memberId,
            present: true
          }
        });
        
        if (!attendance) {
          continue; // Pular membros não presentes
        }
        
        // Upsert do registro de marcação de Bíblia
        const bibliaRecord = await tx.marcarBiblia.upsert({
          where: {
            meetingId_memberId: {
              meetingId,
              memberId
            }
          },
          update: {
            broughtBible,
            updatedAt: new Date()
          },
          create: {
            meetingId,
            memberId,
            smallGroupId: meeting.smallGroupId,
            broughtBible
          }
        });
        
        processedRecords.push(bibliaRecord);
      }
      
      return processedRecords;
    });

    return NextResponse.json({
      message: 'Registros salvos com sucesso',
      processedCount: results.length,
      records: results
    });

  } catch (error) {
    console.error('Erro ao salvar marcação de Bíblia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}