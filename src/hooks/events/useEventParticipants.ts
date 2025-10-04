import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EventParticipantInput } from '@/lib/events/validations';
import { EventParticipant } from '@/types/events';

// Chaves de query para cache
export const participantKeys = {
  all: ['participants'] as const,
  byEvent: (eventId: string) => [...participantKeys.all, 'event', eventId] as const,
};

// Hook para buscar participantes de um evento
export function useEventParticipants(eventId: string) {
  return useQuery({
    queryKey: participantKeys.byEvent(eventId),
    queryFn: async (): Promise<{ participants: EventParticipant[] }> => {
      const response = await fetch(`/api/events/${eventId}/participants`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar participantes');
      }

      return response.json();
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// Hook para adicionar participante
export function useAddEventParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EventParticipantInput): Promise<EventParticipant> => {
      const response = await fetch(`/api/events/${data.eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar participante');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de participantes do evento
      queryClient.invalidateQueries({ 
        queryKey: participantKeys.byEvent(variables.eventId) 
      });
      
      // Invalidar cache do evento para atualizar contadores
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'detail', variables.eventId] 
      });
      
      toast.success('Participante adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para atualizar participante
export function useUpdateEventParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      participantId, 
      data 
    }: { 
      eventId: string; 
      participantId: string; 
      data: Partial<EventParticipant> 
    }): Promise<EventParticipant> => {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar participante');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de participantes do evento
      queryClient.invalidateQueries({ 
        queryKey: participantKeys.byEvent(variables.eventId) 
      });
      
      toast.success('Participante atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para remover participante
export function useRemoveEventParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      participantId 
    }: { 
      eventId: string; 
      participantId: string; 
    }): Promise<void> => {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover participante');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de participantes do evento
      queryClient.invalidateQueries({ 
        queryKey: participantKeys.byEvent(variables.eventId) 
      });
      
      // Invalidar cache do evento para atualizar contadores
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'detail', variables.eventId] 
      });
      
      toast.success('Participante removido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para marcar presença em lote
export function useBulkUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      updates 
    }: { 
      eventId: string; 
      updates: Array<{ participantId: string; attended: boolean }> 
    }): Promise<void> => {
      // Fazer múltiplas requisições em paralelo
      const promises = updates.map(({ participantId, attended }) =>
        fetch(`/api/events/${eventId}/participants/${participantId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ attended }),
        })
      );

      const responses = await Promise.all(promises);
      
      // Verificar se todas as requisições foram bem-sucedidas
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        throw new Error('Erro ao atualizar algumas presenças');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de participantes do evento
      queryClient.invalidateQueries({ 
        queryKey: participantKeys.byEvent(variables.eventId) 
      });
      
      toast.success('Presenças atualizadas com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}