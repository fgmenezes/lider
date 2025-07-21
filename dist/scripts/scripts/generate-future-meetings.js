"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../src/lib/prisma");
const MONTHS_AHEAD = 3;
const freqMap = {
    'DIARIO': 1,
    'SEMANAL': 7,
    'QUINZENAL': 14,
    'MENSAL': 30,
};
const daysOfWeek = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const groups = yield prisma_1.prisma.smallGroup.findMany({
            where: {
                frequency: { not: null },
                dayOfWeek: { not: null },
                time: { not: null },
                startDate: { not: null },
            },
            include: { meetings: true },
        });
        const now = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + MONTHS_AHEAD);
        for (const group of groups) {
            const freqDays = freqMap[group.frequency] || 7;
            let lastMeeting = group.meetings
                .map(m => new Date(m.date))
                .sort((a, b) => b.getTime() - a.getTime())[0];
            let nextMeeting;
            if (lastMeeting && lastMeeting > now) {
                nextMeeting = new Date(lastMeeting);
                nextMeeting.setDate(nextMeeting.getDate() + freqDays);
            }
            else {
                // Começa do startDate ajustado para o dia da semana correto
                nextMeeting = new Date(group.startDate);
                if (group.frequency !== 'DIARIO') {
                    const targetDay = daysOfWeek.indexOf(group.dayOfWeek);
                    if (targetDay !== -1) {
                        let diff = targetDay - nextMeeting.getDay();
                        if (diff < 0)
                            diff += 7;
                        nextMeeting.setDate(nextMeeting.getDate() + diff);
                    }
                }
            }
            // Gera reuniões até o período desejado
            const meetingsToCreate = [];
            while (nextMeeting <= end) {
                // Define horário
                if (group.time) {
                    const [h, m] = group.time.split(':');
                    nextMeeting.setHours(Number(h), Number(m), 0, 0);
                }
                // Só cria se não existir reunião para essa data
                if (!group.meetings.some(m => new Date(m.date).getTime() === nextMeeting.getTime())) {
                    meetingsToCreate.push({
                        smallGroupId: group.id,
                        date: new Date(nextMeeting),
                        type: 'PG',
                    });
                }
                nextMeeting = new Date(nextMeeting);
                nextMeeting.setDate(nextMeeting.getDate() + freqDays);
            }
            if (meetingsToCreate.length > 0) {
                yield prisma_1.prisma.smallGroupMeeting.createMany({ data: meetingsToCreate });
                console.log(`Grupo ${group.name}: ${meetingsToCreate.length} reuniões criadas.`);
            }
        }
        console.log('Job concluído!');
    });
}
main().catch(e => {
    console.error(e);
    process.exit(1);
});
