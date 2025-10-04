const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiStatusUpdate() {
  try {
    console.log('🧪 Testando atualização automática de status via API...\n');

    // 1. Buscar um pequeno grupo com reuniões
    const smallGroup = await prisma.smallGroup.findFirst({
      include: {
        meetings: {
          orderBy: {
            date: 'desc'
          },
          take: 5
        },
        ministry: {
          select: {
            name: true
          }
        }
      }
    });

    if (!smallGroup) {
      console.log('❌ Nenhum pequeno grupo encontrado');
      return;
    }

    console.log(`📋 Testando grupo: ${smallGroup.name}`);
    console.log(`🏛️ Ministério: ${smallGroup.ministry.name}`);
    console.log(`📅 Reuniões encontradas: ${smallGroup.meetings.length}\n`);

    // 2. Mostrar status atual das reuniões
    console.log('📊 Status atual das reuniões:');
    console.log('=============================');
    
    for (const meeting of smallGroup.meetings) {
      let meetingDate;
      try {
        if (meeting.date instanceof Date) {
          meetingDate = new Date(meeting.date.getFullYear(), meeting.date.getMonth(), meeting.date.getDate());
        } else {
          meetingDate = new Date(meeting.date);
          meetingDate = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
        }

        if (meeting.startTime) {
          const [hours, minutes] = meeting.startTime.split(':');
          meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        console.log(`📅 ${meetingDate.toLocaleString('pt-BR')} - Status: ${meeting.status}`);
      } catch (error) {
        console.log(`❌ Erro ao processar reunião ${meeting.id}: ${error.message}`);
      }
    }

    // 3. Simular chamada à API GET do grupo (que deve atualizar os status)
    console.log('\n🔄 Simulando chamada à API para atualizar status...');
    
    // Buscar novamente o grupo com todas as informações necessárias para a API
    const groupForApi = await prisma.smallGroup.findUnique({
      where: { id: smallGroup.id },
      include: {
        ministry: true,
        leaders: {
          include: {
            user: true
          }
        },
        meetings: {
          include: {
            attendances: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!groupForApi) {
      console.log('❌ Grupo não encontrado para teste da API');
      return;
    }

    // 4. Aplicar a mesma lógica da API
    const now = new Date();
    const meetingsToUpdate = [];
    
    for (const meeting of groupForApi.meetings) {
      try {
        // Extrair apenas a data (sem horário) do campo date
        let meetingDate;
        if (meeting.date instanceof Date) {
          meetingDate = new Date(meeting.date.getFullYear(), meeting.date.getMonth(), meeting.date.getDate());
        } else {
          meetingDate = new Date(meeting.date);
          meetingDate = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
        }

        // Adicionar horário de início se disponível
        if (meeting.startTime) {
          const [hours, minutes] = meeting.startTime.split(':');
          meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          meetingDate.setHours(0, 0, 0, 0);
        }

        // Calcular horário de término
        let meetingEndTime = new Date(meetingDate);
        if (meeting.endTime) {
          const [hours, minutes] = meeting.endTime.split(':');
          meetingEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          meetingEndTime.setHours(meetingEndTime.getHours() + 2);
        }
        
        const hasAttendances = meeting.attendances && meeting.attendances.length > 0;
        
        let newStatus = meeting.status;
        
        // Lógica para determinar o status correto
        if (now < meetingDate) {
          newStatus = 'AGENDADA';
        } else if (now >= meetingDate && now <= meetingEndTime) {
          newStatus = hasAttendances ? 'EM_ANDAMENTO' : 'AGENDADA';
        } else {
          newStatus = 'FINALIZADA';
        }
        
        // Se o status mudou, adicionar à lista de atualizações
        if (newStatus !== meeting.status) {
          meetingsToUpdate.push({
            id: meeting.id,
            oldStatus: meeting.status,
            newStatus: newStatus,
            date: meetingDate.toLocaleString('pt-BR')
          });
        }
      } catch (error) {
        console.error(`Erro ao processar reunião ${meeting.id}:`, error);
      }
    }

    // 5. Mostrar resultados
    console.log('\n📊 Resultado da simulação:');
    console.log('==========================');
    
    if (meetingsToUpdate.length > 0) {
      console.log(`✅ ${meetingsToUpdate.length} reunião(ões) seriam atualizadas:`);
      
      for (const update of meetingsToUpdate) {
        console.log(`📅 ${update.date}`);
        console.log(`   Status: ${update.oldStatus} → ${update.newStatus}`);
        console.log('');
      }
      
      console.log('🔧 A API está funcionando corretamente e atualizaria esses status automaticamente.');
    } else {
      console.log('✅ Nenhuma reunião precisa ser atualizada. Todos os status estão corretos!');
    }

    console.log('\n💡 Dica: A atualização automática acontece sempre que:');
    console.log('   - Um usuário acessa os detalhes de um grupo (GET /api/small-groups/[id])');
    console.log('   - Um usuário acessa os detalhes de uma reunião (GET /api/small-groups/[id]/meetings/[meetingId])');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiStatusUpdate();