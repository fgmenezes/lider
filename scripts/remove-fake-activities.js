const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeFakeActivities() {
  try {
    console.log('🗑️ Removendo atividades fictícias...\n');

    // Buscar todas as atividades
    const atividades = await prisma.atividade.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ministry: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total de atividades encontradas: ${atividades.length}\n`);

    // Identificar atividades fictícias para remoção
    const fakeActivityIds = [];

    for (const atividade of atividades) {
      let isFake = false;

      // Verificar se menciona entidades que não existem
      if (atividade.descricao.includes('João Santos')) {
        const joaoSantos = await prisma.member.findFirst({
          where: {
            name: {
              contains: 'João Santos',
              mode: 'insensitive'
            }
          }
        });
        
        if (!joaoSantos) {
          isFake = true;
        }
      }

      // Verificar se menciona grupos que não existem
      if (atividade.descricao.includes('Grupo Alpha')) {
        const grupoAlpha = await prisma.smallGroup.findFirst({
          where: {
            name: {
              contains: 'Grupo Alpha',
              mode: 'insensitive'
            }
          }
        });
        
        if (!grupoAlpha) {
          isFake = true;
        }
      }

      // Verificar se menciona eventos que não existem
      if (atividade.descricao.includes('Conferência de Homens')) {
        const evento = await prisma.event.findFirst({
          where: {
            title: {
              contains: 'Conferência de Homens',
              mode: 'insensitive'
            }
          }
        });
        
        if (!evento) {
          isFake = true;
        }
      }

      // Verificar padrões de atividades de teste/seed genéricas
      const testPatterns = [
        'Nova entrada financeira registrada',
        'Reunião de liderança agendada'
      ];

      for (const pattern of testPatterns) {
        if (atividade.descricao === pattern) {
          isFake = true;
        }
      }

      if (isFake) {
        fakeActivityIds.push(atividade.id);
        console.log(`🎭 Marcada para remoção: ${atividade.tipo} - ${atividade.acao}`);
        console.log(`   Descrição: ${atividade.descricao}`);
        console.log(`   ID: ${atividade.id}`);
        console.log('');
      }
    }

    if (fakeActivityIds.length > 0) {
      console.log(`\n🗑️ Removendo ${fakeActivityIds.length} atividades fictícias...`);
      
      const result = await prisma.atividade.deleteMany({
        where: {
          id: {
            in: fakeActivityIds
          }
        }
      });

      console.log(`✅ ${result.count} atividades fictícias removidas com sucesso!`);
      
      // Verificar quantas atividades restaram
      const remainingActivities = await prisma.atividade.count();
      console.log(`📊 Atividades restantes no banco: ${remainingActivities}`);
      
    } else {
      console.log('✅ Nenhuma atividade fictícia encontrada para remoção!');
    }

  } catch (error) {
    console.error('❌ Erro ao remover atividades fictícias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeFakeActivities();