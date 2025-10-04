const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestActivities() {
  try {
    console.log('🔍 Verificando dados existentes...');

    // Verificar se o usuário Felipe existe
    const felipe = await prisma.user.findUnique({
      where: { email: 'felipe@lider.com' },
      include: {
        masterMinistry: true,
        ministry: true
      }
    });

    if (!felipe) {
      console.log('❌ Usuário Felipe não encontrado. Execute o seed primeiro.');
      return;
    }

    console.log('✅ Usuário Felipe encontrado:', {
      id: felipe.id,
      name: felipe.name,
      email: felipe.email,
      masterMinistry: felipe.masterMinistry?.name,
      ministry: felipe.ministry?.name
    });

    // Verificar ministério
    const ministry = felipe.masterMinistry || felipe.ministry;
    if (!ministry) {
      console.log('❌ Ministério não encontrado para o usuário Felipe.');
      return;
    }

    console.log('✅ Ministério encontrado:', ministry.name);

    // Verificar atividades existentes
    const existingActivities = await prisma.atividade.findMany({
      where: {
        ministryId: ministry.id
      }
    });

    console.log(`📊 Atividades existentes: ${existingActivities.length}`);

    if (existingActivities.length === 0) {
      console.log('🔧 Criando atividades de teste...');

      const atividades = [
        {
          tipo: 'MEMBRO',
          acao: 'CRIACAO',
          descricao: 'Novo membro cadastrado: João Santos',
          detalhes: 'Membro adicionado ao ministério Homens de Deus',
          usuarioId: felipe.id,
          ministryId: ministry.id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 dia atrás
        },
        {
          tipo: 'GRUPO',
          acao: 'CRIACAO',
          descricao: 'Novo pequeno grupo criado: Grupo Alpha',
          detalhes: 'Pequeno grupo criado na região Norte',
          usuarioId: felipe.id,
          ministryId: ministry.id,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
        },
        {
          tipo: 'REUNIAO',
          acao: 'CRIACAO',
          descricao: 'Reunião de liderança agendada',
          detalhes: 'Reunião mensal de liderança do ministério',
          usuarioId: felipe.id,
          ministryId: ministry.id,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 dias atrás
        },
        {
          tipo: 'EVENTO',
          acao: 'CRIACAO',
          descricao: 'Evento especial: Conferência de Homens',
          detalhes: 'Evento anual do ministério Homens de Deus',
          usuarioId: felipe.id,
          ministryId: ministry.id,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 dias atrás
        },
        {
          tipo: 'FINANCEIRO',
          acao: 'CRIACAO',
          descricao: 'Nova entrada financeira registrada',
          detalhes: 'Oferta especial para o ministério - R$ 500,00',
          usuarioId: felipe.id,
          ministryId: ministry.id,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 dias atrás
        },
        {
          tipo: 'SISTEMA',
          acao: 'LOGIN',
          descricao: 'Usuário fez login no sistema',
          detalhes: 'Login realizado com sucesso',
          usuarioId: felipe.id,
          ministryId: ministry.id,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 horas atrás
        }
      ];

      for (const atividade of atividades) {
        await prisma.atividade.create({ data: atividade });
        console.log(`✅ Atividade criada: ${atividade.descricao}`);
      }

      console.log('🎉 Todas as atividades de teste foram criadas!');
    } else {
      console.log('ℹ️ Atividades já existem no banco de dados.');
      existingActivities.forEach((atividade, index) => {
        console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}: ${atividade.descricao}`);
      });
    }

    // Verificar novamente após criação
    const finalActivities = await prisma.atividade.findMany({
      where: {
        ministryId: ministry.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📈 Total de atividades no ministério "${ministry.name}": ${finalActivities.length}`);

  } catch (error) {
    console.error('❌ Erro ao criar atividades de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestActivities();