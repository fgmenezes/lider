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
    
    // Verificar se o usuário tem permissão (apenas ADMIN e MASTER)
    if (user.role !== 'ADMIN' && user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar informações completas do usuário, incluindo ministério
    const userDetails = await prisma.user.findUnique({
      where: { 
        email: user.email 
      },
      include: {
        ministry: true
      }
    });

    if (!userDetails) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Obter parâmetros de busca da URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const action = searchParams.get('action') || '';
    const days = searchParams.get('days') || '30';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Calcular data de início baseada nos dias
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Construir filtros para a query
    const whereClause: any = {
      createdAt: {
        gte: startDate
      }
    };

    // Filtrar por ministério se não for ADMIN
    if (user.role !== 'ADMIN') {
      const ministryId = user.role === 'MASTER' ? user.masterMinistryId : user.ministryId;
      whereClause.ministryId = ministryId;
    }

    // Adicionar filtros opcionais
    if (type) {
      whereClause.tipo = type;
    }

    if (action) {
      whereClause.acao = action;
    }

    if (search) {
      whereClause.OR = [
        {
          descricao: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          detalhes: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          tipo: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          acao: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          usuario: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          usuario: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          ministry: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Buscar atividades do banco de dados
    const atividades = await prisma.atividade.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ministry: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Mapear atividades para o formato esperado pelo frontend
    const mappedActivities = atividades.map(atividade => ({
      id: atividade.id,
      tipo: atividade.tipo,
      acao: atividade.acao,
      descricao: atividade.descricao,
      detalhes: atividade.detalhes,
      usuarioId: atividade.usuarioId,
      usuarioNome: atividade.usuario?.name || 'Sistema',
      ministryId: atividade.ministryId,
      ministryName: atividade.ministry?.name,
      createdAt: atividade.createdAt,
      ip: atividade.ip,
      userAgent: atividade.userAgent
    }));

    return NextResponse.json({
      activities: mappedActivities,
      total: mappedActivities.length,
      hasMore: mappedActivities.length === limit,
      message: `${mappedActivities.length} atividades encontradas`
    });

  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}