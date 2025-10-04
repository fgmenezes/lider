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

  // Criar igreja padrão se não existir
  let defaultChurch = await prisma.church.findFirst();
  if (!defaultChurch) {
    defaultChurch = await prisma.church.create({ 
      data: { 
        name: 'Igreja Líder',
        email: 'contato@igrejlider.com',
        phone: '(11) 99999-9999'
      } 
    });
    console.log('Igreja padrão criada.');
  }

  // Criar ministério "Homens de Deus" se não existir
  let homensDeDeusMinistry = await prisma.ministry.findFirst({
    where: { name: 'Homens de Deus' }
  });
  
  if (!homensDeDeusMinistry) {
    homensDeDeusMinistry = await prisma.ministry.create({
      data: {
        name: 'Homens de Deus',
        churchId: defaultChurch.id,
        churchName: defaultChurch.name,
        churchEmail: defaultChurch.email,
        churchPhone: defaultChurch.phone,
        pastorName: 'Pastor João Silva',
        pastorEmail: 'pastor@igrejlider.com',
        pastorPhone: '(11) 98888-8888',
        cep: '01234-567',
        rua: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        municipio: 'São Paulo',
        estado: 'SP'
      }
    });
    console.log('Ministério "Homens de Deus" criado.');
  }

  // Criar usuário Felipe se não existir
  const felipeUser = await prisma.user.findUnique({
    where: { email: 'felipe@lider.com' },
  });

  if (!felipeUser) {
    const hashedPassword = await hash('felipe123', 10);
    const newFelipe = await prisma.user.create({
      data: {
        name: 'Felipe Silva',
        email: 'felipe@lider.com',
        password: hashedPassword,
        role: 'LEADER',
        masterMinistryId: homensDeDeusMinistry.id,
        ministryId: homensDeDeusMinistry.id,
      },
    });
    console.log('Usuário Felipe (felipe@lider.com) criado.');

    // Criar algumas atividades de exemplo para o ministério
    const atividades = [
      {
        tipo: 'MEMBRO',
        acao: 'CRIACAO',
        descricao: 'Novo membro cadastrado: João Santos',
        detalhes: 'Membro adicionado ao ministério Homens de Deus',
        usuarioId: newFelipe.id,
        ministryId: homensDeDeusMinistry.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 dia atrás
      },
      {
        tipo: 'GRUPO',
        acao: 'CRIACAO',
        descricao: 'Novo pequeno grupo criado: Grupo Alpha',
        detalhes: 'Pequeno grupo criado na região Norte',
        usuarioId: newFelipe.id,
        ministryId: homensDeDeusMinistry.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
      },
      {
        tipo: 'REUNIAO',
        acao: 'CRIACAO',
        descricao: 'Reunião de liderança agendada',
        detalhes: 'Reunião mensal de liderança do ministério',
        usuarioId: newFelipe.id,
        ministryId: homensDeDeusMinistry.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 dias atrás
      },
      {
        tipo: 'EVENTO',
        acao: 'CRIACAO',
        descricao: 'Evento especial: Conferência de Homens',
        detalhes: 'Evento anual do ministério Homens de Deus',
        usuarioId: newFelipe.id,
        ministryId: homensDeDeusMinistry.id,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 dias atrás
      },
      {
        tipo: 'FINANCEIRO',
        acao: 'CRIACAO',
        descricao: 'Nova entrada financeira registrada',
        detalhes: 'Oferta especial para o ministério - R$ 500,00',
        usuarioId: newFelipe.id,
        ministryId: homensDeDeusMinistry.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 dias atrás
      }
    ];

    for (const atividade of atividades) {
      await prisma.atividade.create({ data: atividade });
    }
    console.log('Atividades de exemplo criadas para o ministério Homens de Deus.');
  } else {
    console.log('Usuário Felipe (felipe@lider.com) já existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });