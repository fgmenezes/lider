const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testImprovedSearch() {
  try {
    console.log('🧪 Testando busca melhorada de atividades...\n');

    // Simular a busca de um usuário ADMIN
    const felipe = await prisma.user.findUnique({
      where: { email: 'felipe@lider.com' },
      include: {
        masterMinistry: true,
        ministry: true
      }
    });

    if (!felipe) {
      console.log('❌ Usuário Felipe não encontrado.');
      return;
    }

    console.log('✅ Usuário Felipe encontrado:', {
      id: felipe.id,
      name: felipe.name,
      role: felipe.role
    });

    // Testes de busca
    const searchTests = [
      { term: 'Felipe', description: 'Busca por nome de usuário' },
      { term: 'MEMBRO', description: 'Busca por tipo' },
      { term: 'CRIACAO', description: 'Busca por ação' },
      { term: 'Homens', description: 'Busca por ministério' },
      { term: 'grupo', description: 'Busca por descrição' },
      { term: 'felipe@lider.com', description: 'Busca por email' },
      { term: 'especial', description: 'Busca por detalhes' }
    ];

    for (const test of searchTests) {
      console.log(`🔍 ${test.description}: "${test.term}"`);
      console.log('-'.repeat(50));

      // Simular a consulta da API melhorada
      const whereClause = {
        OR: [
          {
            descricao: {
              contains: test.term,
              mode: 'insensitive'
            }
          },
          {
            detalhes: {
              contains: test.term,
              mode: 'insensitive'
            }
          },
          {
            tipo: {
              contains: test.term,
              mode: 'insensitive'
            }
          },
          {
            acao: {
              contains: test.term,
              mode: 'insensitive'
            }
          },
          {
            usuario: {
              name: {
                contains: test.term,
                mode: 'insensitive'
              }
            }
          },
          {
            usuario: {
              email: {
                contains: test.term,
                mode: 'insensitive'
              }
            }
          },
          {
            ministry: {
              name: {
                contains: test.term,
                mode: 'insensitive'
              }
            }
          }
        ]
      };

      const atividades = await prisma.atividade.findMany({
        where: whereClause,
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
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      console.log(`📊 Resultados encontrados: ${atividades.length}`);

      if (atividades.length > 0) {
        atividades.forEach((atividade, index) => {
          console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}: ${atividade.descricao}`);
          console.log(`   Usuário: ${atividade.usuario?.name || 'Sistema'}`);
          console.log(`   Ministério: ${atividade.ministry?.name || 'N/A'}`);
        });
      } else {
        console.log('   Nenhum resultado encontrado.');
      }

      console.log('');
    }

    console.log('✅ Teste de busca melhorada concluído!');

  } catch (error) {
    console.error('❌ Erro ao testar busca melhorada:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImprovedSearch();