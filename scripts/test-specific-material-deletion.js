const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSpecificMaterialDeletion() {
  try {
    console.log('🧪 Testando exclusão específica do material "Estudo teste 24092025"...\n');

    // Buscar o material específico
    const material = await prisma.materialApoio.findFirst({
      where: {
        nome: {
          contains: 'Estudo teste 24092025',
          mode: 'insensitive'
        }
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
            role: true
          }
        },
        ministry: {
          select: {
            name: true
          }
        },
        smallGroup: {
          select: {
            name: true,
            leaders: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        meeting: {
          select: {
            date: true,
            startTime: true
          }
        }
      }
    });

    if (!material) {
      console.log('✅ Material não encontrado no banco de dados.');
      return;
    }

    console.log('📄 Material encontrado:');
    console.log('====================');
    console.log('ID:', material.id);
    console.log('Nome:', material.nome);
    console.log('Arquivo URL:', material.arquivoUrl);
    console.log('Usuário:', material.usuario.name, '(' + material.usuario.email + ')');
    console.log('Role do usuário:', material.usuario.role);
    console.log('Ministério:', material.ministry?.name || 'N/A');
    console.log('Pequeno Grupo:', material.smallGroup?.name || 'N/A');
    console.log('Líderes do grupo:');
    material.smallGroup?.leaders.forEach((leader, index) => {
      console.log(`  ${index + 1}. ${leader.user.name} (${leader.user.email})`);
    });
    console.log('Data da Reunião:', material.meeting.date);
    console.log('Horário:', material.meeting.startTime);
    console.log('Criado em:', material.createdAt);
    console.log('Atualizado em:', material.updatedAt);

    // Analisar a URL do arquivo
    console.log('\n🔍 Análise da URL do arquivo:');
    console.log('============================');
    console.log('URL completa:', material.arquivoUrl);
    
    if (material.arquivoUrl) {
      try {
        const url = new URL(material.arquivoUrl);
        console.log('Protocol:', url.protocol);
        console.log('Host:', url.host);
        console.log('Pathname:', url.pathname);
        
        const pathParts = url.pathname.split('/').filter(part => part.length > 0);
        console.log('Path parts:', pathParts);
        
        const bucketName = 'sistemalider';
        const bucketIndex = pathParts.findIndex(part => part === bucketName);
        console.log('Bucket index:', bucketIndex);
        
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const objectPath = pathParts.slice(bucketIndex + 1).join('/');
          console.log('Object path no MinIO:', objectPath);
        } else {
          console.log('❌ Não foi possível extrair o caminho do objeto');
        }
      } catch (urlError) {
        console.log('❌ Erro ao analisar URL:', urlError.message);
      }
    } else {
      console.log('❌ URL do arquivo está vazia!');
    }

    // Verificar se o material pode ser excluído
    console.log('\n🔐 Verificação de permissões:');
    console.log('=============================');
    console.log('Para excluir este material, o usuário deve ser:');
    console.log('1. Autor do material:', material.usuario.name);
    console.log('2. Líder do pequeno grupo:', material.smallGroup?.leaders.map(l => l.user.name).join(', ') || 'Nenhum');
    console.log('3. MASTER do ministério');
    console.log('4. ADMIN do sistema');

    // Simular exclusão manual via Prisma
    console.log('\n🧪 Simulando exclusão manual...');
    console.log('================================');
    
    const confirmDelete = process.argv.includes('--confirm-delete');
    
    if (confirmDelete) {
      console.log('⚠️ EXECUTANDO EXCLUSÃO REAL...');
      
      try {
        // Deletar registro do banco
        await prisma.materialApoio.delete({
          where: { id: material.id }
        });
        
        console.log('✅ Material excluído com sucesso do banco de dados!');
        
        // Verificar se foi realmente excluído
        const checkMaterial = await prisma.materialApoio.findUnique({
          where: { id: material.id }
        });
        
        if (!checkMaterial) {
          console.log('✅ Confirmado: Material não existe mais no banco.');
        } else {
          console.log('❌ Erro: Material ainda existe no banco após exclusão!');
        }
        
      } catch (deleteError) {
        console.error('❌ Erro ao excluir material:', deleteError);
      }
    } else {
      console.log('💡 Para executar a exclusão real, execute:');
      console.log('   node scripts/test-specific-material-deletion.js --confirm-delete');
      console.log('\n⚠️ ATENÇÃO: Isso irá excluir permanentemente o material do banco!');
    }

    // Verificar se há outros materiais órfãos
    console.log('\n🔍 Verificando outros materiais com URL vazia...');
    console.log('================================================');
    
    const materialsWithEmptyUrl = await prisma.materialApoio.findMany({
      where: {
        OR: [
          { arquivoUrl: '' },
          { arquivoUrl: null }
        ]
      },
      select: {
        id: true,
        nome: true,
        arquivoUrl: true,
        createdAt: true
      }
    });

    if (materialsWithEmptyUrl.length > 0) {
      console.log(`⚠️ Encontrados ${materialsWithEmptyUrl.length} materiais com URL vazia:`);
      materialsWithEmptyUrl.forEach((mat, index) => {
        console.log(`${index + 1}. ${mat.nome} - ID: ${mat.id}`);
        console.log(`   URL: "${mat.arquivoUrl}"`);
        console.log(`   Criado: ${mat.createdAt}`);
      });
    } else {
      console.log('✅ Nenhum material com URL vazia encontrado.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpecificMaterialDeletion();