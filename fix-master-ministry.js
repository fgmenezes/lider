const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // IDs extraídos dos arquivos CSV
  const ministryId = 'cmb8kvc1s0002w0b0qf3kyzkx';
  const userId = 'cmccj87kt0003w03ww7og63ff';

  // Atualiza o campo masterId do ministério
  const updated = await prisma.ministry.update({
    where: { id: ministryId },
    data: { masterId: userId },
  });

  console.log('Ministério atualizado:', updated);
}

main().finally(() => prisma.$disconnect()); 