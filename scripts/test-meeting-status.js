const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMeetingStatus() {
  try {
    console.log('🔍 Testando status de reuniões em pequenos grupos...\n');

    // 1. Buscar um pequeno grupo existente
    const smallGroup = await prisma.smallGroup.findFirst({
      include: {
        meetings: {
          orderBy: {
            date: 'desc'
          },
          take: 10
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

    console.log(`📋 Grupo: ${smallGroup.name}`);
    console.log(`🏛️ Ministério: ${smallGroup.ministry.name}`);
    console.log(`📅 Total de reuniões: ${smallGroup.meetings.length}\n`);

    // 2. Analisar status das reuniões
    const now = new Date();
    console.log(`⏰ Data/hora atual: ${now.toLocaleString('pt-BR')}\n`);

    console.log('📊 Status das reuniões:');
    console.log('========================');

    for (const meeting of smallGroup.meetings) {
      const meetingDate = new Date(meeting.date + 'T' + (meeting.startTime || '00:00:00'));
      
      // Calcular data de término
      let meetingEndTime;
      if (meeting.endTime) {
        meetingEndTime = new Date(meeting.date + 'T' + meeting.endTime);
      } else {
        meetingEndTime = new Date(meetingDate.getTime() + 2 * 60 * 60 * 1000);
      }

      // Determinar status esperado
      let expectedStatus;
      if (now < meetingDate) {
        expectedStatus = 'AGENDADA';
      } else if (now >= meetingDate && now <= meetingEndTime) {
        expectedStatus = 'AGENDADA'; // ou EM_ANDAMENTO se tiver presenças
      } else {
        expectedStatus = 'FINALIZADA';
      }

      const statusMatch = meeting.status === expectedStatus ? '✅' : '❌';
      
      console.log(`${statusMatch} ${meetingDate.toLocaleDateString('pt-BR')} ${meeting.startTime || 'sem horário'}`);
      console.log(`   Status atual: ${meeting.status}`);
      console.log(`   Status esperado: ${expectedStatus}`);
      console.log(`   Tema: ${meeting.theme || 'Sem tema'}`);
      console.log('');
    }

    // 3. Verificar reuniões que deveriam estar finalizadas mas não estão
    const problematicMeetings = smallGroup.meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date + 'T' + (meeting.startTime || '00:00:00'));
      let meetingEndTime;
      if (meeting.endTime) {
        meetingEndTime = new Date(meeting.date + 'T' + meeting.endTime);
      } else {
        meetingEndTime = new Date(meetingDate.getTime() + 2 * 60 * 60 * 1000);
      }
      
      return now > meetingEndTime && meeting.status !== 'FINALIZADA';
    });

    if (problematicMeetings.length > 0) {
      console.log('🚨 PROBLEMA IDENTIFICADO:');
      console.log(`${problematicMeetings.length} reunião(ões) que deveria(m) estar finalizada(s):`);
      
      for (const meeting of problematicMeetings) {
        const meetingDate = new Date(meeting.date + 'T' + (meeting.startTime || '00:00:00'));
        console.log(`- ${meetingDate.toLocaleString('pt-BR')} - Status: ${meeting.status}`);
      }
    } else {
      console.log('✅ Todos os status estão corretos!');
    }

    // 4. Testar criação de novo pequeno grupo
    console.log('\n🧪 Testando criação de novo pequeno grupo...');
    
    // Buscar um ministério para usar no teste
    const ministry = await prisma.ministry.findFirst();
    if (!ministry) {
      console.log('❌ Nenhum ministério encontrado para teste');
      return;
    }

    // Criar data de início para amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = tomorrow.toISOString().split('T')[0];

    console.log(`📅 Data de início do teste: ${startDate}`);
    console.log(`🏛️ Ministério de teste: ${ministry.name}`);

    // Simular dados de criação de grupo
    const testGroupData = {
      name: `Grupo Teste - ${Date.now()}`,
      description: 'Grupo criado para teste de status de reuniões',
      dayOfWeek: 'QUARTA',
      frequency: 'SEMANAL',
      time: '19:30',
      endTime: '21:30',
      startDate: startDate,
      hostName: 'Host Teste',
      hostPhone: '(11) 99999-9999',
      cep: '01234-567',
      rua: 'Rua Teste',
      numero: '123',
      bairro: 'Bairro Teste',
      municipio: 'São Paulo',
      estado: 'SP',
      ministryId: ministry.id
    };

    console.log('\n📝 Dados do grupo de teste:');
    console.log(JSON.stringify(testGroupData, null, 2));

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMeetingStatus();