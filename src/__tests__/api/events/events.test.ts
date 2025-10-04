import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/events/route';
import { prisma } from '@/lib/prisma';

// Mock do Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock da autenticação
jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(() => ({
    user: {
      id: 'user-123',
      role: 'MASTER',
      ministryId: 'ministry-123',
    },
  })),
}));

describe('API de Eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/events', () => {
    it('deve retornar lista de eventos', async () => {
      // Mock do retorno do Prisma
      const mockEvents = [
        {
          id: '1',
          title: 'Evento de Teste',
          type: 'WORKSHOP',
          status: 'PLANNED',
          ministryId: 'ministry-123',
          startDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.event.count as jest.Mock).mockResolvedValue(1);

      // Simula a requisição
      const { req, res } = createMocks({
        method: 'GET',
      });

      // Chama o handler
      await GET(req);

      // Verifica a resposta
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.events).toHaveLength(1);
      expect(responseData.total).toBe(1);
    });
  });

  describe('POST /api/events', () => {
    it('deve criar um novo evento', async () => {
      // Mock do evento criado
      const mockCreatedEvent = {
        id: '1',
        title: 'Novo Evento',
        type: 'WORKSHOP',
        status: 'PLANNED',
        ministryId: 'ministry-123',
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.event.create as jest.Mock).mockResolvedValue(mockCreatedEvent);

      // Dados para criar o evento
      const eventData = {
        title: 'Novo Evento',
        type: 'WORKSHOP',
        ministryId: 'ministry-123',
        startDate: new Date().toISOString(),
      };

      // Simula a requisição
      const { req, res } = createMocks({
        method: 'POST',
        body: eventData,
      });

      // Chama o handler
      await POST(req);

      // Verifica a resposta
      expect(res._getStatusCode()).toBe(201);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.event.id).toBe('1');
      expect(responseData.event.title).toBe('Novo Evento');
    });

    it('deve validar dados obrigatórios', async () => {
      // Dados incompletos
      const eventData = {
        // Falta o título e outros campos obrigatórios
        type: 'WORKSHOP',
      };

      // Simula a requisição
      const { req, res } = createMocks({
        method: 'POST',
        body: eventData,
      });

      // Chama o handler
      await POST(req);

      // Verifica a resposta de erro
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBeDefined();
    });
  });
});