// Tipos para o módulo de eventos
// Importando os enums do Prisma para manter consistência
import { 
  EventType as PrismaEventType, 
  EventStatus as PrismaEventStatus,
  ParticipationStatus,
  EventFinanceType,
  RegistrationStatus,
  PaymentStatus as PrismaPaymentStatus
} from '@prisma/client';

// Criando aliases de tipo para uso interno
export type EventType = PrismaEventType;
export type EventStatus = PrismaEventStatus;
export type PaymentStatus = PrismaPaymentStatus;

// Re-exportando outros enums
export { 
  ParticipationStatus,
  EventFinanceType,
  RegistrationStatus
};

// Enums específicos do frontend
export enum EventLeaderRole {
  LEADER = 'LEADER',
  CO_LEADER = 'CO_LEADER',
  ASSISTANT = 'ASSISTANT'
}

// Interfaces principais alinhadas com o schema do Prisma
export interface Event {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  ministryId: string;
  startDate: Date;
  endDate?: Date;
  maxParticipants?: number;
  registrationDeadline?: Date;
  
  // Endereço
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  
  // Dados específicos por tipo (JSON)
  specificData?: Record<string, any>;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
  
  // Relacionamentos
  ministry?: Ministry;
  leaders?: EventLeader[];
  participants?: EventParticipant[];
  smallGroups?: EventSmallGroup[];
  materials?: EventMaterial[];
  finances?: EventFinance[];
  registrations?: EventRegistration[];
  feedback?: EventFeedback[];
}

export interface EventLeader {
  id: string;
  eventId: string;
  userId: string;
  role: string;
  createdAt: Date;
  
  // Relacionamentos
  event?: Event;
  user?: User;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId?: string;
  externalName?: string;
  externalEmail?: string;
  externalPhone?: string;
  status: ParticipationStatus;
  attended: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relacionamentos
  event?: Event;
  user?: User;
}

export interface EventSmallGroup {
  id: string;
  eventId: string;
  smallGroupId: string;
  createdAt: Date;
  
  // Relacionamentos
  event?: Event;
  smallGroup?: SmallGroup;
}

export interface EventMaterial {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  fileUrl?: string;
  fileKey?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy: string;
  createdAt: Date;
  
  // Relacionamentos
  event?: Event;
  user?: User;
}

export interface EventFinance {
  id: string;
  eventId: string;
  type: EventFinanceType;
  description: string;
  amount: number;
  date: Date;
  createdBy: string;
  createdAt: Date;
  
  // Relacionamentos
  event?: Event;
  user?: User;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  externalName?: string;
  externalEmail?: string;
  externalPhone?: string;
  status: RegistrationStatus;
  registrationData?: Record<string, any>;
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relacionamentos
  event?: Event;
  user?: User;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  userId?: string;
  rating?: number; // 1-5
  comment?: string;
  anonymous: boolean;
  createdAt: Date;
  
  // Relacionamentos
  event?: Event;
  user?: User;
}

// Tipos para formulários de criação/edição
export interface CreateEventData {
  title: string;
  description?: string;
  type: EventType;
  ministryId: string;
  startDate: Date;
  endDate?: Date;
  maxParticipants?: number;
  registrationDeadline?: Date;
  
  // Endereço
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  
  // Dados específicos por tipo (JSON)
  specificData?: Record<string, any>;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
  status?: EventStatus;
}

// Tipos para filtros e busca
export interface EventFilters {
  ministryId?: string;
  type?: EventType;
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Tipos para dashboard e estatísticas
export interface EventStats {
  total: number;
  byStatus: Record<EventStatus, number>;
  byType: Record<EventType, number>;
  upcoming: number;
  thisMonth: number;
}

// Tipos para API responses
export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export interface EventResponse extends Event {
  userRegistration?: EventRegistration;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canManageParticipants: boolean;
    canManageLeaders: boolean;
    canUploadMaterials: boolean;
    canManageFinances: boolean;
    canManageRegistrations: boolean;
    canRegister: boolean;
    canProvideFeedback: boolean;
    canChangeStatus: boolean;
  };
}

// Tipos auxiliares para relacionamentos
export interface Ministry {
  id: string;
  name: string;
  churchId?: string;
  churchName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  celular?: string;
}

export interface SmallGroup {
  id: string;
  name: string;
  ministryId: string;
}