import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Lista todos os pequenos grupos do ministério do usuário autenticado
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  // Suporte a múltiplos perfis
  let ministryId = session.user.ministryId;
  if (session.user.role === 'MASTER') {
    ministryId = session.user.masterMinistryId;
  }
  if (!ministryId) {
    return NextResponse.json({ error: 'Usuário sem ministério associado' }, { status: 400 });
  }
  // Filtros via query string
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const dayOfWeek = searchParams.get('dayOfWeek') || '';
  const frequency = searchParams.get('frequency') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '10', 10);
  const skip = (page - 1) * perPage;

  // Montar where dinâmico
  const where: any = { ministryId };
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (status) {
    where.status = status;
  }
  if (dayOfWeek) {
    where.dayOfWeek = dayOfWeek;
  }
  if (frequency) {
    where.frequency = frequency;
  }

  const [groups, total] = await Promise.all([
    prisma.smallGroup.findMany({
      where,
      include: {
        leaders: { include: { user: true } },
        members: { include: { member: true } },
        meetings: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: perPage,
    }),
    prisma.smallGroup.count({ where }),
  ]);
  const totalPages = Math.ceil(total / perPage);
  return NextResponse.json({
    groups,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

const allowedFields = [
  'name', 'description', 'dayOfWeek', 'frequency', 'time', 'endTime', 'startDate',
  'hostName', 'hostPhone', 'cep', 'rua', 'numero', 'complemento',
  'bairro', 'municipio', 'estado', 'ministryId'
];

// POST: Cria um novo pequeno grupo
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('[API SMALL-GROUPS] Payload recebido:', JSON.stringify(data, null, 2));
    // Filtra apenas os campos permitidos
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );
    console.log('[SmallGroup] Payload filtrado:', JSON.stringify(filteredData, null, 2));
    if (!filteredData.name || !filteredData.ministryId) {
      return new Response(JSON.stringify({ error: 'Nome e ministryId são obrigatórios.' }), { status: 400 });
    }
    // Cria o grupo
    const group = await prisma.smallGroup.create({ data: filteredData as any });

    // Lógica para criar reuniões futuras
    const meetingsToCreate: Array<{ 
      smallGroupId: string; 
      date: Date; 
      type: string;
      startTime?: string;
      endTime?: string;
      location?: string;
    }> = [];
    const frequency = filteredData.frequency as string | undefined;
    const dayOfWeek = filteredData.dayOfWeek as string | undefined;
    const time = filteredData.time as string | undefined;
    const endTime = filteredData.endTime as string | undefined;
    const startDate = filteredData.startDate as string | undefined;
    
    // Monta o endereço do grupo para usar como local padrão
    const groupAddress = [
      filteredData.rua,
      filteredData.numero,
      filteredData.complemento
    ].filter(Boolean).join(', ') + 
    (filteredData.bairro || filteredData.municipio || filteredData.estado ? 
      ', ' + [filteredData.bairro, filteredData.municipio, filteredData.estado].filter(Boolean).join(', ') 
      : '');
    if (frequency && dayOfWeek && time && startDate) {
      // Recorrente: criar reuniões para os próximos 3 meses
      const freqMap: Record<string, number> = {
        'DIARIO': 1,
        'SEMANAL': 7,
        'QUINZENAL': 14,
        'MENSAL': 30,
      };
      const freqDays = freqMap[frequency] || 7;
      const start = new Date(startDate);
      let firstMeeting = new Date(start);
      // Ajusta para o próximo dia da semana correto
      if (frequency !== 'DIARIO') {
        const daysOfWeek = ['DOMINGO','SEGUNDA','TERCA','QUARTA','QUINTA','SEXTA','SABADO'];
        const targetDay = daysOfWeek.indexOf(dayOfWeek);
        if (targetDay !== -1) {
          let diff = targetDay - firstMeeting.getDay();
          if (diff < 0) diff += 7;
          firstMeeting.setDate(firstMeeting.getDate() + diff);
        }
      }
      // Gera reuniões até 3 meses à frente
      let meetingDate = new Date(firstMeeting);
      const end = new Date();
      end.setMonth(end.getMonth() + 3);
      while (meetingDate <= end) {
        // Define horário
        if (time) {
          const [h, m] = time.split(":");
          meetingDate.setHours(Number(h), Number(m), 0, 0);
        }
        meetingsToCreate.push({
          smallGroupId: group.id,
          date: new Date(meetingDate),
          type: 'PG',
          startTime: time,
          endTime: endTime,
          location: groupAddress || undefined,
        });
        // Próxima reunião
        meetingDate = new Date(meetingDate);
        meetingDate.setDate(meetingDate.getDate() + freqDays);
      }
    } else if (startDate && time) {
      // Encontro único
      const date = new Date(startDate);
      const [h, m] = time.split(":");
      date.setHours(Number(h), Number(m), 0, 0);
      meetingsToCreate.push({
        smallGroupId: group.id,
        date,
        type: 'PG',
        startTime: time,
        endTime: endTime,
        location: groupAddress || undefined,
      });
    }
    if (meetingsToCreate.length > 0) {
      await prisma.smallGroupMeeting.createMany({ data: meetingsToCreate });
    }
    return new Response(JSON.stringify(group), { status: 201 });
  } catch (error: any) {
    console.error('[SmallGroup] Erro ao criar grupo:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE: Exclui um pequeno grupo e todos os dados relacionados (cascata)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
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
    return NextResponse.json({ success: true, message: 'Grupo excluído com sucesso' });
  } catch (error: any) {
    console.error('[SmallGroup] Erro ao excluir grupo:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}