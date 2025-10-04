import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EventFiltersInput, CreateEventInput, UpdateEventInput } from '@/lib/events/validations';
import { EventsResponse, EventResponse } from '@/types/events';

// Chaves de query para cache
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: EventFiltersInput) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  types: () => [...eventKeys.all, 'types'] as const,
};

// Hook para buscar lista de eventos
export function useEvents(filters: EventFiltersInput = {}) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: async (): Promise<EventsResponse> => {
      try {
        
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });

        const url = `/api/events?${params.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Erro na resposta da API:', error);
          throw new Error(error.error || 'Erro ao buscar eventos');
        }

        const data = await response.json();
        
        // Garantindo que events seja sempre um array
        const processedData = {
          ...data,
          events: Array.isArray(data.events) ? data.events : []
        };
        
        return processedData;
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        console.error('error.stack:', error.stack);
        return { events: [], total: 0, page: 1, limit: 10 }; // Retorna estrutura completa em caso de erro
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para buscar evento específico
export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async (): Promise<EventResponse> => {
      const response = await fetch(`/api/events/${id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar evento');
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// Hook para buscar tipos de eventos
export function useEventTypes() {
  return useQuery({
    queryKey: eventKeys.types(),
    queryFn: async () => {
      const response = await fetch('/api/events/types');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar tipos de eventos');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutos (dados estáticos)
  });
}

// Hook para criar evento
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventInput): Promise<EventResponse> => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar evento');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidar cache de listas
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      
      // Adicionar ao cache de detalhes
      queryClient.setQueryData(eventKeys.detail(data.id), data);
      
      toast.success('Evento criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para atualizar evento
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventInput): Promise<EventResponse> => {
      const response = await fetch(`/api/events/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar evento');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidar cache de listas
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      
      // Atualizar cache de detalhes
      queryClient.setQueryData(eventKeys.detail(data.id), data);
      
      toast.success('Evento atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para deletar evento
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar evento');
      }
    },
    onSuccess: (_, id) => {
      // Invalidar cache de listas
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      
      // Remover do cache de detalhes
      queryClient.removeQueries({ queryKey: eventKeys.detail(id) });
      
      toast.success('Evento deletado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}