import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@admin.com';
  const plainPassword = 'admin123'; // Senha temporária para o usuário administrador
  const name = 'Administrador';
  const role = 'ADMIN'; // Papel ADMIN (ajuste se o enum Role for diferente)

  try {
    // Verificar se o usuário já existe para evitar duplicidade
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      console.log(`Usuário com email ${email} já existe. Pulando a criação.`);
      return;
    }

    // Hashear a senha
    const hashedPassword = await hash(plainPassword, 10);

    // Criar o usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        role: role,
      },
    });

    console.log(`Usuário administrador (${email}) criado com sucesso.`);
    console.log('ID do usuário:', user.id);

  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 