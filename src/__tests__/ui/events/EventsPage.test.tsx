import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventsPage from '@/app/dashboard/events/page';
import { useEvents } from '@/hooks/events';

// Mock dos hooks
jest.mock('@/hooks/events', () => ({
  useEvents: jest.fn(),
}));

// Mock do Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('EventsPage Component', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Evento de Teste',
      description: 'Descrição do evento de teste',
      type: 'WORKSHOP',
      status: 'PLANNED',
      ministryId: '123',
      startDate: new Date('2023-12-25T10:00:00Z'),
      endDate: new Date('2023-12-25T12:00:00Z'),
      location: 'Local de Teste',
      maxParticipants: 50,
      _count: { participants: 25 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Reunião de Líderes',
      description: 'Reunião mensal de líderes',
      type: 'MEETING',
      status: 'IN_PROGRESS',
      ministryId: '123',
      startDate: new Date('2023-12-26T14:00:00Z'),
      location: 'Sala de Reuniões',
      _count: { participants: 10 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    // Configuração padrão do mock
    (useEvents as jest.Mock).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      error: null,
    });
  });

  it('deve renderizar a lista de eventos', () => {
    render(<EventsPage />);
    
    // Verifica se os títulos dos eventos estão presentes
    expect(screen.getByText('Evento de Teste')).toBeInTheDocument();
    expect(screen.getByText('Reunião de Líderes')).toBeInTheDocument();
    
    // Verifica se os status estão presentes
    expect(screen.getByText('Planejado')).toBeInTheDocument();
    expect(screen.getByText('Em Andamento')).toBeInTheDocument();
  });

  it('deve mostrar loading state', () => {
    (useEvents as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    
    render(<EventsPage />);
    
    // Verifica se o indicador de carregamento está presente
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('deve mostrar mensagem de erro', () => {
    (useEvents as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Erro ao carregar eventos'),
    });
    
    render(<EventsPage />);
    
    // Verifica se a mensagem de erro está presente
    expect(screen.getByText(/Erro ao carregar eventos/i)).toBeInTheDocument();
  });

  it('deve filtrar eventos por busca', async () => {
    render(<EventsPage />);
    
    // Digita no campo de busca
    const searchInput = screen.getByPlaceholderText('Buscar eventos...');
    fireEvent.change(searchInput, { target: { value: 'Reunião' } });
    
    // Verifica se apenas o evento correspondente está visível
    await waitFor(() => {
      expect(screen.queryByText('Evento de Teste')).not.toBeInTheDocument();
      expect(screen.getByText('Reunião de Líderes')).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem quando não há eventos', () => {
    (useEvents as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    
    render(<EventsPage />);
    
    // Verifica se a mensagem de "nenhum evento" está presente
    expect(screen.getByText('Nenhum evento encontrado')).toBeInTheDocument();
    expect(screen.getByText('Comece criando seu primeiro evento.')).toBeInTheDocument();
  });
});