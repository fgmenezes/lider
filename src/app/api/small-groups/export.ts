import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toCsvRow(fields: string[]): string {
  return fields.map(f => '"' + (f?.replace(/"/g, '""') || '') + '"').join(',');
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new Response('Não autenticado', { status: 401 });
  }
  let ministryId = session.user.ministryId;
  if (session.user.role === 'MASTER') {
    ministryId = session.user.masterMinistryId;
  }
  if (!ministryId) {
    return new Response('Usuário sem ministério associado', { status: 400 });
  }
  // Filtros via query string
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const dayOfWeek = searchParams.get('dayOfWeek') || '';
  const frequency = searchParams.get('frequency') || '';

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

  const groups = await prisma.smallGroup.findMany({
    where,
    include: {
      leaders: { include: { user: true } },
      members: true,
    },
    orderBy: { name: 'asc' },
  });

  // Montar CSV
  const header = [
    'Nome do Grupo',
    'Dia da Semana',
    'Frequência',
    'Status',
    'Líderes',
    'Qtd. Membros',
  ];
  const rows = [toCsvRow(header)];
  for (const g of groups) {
    const leaders = (g.leaders || []).map(l => l.user?.name).filter(Boolean).join(', ');
    rows.push(toCsvRow([
      g.name,
      g.dayOfWeek || '-',
      g.frequency || '-',
      g.status || '-',
      leaders,
      String(g.members?.length || 0),
    ]));
  }
  const csv = rows.join('\r\n');
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pequenos-grupos.csv"',
    },
  });
} 