import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EventFinanceInput } from '@/lib/events/validations';
import { EventFinance } from '@/types/events';

// Chaves de query para cache
export const financeKeys = {
  all: ['finance'] as const,
  byEvent: (eventId: string) => [...financeKeys.all, 'event', eventId] as const,
  summary: (eventId: string) => [...financeKeys.byEvent(eventId), 'summary'] as const,
};

// Hook para buscar finanças de um evento
export function useEventFinance(eventId: string) {
  return useQuery({
    queryKey: financeKeys.byEvent(eventId),
    queryFn: async (): Promise<{ 
      finance: EventFinance[]; 
      summary: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
        incomeByType: Record<string, number>;
        expenseByType: Record<string, number>;
      }
    }> => {
      const response = await fetch(`/api/events/${eventId}/finance`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar finanças');
      }

      return response.json();
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// Hook para adicionar entrada financeira
export function useAddEventFinance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EventFinanceInput): Promise<EventFinance> => {
      const response = await fetch(`/api/events/${data.eventId}/finance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar entrada financeira');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de finanças do evento
      queryClient.invalidateQueries({ 
        queryKey: financeKeys.byEvent(variables.eventId) 
      });
      
      // Invalidar cache do evento para atualizar informações financeiras
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'detail', variables.eventId] 
      });
      
      const type = data.type === 'INCOME' ? 'receita' : 'despesa';
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} adicionada com sucesso!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para atualizar entrada financeira
export function useUpdateEventFinance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      financeId, 
      data 
    }: { 
      eventId: string; 
      financeId: string; 
      data: Partial<EventFinance> 
    }): Promise<EventFinance> => {
      const response = await fetch(`/api/events/${eventId}/finance/${financeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar entrada financeira');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de finanças do evento
      queryClient.invalidateQueries({ 
        queryKey: financeKeys.byEvent(variables.eventId) 
      });
      
      // Invalidar cache do evento para atualizar informações financeiras
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'detail', variables.eventId] 
      });
      
      toast.success('Entrada financeira atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para deletar entrada financeira
export function useDeleteEventFinance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      financeId 
    }: { 
      eventId: string; 
      financeId: string; 
    }): Promise<void> => {
      const response = await fetch(`/api/events/${eventId}/finance/${financeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar entrada financeira');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de finanças do evento
      queryClient.invalidateQueries({ 
        queryKey: financeKeys.byEvent(variables.eventId) 
      });
      
      // Invalidar cache do evento para atualizar informações financeiras
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'detail', variables.eventId] 
      });
      
      toast.success('Entrada financeira deletada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook para gerar relatório financeiro
export function useEventFinanceReport(eventId: string) {
  return useQuery({
    queryKey: [...financeKeys.byEvent(eventId), 'report'],
    queryFn: async (): Promise<{
      summary: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
        profitMargin: number;
      };
      incomeByCategory: Array<{ category: string; amount: number; percentage: number }>;
      expenseByCategory: Array<{ category: string; amount: number; percentage: number }>;
      monthlyBreakdown: Array<{ month: string; income: number; expense: number; balance: number }>;
      topExpenses: Array<{ description: string; amount: number; date: string }>;
      topIncomes: Array<{ description: string; amount: number; date: string }>;
    }> => {
      const response = await fetch(`/api/events/${eventId}/finance?report=true`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar relatório financeiro');
      }

      return response.json();
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}