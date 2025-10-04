const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMaterialApoio() {
  try {
    console.log('🔍 Verificando material de apoio "Estudo teste 24092025"...\n');

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
            email: true
          }
        },
        ministry: {
          select: {
            name: true
          }
        },
        smallGroup: {
          select: {
            name: true
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

    if (material) {
      console.log('📄 Material encontrado no banco de dados:');
      console.log('ID:', material.id);
      console.log('Nome:', material.nome);
      console.log('Descrição:', material.descricao || 'N/A');
      console.log('Arquivo URL:', material.arquivoUrl);
      console.log('Usuário:', material.usuario.name, '(' + material.usuario.email + ')');
      console.log('Ministério:', material.ministry?.name || 'N/A');
      console.log('Pequeno Grupo:', material.smallGroup?.name || 'N/A');
      console.log('Data da Reunião:', material.meeting.date);
      console.log('Horário:', material.meeting.startTime);
      console.log('Criado em:', material.createdAt);
      console.log('Atualizado em:', material.updatedAt);
      console.log('\n❌ PROBLEMA: Material ainda existe no banco de dados!\n');
    } else {
      console.log('✅ Material não encontrado no banco de dados.\n');
    }

    // Buscar todos os materiais do grupo "teste 24092025"
    console.log('🔍 Buscando todos os materiais do grupo "teste 24092025"...\n');
    
    const grupoMateriais = await prisma.materialApoio.findMany({
      where: {
        smallGroup: {
          name: {
            contains: 'teste 24092025',
            mode: 'insensitive'
          }
        }
      },
      include: {
        usuario: {
          select: {
            name: true
          }
        },
        smallGroup: {
          select: {
            name: true
          }
        },
        meeting: {
          select: {
            date: true
          }
        }
      }
    });

    if (grupoMateriais.length > 0) {
      console.log(`📚 Encontrados ${grupoMateriais.length} materiais no grupo:`);
      grupoMateriais.forEach((mat, index) => {
        console.log(`${index + 1}. ${mat.nome} - ${mat.arquivoUrl}`);
        console.log(`   Usuário: ${mat.usuario.name}`);
        console.log(`   Grupo: ${mat.smallGroup?.name}`);
        console.log(`   Data: ${mat.meeting.date}`);
        console.log(`   ID: ${mat.id}\n`);
      });
    } else {
      console.log('✅ Nenhum material encontrado no grupo.\n');
    }

    // Buscar materiais do ministério "homens de deus"
    console.log('🔍 Buscando materiais do ministério "homens de deus"...\n');
    
    const ministerioMateriais = await prisma.materialApoio.findMany({
      where: {
        ministry: {
          name: {
            contains: 'homens de deus',
            mode: 'insensitive'
          }
        }
      },
      include: {
        usuario: {
          select: {
            name: true
          }
        },
        ministry: {
          select: {
            name: true
          }
        },
        smallGroup: {
          select: {
            name: true
          }
        }
      }
    });

    if (ministerioMateriais.length > 0) {
      console.log(`📚 Encontrados ${ministerioMateriais.length} materiais no ministério:`);
      ministerioMateriais.forEach((mat, index) => {
        console.log(`${index + 1}. ${mat.nome} - ${mat.arquivoUrl}`);
        console.log(`   Ministério: ${mat.ministry?.name}`);
        console.log(`   Grupo: ${mat.smallGroup?.name}`);
        console.log(`   ID: ${mat.id}\n`);
      });
    } else {
      console.log('✅ Nenhum material encontrado no ministério.\n');
    }

    // Mostrar detalhes do material encontrado para análise
    if (grupoMateriais.length > 0) {
      console.log('📋 Detalhes completos do material encontrado:');
      const mat = grupoMateriais[0];
      console.log('- ID:', mat.id);
      console.log('- Nome:', JSON.stringify(mat.nome));
      console.log('- Arquivo URL:', mat.arquivoUrl);
      console.log('- Meeting ID:', mat.meetingId);
      console.log('- Usuario ID:', mat.usuarioId);
      console.log('- Ministry ID:', mat.ministerioId);
      console.log('- SmallGroup ID:', mat.smallGroupId);
      console.log('- Criado em:', mat.createdAt);
      console.log('- Atualizado em:', mat.updatedAt);
      console.log('\n❌ PROBLEMA CONFIRMADO: Material ainda existe no banco!\n');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar material de apoio:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMaterialApoio();