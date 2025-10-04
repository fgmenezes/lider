const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardAPI() {
  try {
    console.log('🧪 Testando a API do dashboard...\n');

    // Simular a busca de um usuário ADMIN ou MASTER
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
      role: felipe.role,
      masterMinistry: felipe.masterMinistry?.name,
      ministry: felipe.ministry?.name
    });

    // Determinar o ministério
    const ministry = felipe.masterMinistry || felipe.ministry;
    const ministryId = ministry?.id;

    console.log('🏛️ Ministério identificado:', {
      id: ministryId,
      name: ministry?.name
    });

    // Simular a consulta da API (igual ao código da API)
    const limit = 10;

    console.log('🔍 Buscando atividades (simulando API)...');

    const whereClause = {
      ...(felipe.role !== 'ADMIN' && ministryId ? { ministryId: ministryId } : {})
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
      console.log('\n📝 Detalhes das atividades (como retornado pela API):');
      console.log('='.repeat(80));

      // Mapear atividades exatamente como na API
      const mappedActivities = atividades.map(atividade => ({
        id: atividade.id,
        tipo: atividade.tipo,
        acao: atividade.acao,
        descricao: atividade.descricao,
        detalhes: atividade.detalhes,
        usuarioId: atividade.usuarioId,
        usuarioNome: atividade.usuario?.name || 'Sistema',
        ministryId: atividade.ministryId,
        ministryName: atividade.ministry?.name,
        createdAt: atividade.createdAt,
        ip: atividade.ip,
        userAgent: atividade.userAgent
      }));

      mappedActivities.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.tipo} - ${activity.acao}`);
        console.log(`   Descrição: ${activity.descricao}`);
        console.log(`   UsuarioId: ${activity.usuarioId}`);
        console.log(`   UsuarioNome: ${activity.usuarioNome}`);
        console.log(`   Ministério: ${activity.ministryName || 'N/A'}`);
        console.log(`   Data: ${activity.createdAt}`);
        console.log('');
      });

      // Verificar se há atividades que mostram 'Sistema'
      const atividadesSistema = mappedActivities.filter(a => a.usuarioNome === 'Sistema');
      console.log(`🔍 Atividades que mostram 'Sistema': ${atividadesSistema.length}`);

      if (atividadesSistema.length > 0) {
        console.log('\n⚠️ Atividades que mostram "Sistema":');
        atividadesSistema.forEach((activity, index) => {
          console.log(`${index + 1}. ${activity.tipo} - ${activity.acao}: ${activity.descricao}`);
          console.log(`   UsuarioId: ${activity.usuarioId}`);
          console.log(`   Razão: ${activity.usuarioId ? 'Usuário não encontrado' : 'UsuarioId é null'}`);
        });
      } else {
        console.log('\n✅ Todas as atividades têm usuários válidos!');
      }

      console.log('\n🎯 Resposta simulada da API:');
      const apiResponse = {
        activities: mappedActivities,
        total: mappedActivities.length,
        hasMore: mappedActivities.length === limit,
        message: `${mappedActivities.length} atividades encontradas`
      };

      console.log(JSON.stringify(apiResponse, null, 2));

    } else {
      console.log('⚠️ Nenhuma atividade encontrada.');
    }

  } catch (error) {
    console.error('❌ Erro ao testar a API do dashboard:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardAPI();