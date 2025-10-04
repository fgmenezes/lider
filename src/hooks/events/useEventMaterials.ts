import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EventMaterialInput } from '@/lib/events/validations';
import { EventMaterial } from '@/types/events';

// Chaves de query para cache
export const materialKeys = {
  all: ['materials'] as const,
  byEvent: (eventId: string) => [...materialKeys.all, 'event', eventId] as const,
  inventory: (eventId: string) => [...materialKeys.byEvent(eventId), 'inventory'] as const,
};

// Hook para buscar materiais de um evento
export function useEventMaterials(eventId: string) {
  return useQuery({
    queryKey: materialKeys.byEvent(eventId),
    queryFn: async (): Promise<{ materials: EventMaterial[] }> => {
      const response = await fetch(`/api/events/${eventId}/materials`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar materiais');
      }

      return response.json();
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para adicionar material
export function useAddEventMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EventMaterialInput): Promise<EventMaterial> => {
      const response = await fetch(`/api/events/${data.eventId}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar material');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de materiais do evento
      queryClient.invalidateQueries({ 
        queryKey: materialKeys.byEvent(variables.eventId) 
      });
      
      toast.success('Material adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para atualizar material
export function useUpdateEventMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      materialId, 
      data 
    }: { 
      eventId: string; 
      materialId: string; 
      data: Partial<EventMaterial> 
    }): Promise<EventMaterial> => {
      const response = await fetch(`/api/events/${eventId}/materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar material');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de materiais do evento
      queryClient.invalidateQueries({ 
        queryKey: materialKeys.byEvent(variables.eventId) 
      });
      
      toast.success('Material atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para deletar material
export function useDeleteEventMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      materialId 
    }: { 
      eventId: string; 
      materialId: string; 
    }): Promise<void> => {
      const response = await fetch(`/api/events/${eventId}/materials/${materialId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar material');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de materiais do evento
      queryClient.invalidateQueries({ 
        queryKey: materialKeys.byEvent(variables.eventId) 
      });
      
      toast.success('Material deletado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para marcar material como usado/devolvido
export function useUpdateMaterialStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      materialId, 
      used, 
      returned 
    }: { 
      eventId: string; 
      materialId: string; 
      used?: boolean;
      returned?: boolean;
    }): Promise<EventMaterial> => {
      const response = await fetch(`/api/events/${eventId}/materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ used, returned }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar status do material');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de materiais do evento
      queryClient.invalidateQueries({ 
        queryKey: materialKeys.byEvent(variables.eventId) 
      });
      
      const status = variables.used ? 'usado' : variables.returned ? 'devolvido' : 'atualizado';
      toast.success(`Material marcado como ${status}!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para relatório de inventário
export function useEventMaterialsInventory(eventId: string) {
  return useQuery({
    queryKey: materialKeys.inventory(eventId),
    queryFn: async (): Promise<{
      summary: {
        totalItems: number;
        totalQuantity: number;
        usedItems: number;
        returnedItems: number;
        pendingReturn: number;
      };
      byCategory: Array<{
        category: string;
        items: number;
        quantity: number;
        used: number;
        returned: number;
      }>;
      lowStock: Array<{
        name: string;
        currentQuantity: number;
        minimumQuantity: number;
      }>;
    }> => {
      const response = await fetch(`/api/events/${eventId}/materials?inventory=true`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar relatório de inventário');
      }

      return response.json();
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}