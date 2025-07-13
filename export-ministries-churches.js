// Script para exportar ministérios e igrejas com seus IDs
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const ministries = await prisma.ministry.findMany({
      include: {
        church: true
      }
    });
    const result = ministries.map(m => ({
      ministryId: m.id,
      ministryName: m.name,
      churchId: m.churchId || (m.church ? m.church.id : null),
      churchName: m.church ? m.church.name : null
    }));
    fs.writeFileSync('ministries-churches.json', JSON.stringify(result, null, 2), 'utf-8');
    console.log('Arquivo ministries-churches.json gerado com sucesso!');
  } catch (err) {
    console.error('Erro ao exportar:', err);
  } finally {
    await prisma.$disconnect();
  }
}

const ministryIdToCheck = process.argv[2];
if (ministryIdToCheck) {
  prisma.ministry.findUnique({
    where: { id: ministryIdToCheck },
    include: { church: true }
  }).then(ministry => {
    console.log('Busca individual pelo ID:', ministryIdToCheck);
    console.log(ministry);
    prisma.$disconnect();
  });
}

main(); 