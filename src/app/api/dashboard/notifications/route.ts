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
    
    // Buscar notificações baseadas em observações recentes
    const notifications = [];

    // 1. Observações de membros (últimas 30 dias)
    const memberObservations = await prisma.memberObservacao.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 dias
        }
      },
      include: {
        member: {
          select: {
            name: true
          }
        },
        autor: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    memberObservations.forEach(obs => {
      notifications.push({
        id: `member-${obs.id}`,
        type: 'member',
        title: `Nova observação: ${obs.member.name}`,
        description: obs.texto.length > 100 ? 
          `${obs.texto.substring(0, 100)}...` : 
          obs.texto,
        priority: 'medium',
        createdAt: obs.createdAt,
        createdBy: obs.autor.name
      });
    });

    // 2. Notas de reuniões de pequenos grupos (últimas 30 dias)
    const meetingNotes = await prisma.smallGroupMeetingNote.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        smallGroup: {
          select: {
            name: true
          }
        },
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    meetingNotes.forEach(note => {
      notifications.push({
        id: `meeting-note-${note.id}`,
        type: 'meeting',
        title: `Nova nota: ${note.title} - ${note.smallGroup.name}`,
        description: note.content.length > 100 ? 
          `${note.content.substring(0, 100)}...` : 
          note.content,
        priority: 'medium',
        createdAt: note.createdAt,
        createdBy: note.author?.name || 'Sistema'
      });
    });

    // 3. Observações de pequenos grupos (últimas 30 dias)
    const smallGroupObservations = await prisma.smallGroupObservacao.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 dias
        }
      },
      include: {
        smallGroup: {
          select: {
            name: true
          }
        },
        autor: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    smallGroupObservations.forEach(obs => {
      notifications.push({
        id: `small-group-${obs.id}`,
        type: 'group',
        title: `Nova observação: ${obs.smallGroup.name}`,
        description: obs.texto.length > 100 ? 
          `${obs.texto.substring(0, 100)}...` : 
          obs.texto,
        priority: obs.categoria === 'URGENTE' ? 'high' : 'medium',
        createdAt: obs.createdAt,
        createdBy: obs.autor.name
      });
    });

    // Ordenar por data de criação (mais recentes primeiro) e limitar a 20
    const sortedNotifications = notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    return NextResponse.json({
      notifications: sortedNotifications,
      total: sortedNotifications.length
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}