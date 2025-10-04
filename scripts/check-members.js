const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMembers() {
  try {
    console.log('🔍 Verificando membros no banco de dados...\n');

    // Buscar todos os membros
    const members = await prisma.member.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        ministry: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 Total de membros encontrados: ${members.length}\n`);

    if (members.length > 0) {
      console.log('👥 Membros cadastrados:');
      console.log('=====================================');
      members.forEach((member, index) => {
        console.log(`${index + 1}. ${member.name}`);
        console.log(`   Email: ${member.email || 'Não informado'}`);
        console.log(`   Ministério: ${member.ministry?.name || 'Não associado'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum membro encontrado no banco de dados');
    }

    // Verificar especificamente por João Santos
    const joaoSantos = await prisma.member.findFirst({
      where: {
        name: {
          contains: 'João Santos',
          mode: 'insensitive'
        }
      }
    });

    console.log('\n🔍 Verificando especificamente por "João Santos":');
    if (joaoSantos) {
      console.log('✅ João Santos encontrado no banco de dados');
      console.log(`   ID: ${joaoSantos.id}`);
      console.log(`   Nome: ${joaoSantos.name}`);
    } else {
      console.log('❌ João Santos NÃO encontrado no banco de dados');
      console.log('   Isso indica uma inconsistência na atividade registrada');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar membros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMembers();