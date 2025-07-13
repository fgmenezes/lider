// Script para exportar informações de líderes, ministérios e relacionamentos para CSV
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportLeadersMinistryInfo() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      ministryId: true,
      ministry: {
        select: {
          id: true,
          name: true,
          church: { select: { name: true } }
        }
      },
    },
    orderBy: { name: 'asc' },
  });

  const ministries = await prisma.ministry.findMany({
    select: {
      id: true,
      name: true,
      church: { select: { name: true } },
      master: { select: { id: true, name: true, email: true } },
      leaders: { select: { id: true, name: true, email: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Exportar usuários (líderes)
  let csv = 'user_id,user_name,user_email,user_role,user_ministry_id,user_ministry_name,user_ministry_church\n';
  for (const u of users) {
    csv += `${u.id},${u.name},${u.email},${u.role},${u.ministryId || ''},${u.ministry ? u.ministry.name : ''},${u.ministry && u.ministry.church ? u.ministry.church.name : ''}\n`;
  }
  csv += '\n';

  // Exportar ministérios e seus líderes
  csv += 'ministry_id,ministry_name,ministry_church,master_id,master_name,master_email,leaders_ids,leaders_names,leaders_emails\n';
  for (const m of ministries) {
    const leadersIds = m.leaders.map(l => l.id).join('|');
    const leadersNames = m.leaders.map(l => l.name).join('|');
    const leadersEmails = m.leaders.map(l => l.email).join('|');
    csv += `${m.id},${m.name},${m.church ? m.church.name : ''},${m.master ? m.master.id : ''},${m.master ? m.master.name : ''},${m.master ? m.master.email : ''},${leadersIds},${leadersNames},${leadersEmails}\n`;
  }

  fs.writeFileSync('leaders-ministries-export.csv', csv, 'utf8');
  console.log('Arquivo leaders-ministries-export.csv gerado com sucesso!');
  await prisma.$disconnect();
}

exportLeadersMinistryInfo(); 