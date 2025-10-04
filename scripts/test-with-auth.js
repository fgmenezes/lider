const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWithAuth() {
  try {
    console.log('🔐 Testando API com autenticação simulada...');

    // Primeiro, vamos verificar se o usuário Felipe existe e tem o role correto
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
      role: felipe.role,
      masterMinistry: felipe.masterMinistry?.name,
      ministry: felipe.ministry?.name
    });

    // Verificar se o role permite acesso
    const allowedRoles = ['ADMIN', 'MASTER', 'LEADER'];
    if (!allowedRoles.includes(felipe.role)) {
      console.log(`❌ Role '${felipe.role}' não tem permissão. Roles permitidos: ${allowedRoles.join(', ')}`);
      return;
    }

    console.log(`✅ Role '${felipe.role}' tem permissão para acessar a API.`);

    // Simular a lógica da API sem autenticação
    const ministryId = felipe.masterMinistry?.id || felipe.ministry?.id || felipe.ministryId;
    
    console.log('🏛️ Ministério identificado:', {
      id: ministryId,
      name: felipe.masterMinistry?.name || felipe.ministry?.name
    });

    if (!ministryId) {
      console.log('⚠️ Usuário não está associado a nenhum ministério.');
      return;
    }

    // Buscar atividades
    const atividades = await prisma.atividade.findMany({
      where: {
        ministryId: ministryId
      },
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
      take: 10
    });

    console.log(`📊 Atividades encontradas: ${atividades.length}`);

    if (atividades.length > 0) {
      console.log('\n📝 Atividades:');
      atividades.forEach((atividade, index) => {
        console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}: ${atividade.descricao}`);
      });

      // Simular resposta da API
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

      console.log('\n🎯 Resposta simulada da API (primeiras 3 atividades):');
      console.log(JSON.stringify({
        ...apiResponse,
        activities: apiResponse.activities.slice(0, 3)
      }, null, 2));

      console.log('\n✅ Teste concluído com sucesso!');
      console.log(`📈 Total de atividades que seriam retornadas: ${apiResponse.activities.length}`);
    } else {
      console.log('\n⚠️ Nenhuma atividade encontrada para este ministério.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWithAuth();