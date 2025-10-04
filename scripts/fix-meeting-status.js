const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMeetingStatus() {
  try {
    console.log('🔧 Iniciando correção do status das reuniões...\n');

    const now = new Date();
    console.log(`⏰ Data/hora atual: ${now.toLocaleString('pt-BR')}\n`);

    // Buscar todas as reuniões que precisam ter o status atualizado
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
        },
        attendances: true
      }
    });

    console.log(`📊 Total de reuniões encontradas: ${meetings.length}\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const meeting of meetings) {
      try {
        // Extrair apenas a data (sem horário) do campo date
        let meetingDate;
        if (meeting.date instanceof Date) {
          // Se já é um objeto Date, usar apenas a parte da data
          meetingDate = new Date(meeting.date.getFullYear(), meeting.date.getMonth(), meeting.date.getDate());
        } else {
          // Se é string, converter
          meetingDate = new Date(meeting.date);
          meetingDate = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
        }

        // Adicionar horário de início se disponível
        if (meeting.startTime) {
          const [hours, minutes] = meeting.startTime.split(':');
          meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          // Se não tem horário, assumir 00:00
          meetingDate.setHours(0, 0, 0, 0);
        }

        // Calcular horário de término
        let meetingEndTime = new Date(meetingDate);
        if (meeting.endTime) {
          const [hours, minutes] = meeting.endTime.split(':');
          meetingEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          // Se não tem horário de fim, assumir 2 horas após o início
          meetingEndTime.setHours(meetingEndTime.getHours() + 2);
        }

        // Determinar status correto
        let newStatus = meeting.status;
        const hasAttendances = meeting.attendances && meeting.attendances.length > 0;

        if (now < meetingDate) {
          // Reunião futura
          newStatus = 'AGENDADA';
        } else if (now >= meetingDate && now <= meetingEndTime) {
          // Reunião em andamento
          newStatus = hasAttendances ? 'EM_ANDAMENTO' : 'AGENDADA';
        } else {
          // Reunião passada
          newStatus = 'FINALIZADA';
        }

        // Atualizar apenas se o status mudou
        if (newStatus !== meeting.status) {
          await prisma.smallGroupMeeting.update({
            where: { id: meeting.id },
            data: { status: newStatus }
          });

          console.log(`✅ Atualizado: ${meeting.smallGroup.name}`);
          console.log(`   Data: ${meetingDate.toLocaleString('pt-BR')}`);
          console.log(`   Status: ${meeting.status} → ${newStatus}`);
          console.log('');

          updatedCount++;
        }

      } catch (error) {
        console.error(`❌ Erro ao processar reunião ${meeting.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da correção:');
    console.log(`✅ Reuniões atualizadas: ${updatedCount}`);
    console.log(`❌ Erros encontrados: ${errorCount}`);
    console.log(`📋 Total processadas: ${meetings.length}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Correção concluída com sucesso!');
    } else {
      console.log('\n✅ Nenhuma reunião precisava ser atualizada.');
    }

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMeetingStatus();