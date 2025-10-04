'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useEvent, useUpdateEvent } from '@/hooks/events';
import { EventType, EventStatus, UpdateEventData } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: 'CELL', label: 'Célula/Pequeno Grupo' },
  { value: 'LEADER_MEETING', label: 'Reunião de Líderes' },
  { value: 'WORSHIP', label: 'Culto/Encontrão' },
  { value: 'WORKSHOP', label: 'Workshop/Palestra' },
  { value: 'CANTEEN', label: 'Cantina/Bazar' },
  { value: 'CAMP', label: 'Acampamento/Retiro' },
  { value: 'MISSION', label: 'Projeto Missionário/Social' },
  { value: 'PLANNING', label: 'Planejamento Ministerial' },
  { value: 'TRAINING', label: 'Treinamento Interno' },
  { value: 'REGISTRATION', label: 'Inscrições e Cadastros' }
];

const eventStatusOptions: { value: EventStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Planejado' },
  { value: 'REGISTRATIONS_OPEN', label: 'Inscrições Abertas' },
  { value: 'REGISTRATIONS_CLOSED', label: 'Inscrições Fechadas' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' }
];

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const updateEventMutation = useUpdateEvent();

  const [formData, setFormData] = useState<{
    title?: string;
    description?: string;
    type?: EventType;
    status?: EventStatus;
    startDate?: string; // Mudando para string para compatibilidade com input HTML
    endDate?: string; // Mudando para string para compatibilidade com input HTML
    startTime?: string;
    endTime?: string;
    location?: string;
    maxParticipants?: number;
    registrationFee?: number;
    requiresRegistration?: boolean;
    isPublic?: boolean;
  }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when event data loads
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        type: event.type,
        status: event.status,
        startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        startTime: '', // Campo não existe no schema, usar valor padrão
        endTime: '', // Campo não existe no schema, usar valor padrão
        location: '', // Campo não existe no schema, usar valor padrão
        maxParticipants: event.maxParticipants || undefined,
        registrationFee: undefined, // Campo não existe no schema, usar valor padrão
        requiresRegistration: false, // Campo não existe no schema, usar valor padrão
        isPublic: true // Campo não existe no schema, usar valor padrão
      });
    }
  }, [event]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    if (!formData.type) {
      newErrors.type = 'Tipo do evento é obrigatório';
    }

    if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início';
    }

    if (formData.maxParticipants && formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Número máximo de participantes deve ser maior que 0';
    }

    if (formData.registrationFee && formData.registrationFee < 0) {
      newErrors.registrationFee = 'Taxa de inscrição não pode ser negativa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      const updateData: UpdateEventData = {
        id: eventId,
        title: formData.title!,
        description: formData.description || undefined,
        type: formData.type!,
        status: formData.status!,
        startDate: new Date(formData.startDate!),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        maxParticipants: formData.maxParticipants || undefined
      };

      await updateEventMutation.mutateAsync({ id: eventId, ...updateData });
      toast.success('Evento atualizado com sucesso!');
      router.push(`/dashboard/events/${eventId}`);
    } catch (error) {
      toast.error('Erro ao atualizar evento. Tente novamente.');
      console.error('Erro ao atualizar evento:', error);
    }
  };

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Evento não encontrado</p>
        <Link href="/dashboard/events">
          <Button className="mt-4">Voltar para Eventos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1>
          <p className="text-gray-600">Atualize as informações do evento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Título do Evento *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Retiro de Jovens 2024"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="type">Tipo de Evento *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value as EventType)}>
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as EventStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o evento, objetivos, programação..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data e Horário */}
        <Card>
          <CardHeader>
            <CardTitle>Data e Horário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <Label htmlFor="endDate">Data de Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              </div>

              <div>
                <Label htmlFor="startTime">Horário de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endTime">Horário de Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Local e Participantes */}
        <Card>
          <CardHeader>
            <CardTitle>Local e Participantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="location">Local do Evento</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ex: Auditório Principal, Chácara da Igreja..."
                />
              </div>

              <div>
                <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants || ''}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Deixe vazio para ilimitado"
                  className={errors.maxParticipants ? 'border-red-500' : ''}
                />
                {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>}
              </div>

              <div>
                <Label htmlFor="registrationFee">Taxa de Inscrição (R$)</Label>
                <Input
                  id="registrationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.registrationFee || ''}
                  onChange={(e) => handleInputChange('registrationFee', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.00"
                  className={errors.registrationFee ? 'border-red-500' : ''}
                />
                {errors.registrationFee && <p className="text-red-500 text-sm mt-1">{errors.registrationFee}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requiresRegistration">Requer Inscrição</Label>
                <p className="text-sm text-gray-600">Os participantes precisam se inscrever para participar</p>
              </div>
              <Checkbox
                id="requiresRegistration"
                checked={formData.requiresRegistration || false}
                onChange={(e) => handleInputChange('requiresRegistration', e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPublic">Evento Público</Label>
                <p className="text-sm text-gray-600">O evento será visível para todos os membros</p>
              </div>
              <Checkbox
                id="isPublic"
                checked={formData.isPublic ?? true}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={updateEventMutation.isPending}>
            {updateEventMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}