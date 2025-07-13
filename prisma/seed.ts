import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Crie um usuário administrador padrão, se não existir
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  });

  if (!adminUser) {
    const hashedPassword = await hash('admin123', 10); // Senha padrão: admin123
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'ADMIN', // Defina o papel como ADMIN
      },
    });
    console.log('Usuário administrador padrão (admin@admin.com) criado.');
  } else {
    console.log('Usuário administrador padrão (admin@admin.com) já existe.');
  }

  // Adicione aqui outros dados iniciais que você precisar (igrejas, features, etc.)
  // Exemplo: Criar uma igreja padrão se não existir
  // const defaultChurch = await prisma.church.findFirst();
  // if (!defaultChurch) {
  //   await prisma.church.create({ data: { name: 'Igreja Padrão' } });
  //   console.log('Igreja padrão criada.');
  // }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 