import { EventType, EventStatus, ParticipationStatus, RegistrationStatus, PaymentStatus } from "@prisma/client";

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

// Mapeamento de status de participação para labels em português
export const PARTICIPATION_STATUS_LABELS: Record<ParticipationStatus, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendente",
  CANCELLED: "Cancelado"
};

// Mapeamento de status de inscrição para labels em português
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelado"
};

// Mapeamento de status de pagamento para labels em português
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
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

// Cores para status de participação
export const PARTICIPATION_STATUS_COLORS: Record<ParticipationStatus, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800"
};

// Cores para status de inscrição
export const REGISTRATION_STATUS_COLORS: Record<RegistrationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800"
};

// Cores para status de pagamento
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  REFUNDED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800"
};

// Função para formatar data e hora
export function formatEventDateTime(date: Date, includeTime: boolean = true): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime && {
      hour: "2-digit",
      minute: "2-digit",
    })
  };
  
  return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

// Função para formatar duração do evento
export function formatEventDuration(startDate: Date, endDate?: Date): string {
  if (!endDate) {
    return formatEventDateTime(startDate);
  }

  const start = formatEventDateTime(startDate);
  const end = formatEventDateTime(endDate);
  
  // Se for no mesmo dia, mostrar apenas as horas
  if (startDate.toDateString() === endDate.toDateString()) {
    const startTime = startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const endTime = endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const date = startDate.toLocaleDateString("pt-BR");
    return `${date} das ${startTime} às ${endTime}`;
  }
  
  return `${start} até ${end}`;
}

// Função para calcular dias restantes até o evento
export function getDaysUntilEvent(eventDate: Date): number {
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Função para verificar se evento está próximo (próximos 7 dias)
export function isEventSoon(eventDate: Date): boolean {
  const daysUntil = getDaysUntilEvent(eventDate);
  return daysUntil >= 0 && daysUntil <= 7;
}

// Função para verificar se evento já passou
export function isEventPast(eventDate: Date): boolean {
  return getDaysUntilEvent(eventDate) < 0;
}

// Função para gerar slug do evento
export function generateEventSlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .trim();
  
  return `${slug}-${id.slice(-8)}`;
}

// Função para validar se usuário pode se inscrever no evento
export function canUserRegister(
  event: {
    status: EventStatus;
    registrationDeadline?: Date | null;
    maxParticipants?: number | null;
    _count?: { registrations: number };
  },
  userRegistration?: { status: RegistrationStatus } | null
): { canRegister: boolean; reason?: string } {
  // Se já tem inscrição ativa
  if (userRegistration && userRegistration.status !== "CANCELLED") {
    return { canRegister: false, reason: "Você já está inscrito neste evento" };
  }

  // Se inscrições não estão abertas
  if (event.status !== "REGISTRATIONS_OPEN") {
    return { canRegister: false, reason: "Inscrições não estão abertas" };
  }

  // Se passou do prazo de inscrição
  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return { canRegister: false, reason: "Prazo de inscrição encerrado" };
  }

  // Se atingiu limite de participantes
  if (event.maxParticipants && event._count?.registrations && 
      event._count.registrations >= event.maxParticipants) {
    return { canRegister: false, reason: "Evento lotado" };
  }

  return { canRegister: true };
}

// Função para calcular estatísticas do evento
export function calculateEventStats(event: {
  participants: { attended: boolean; status: ParticipationStatus }[];
  registrations: { status: RegistrationStatus }[];
  feedback: { rating?: number | null }[];
}) {
  const totalParticipants = event.participants.length;
  const confirmedParticipants = event.participants.filter(p => p.status === "CONFIRMED").length;
  const attendedParticipants = event.participants.filter(p => p.attended).length;
  
  const totalRegistrations = event.registrations.length;
  const approvedRegistrations = event.registrations.filter(r => r.status === "APPROVED").length;
  const pendingRegistrations = event.registrations.filter(r => r.status === "PENDING").length;
  
  const feedbackWithRating = event.feedback.filter(f => f.rating !== null);
  const averageRating = feedbackWithRating.length > 0 
    ? feedbackWithRating.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackWithRating.length
    : null;

  const attendanceRate = confirmedParticipants > 0 
    ? (attendedParticipants / confirmedParticipants) * 100 
    : 0;

  return {
    participants: {
      total: totalParticipants,
      confirmed: confirmedParticipants,
      attended: attendedParticipants,
      attendanceRate: Math.round(attendanceRate)
    },
    registrations: {
      total: totalRegistrations,
      approved: approvedRegistrations,
      pending: pendingRegistrations
    },
    feedback: {
      total: event.feedback.length,
      withRating: feedbackWithRating.length,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null
    }
  };
}

// Função para formatar endereço completo
export function formatEventAddress(event: {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
}): string {
  const parts = [];
  
  if (event.street) {
    let address = event.street;
    if (event.number) address += `, ${event.number}`;
    if (event.complement) address += `, ${event.complement}`;
    parts.push(address);
  }
  
  if (event.neighborhood) parts.push(event.neighborhood);
  if (event.city && event.state) parts.push(`${event.city}/${event.state}`);
  if (event.cep) parts.push(`CEP: ${event.cep}`);
  
  return parts.join(" - ");
}

// Função para gerar link do Google Maps
export function generateMapsLink(event: {
  street?: string | null;
  number?: string | null;
  city?: string | null;
  state?: string | null;
}): string | null {
  if (!event.street || !event.city) return null;
  
  const address = `${event.street}${event.number ? `, ${event.number}` : ""}, ${event.city}, ${event.state || ""}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Função para validar campos obrigatórios por tipo de evento
export function getRequiredFieldsByEventType(type: EventType): string[] {
  const baseFields = ["title", "startDate", "ministryId"];
  
  switch (type) {
    case "CELL":
      return [...baseFields, "description"];
    case "WORKSHOP":
      return [...baseFields, "description", "maxParticipants"];
    case "CAMP":
      return [...baseFields, "endDate", "maxParticipants", "registrationDeadline"];
    case "REGISTRATION":
      return [...baseFields, "registrationDeadline"];
    default:
      return baseFields;
  }
}

// Função para obter configurações padrão por tipo de evento
export function getDefaultEventConfig(type: EventType) {
  switch (type) {
    case "CELL":
      return {
        maxParticipants: null,
        registrationDeadline: null,
        status: "PLANNED" as EventStatus
      };
    case "WORKSHOP":
      return {
        maxParticipants: 30,
        registrationDeadline: null,
        status: "REGISTRATIONS_OPEN" as EventStatus
      };
    case "CAMP":
      return {
        maxParticipants: 50,
        status: "REGISTRATIONS_OPEN" as EventStatus
      };
    case "REGISTRATION":
      return {
        maxParticipants: null,
        status: "REGISTRATIONS_OPEN" as EventStatus
      };
    default:
      return {
        maxParticipants: null,
        registrationDeadline: null,
        status: "PLANNED" as EventStatus
      };
  }
}