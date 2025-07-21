const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

function toCsv(rows, headers) {
  const escape = (v) => (v == null ? '' : String(v).replace(/"/g, '""'));
  return [
    headers.join(','),
    ...rows.map(row => headers.map(h => `"${escape(row[h])}"`).join(','))
  ].join('\n');
}

async function main() {
  // Exportar usuários
  const users = await prisma.user.findMany({
    include: {
      ministry: true,
      masterMinistry: true,
    }
  });

  const userHeaders = [
    'id', 'name', 'email', 'role', 'ministryId', 'ministryName', 'masterMinistryId', 'masterMinistryName', 'createdAt', 'updatedAt'
  ];

  const userRows = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    ministryId: u.ministryId,
    ministryName: u.ministry?.name || '',
    masterMinistryId: u.masterMinistry?.id || '',
    masterMinistryName: u.masterMinistry?.name || '',
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  fs.writeFileSync('usuarios.csv', toCsv(userRows, userHeaders));
  console.log('usuarios.csv exportado!');

  // Exportar ministérios
  const ministries = await prisma.ministry.findMany({
    include: {
      master: true,
      leaders: true,
      church: true,
    }
  });

  const ministryHeaders = [
    'id', 'name', 'churchId', 'churchName', 'masterId', 'masterName', 'createdAt', 'updatedAt', 'leaders'
  ];

  const ministryRows = ministries.map(m => ({
    id: m.id,
    name: m.name,
    churchId: m.churchId,
    churchName: m.church?.name || '',
    masterId: m.masterId,
    masterName: m.master?.name || '',
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    leaders: m.leaders.map(l => l.name).join('; ')
  }));

  fs.writeFileSync('ministerios.csv', toCsv(ministryRows, ministryHeaders));
  console.log('ministerios.csv exportado!');
}

main().finally(() => prisma.$disconnect()); 