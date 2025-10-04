import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from '@/app/api/dashboard/activities/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

// Mock do PrismaClient
jest.mock('@prisma/client', () => {
  const mockFindMany = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      member: { findMany: mockFindMany },
      event: { findMany: mockFindMany },
      smallGroup: { findMany: mockFindMany },
      smallGroupMeeting: { findMany: mockFindMany },
      transaction: { findMany: mockFindMany },
      user: { findUnique: jest.fn() },
      $disconnect: jest.fn(),
    })),
  };
});

// Mock do getServerSession
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

describe('API de Atividades', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Configurar o mock do request
    mockRequest = {
      url: 'http://localhost:3000/api/dashboard/activities',
    } as unknown as NextRequest;

    // Configurar o mock da sessão
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-id',
        email: 'felipe@lider.com',
        name: 'Felipe',
        role: 'MASTER',
      },
    });

    // Resetar todos os mocks
    jest.clearAllMocks();
  });

  it('deve filtrar atividades pelo ministério do usuário', async () => {
    // Configurar o mock do Prisma para retornar um usuário com ministério
    const { PrismaClient } = require('@prisma/client');
    const prismaInstance = new PrismaClient();
    
    prismaInstance.user.findUnique.mockResolvedValue({
      id: 'user-id',
      name: 'Felipe',
      email: 'felipe@lider.com',
      role: 'MASTER',
      masterMinistry: {
        id: 'ministry-id',
        name: 'Homens de Deus'
      }
    });

    // Configurar o mock para retornar membros do ministério
    prismaInstance.member.findMany.mockResolvedValue([
      {
        id: 'member-1',
        name: 'João Silva',
        createdAt: new Date(),
        createdBy: {
          id: 'user-id',
          name: 'Felipe'
        },
        ministryId: 'ministry-id'
      }
    ]);

    // Executar a função GET
    const response = await GET(mockRequest);
    const data = await response.json();

    // Verificar se a consulta foi feita com o filtro de ministério
    expect(prismaInstance.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ministryId: 'ministry-id'
        })
      })
    );

    // Verificar se as atividades foram retornadas corretamente
    expect(data.activities).toBeDefined();
    expect(data.activities.length).toBeGreaterThan(0);
  });
});