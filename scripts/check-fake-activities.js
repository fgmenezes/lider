const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFakeActivities() {
  try {
    console.log('🔍 Verificando atividades fictícias...\n');

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

    // Identificar atividades potencialmente fictícias
    const fakeActivities = [];
    const realActivities = [];

    for (const atividade of atividades) {
      let isFake = false;
      const reasons = [];

      // Verificar se menciona entidades que não existem
      if (atividade.descricao.includes('João Santos')) {
        // Verificar se João Santos existe no banco
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
          reasons.push('Menciona membro inexistente: João Santos');
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
          reasons.push('Menciona grupo inexistente: Grupo Alpha');
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
          reasons.push('Menciona evento inexistente: Conferência de Homens');
        }
      }

      // Verificar padrões de atividades de teste/seed
      const testPatterns = [
        'Nova entrada financeira registrada',
        'Reunião de liderança agendada',
        'Evento especial:',
        'Novo pequeno grupo criado:',
        'Novo membro cadastrado:'
      ];

      for (const pattern of testPatterns) {
        if (atividade.descricao.includes(pattern)) {
          // Verificar se é uma descrição genérica sem detalhes específicos
          if (atividade.descricao === pattern || 
              atividade.descricao === `${pattern} ` ||
              atividade.descricao.length < pattern.length + 10) {
            isFake = true;
            reasons.push(`Descrição genérica de teste: "${pattern}"`);
          }
        }
      }

      if (isFake) {
        fakeActivities.push({ ...atividade, reasons });
      } else {
        realActivities.push(atividade);
      }
    }

    console.log(`🎭 Atividades fictícias encontradas: ${fakeActivities.length}`);
    console.log(`✅ Atividades reais encontradas: ${realActivities.length}\n`);

    if (fakeActivities.length > 0) {
      console.log('🎭 ATIVIDADES FICTÍCIAS IDENTIFICADAS:');
      console.log('=====================================');
      
      fakeActivities.forEach((atividade, index) => {
        console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}`);
        console.log(`   Descrição: ${atividade.descricao}`);
        console.log(`   Usuário: ${atividade.usuario?.name || 'Sistema'}`);
        console.log(`   Data: ${atividade.createdAt}`);
        console.log(`   Razões para ser considerada fictícia:`);
        atividade.reasons.forEach(reason => {
          console.log(`   - ${reason}`);
        });
        console.log('');
      });

      console.log('\n❓ Deseja remover essas atividades fictícias? (Execute o script remove-fake-activities.js)');
    } else {
      console.log('✅ Nenhuma atividade fictícia identificada!');
    }

    console.log('\n📋 RESUMO:');
    console.log(`   Total de atividades: ${atividades.length}`);
    console.log(`   Atividades reais: ${realActivities.length}`);
    console.log(`   Atividades fictícias: ${fakeActivities.length}`);

  } catch (error) {
    console.error('❌ Erro ao verificar atividades fictícias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFakeActivities();