// Hooks principais de eventos
export * from './useEvents';

// Hooks de participantes
export * from './useEventParticipants';

// Hooks de líderes
export * from './useEventLeaders';

// Hooks de finanças
export * from './useEventFinance';

// Hooks de materiais
export * from './useEventMaterials';

// Re-exportar chaves de query para uso externo se necessário
export { eventKeys } from './useEvents';
export { participantKeys } from './useEventParticipants';
export { leaderKeys } from './useEventLeaders';
export { financeKeys } from './useEventFinance';
export { materialKeys } from './useEventMaterials';