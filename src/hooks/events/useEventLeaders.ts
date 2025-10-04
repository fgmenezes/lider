import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EventLeaderInput } from '@/lib/events/validations';
import { EventLeader } from '@/types/events';

// Chaves de query para cache
export const leaderKeys = {
  all: ['leaders'] as const,
  byEvent: (eventId: string) => [...leaderKeys.all, 'event', eventId] as const,
};

// Hook para buscar líderes de um evento
export function useEventLeaders(eventId: string) {
  return useQuery({
    queryKey: leaderKeys.byEvent(eventId),
    queryFn: async (): Promise<{ leaders: EventLeader[] }> => {
      const response = await fetch(`/api/events/${eventId}/leaders`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar líderes');
      }

      return response.json();
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para adicionar líder
export function useAddEventLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EventLeaderInput): Promise<EventLeader> => {
      const response = await fetch(`/api/events/${data.eventId}/leaders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar líder');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de líderes do evento
      queryClient.invalidateQueries({ 
        queryKey: leaderKeys.byEvent(variables.eventId) 
      });
      
      // Invalidar cache do evento para atualizar informações
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'detail', variables.eventId] 
      });
      
      toast.success('Líder adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para remover líder
export function useRemoveEventLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      leaderId 
    }: { 
      eventId: string; 
      leaderId: string; 
    }): Promise<void> => {
      const response = await fetch(`/api/events/${eventId}/leaders/${leaderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover líder');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de líderes do evento
      queryClient.invalidateQueries({ 
        queryKey: leaderKeys.byEvent(variables.eventId) 
      });
      
      // Invalidar cache do evento para atualizar informações
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'detail', variables.eventId] 
      });
      
      toast.success('Líder removido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para promover líder a líder principal
export function usePromoteToMainLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      leaderId 
    }: { 
      eventId: string; 
      leaderId: string; 
    }): Promise<EventLeader> => {
      const response = await fetch(`/api/events/${eventId}/leaders/${leaderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isMainLeader: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao promover líder');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de líderes do evento
      queryClient.invalidateQueries({ 
        queryKey: leaderKeys.byEvent(variables.eventId) 
      });
      
      // Invalidar cache do evento para atualizar informações
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'detail', variables.eventId] 
      });
      
      toast.success('Líder promovido a líder principal!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}