import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export const dynamic = 'force-dynamic';

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

  // Gerar PDF
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  let buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  doc.fontSize(18).text('Pequenos Grupos', { align: 'center' });
  doc.moveDown();

  // Cabeçalhos
  doc.fontSize(12).font('Helvetica-Bold');
  const headers = ['Nome', 'Dia da Semana', 'Frequência', 'Status', 'Líderes', 'Qtd. Membros'];
  headers.forEach((h, i) => {
    doc.text(h, 40 + i * 90, doc.y, { continued: i < headers.length - 1 });
  });
  doc.moveDown(0.5);
  doc.font('Helvetica');

  // Linhas
  groups.forEach(g => {
    const leaders = (g.leaders || []).map(l => l.user?.name).filter(Boolean).join(', ');
    const row = [
      g.name,
      g.dayOfWeek || '-',
      g.frequency || '-',
      g.status || '-',
      leaders,
      String(g.members?.length || 0),
    ];
    row.forEach((cell, i) => {
      doc.text(cell, 40 + i * 90, doc.y, { continued: i < row.length - 1 });
    });
    doc.moveDown(0.5);
  });

  doc.end();
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    const bufs: Buffer[] = [];
    doc.on('data', (d) => bufs.push(d));
    doc.on('end', () => resolve(Buffer.concat(bufs)));
  });

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="pequenos-grupos.pdf"',
    },
  });
} 