const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

function toCsvRow(obj, fields) {
  return fields.map(f => {
    let v = obj[f];
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v).replace(/"/g, '""');
  }).join(',');
}

async function exportMinistries() {
  const ministries = await prisma.ministry.findMany({
    include: { church: true, master: true }
  });
  const fields = ['id', 'name', 'status', 'churchId', 'churchName', 'masterId', 'masterName'];
  const header = fields.join(',') + '\n';
  const rows = ministries.map(m => toCsvRow({
    id: m.id,
    name: m.name,
    status: m.status,
    churchId: m.churchId,
    churchName: m.church?.name,
    masterId: m.masterId,
    masterName: m.master?.name,
  }, fields)).join('\n');
  fs.writeFileSync('ministries.csv', header + rows);
}

async function exportUsers() {
  const users = await prisma.user.findMany({
    include: { masterMinistry: true, ministry: true }
  });
  const fields = ['id', 'name', 'email', 'role', 'ministryId', 'ministryName', 'masterMinistryId', 'masterMinistryName'];
  const header = fields.join(',') + '\n';
  const rows = users.map(u => toCsvRow({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    ministryId: u.ministryId,
    ministryName: u.ministry?.name,
    masterMinistryId: u.masterMinistry?.id,
    masterMinistryName: u.masterMinistry?.name,
  }, fields)).join('\n');
  fs.writeFileSync('users.csv', header + rows);
}

async function exportMembers() {
  const members = await prisma.member.findMany({
    include: { ministry: true }
  });
  const fields = ['id', 'name', 'email', 'phone', 'ministryId', 'ministryName', 'status'];
  const header = fields.join(',') + '\n';
  const rows = members.map(m => toCsvRow({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    ministryId: m.ministryId,
    ministryName: m.ministry?.name,
    status: m.status,
  }, fields)).join('\n');
  fs.writeFileSync('members.csv', header + rows);
}

async function main() {
  await exportMinistries();
  await exportUsers();
  await exportMembers();
  await prisma.$disconnect();
  console.log('Exportação concluída: ministries.csv, users.csv, members.csv');
}

main().catch(e => { console.error(e); process.exit(1); }); 