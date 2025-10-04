import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export interface ActivityLogData {
  tipo: string;
  acao: string;
  descricao: string;
  detalhes?: string;
  entidadeId?: string;
  usuarioId: string;
  ministryId?: string;
  ip?: string;
  userAgent?: string;
}

export async function logActivity(data: ActivityLogData, request?: NextRequest) {
  try {
    // Extrair IP e User-Agent da requisição se fornecida
    let ip = data.ip;
    let userAgent = data.userAgent;
    
    if (request) {
      ip = ip || request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
      userAgent = userAgent || request.headers.get('user-agent') || 'unknown';
    }

    await prisma.atividade.create({
      data: {
        tipo: data.tipo,
        acao: data.acao,
        descricao: data.descricao,
        detalhes: data.detalhes,
        entidadeId: data.entidadeId,
        usuarioId: data.usuarioId,
        ministryId: data.ministryId,
        ip: ip || 'unknown',
        userAgent: userAgent || 'unknown',
      }
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    // Não falhar a operação principal se o log falhar
  }
}

// Tipos de atividades padronizados
export const ACTIVITY_TYPES = {
  MEMBER: 'MEMBRO',
  SMALL_GROUP: 'PEQUENO_GRUPO',
  EVENT: 'EVENTO',
  USER: 'USUARIO',
  MINISTRY: 'MINISTERIO',
  FINANCE: 'FINANCEIRO',
  MATERIAL: 'MATERIAL',
  OBSERVATION: 'OBSERVACAO',
  MEETING: 'REUNIAO',
  VISITOR: 'VISITANTE',
  PARTICIPANT: 'PARTICIPANTE',
  REGISTRATION: 'INSCRICAO'
} as const;

// Ações padronizadas
export const ACTIVITY_ACTIONS = {
  CREATE: 'CRIAR',
  UPDATE: 'ATUALIZAR',
  DELETE: 'EXCLUIR',
  VIEW: 'VISUALIZAR',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORTAR',
  IMPORT: 'IMPORTAR',
  APPROVE: 'APROVAR',
  REJECT: 'REJEITAR',
  CANCEL: 'CANCELAR',
  ACTIVATE: 'ATIVAR',
  DEACTIVATE: 'DESATIVAR'
} as const;