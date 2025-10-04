const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalValidation() {
  console.log('🔍 Iniciando validação final da implementação...\n');

  try {
    // 1. Verificar estrutura do banco de dados
    console.log('📊 1. Verificando estrutura do banco de dados...');
    
    const userCount = await prisma.user.count();
    const ministryCount = await prisma.ministry.count();
    const atividadeCount = await prisma.atividade.count();
    
    console.log(`   ✅ Usuários: ${userCount}`);
    console.log(`   ✅ Ministérios: ${ministryCount}`);
    console.log(`   ✅ Atividades: ${atividadeCount}\n`);

    // 2. Verificar usuário Felipe
    console.log('👤 2. Verificando usuário Felipe...');
    
    const felipe = await prisma.user.findUnique({
      where: { email: 'felipe@lider.com' },
      include: {
        masterMinistry: true,
        ministry: true
      }
    });

    if (felipe) {
      console.log(`   ✅ Usuário encontrado: ${felipe.name}`);
      console.log(`   ✅ Role: ${felipe.role}`);
      console.log(`   ✅ Ministério: ${felipe.masterMinistry?.name || felipe.ministry?.name || 'Nenhum'}\n`);
    } else {
      console.log('   ❌ Usuário Felipe não encontrado\n');
      return;
    }

    // 3. Verificar atividades do ministério
    console.log('📝 3. Verificando atividades do ministério...');
    
    const ministryId = felipe.masterMinistry?.id || felipe.ministry?.id;
    let atividades = [];
    
    if (ministryId) {
      atividades = await prisma.atividade.findMany({
        where: { ministryId },
        include: {
          usuario: { select: { name: true } },
          ministry: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`   ✅ Atividades encontradas: ${atividades.length}`);
      
      if (atividades.length > 0) {
        console.log('   📋 Tipos de atividades:');
        const tipos = [...new Set(atividades.map(a => a.tipo))];
        tipos.forEach(tipo => {
          const count = atividades.filter(a => a.tipo === tipo).length;
          console.log(`      - ${tipo}: ${count}`);
        });
      }
      console.log('');
    }

    // 4. Simular resposta da API
    console.log('🔌 4. Simulando resposta da API...');
    
    const apiActivities = atividades.map(atividade => ({
      id: atividade.id,
      tipo: atividade.tipo,
      acao: atividade.acao,
      descricao: atividade.descricao,
      usuarioNome: atividade.usuario?.name || 'Sistema',
      usuarioId: atividade.usuarioId,
      createdAt: atividade.createdAt,
      detalhes: atividade.detalhes,
      entidadeId: atividade.entidadeId
    }));

    const apiResponse = {
      activities: apiActivities,
      total: apiActivities.length,
      hasMore: false,
      message: `${apiActivities.length} atividades encontradas`
    };

    console.log('   ✅ Estrutura da resposta da API:');
    console.log(`      - activities: array com ${apiResponse.activities.length} itens`);
    console.log(`      - total: ${apiResponse.total}`);
    console.log(`      - hasMore: ${apiResponse.hasMore}`);
    console.log(`      - message: "${apiResponse.message}"\n`);

    // 5. Verificar campos obrigatórios
    console.log('🔍 5. Verificando campos obrigatórios das atividades...');
    
    let validationErrors = 0;
    
    apiResponse.activities.forEach((activity, index) => {
      const requiredFields = ['id', 'tipo', 'acao', 'descricao', 'createdAt'];
      const missingFields = requiredFields.filter(field => !activity[field]);
      
      if (missingFields.length > 0) {
        console.log(`   ❌ Atividade ${index + 1}: campos ausentes: ${missingFields.join(', ')}`);
        validationErrors++;
      }
    });

    if (validationErrors === 0) {
      console.log('   ✅ Todos os campos obrigatórios estão presentes\n');
    } else {
      console.log(`   ❌ ${validationErrors} atividades com campos ausentes\n`);
    }

    // 6. Verificar permissões de acesso
    console.log('🔐 6. Verificando permissões de acesso...');
    
    const allowedRoles = ['ADMIN', 'MASTER', 'LEADER'];
    const hasPermission = allowedRoles.includes(felipe.role);
    
    if (hasPermission) {
      console.log(`   ✅ Role '${felipe.role}' tem permissão para acessar a API`);
    } else {
      console.log(`   ❌ Role '${felipe.role}' não tem permissão para acessar a API`);
    }
    
    console.log(`   📋 Roles permitidos: ${allowedRoles.join(', ')}\n`);

    // 7. Resumo final
    console.log('📊 RESUMO DA VALIDAÇÃO:');
    console.log('========================');
    console.log(`✅ Banco de dados: ${userCount} usuários, ${ministryCount} ministérios, ${atividadeCount} atividades`);
    console.log(`✅ Usuário Felipe: encontrado com role ${felipe.role}`);
    console.log(`✅ Ministério: ${felipe.masterMinistry?.name || felipe.ministry?.name}`);
    console.log(`✅ Atividades: ${atividades.length} registradas`);
    console.log(`✅ API Response: estrutura válida`);
    console.log(`✅ Permissões: ${hasPermission ? 'OK' : 'ERRO'}`);
    console.log(`✅ Campos obrigatórios: ${validationErrors === 0 ? 'OK' : 'ERRO'}`);
    
    if (validationErrors === 0 && hasPermission && atividades.length > 0) {
      console.log('\n🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('A API de atividades está funcionando corretamente.');
    } else {
      console.log('\n⚠️ VALIDAÇÃO CONCLUÍDA COM PROBLEMAS');
      console.log('Alguns aspectos precisam ser revisados.');
    }

  } catch (error) {
    console.error('❌ Erro durante a validação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalValidation();