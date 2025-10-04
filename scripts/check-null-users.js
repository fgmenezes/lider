const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNullUsers() {
  try {
    console.log('🔍 Verificando atividades com usuarioId null...\n');

    // Buscar atividades com usuarioId null
    const atividadesNull = await prisma.atividade.findMany({
      where: { 
        usuarioId: null 
      },
      include: {
        usuario: true,
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

    console.log(`📊 Atividades com usuarioId null: ${atividadesNull.length}`);

    if (atividadesNull.length > 0) {
      console.log('\n📋 Detalhes das atividades com usuarioId null:');
      console.log('='.repeat(60));
      
      atividadesNull.forEach((atividade, index) => {
        console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}`);
        console.log(`   Descrição: ${atividade.descricao}`);
        console.log(`   Usuário: ${atividade.usuario?.name || 'NULL'}`);
        console.log(`   Ministério: ${atividade.ministry?.name || 'NULL'}`);
        console.log(`   Data: ${atividade.createdAt}`);
        console.log('');
      });
    }

    // Verificar também atividades com usuário inexistente
    const atividadesOrfas = await prisma.atividade.findMany({
      where: {
        usuarioId: {
          not: null
        },
        usuario: null
      },
      include: {
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

    console.log(`📊 Atividades com usuário inexistente: ${atividadesOrfas.length}`);

    if (atividadesOrfas.length > 0) {
      console.log('\n📋 Detalhes das atividades órfãs:');
      console.log('='.repeat(60));
      
      atividadesOrfas.forEach((atividade, index) => {
        console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}`);
        console.log(`   Descrição: ${atividade.descricao}`);
        console.log(`   UsuarioId: ${atividade.usuarioId}`);
        console.log(`   Ministério: ${atividade.ministry?.name || 'NULL'}`);
        console.log(`   Data: ${atividade.createdAt}`);
        console.log('');
      });
    }

    // Estatísticas gerais
    const totalAtividades = await prisma.atividade.count();
    const atividadesComUsuario = await prisma.atividade.count({
      where: {
        usuario: {
          isNot: null
        }
      }
    });

    console.log('\n📈 Estatísticas:');
    console.log(`   Total de atividades: ${totalAtividades}`);
    console.log(`   Atividades com usuário válido: ${atividadesComUsuario}`);
    console.log(`   Atividades problemáticas: ${atividadesNull.length + atividadesOrfas.length}`);

  } catch (error) {
    console.error('❌ Erro ao verificar atividades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNullUsers();