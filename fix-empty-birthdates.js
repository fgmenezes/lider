// Script para corrigir datas de nascimento vazias ou inválidas no banco
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmptyBirthdates() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (!user.dataNascimento || user.dataNascimento === '' || isNaN(new Date(user.dataNascimento).getTime())) {
      await prisma.user.update({
        where: { id: user.id },
        data: { dataNascimento: null },
      });
      console.log(`Corrigido usuário: ${user.id}`);
    }
  }
  await prisma.$disconnect();
  console.log('Correção concluída.');
}

fixEmptyBirthdates(); 