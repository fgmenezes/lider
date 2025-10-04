const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMeetingDates() {
  try {
    console.log('🔍 Verificando datas das reuniões no banco de dados...\n');

    // Buscar todas as reuniões com problemas de data
    const meetings = await prisma.smallGroupMeeting.findMany({
      include: {
        smallGroup: {
          select: {
            name: true,
            ministry: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log(`📊 Total de reuniões encontradas: ${meetings.length}\n`);

    console.log('📅 Análise das datas:');
    console.log('====================');

    let problematicCount = 0;
    const now = new Date();

    for (const meeting of meetings) {
      console.log(`\n🆔 ID: ${meeting.id}`);
      console.log(`📋 Grupo: ${meeting.smallGroup.name}`);
      console.log(`🏛️ Ministério: ${meeting.smallGroup.ministry.name}`);
      console.log(`📅 Data bruta: ${meeting.date}`);
      console.log(`🕐 Horário início: ${meeting.startTime || 'não definido'}`);
      console.log(`🕐 Horário fim: ${meeting.endTime || 'não definido'}`);
      console.log(`📊 Status: ${meeting.status}`);
      
      // Tentar converter a data
      let meetingDate;
      try {
        if (meeting.startTime) {
          meetingDate = new Date(meeting.date + 'T' + meeting.startTime);
        } else {
          meetingDate = new Date(meeting.date);
        }
        
        if (isNaN(meetingDate.getTime())) {
          console.log('❌ Data inválida!');
          problematicCount++;
        } else {
          console.log(`✅ Data convertida: ${meetingDate.toLocaleString('pt-BR')}`);
          
          // Verificar se o status está correto
          const isPast = now > meetingDate;
          const shouldBeFinalized = isPast && meeting.status !== 'FINALIZADA' && meeting.status !== 'CANCELADA';
          
          if (shouldBeFinalized) {
            console.log(`⚠️ PROBLEMA: Reunião passada com status ${meeting.status} (deveria ser FINALIZADA)`);
            problematicCount++;
          }
        }
      } catch (error) {
        console.log(`❌ Erro ao converter data: ${error.message}`);
        problematicCount++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`Total de reuniões analisadas: ${meetings.length}`);
    console.log(`Reuniões com problemas: ${problematicCount}`);

    if (problematicCount > 0) {
      console.log('\n🔧 Sugestões de correção:');
      console.log('1. Verificar formato das datas no banco');
      console.log('2. Executar script de correção de status');
      console.log('3. Verificar lógica de criação de reuniões');
    }

    // Verificar tipos de dados no banco
    console.log('\n🔍 Verificando estrutura da tabela...');
    const sampleMeeting = meetings[0];
    if (sampleMeeting) {
      console.log('Tipos de dados encontrados:');
      console.log(`- date: ${typeof sampleMeeting.date} (${sampleMeeting.date})`);
      console.log(`- startTime: ${typeof sampleMeeting.startTime} (${sampleMeeting.startTime})`);
      console.log(`- endTime: ${typeof sampleMeeting.endTime} (${sampleMeeting.endTime})`);
      console.log(`- status: ${typeof sampleMeeting.status} (${sampleMeeting.status})`);
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMeetingDates();