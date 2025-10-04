'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useCreateEvent } from '@/hooks/events';
import { EventType, EventStatus, CreateEventData } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number;
  registrationFee?: number;
  requiresRegistration: boolean;
  isPublic: boolean;
}

const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: 'CELL', label: 'Célula' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'WORSHIP', label: 'Culto' },
  { value: 'LEADER_MEETING', label: 'Reunião de Líderes' },
  { value: 'CAMP', label: 'Acampamento' },
  { value: 'CANTEEN', label: 'Cantina' },
  { value: 'MISSION', label: 'Missão' },
  { value: 'PLANNING', label: 'Planejamento' },
  { value: 'TRAINING', label: 'Treinamento' },
  { value: 'REGISTRATION', label: 'Inscrição' }
];

const eventStatusOptions: { value: EventStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Planejado' },
  { value: 'REGISTRATIONS_OPEN', label: 'Inscrições Abertas' },
  { value: 'REGISTRATIONS_CLOSED', label: 'Inscrições Fechadas' }
];

export default function NewEventPage() {
  const router = useRouter();
  const createEventMutation = useCreateEvent();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'LEADER_MEETING',
    status: 'PLANNED',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: undefined,
    registrationFee: undefined,
    requiresRegistration: false,
    isPublic: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof EventFormData, value: any) => {
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

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
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
      const eventData: CreateEventData = {
        title: formData.title!,
        description: formData.description || undefined,
        type: formData.type!,
        ministryId: 'default-ministry-id', // TODO: Obter do contexto do usuário
        startDate: new Date(formData.startDate!),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        maxParticipants: formData.maxParticipants || undefined,
        cep: '',
        street: formData.location || undefined,
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        specificData: {}
      };

      const newEvent = await createEventMutation.mutateAsync(eventData);
      toast.success('Evento criado com sucesso!');
      router.push(`/dashboard/events/${newEvent.id}`);
    } catch (error) {
      toast.error('Erro ao criar evento. Tente novamente.');
      console.error('Erro ao criar evento:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Evento</h1>
          <p className="text-gray-600">Crie um novo evento para sua igreja</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Título do Evento *</Label>
                <Input
                  id="title"
                  value={formData.title}
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
                  value={formData.description}
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
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data e Horário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
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
                  value={formData.endDate}
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
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endTime">Horário de Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Local e Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Local e Participantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="location">Local do Evento</Label>
                <Input
                  id="location"
                  value={formData.location}
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
                checked={formData.requiresRegistration}
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
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/events">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={createEventMutation.isPending}>
            {createEventMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Criar Evento
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}