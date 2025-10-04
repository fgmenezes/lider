const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMember() {
  try {
    console.log('🔍 Procurando por membros com nome "Thiago"...\n');
    
    // Buscar membros com nome contendo "Thiago"
    const members = await prisma.member.findMany({
      where: {
        name: {
          contains: 'Thiago',
          mode: 'insensitive'
        }
      },
      include: {
        ministry: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (members.length === 0) {
      console.log('❌ Nenhum membro com nome "Thiago" foi encontrado no banco de dados.');
    } else {
      console.log(`✅ Encontrados ${members.length} membro(s) com nome "Thiago":\n`);
      
      members.forEach((member, index) => {
        console.log(`${index + 1}. Nome: ${member.name}`);
        console.log(`   ID: ${member.id}`);
        console.log(`   Email: ${member.email || 'N/A'}`);
        console.log(`   Telefone: ${member.phone || 'N/A'}`);
        console.log(`   Status: ${member.status}`);
        console.log(`   Ministério: ${member.ministry?.name || 'N/A'}`);
        console.log(`   Criado em: ${member.createdAt}`);
        console.log('   ---');
      });
    }

    // Verificar especificamente o ministério "Homens de Deus"
    console.log('\n🔍 Verificando ministério "Homens de Deus"...\n');
    
    const ministry = await prisma.ministry.findFirst({
      where: {
        name: {
          contains: 'Homens de Deus',
          mode: 'insensitive'
        }
      },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (ministry) {
      console.log(`✅ Ministério encontrado: ${ministry.name}`);
      console.log(`   ID: ${ministry.id}`);
      console.log(`   Total de membros: ${ministry._count.members}`);
    } else {
      console.log('❌ Ministério "Homens de Deus" não encontrado.');
    }

    // Verificar últimos membros criados
    console.log('\n🔍 Últimos 5 membros criados:\n');
    
    const recentMembers = await prisma.member.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        ministry: {
          select: {
            name: true
          }
        }
      }
    });

    recentMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} (${member.ministry?.name || 'Sem ministério'})`);
      console.log(`   Criado em: ${member.createdAt}`);
      console.log(`   Status: ${member.status}`);
    });

  } catch (error) {
    console.error('❌ Erro ao consultar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMember();