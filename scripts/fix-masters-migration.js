const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const masters = await prisma.user.findMany({ where: { role: 'MASTER' } });
  for (const master of masters) {
    if (master.ministryId) {
      await prisma.user.update({
        where: { id: master.id },
        data: {
          masterMinistryId: master.ministryId,
          ministryId: null,
        },
      });
      console.log(`Usuário ${master.name} (${master.email}) migrado para masterMinistryId: ${master.ministryId}`);
    }
  }
  console.log('Migração dos masters concluída.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); }); 