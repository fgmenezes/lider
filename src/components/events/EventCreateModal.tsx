"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Clock, Loader2 } from "lucide-react";
import { fetchAddressByCep } from "@/lib/utils/viaCep";
import { EventType, EventStatus } from "@/types/events";

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EventFormData {
  title: string;
  description: string;
  type: EventType | "";
  status: EventStatus;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  estado: string;
  maxParticipants?: number;
  registrationFee?: number;
  requiresRegistration: boolean;
  isPublic: boolean;
  specificData: Record<string, any>;
}

const initialFormData: EventFormData = {
  title: "",
  description: "",
  type: "",
  status: "PLANNED",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  estado: "",
  maxParticipants: undefined,
  registrationFee: undefined,
  requiresRegistration: false,
  isPublic: true,
  specificData: {}
};

const eventTypeLabels: Record<EventType, string> = {
  CELL: "Célula",
  LEADER_MEETING: "Reunião de Líderes",
  WORSHIP: "Culto",
  WORKSHOP: "Workshop",
  CANTEEN: "Cantina",
  CAMP: "Acampamento",
  MISSION: "Missão",
  PLANNING: "Planejamento",
  TRAINING: "Treinamento",
  REGISTRATION: "Inscrição"
};

const STEPS_CONFIG = {
  1: {
    title: "Informações Básicas",
    description: "Defina o título, tipo e descrição do evento",
    icon: Calendar
  },
  2: {
    title: "Data e Horário",
    description: "Configure quando o evento acontecerá",
    icon: Clock
  },
  3: {
    title: "Local do Evento",
    description: "Informe onde o evento será realizado",
    icon: MapPin
  },
  4: {
    title: "Configurações",
    description: "Defina participantes e configurações específicas",
    icon: Users
  },
  5: {
    title: "Resumo",
    description: "Revise todas as informações antes de criar",
    icon: Calendar
  }
};

export default function EventCreateModal({ isOpen, onClose, onSuccess }: EventCreateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Refs para foco automático
  const titleRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);
  const maxParticipantsRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData(initialFormData);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Auto focus on step change
  useEffect(() => {
    if (!isOpen) return;
    
    setTimeout(() => {
      switch (currentStep) {
        case 1:
          titleRef.current?.focus();
          break;
        case 2:
          startDateRef.current?.focus();
          break;
        case 3:
          cepRef.current?.focus();
          break;
        case 4:
          maxParticipantsRef.current?.focus();
          break;
      }
    }, 100);
  }, [currentStep, isOpen]);

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    handleInputChange('cep', cleanCep);

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const addressData = await fetchAddressByCep(cleanCep);
        setFormData(prev => ({
          ...prev,
          rua: addressData.logradouro || "",
          bairro: addressData.bairro || "",
          municipio: addressData.localidade || "",
          estado: addressData.uf || ""
        }));
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = "Título é obrigatório";
        if (!formData.type) newErrors.type = "Tipo do evento é obrigatório";
        break;
      case 2:
        if (!formData.startDate) newErrors.startDate = "Data de início é obrigatória";
        if (!formData.startTime) newErrors.startTime = "Horário de início é obrigatório";
        if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
          newErrors.endDate = "Data de término deve ser posterior à data de início";
        }
        break;
      case 3:
        if (!formData.cep) newErrors.cep = "CEP é obrigatório";
        if (!formData.rua.trim()) newErrors.rua = "Rua é obrigatória";
        if (!formData.numero.trim()) newErrors.numero = "Número é obrigatório";
        if (!formData.bairro.trim()) newErrors.bairro = "Bairro é obrigatório";
        if (!formData.municipio.trim()) newErrors.municipio = "Município é obrigatório";
        if (!formData.estado.trim()) newErrors.estado = "Estado é obrigatório";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar evento");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Evento *</Label>
              <Input
                id="title"
                ref={titleRef}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Célula de Crescimento"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="type">Tipo de Evento *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o evento..."
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  ref={startDateRef}
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
              </div>
              <div>
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Horário de Início *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
              </div>
              <div>
                <Label htmlFor="endTime">Horário de Término</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  min={formData.startTime}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                ref={cepRef}
                value={formData.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={8}
                className={errors.cep ? 'border-red-500' : ''}
              />
              {cepLoading && <p className="text-sm text-blue-500">Buscando endereço...</p>}
              {errors.cep && <p className="text-sm text-red-500">{errors.cep}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="rua">Rua/Logradouro *</Label>
                <Input
                  id="rua"
                  value={formData.rua}
                  onChange={(e) => handleInputChange('rua', e.target.value)}
                  placeholder="Nome da rua"
                  className={errors.rua ? 'border-red-500' : ''}
                />
                {errors.rua && <p className="text-sm text-red-500">{errors.rua}</p>}
              </div>
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  placeholder="123"
                  className={errors.numero ? 'border-red-500' : ''}
                />
                {errors.numero && <p className="text-sm text-red-500">{errors.numero}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => handleInputChange('complemento', e.target.value)}
                placeholder="Apto, sala, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  placeholder="Nome do bairro"
                  className={errors.bairro ? 'border-red-500' : ''}
                />
                {errors.bairro && <p className="text-sm text-red-500">{errors.bairro}</p>}
              </div>
              <div>
                <Label htmlFor="municipio">Município *</Label>
                <Input
                  id="municipio"
                  value={formData.municipio}
                  onChange={(e) => handleInputChange('municipio', e.target.value)}
                  placeholder="Nome da cidade"
                  className={errors.municipio ? 'border-red-500' : ''}
                />
                {errors.municipio && <p className="text-sm text-red-500">{errors.municipio}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                placeholder="UF"
                maxLength={2}
                className={errors.estado ? 'border-red-500' : ''}
              />
              {errors.estado && <p className="text-sm text-red-500">{errors.estado}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
              <Input
                id="maxParticipants"
                ref={maxParticipantsRef}
                type="number"
                value={formData.maxParticipants || ""}
                onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || undefined)}
                placeholder="Deixe vazio para ilimitado"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="registrationFee">Taxa de Inscrição (R$)</Label>
              <Input
                id="registrationFee"
                type="number"
                step="0.01"
                value={formData.registrationFee || ""}
                onChange={(e) => handleInputChange('registrationFee', parseFloat(e.target.value) || undefined)}
                placeholder="0.00"
                min="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresRegistration"
                checked={formData.requiresRegistration}
                onChange={(e) => handleInputChange('requiresRegistration', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="requiresRegistration">Requer inscrição prévia</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPublic">Evento público</Label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Resumo do Evento</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Título:</strong> {formData.title}</p>
                <p><strong>Tipo:</strong> {formData.type ? eventTypeLabels[formData.type as EventType] : ''}</p>
                <p><strong>Data:</strong> {formData.startDate} {formData.startTime}</p>
                <p><strong>Local:</strong> {formData.rua}, {formData.numero} - {formData.bairro}, {formData.municipio}/{formData.estado}</p>
                {formData.maxParticipants && <p><strong>Máx. Participantes:</strong> {formData.maxParticipants}</p>}
                {formData.registrationFee && <p><strong>Taxa:</strong> R$ {formData.registrationFee.toFixed(2)}</p>}
              </div>
            </div>
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const currentStepConfig = STEPS_CONFIG[currentStep as keyof typeof STEPS_CONFIG];
  const IconComponent = currentStepConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <IconComponent className="w-5 h-5" />
          Novo Evento
        </DialogTitle>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-semibold">{currentStepConfig.title}</h3>
            <p className="text-sm text-gray-600">{currentStepConfig.description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Voltar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            {currentStep < 5 ? (
              <Button onClick={nextStep}>
                Avançar
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Evento"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}