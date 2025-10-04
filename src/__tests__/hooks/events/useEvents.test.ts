import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvents } from '@/hooks/events';
import { ReactNode } from 'react';
import React from 'react';

// Mock do fetch global
global.fetch = jest.fn();

// Mock do response para simular a API
const mockEventsResponse = {
  events: [
    {
      id: '1',
      title: 'Evento de Teste',
      description: 'Descrição do evento de teste',
      type: 'WORKSHOP',
      status: 'PLANNED',
      ministryId: '123',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Outro Evento',
      description: 'Descrição de outro evento',
      type: 'MEETING',
      status: 'IN_PROGRESS',
      ministryId: '123',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
};

// Wrapper para o React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useEvents Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockEventsResponse,
    });
  });

  it('deve buscar eventos com sucesso', async () => {
    const { result } = renderHook(() => useEvents(), {
      wrapper: createWrapper(),
    });

    // Inicialmente deve estar carregando
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Espera a resolução da promise
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verifica se os dados foram carregados corretamente
    expect(result.current.data?.events).toHaveLength(2);
    expect(result.current.data?.events[0].title).toBe('Evento de Teste');
    expect(result.current.data?.events[1].title).toBe('Outro Evento');
  });

  it('deve lidar com erros na API', async () => {
    // Simula um erro na API
    (fetch as jest.Mock).mockRejectedValue(new Error('Erro na API'));

    const { result } = renderHook(() => useEvents(), {
      wrapper: createWrapper(),
    });

    // Espera a resolução da promise
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verifica se o erro foi capturado corretamente
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Erro na API');
    expect(result.current.data).toBeUndefined();
  });
});