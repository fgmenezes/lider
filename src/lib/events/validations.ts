import { z } from "zod";

// Enums
export const EventTypeEnum = z.enum([
  "CELL",
  "LEADER_MEETING", 
  "WORSHIP",
  "WORKSHOP",
  "CANTEEN",
  "CAMP",
  "MISSION",
  "PLANNING",
  "TRAINING",
  "REGISTRATION"
]);

export const EventStatusEnum = z.enum([
  "PLANNED",
  "REGISTRATIONS_OPEN",
  "REGISTRATIONS_CLOSED", 
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
]);

export const ParticipationStatusEnum = z.enum([
  "CONFIRMED",
  "PENDING",
  "CANCELLED"
]);

export const RegistrationStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED"
]);

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "REFUNDED",
  "CANCELLED"
]);

export const EventFinanceTypeEnum = z.enum([
  "INCOME",
  "EXPENSE"
]);

// Schema base para endereço
export const AddressSchema = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP deve ter formato válido").optional(),
  street: z.string().min(1, "Rua é obrigatória").optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, "Estado deve ter 2 caracteres").optional(),
});

// Schema principal para criação de evento
export const CreateEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  description: z.string().optional(),
  type: EventTypeEnum,
  ministryId: z.string().cuid("ID do ministério inválido"),
  startDate: z.coerce.date().refine(date => date > new Date(), {
    message: "Data de início deve ser futura"
  }),
  endDate: z.coerce.date().optional(),
  maxParticipants: z.number().int().positive().optional(),
  registrationDeadline: z.coerce.date().optional(),
  specificData: z.record(z.any()).optional(),
}).merge(AddressSchema).refine(data => {
  if (data.endDate && data.startDate >= data.endDate) {
    return false;
  }
  return true;
}, {
  message: "Data de término deve ser posterior à data de início",
  path: ["endDate"]
}).refine(data => {
  if (data.registrationDeadline && data.registrationDeadline >= data.startDate) {
    return false;
  }
  return true;
}, {
  message: "Prazo de inscrição deve ser anterior à data de início",
  path: ["registrationDeadline"]
});

// Schema base para atualização de evento (sem validações)
const BaseUpdateEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo").optional(),
  description: z.string().optional(),
  type: EventTypeEnum.optional(),
  ministryId: z.string().cuid("ID do ministério inválido").optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  maxParticipants: z.number().int().positive().optional(),
  registrationDeadline: z.coerce.date().optional(),
  specificData: z.record(z.any()).optional(),
  // Campos de endereço
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP deve ter formato válido").optional(),
  street: z.string().min(1, "Rua é obrigatória").optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, "Estado deve ter 2 caracteres").optional(),
  // Campos específicos de update
  id: z.string().cuid("ID do evento inválido"),
  status: EventStatusEnum.optional(),
});

// Schema para atualização de evento com validações
export const UpdateEventSchema = BaseUpdateEventSchema.refine(data => {
  if (data.endDate && data.startDate && data.endDate <= data.startDate) {
    return false;
  }
  return true;
}, {
  message: "Data de término deve ser posterior à data de início",
  path: ["endDate"]
}).refine(data => {
  if (data.registrationDeadline && data.startDate && data.registrationDeadline >= data.startDate) {
    return false;
  }
  return true;
}, {
  message: "Prazo de inscrição deve ser anterior à data de início",
  path: ["registrationDeadline"]
});

// Schema para adicionar líder
export const AddEventLeaderSchema = z.object({
  eventId: z.string().cuid("ID do evento inválido"),
  userId: z.string().cuid("ID do usuário inválido"),
  role: z.string().min(1, "Função é obrigatória").default("LEADER"),
});

// Tipo inferido do schema
export type EventLeaderInput = z.infer<typeof AddEventLeaderSchema>;

// Schema para adicionar participante
export const AddEventParticipantSchema = z.object({
  eventId: z.string().cuid("ID do evento inválido"),
  userId: z.string().cuid("ID do usuário inválido").optional(),
  externalName: z.string().min(1, "Nome é obrigatório").optional(),
  externalEmail: z.string().email("Email inválido").optional(),
  status: ParticipationStatusEnum.default("CONFIRMED"),
  notes: z.string().optional(),
}).refine(data => {
  // Deve ter userId OU externalName
  return data.userId || data.externalName;
}, {
  message: "Deve informar um usuário ou nome externo",
  path: ["userId"]
});

// Tipo inferido do schema
export type EventParticipantInput = z.infer<typeof AddEventParticipantSchema>;

// Schema para atualizar participação
export const UpdateParticipationSchema = z.object({
  status: ParticipationStatusEnum.optional(),
  attended: z.boolean().optional(),
  notes: z.string().optional(),
});

// Schema para upload de material
export const UploadEventMaterialSchema = z.object({
  eventId: z.string().cuid("ID do evento inválido"),
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  description: z.string().optional(),
});

// Tipo inferido do schema
export type EventMaterialInput = z.infer<typeof UploadEventMaterialSchema>;

// Schema para registro financeiro
export const CreateEventFinanceSchema = z.object({
  eventId: z.string().cuid("ID do evento inválido"),
  type: EventFinanceTypeEnum,
  description: z.string().min(1, "Descrição é obrigatória").max(255, "Descrição muito longa"),
  amount: z.number().positive("Valor deve ser positivo"),
  date: z.coerce.date(),
});

// Tipo inferido do schema
export type EventFinanceInput = z.infer<typeof CreateEventFinanceSchema>;

// Schema para inscrição em evento
export const CreateEventRegistrationSchema = z.object({
  eventId: z.string().cuid("ID do evento inválido"),
  userId: z.string().cuid("ID do usuário inválido").optional(),
  externalName: z.string().min(1, "Nome é obrigatório").optional(),
  externalEmail: z.string().email("Email inválido").optional(),
  externalPhone: z.string().optional(),
  registrationData: z.record(z.any()).optional(),
  paymentAmount: z.number().positive().optional(),
  notes: z.string().optional(),
}).refine(data => {
  // Deve ter userId OU dados externos
  return data.userId || (data.externalName && data.externalEmail);
}, {
  message: "Deve informar um usuário ou dados externos completos",
  path: ["userId"]
});

// Schema para atualizar inscrição
export const UpdateEventRegistrationSchema = z.object({
  status: RegistrationStatusEnum.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  paymentAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

// Schema para feedback
export const CreateEventFeedbackSchema = z.object({
  eventId: z.string().cuid("ID do evento inválido"),
  userId: z.string().cuid("ID do usuário inválido").optional(),
  rating: z.number().int().min(1, "Avaliação mínima é 1").max(5, "Avaliação máxima é 5").optional(),
  comment: z.string().optional(),
  anonymous: z.boolean().default(false),
}).refine(data => {
  // Deve ter rating OU comment
  return data.rating || data.comment;
}, {
  message: "Deve informar uma avaliação ou comentário",
  path: ["rating"]
});

// Schema para filtros de listagem
export const EventFiltersSchema = z.object({
  ministryId: z.string().cuid().optional(),
  type: EventTypeEnum.optional(),
  status: EventStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Tipos inferidos dos schemas
export type EventFiltersInput = z.infer<typeof EventFiltersSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

// Schemas específicos por tipo de evento
export const CellEventDataSchema = z.object({
  theme: z.string().optional(),
  materials: z.array(z.string()).optional(),
  attendanceRequired: z.boolean().default(true),
  bibleReading: z.string().optional(),
});

export const WorkshopEventDataSchema = z.object({
  instructor: z.string().optional(),
  materials: z.array(z.string()).optional(),
  prerequisites: z.string().optional(),
  certificate: z.boolean().default(false),
  maxDuration: z.number().int().positive().optional(), // em minutos
});

export const WorshipEventDataSchema = z.object({
  program: z.array(z.object({
    time: z.string(),
    activity: z.string(),
    responsible: z.string().optional(),
  })).optional(),
  volunteers: z.array(z.object({
    role: z.string(),
    userId: z.string().cuid().optional(),
    name: z.string().optional(),
  })).optional(),
  equipment: z.array(z.string()).optional(),
});

export const CampEventDataSchema = z.object({
  accommodation: z.object({
    rooms: z.number().int().positive().optional(),
    bedsPerRoom: z.number().int().positive().optional(),
    totalBeds: z.number().int().positive().optional(),
  }).optional(),
  meals: z.array(z.object({
    date: z.string(),
    meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    menu: z.string(),
  })).optional(),
  activities: z.array(z.object({
    time: z.string(),
    activity: z.string(),
    location: z.string().optional(),
  })).optional(),
  packingList: z.array(z.string()).optional(),
});

// Função para validar dados específicos por tipo
export function validateSpecificData(type: string, data: any) {
  switch (type) {
    case "CELL":
      return CellEventDataSchema.parse(data);
    case "WORKSHOP":
      return WorkshopEventDataSchema.parse(data);
    case "WORSHIP":
      return WorshipEventDataSchema.parse(data);
    case "CAMP":
      return CampEventDataSchema.parse(data);
    default:
      return data; // Para tipos sem validação específica
  }
}