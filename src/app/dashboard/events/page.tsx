'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Calendar, Users, MapPin } from 'lucide-react';
import { useEvents } from '@/hooks/events';
import { EventType, EventStatus } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EventCreateModal from '@/components/events/EventCreateModal';

const eventTypeLabels: Record<EventType, string> = {
  CELL: 'Célula',
  LEADER_MEETING: 'Reunião de Líderes',
  WORSHIP: 'Culto',
  WORKSHOP: 'Workshop',
  CANTEEN: 'Cantina',
  CAMP: 'Acampamento',
  MISSION: 'Missão',
  PLANNING: 'Planejamento',
  TRAINING: 'Treinamento',
  REGISTRATION: 'Inscrição'
};

const eventStatusLabels: Record<EventStatus, string> = {
  PLANNED: 'Planejado',
  REGISTRATIONS_OPEN: 'Inscrições Abertas',
  REGISTRATIONS_CLOSED: 'Inscrições Fechadas',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado'
};

const statusColors: Record<EventStatus, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  REGISTRATIONS_OPEN: 'bg-green-100 text-green-800',
  REGISTRATIONS_CLOSED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, error, refetch } = useEvents();

  // DEBUG: Logs detalhados para identificar o problema
  
  // Verificando se data existe e se tem a propriedade events
  const events = data?.events || [];
  
  // Tratamento de erro para evitar falha no carregamento
  if (error) {
    console.error('Erro ao carregar eventos:', error);
    console.error('error.stack:', error.stack);
  }

  // Adicionando verificação de segurança para evitar erros
  const filteredEvents = Array.isArray(events) ? events.filter(event => {
    if (!event) return false;
    
    const matchesSearch = (event.title || '').toLowerCase().includes(search.toLowerCase()) ||
                         (event.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || event.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar eventos</h3>
          <p className="text-red-700 mb-4">
            {error.message || 'Ocorreu um erro inesperado ao carregar os eventos.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600">Gerencie todos os eventos do ministério</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar eventos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as EventType | 'ALL')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os tipos</SelectItem>
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EventStatus | 'ALL')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                {Object.entries(eventStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-600 mb-4">
              {events?.length === 0 
                ? 'Comece criando seu primeiro evento.' 
                : 'Tente ajustar os filtros de busca.'}
            </p>
            <Link href="/dashboard/events/new">
              <Button>Criar Primeiro Evento</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                    <Badge className={statusColors[event.status]}>
                      {eventStatusLabels[event.status]}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {eventTypeLabels[event.type]}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.startDate).toLocaleDateString('pt-BR')}
                      {event.endDate && event.endDate !== event.startDate && (
                        <span> - {new Date(event.endDate).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                    
                    {event.street && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="truncate">{event.street}, {event.number} - {event.neighborhood}, {event.city}/{event.state}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {event.maxParticipants 
                        ? `${event.participants?.length || 0}/${event.maxParticipants} participantes`
                        : `${event.participants?.length || 0} participantes`
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal de Criação de Evento */}
      <EventCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />
    </div>
  );
}