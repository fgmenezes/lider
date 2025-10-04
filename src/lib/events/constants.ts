import { EventType, EventStatus } from '@prisma/client';

// Mapeamento de tipos de eventos para labels em português
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CELL: "Célula/Pequeno Grupo",
  LEADER_MEETING: "Reunião de Líderes",
  WORSHIP: "Culto/Encontrão",
  WORKSHOP: "Workshop/Palestra",
  CANTEEN: "Cantina/Bazar",
  CAMP: "Acampamento/Retiro",
  MISSION: "Projeto Missionário/Social",
  PLANNING: "Planejamento Ministerial",
  TRAINING: "Treinamento Interno",
  REGISTRATION: "Inscrições e Cadastros"
};

// Mapeamento de status de eventos para labels em português
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  PLANNED: "Planejado",
  REGISTRATIONS_OPEN: "Inscrições Abertas",
  REGISTRATIONS_CLOSED: "Inscrições Encerradas",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado"
};

// Cores para status de eventos
export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  PLANNED: "bg-gray-100 text-gray-800",
  REGISTRATIONS_OPEN: "bg-green-100 text-green-800",
  REGISTRATIONS_CLOSED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800"
};

// Cores para tipos de eventos
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  CELL: "bg-blue-100 text-blue-800",
  LEADER_MEETING: "bg-purple-100 text-purple-800",
  WORSHIP: "bg-yellow-100 text-yellow-800",
  WORKSHOP: "bg-green-100 text-green-800",
  CANTEEN: "bg-orange-100 text-orange-800",
  CAMP: "bg-indigo-100 text-indigo-800",
  MISSION: "bg-pink-100 text-pink-800",
  PLANNING: "bg-gray-100 text-gray-800",
  TRAINING: "bg-teal-100 text-teal-800",
  REGISTRATION: "bg-cyan-100 text-cyan-800"
};

// Ícones para tipos de eventos (usando Lucide React)
export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  CELL: "Users",
  LEADER_MEETING: "UserCheck",
  WORSHIP: "Music",
  WORKSHOP: "GraduationCap",
  CANTEEN: "Coffee",
  CAMP: "Tent",
  MISSION: "Heart",
  PLANNING: "Calendar",
  TRAINING: "BookOpen",
  REGISTRATION: "ClipboardList"
};

// Configurações padrão por tipo de evento
export const EVENT_TYPE_DEFAULTS = {
  CELL: {
    maxParticipants: null,
    registrationDeadline: null,
    status: "PLANNED" as EventStatus
  },
  LEADER_MEETING: {
    maxParticipants: null,
    registrationDeadline: null,
    status: "PLANNED" as EventStatus
  },
  WORSHIP: {
    maxParticipants: null,
    registrationDeadline: null,
    status: "PLANNED" as EventStatus
  },
  WORKSHOP: {
    maxParticipants: 30,
    registrationDeadline: null,
    status: "REGISTRATIONS_OPEN" as EventStatus
  },
  CANTEEN: {
    maxParticipants: null,
    registrationDeadline: null,
    status: "PLANNED" as EventStatus
  },
  CAMP: {
    maxParticipants: 50,
    status: "REGISTRATIONS_OPEN" as EventStatus
  },
  MISSION: {
    maxParticipants: null,
    registrationDeadline: null,
    status: "PLANNED" as EventStatus
  },
  PLANNING: {
    maxParticipants: null,
    registrationDeadline: null,
    status: "PLANNED" as EventStatus
  },
  TRAINING: {
    maxParticipants: 20,
    registrationDeadline: null,
    status: "REGISTRATIONS_OPEN" as EventStatus
  },
  REGISTRATION: {
    maxParticipants: null,
    status: "REGISTRATIONS_OPEN" as EventStatus
  }
};

// Campos obrigatórios por tipo de evento
export const REQUIRED_FIELDS_BY_TYPE: Record<EventType, string[]> = {
  CELL: ["title", "startDate", "ministryId"],
  LEADER_MEETING: ["title", "startDate", "ministryId"],
  WORSHIP: ["title", "startDate", "ministryId"],
  WORKSHOP: ["title", "startDate", "ministryId", "description", "maxParticipants"],
  CANTEEN: ["title", "startDate", "ministryId"],
  CAMP: ["title", "startDate", "endDate", "ministryId", "maxParticipants", "registrationDeadline"],
  MISSION: ["title", "startDate", "ministryId", "description"],
  PLANNING: ["title", "startDate", "ministryId"],
  TRAINING: ["title", "startDate", "ministryId", "description", "maxParticipants"],
  REGISTRATION: ["title", "startDate", "ministryId", "registrationDeadline"]
};