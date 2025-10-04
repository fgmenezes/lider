import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EventType } from '@prisma/client';
import { 
  EVENT_TYPE_LABELS, 
  EVENT_TYPE_COLORS, 
  EVENT_TYPE_ICONS, 
  EVENT_TYPE_DEFAULTS,
  REQUIRED_FIELDS_BY_TYPE 
} from '@/lib/events/constants';

// GET /api/events/types - Buscar tipos de eventos e suas configurações
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const eventTypes = Object.values(EventType).map(type => ({
      value: type,
      label: EVENT_TYPE_LABELS[type],
      color: EVENT_TYPE_COLORS[type],
      icon: EVENT_TYPE_ICONS[type],
      defaults: EVENT_TYPE_DEFAULTS[type],
      requiredFields: REQUIRED_FIELDS_BY_TYPE[type]
    }));

    return NextResponse.json({ eventTypes });
  } catch (error) {
    console.error('Erro ao buscar tipos de eventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}