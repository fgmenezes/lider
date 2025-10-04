const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkActivities() {
  try {
    console.log('🔍 Verificando todas as atividades...\n');

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
      },
      take: 10
    });

    console.log(`📊 Últimas ${atividades.length} atividades:`);
    console.log('='.repeat(80));

    atividades.forEach((atividade, index) => {
      console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}`);
      console.log(`   Descrição: ${atividade.descricao}`);
      console.log(`   UsuarioId: ${atividade.usuarioId}`);
      console.log(`   Usuario: ${atividade.usuario ? atividade.usuario.name + ' (' + atividade.usuario.email + ')' : 'NULL'}`);
      console.log(`   Ministério: ${atividade.ministry?.name || 'NULL'}`);
      console.log(`   Data: ${atividade.createdAt}`);
      console.log('');
    });

    // Verificar se há atividades que mostrariam 'Sistema'
    const atividadesSistema = atividades.filter(a => !a.usuario);
    console.log(`🔍 Atividades que mostrariam 'Sistema': ${atividadesSistema.length}`);

    if (atividadesSistema.length > 0) {
      console.log('\n⚠️ Atividades problemáticas:');
      atividadesSistema.forEach((atividade, index) => {
        console.log(`${index + 1}. ${atividade.tipo} - ${atividade.acao}: ${atividade.descricao}`);
        console.log(`   UsuarioId: ${atividade.usuarioId}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar atividades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivities();