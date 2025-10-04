const { PrismaClient } = require('@prisma/client');
const { getServerSession } = require('next-auth');

const prisma = new PrismaClient();

async function testActivitiesAPI() {
  try {
    console.log('🧪 Testando a API de atividades...');

    // Simular a busca do usuário Felipe
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
      email: felipe.email,
      masterMinistry: felipe.masterMinistry?.name,
      ministry: felipe.ministry?.name
    });

    // Determinar o ministério (priorizar masterMinistry)
    const ministry = felipe.masterMinistry || felipe.ministry;
    const ministryId = ministry?.id;

    console.log('🏛️ Ministério identificado:', {
      id: ministryId,
      name: ministry?.name
    });

    // Simular a consulta da API
    const limit = 10;
    const searchQuery = '';

    console.log('🔍 Buscando atividades...');

    // Buscar atividades do modelo Atividade
    const whereClause = {
      ...(ministryId ? { ministryId: ministryId } : {}),
      ...(searchQuery ? {
        OR: [
          { descricao: { contains: searchQuery, mode: 'insensitive' } },
          { detalhes: { contains: searchQuery, mode: 'insensitive' } }
        ]
      } : {})
    };

    console.log('📋 Cláusula WHERE:', JSON.stringify(whereClause, null, 2));

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
      take: limit
    });

    console.log(`📊 Atividades encontradas: ${atividades.length}`);

    if (atividades.length > 0) {
      console.log('\n📝 Detalhes das atividades:');
      atividades.forEach((atividade, index) => {
        console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}`);
        console.log(`   Descrição: ${atividade.descricao}`);
        console.log(`   Usuário: ${atividade.usuario?.name || 'N/A'}`);
        console.log(`   Ministério: ${atividade.ministry?.name || 'N/A'}`);
        console.log(`   Data: ${atividade.createdAt}`);
        console.log('');
      });

      // Simular a resposta da API
      const apiResponse = {
        activities: atividades.map(atividade => ({
          id: atividade.id,
          tipo: atividade.tipo,
          acao: atividade.acao,
          descricao: atividade.descricao,
          usuarioNome: atividade.usuario?.name || 'Sistema',
          usuarioId: atividade.usuarioId,
          createdAt: atividade.createdAt
        })),
        total: atividades.length,
        hasMore: false
      };

      console.log('🎯 Resposta simulada da API:');
      console.log(JSON.stringify(apiResponse, null, 2));

      console.log('\n✅ Teste da API concluído com sucesso!');
      console.log(`📈 Total de atividades retornadas: ${apiResponse.activities.length}`);
    } else {
      console.log('⚠️ Nenhuma atividade encontrada para o ministério.');
    }

  } catch (error) {
    console.error('❌ Erro ao testar a API de atividades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testActivitiesAPI();