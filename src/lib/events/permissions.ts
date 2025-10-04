import { Role } from "@prisma/client";

export interface EventPermissionContext {
  userId: string;
  userRole: Role;
  userMinistryIds: string[];
  masterMinistryId?: string;
  eventMinistryId?: string;
  eventLeaderIds?: string[];
  isEventLeader?: boolean;
}

export class EventPermissions {
  private context: EventPermissionContext;

  constructor(context: EventPermissionContext) {
    this.context = context;
  }

  // Verificar se pode visualizar eventos
  canViewEvents(): boolean {
    // ADMIN pode ver todos os eventos
    if (this.context.userRole === "ADMIN") {
      return true;
    }

    // MASTER pode ver eventos do ministério que gerencia
    if (this.context.userRole === "MASTER" && this.context.masterMinistryId) {
      return true;
    }

    // LEADER pode ver eventos dos ministérios que participa
    if (this.context.userRole === "LEADER" && this.context.userMinistryIds.length > 0) {
      return true;
    }

    return false;
  }

  // Verificar se pode visualizar um evento específico
  canViewEvent(): boolean {
    if (!this.canViewEvents()) {
      return false;
    }

    // ADMIN pode ver qualquer evento
    if (this.context.userRole === "ADMIN") {
      return true;
    }

    // MASTER pode ver eventos do ministério que gerencia
    if (this.context.userRole === "MASTER" && 
        this.context.masterMinistryId === this.context.eventMinistryId) {
      return true;
    }

    // LEADER pode ver eventos dos ministérios que participa
    if (this.context.userRole === "LEADER" && 
        this.context.eventMinistryId &&
        this.context.userMinistryIds.includes(this.context.eventMinistryId)) {
      return true;
    }

    return false;
  }

  // Verificar se pode criar eventos
  canCreateEvents(): boolean {
    // ADMIN pode criar eventos em qualquer ministério
    if (this.context.userRole === "ADMIN") {
      return true;
    }

    // MASTER pode criar eventos no ministério que gerencia
    if (this.context.userRole === "MASTER" && this.context.masterMinistryId) {
      return true;
    }

    // LEADER pode criar eventos nos ministérios que participa
    if (this.context.userRole === "LEADER" && this.context.userMinistryIds.length > 0) {
      return true;
    }

    return false;
  }

  // Verificar se pode criar evento em um ministério específico
  canCreateEventInMinistry(ministryId: string): boolean {
    if (!this.canCreateEvents()) {
      return false;
    }

    // ADMIN pode criar em qualquer ministério
    if (this.context.userRole === "ADMIN") {
      return true;
    }

    // MASTER pode criar no ministério que gerencia
    if (this.context.userRole === "MASTER" && 
        this.context.masterMinistryId === ministryId) {
      return true;
    }

    // LEADER pode criar nos ministérios que participa
    if (this.context.userRole === "LEADER" && 
        this.context.userMinistryIds.includes(ministryId)) {
      return true;
    }

    return false;
  }

  // Verificar se pode editar um evento
  canEditEvent(): boolean {
    // ADMIN pode editar qualquer evento
    if (this.context.userRole === "ADMIN") {
      return true;
    }

    // MASTER pode editar eventos do ministério que gerencia
    if (this.context.userRole === "MASTER" && 
        this.context.masterMinistryId === this.context.eventMinistryId) {
      return true;
    }

    // LEADER pode editar se for líder do evento
    if (this.context.userRole === "LEADER" && this.context.isEventLeader) {
      return true;
    }

    return false;
  }

  // Verificar se pode excluir um evento
  canDeleteEvent(): boolean {
    // ADMIN pode excluir qualquer evento
    if (this.context.userRole === "ADMIN") {
      return true;
    }

    // MASTER pode excluir eventos do ministério que gerencia
    if (this.context.userRole === "MASTER" && 
        this.context.masterMinistryId === this.context.eventMinistryId) {
      return true;
    }

    // LEADER não pode excluir eventos (apenas ADMIN e MASTER)
    return false;
  }

  // Verificar se pode gerenciar participantes
  canManageParticipants(): boolean {
    return this.canEditEvent();
  }

  // Verificar se pode gerenciar líderes do evento
  canManageEventLeaders(): boolean {
    // ADMIN pode gerenciar líderes de qualquer evento
    if (this.context.userRole === "ADMIN") {
      return true;
    }

    // MASTER pode gerenciar líderes de eventos do ministério que gerencia
    if (this.context.userRole === "MASTER" && 
        this.context.masterMinistryId === this.context.eventMinistryId) {
      return true;
    }

    // LEADER não pode gerenciar outros líderes
    return false;
  }

  // Verificar se pode fazer upload de materiais
  canUploadMaterials(): boolean {
    return this.canEditEvent();
  }

  // Verificar se pode gerenciar finanças do evento
  canManageEventFinances(): boolean {
    return this.canEditEvent();
  }

  // Verificar se pode aprovar/rejeitar inscrições
  canManageRegistrations(): boolean {
    return this.canEditEvent();
  }

  // Verificar se pode visualizar feedback
  canViewFeedback(): boolean {
    return this.canViewEvent();
  }

  // Verificar se pode se inscrever em um evento
  canRegisterForEvent(): boolean {
    // Qualquer usuário pode se inscrever se o evento permitir
    return this.canViewEvent();
  }

  // Verificar se pode dar feedback
  canProvideFeedback(): boolean {
    // Qualquer usuário que pode ver o evento pode dar feedback
    return this.canViewEvent();
  }

  // Verificar se pode alterar status do evento
  canChangeEventStatus(): boolean {
    return this.canEditEvent();
  }

  // Verificar se pode visualizar relatórios/estatísticas
  canViewEventStats(): boolean {
    // ADMIN pode ver estatísticas de todos os eventos
    if (this.context.userRole === "ADMIN") {
      return true;
    }

    // MASTER pode ver estatísticas do ministério que gerencia
    if (this.context.userRole === "MASTER" && this.context.masterMinistryId) {
      return true;
    }

    // LEADER pode ver estatísticas dos eventos que lidera
    if (this.context.userRole === "LEADER" && this.context.isEventLeader) {
      return true;
    }

    return false;
  }

  // Obter ministérios onde pode criar eventos
  getMinistryIdsForEventCreation(): string[] {
    if (this.context.userRole === "ADMIN") {
      // ADMIN pode criar em qualquer ministério (retorna vazio para indicar "todos")
      return [];
    }

    if (this.context.userRole === "MASTER" && this.context.masterMinistryId) {
      return [this.context.masterMinistryId];
    }

    if (this.context.userRole === "LEADER") {
      return this.context.userMinistryIds;
    }

    return [];
  }

  // Verificar se tem permissão específica baseada no contexto
  hasPermission(permission: EventPermissionType): boolean {
    switch (permission) {
      case "VIEW_EVENTS":
        return this.canViewEvents();
      case "VIEW_EVENT":
        return this.canViewEvent();
      case "CREATE_EVENTS":
        return this.canCreateEvents();
      case "EDIT_EVENT":
        return this.canEditEvent();
      case "DELETE_EVENT":
        return this.canDeleteEvent();
      case "MANAGE_PARTICIPANTS":
        return this.canManageParticipants();
      case "MANAGE_LEADERS":
        return this.canManageEventLeaders();
      case "UPLOAD_MATERIALS":
        return this.canUploadMaterials();
      case "MANAGE_FINANCES":
        return this.canManageEventFinances();
      case "MANAGE_REGISTRATIONS":
        return this.canManageRegistrations();
      case "VIEW_FEEDBACK":
        return this.canViewFeedback();
      case "REGISTER_FOR_EVENT":
        return this.canRegisterForEvent();
      case "PROVIDE_FEEDBACK":
        return this.canProvideFeedback();
      case "CHANGE_STATUS":
        return this.canChangeEventStatus();
      case "VIEW_STATS":
        return this.canViewEventStats();
      default:
        return false;
    }
  }
}

export type EventPermissionType = 
  | "VIEW_EVENTS"
  | "VIEW_EVENT"
  | "CREATE_EVENTS"
  | "EDIT_EVENT"
  | "DELETE_EVENT"
  | "MANAGE_PARTICIPANTS"
  | "MANAGE_LEADERS"
  | "UPLOAD_MATERIALS"
  | "MANAGE_FINANCES"
  | "MANAGE_REGISTRATIONS"
  | "VIEW_FEEDBACK"
  | "REGISTER_FOR_EVENT"
  | "PROVIDE_FEEDBACK"
  | "CHANGE_STATUS"
  | "VIEW_STATS";

// Função helper para criar contexto de permissões
export function createEventPermissionContext(
  user: {
    id: string;
    role: Role;
    ministryId?: string;
    masterMinistryId?: string;
  },
  userMinistries: string[] = [],
  event?: {
    ministryId: string;
    leaders: { userId: string }[];
  }
): EventPermissionContext {
  const userMinistryIds = user.ministryId ? [user.ministryId, ...userMinistries] : userMinistries;
  
  return {
    userId: user.id,
    userRole: user.role || "LEADER",
    userMinistryIds: [...new Set(userMinistryIds)], // Remove duplicatas
    masterMinistryId: user.masterMinistryId,
    eventMinistryId: event?.ministryId,
    eventLeaderIds: event?.leaders.map(l => l.userId) || [],
    isEventLeader: event ? event.leaders.some(l => l.userId === user.id) : false,
  };
}

// Middleware para verificar permissões em rotas da API
export function requireEventPermission(permission: EventPermissionType) {
  return (permissions: EventPermissions) => {
    if (!permissions.hasPermission(permission)) {
      throw new Error(`Permissão negada: ${permission}`);
    }
  };
}