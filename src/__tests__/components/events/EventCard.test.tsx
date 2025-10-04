import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventCard } from '@/components/events/EventCard';

// Mock do Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('EventCard Component', () => {
  const mockEvent = {
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
  };

  it('deve renderizar corretamente com todos os dados', () => {
    render(<EventCard event={mockEvent} />);
    
    // Verifica se os elementos principais estão presentes
    expect(screen.getByText('Evento de Teste')).toBeInTheDocument();
    expect(screen.getByText('Descrição do evento de teste')).toBeInTheDocument();
    expect(screen.getByText('Planejado')).toBeInTheDocument();
    expect(screen.getByText('Workshop')).toBeInTheDocument();
    expect(screen.getByText('25/12/2023')).toBeInTheDocument();
    expect(screen.getByText('Local de Teste')).toBeInTheDocument();
    expect(screen.getByText('25/50 participantes')).toBeInTheDocument();
  });

  it('deve lidar com dados opcionais ausentes', () => {
    const eventSemOpcionais = {
      ...mockEvent,
      description: undefined,
      endDate: undefined,
      location: undefined,
      maxParticipants: undefined,
      _count: undefined,
    };

    render(<EventCard event={eventSemOpcionais} />);
    
    // Verifica se o título e status ainda estão presentes
    expect(screen.getByText('Evento de Teste')).toBeInTheDocument();
    expect(screen.getByText('Planejado')).toBeInTheDocument();
    
    // Verifica se os dados opcionais não estão presentes
    expect(screen.queryByText('Descrição do evento de teste')).not.toBeInTheDocument();
    expect(screen.queryByText('Local de Teste')).not.toBeInTheDocument();
    expect(screen.queryByText('25/50 participantes')).not.toBeInTheDocument();
    
    // Verifica se mostra "0 participantes" quando _count está ausente
    expect(screen.getByText('0 participantes')).toBeInTheDocument();
  });

  it('deve ter um link para a página de detalhes do evento', () => {
    render(<EventCard event={mockEvent} />);
    
    // Verifica se o link para a página de detalhes está presente
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/dashboard/events/${mockEvent.id}`);
  });
});