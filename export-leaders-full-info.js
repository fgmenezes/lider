// Script para exportar todos os líderes (MASTER e LEADER) e seus vínculos de ministério
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function toCsvRow(fields) {
  return fields.map(f => '"' + (f?.toString().replace(/"/g, '""') || '') + '"').join(',');
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['MASTER', 'LEADER'] }
    },
    include: {
      ministry: { select: { id: true, name: true, church: { select: { name: true } } } },
      masterMinistry: { select: { id: true, name: true, church: { select: { name: true } } } },
    },
    orderBy: { name: 'asc' },
  });

  const header = [
    'id', 'name', 'email', 'role', 'isActive', 'ministryId', 'masterMinistryId', 'ministryName', 'masterMinistryName', 'churchName'
  ];
  const rows = [toCsvRow(header)];

  for (const u of users) {
    rows.push(toCsvRow([
      u.id,
      u.name,
      u.email,
      u.role,
      u.isActive ? 'Ativo' : 'Inativo',
      u.ministryId || '',
      u.masterMinistryId || '',
      u.ministry?.name || '',
      u.masterMinistry?.name || '',
      u.ministry?.church?.name || u.masterMinistry?.church?.name || ''
    ]));
  }

  fs.writeFileSync('lideres-ministerios.csv', rows.join('\r\n'), 'utf8');
  console.log('Arquivo lideres-ministerios.csv exportado com sucesso!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); }); 