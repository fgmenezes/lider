'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Users, Calendar, MapPin, DollarSign, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useEvent, useDeleteEvent } from '@/hooks/events';
import { EventType, EventStatus } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const eventTypeLabels: Record<EventType, string> = {
  CELL: 'Célula/Pequeno Grupo',
  LEADER_MEETING: 'Reunião de Líderes',
  WORSHIP: 'Culto/Encontrão',
  WORKSHOP: 'Workshop/Palestra',
  CANTEEN: 'Cantina/Bazar',
  CAMP: 'Acampamento/Retiro',
  MISSION: 'Projeto Missionário/Social',
  PLANNING: 'Planejamento Ministerial',
  TRAINING: 'Treinamento Interno',
  REGISTRATION: 'Inscrições e Cadastros'
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

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: event, isLoading, error } = useEvent(eventId);
  const deleteEventMutation = useDeleteEvent();

  const handleDelete = async () => {
    try {
      await deleteEventMutation.mutateAsync(eventId);
      toast.success('Evento excluído com sucesso!');
      router.push('/dashboard/events');
    } catch (error) {
      toast.error('Erro ao excluir evento. Tente novamente.');
      console.error('Erro ao excluir evento:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar evento: {error?.message || 'Evento não encontrado'}</p>
        <Link href="/dashboard/events">
          <Button className="mt-4">Voltar para Eventos</Button>
        </Link>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <p className="text-gray-600">{eventTypeLabels[event.type]}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={statusColors[event.status]}>
            {eventStatusLabels[event.status]}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/events/${eventId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="leaders">Líderes</TabsTrigger>
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="finance">Finanças</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Descrição</h4>
                  <p className="text-gray-600 mt-1">{event.description || 'Sem descrição'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Data de Início</h4>
                    <p className="text-gray-600">{formatDate(event.startDate)}</p>
                  </div>
                  
                  {event.endDate && (
                    <div>
                      <h4 className="font-medium text-gray-900">Data de Fim</h4>
                      <p className="text-gray-600">{formatDate(event.endDate)}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Capacidade:</dt>
                      <dd>{event.maxParticipants || 'Ilimitada'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Criado em:</dt>
                      <dd>{new Date(event.createdAt).toLocaleDateString('pt-BR')}</dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Participantes</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Líderes</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Materiais</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">R$ 0,00</div>
                    <div className="text-sm text-gray-600">Orçamento</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participantes do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaders">
          <Card>
            <CardHeader>
              <CardTitle>Líderes do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Materiais do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle>Finanças do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento &quot;{event.title}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}