'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tab } from '@headlessui/react';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, UserPlus, FileText, Settings, Calendar, MapPin, Clock, XCircle, CheckCircle, BookOpen } from 'lucide-react';
import AttendanceModal from '@/components/forms/AttendanceModal';
import VisitorModal from '@/components/forms/VisitorModal';
import NoteModal from '@/components/forms/NoteModal';

// Interfaces
interface MeetingDetails {
  id: string;
  theme: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
  smallGroup: {
    id: string;
    name: string;
  };
  attendances: Array<{
    id: string;
    memberId: string;
    present: boolean;
    member: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  visitors: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      name: string;
    };
  }>;
}

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.meetingId as string;
  const groupId = params.id as string;

  // Estados
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Estados dos modais
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Estados para edição de configurações
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editedMeeting, setEditedMeeting] = useState({
    theme: '',
    date: '',
    startTime: '',
    endTime: '',
    location: ''
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Definição das funções de carregamento com useCallback
  const loadMeetingData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}`);
      if (!response.ok) throw new Error('Erro ao carregar dados da reunião');
      const data = await response.json();
      
      // Logs para investigação dos problemas
      console.log('=== DADOS DA REUNIÃO RECEBIDOS DA API ===');
      console.log('Data completa:', JSON.stringify(data, null, 2));
      console.log('Meeting object:', data.meeting);
      console.log('Date field:', data.meeting?.date);
      console.log('StartTime field:', data.meeting?.startTime);
      console.log('EndTime field:', data.meeting?.endTime);
      console.log('Location field:', data.meeting?.location);
      console.log('Theme field:', data.meeting?.theme);
      console.log('SmallGroup name:', data.meeting?.smallGroup?.name);
      
      // Teste de formatação de data
      if (data.meeting?.date) {
        console.log('=== TESTE DE FORMATAÇÃO DE DATA ===');
        console.log('Data original:', data.meeting.date);
        console.log('Data como Date object:', new Date(data.meeting.date));
        console.log('Data formatada (toLocaleDateString):', new Date(data.meeting.date).toLocaleDateString('pt-BR'));
        console.log('Data formatada (formatDate):', formatDate(data.meeting.date));
        
        // Verificar timezone
        const dateObj = new Date(data.meeting.date);
        console.log('UTC Date:', dateObj.toISOString());
        console.log('Local Date:', dateObj.toString());
        console.log('Timezone offset:', dateObj.getTimezoneOffset());
      }
      
      setMeeting(data.meeting);
    } catch (error) {
      console.error('Erro ao carregar reunião:', error);
      setError('Erro ao carregar dados da reunião');
      toast.error('Erro ao carregar dados da reunião');
    } finally {
      setLoading(false);
    }
  }, [groupId, meetingId]);

  const loadMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/small-groups/${groupId}/members`);
      if (!response.ok) throw new Error('Erro ao carregar membros');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros do grupo');
    }
  }, [groupId]);
  
  // Hooks de carregamento de dados
  useEffect(() => {
    loadMeetingData();
    loadMembers();
  }, [meetingId, groupId, loadMeetingData, loadMembers]);

  // Funções para gerenciar notas
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Digite uma observação antes de salvar');
      return;
    }

    try {
      setIsSavingNote(true);
      const response = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote.trim()
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar nota');
      
      toast.success('Nota adicionada com sucesso!');
      setNewNote('');
      setIsAddingNote(false);
      
      // Recarregar dados da reunião para mostrar a nova nota
      await loadMeetingData();
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast.error('Erro ao adicionar nota');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelNote = () => {
    setNewNote('');
    setIsAddingNote(false);
  };

  // Funções dos botões de ação
  const handleCancelMeeting = async () => {
    if (!confirm('Tem certeza que deseja cancelar esta reunião?')) return;
    
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELADA'
        })
      });

      if (!response.ok) throw new Error('Erro ao cancelar reunião');
      
      toast.success('Reunião cancelada com sucesso!');
      await loadMeetingData();
    } catch (error) {
      console.error('Erro ao cancelar reunião:', error);
      toast.error('Erro ao cancelar reunião');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFinishMeeting = async () => {
    if (!confirm('Tem certeza que deseja finalizar esta reunião?')) return;
    
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FINALIZADA'
        })
      });

      if (!response.ok) throw new Error('Erro ao finalizar reunião');
      
      toast.success('Reunião finalizada com sucesso!');
      await loadMeetingData();
    } catch (error) {
      console.error('Erro ao finalizar reunião:', error);
      toast.error('Erro ao finalizar reunião');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Funções para edição de configurações
  const handleStartEditConfig = () => {
    if (!meeting) return;
    
    setEditedMeeting({
      theme: meeting.theme,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime || '',
      location: meeting.location
    });
    setIsEditingConfig(true);
  };

  const handleCancelEditConfig = () => {
    setIsEditingConfig(false);
    setEditedMeeting({
      theme: '',
      date: '',
      startTime: '',
      endTime: '',
      location: ''
    });
  };

  const handleSaveConfig = async () => {
    try {
      setIsSavingConfig(true);
      
      const response = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: editedMeeting.theme,
          date: `${editedMeeting.date}T${editedMeeting.startTime}:00`,
          endTime: editedMeeting.endTime ? `${editedMeeting.date}T${editedMeeting.endTime}:00` : null,
          location: editedMeeting.location
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar configurações');
      
      toast.success('Configurações salvas com sucesso!');
      setIsEditingConfig(false);
      await loadMeetingData();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAttendanceSuccess = () => {
    setShowAttendanceModal(false);
    loadMeetingData(); // Recarregar dados para atualizar presenças
  };

  const handleVisitorSuccess = () => {
    setShowVisitorModal(false);
    loadMeetingData(); // Recarregar dados para atualizar visitantes
  };

  const handleNoteSuccess = () => {
    setShowNoteModal(false);
    loadMeetingData(); // Recarregar dados para atualizar notas
  };

  // Funções utilitárias
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AGENDADA: { label: 'Agendada', className: 'bg-blue-100 text-blue-800' },
      EM_ANDAMENTO: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-800' },
      FINALIZADA: { label: 'Finalizada', className: 'bg-green-100 text-green-800' },
      CANCELADA: { label: 'Cancelada', className: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.AGENDADA;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    // Usar UTC para evitar problemas de timezone
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    
    // Criar nova data em UTC para formatação
    const utcDate = new Date(Date.UTC(year, month, day));
    
    return utcDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cálculos de indicadores
  const totalMembers = members.length;
  const presentMembers = meeting?.attendances?.filter(a => a.present).length || 0;
  const attendanceRate = totalMembers > 0 ? Math.round((presentMembers / totalMembers) * 100) : 0;
  const totalVisitors = meeting?.visitors?.length || 0;
  const totalNotes = meeting?.notes?.length || 0;

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados da reunião...</p>
          </div>
      </div>

      {/* Modais */}
      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        onSuccess={handleAttendanceSuccess}
        groupId={groupId}
        meetingId={meetingId}
        members={members}
        existingAttendances={meeting?.attendances || []}
      />

      <VisitorModal
        isOpen={showVisitorModal}
        onClose={() => setShowVisitorModal(false)}
        onSuccess={handleVisitorSuccess}
        groupId={groupId}
        meetingId={meetingId}
      />

      <NoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSuccess={handleNoteSuccess}
        groupId={groupId}
        meetingId={meetingId}
      />
    </div>
  );
}

  if (error || !meeting) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Reunião não encontrada'}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{meeting.theme}</h1>
            <p className="text-muted-foreground">{meeting.smallGroup.name}</p>
          </div>
        </div>
        {getStatusBadge(meeting.status)}
      </div>

      {/* Sistema de Abas */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Tab className={({ selected }) => 
            `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 outline-none ${
              selected 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`
          }>
            <Calendar className="w-4 h-4" />
            Geral
          </Tab>
          <Tab className={({ selected }) => 
            `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 outline-none ${
              selected 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`
          }>
            <Users className="w-4 h-4" />
            Participantes
          </Tab>
          <Tab className={({ selected }) => 
            `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 outline-none ${
              selected 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`
          }>
            <FileText className="w-4 h-4" />
            Notas
          </Tab>
          <Tab className={({ selected }) => 
            `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 outline-none ${
              selected 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`
          }>
            <Settings className="w-4 h-4" />
            Configurações
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-6">
          {/* Aba Geral */}
           <Tab.Panel className="space-y-6">
             {/* Informações da Reunião */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center justify-between">
                   <span>Informações da Reunião</span>
                   {getStatusBadge(meeting.status)}
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Título/Tema */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="text-sm font-medium text-gray-700 mb-1 block">
                       Tema da Reunião
                     </label>
                     <p className="text-lg font-semibold text-gray-900">{meeting.theme}</p>
                   </div>
                   
                   {/* Nome do Grupo */}
                   <div>
                     <label className="text-sm font-medium text-gray-700 mb-1 block">
                       Pequeno Grupo
                     </label>
                     <p className="text-lg text-gray-900">{meeting.smallGroup.name}</p>
                   </div>
                 </div>

                 {/* Data e Horários */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                       <Calendar className="w-4 h-4" />
                       Data
                     </label>
                     <p className="text-gray-900">{formatDate(meeting.date)}</p>
                   </div>
                   
                   <div>
                     <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                       <Clock className="w-4 h-4" />
                       Horário de Início
                     </label>
                     <p className="text-gray-900">{formatTime(meeting.startTime)}</p>
                   </div>
                   
                   {meeting.endTime && (
                     <div>
                       <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                         <Clock className="w-4 h-4" />
                         Horário de Término
                       </label>
                       <p className="text-gray-900">{formatTime(meeting.endTime)}</p>
                     </div>
                   )}
                 </div>

                 {/* Local */}
                 <div>
                   <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                     <MapPin className="w-4 h-4" />
                     Local
                   </label>
                   <p className="text-gray-900">{meeting.location || 'Local não definido'}</p>
                 </div>
               </CardContent>
             </Card>

             {/* Indicadores/Estatísticas */}
             <Card>
               <CardHeader>
                 <CardTitle>Indicadores da Reunião</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   {/* Total de Membros */}
                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                     <div className="text-2xl font-bold text-blue-600">{totalMembers}</div>
                     <div className="text-sm text-blue-700 font-medium">Total de Membros</div>
                     <div className="text-xs text-blue-600 mt-1">No grupo</div>
                   </div>
                   
                   {/* Membros Presentes */}
                   <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                     <div className="text-2xl font-bold text-green-600">{presentMembers}</div>
                     <div className="text-sm text-green-700 font-medium">Presentes</div>
                     <div className="text-xs text-green-600 mt-1">Confirmados</div>
                   </div>
                   
                   {/* Taxa de Presença */}
                   <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                     <div className="text-2xl font-bold text-purple-600">{attendanceRate}%</div>
                     <div className="text-sm text-purple-700 font-medium">Taxa de Presença</div>
                     <div className="text-xs text-purple-600 mt-1">Participação</div>
                   </div>
                   
                   {/* Visitantes */}
                   <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                     <div className="text-2xl font-bold text-orange-600">{totalVisitors}</div>
                     <div className="text-sm text-orange-700 font-medium">Visitantes</div>
                     <div className="text-xs text-orange-600 mt-1">Cadastrados</div>
                   </div>
                 </div>
                 
                 {/* Indicador de Notas */}
                 {totalNotes > 0 && (
                   <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                     <div className="flex items-center gap-2 text-sm text-gray-700">
                       <FileText className="w-4 h-4" />
                       <span className="font-medium">{totalNotes}</span>
                       <span>{totalNotes === 1 ? 'nota registrada' : 'notas registradas'}</span>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>

              {/* Ações Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Marcar Presença */}
                    {(meeting.status === 'AGENDADA' || meeting.status === 'EM_ANDAMENTO') && (
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300"
                        onClick={() => setShowAttendanceModal(true)}
                      >
                        <Users className="w-6 h-6 text-green-600" />
                        <div className="text-center">
                          <div className="font-medium text-sm">Marcar Presença</div>
                          <div className="text-xs text-gray-500">Registrar participantes</div>
                        </div>
                      </Button>
                    )}

                    {/* Marcar Bíblia */}
                    {(meeting.status === 'AGENDADA' || meeting.status === 'EM_ANDAMENTO') && (
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
                        onClick={() => toast.success('Funcionalidade de marcar bíblia será implementada')}
                      >
                        <BookOpen className="w-6 h-6 text-orange-600" />
                        <div className="text-center">
                          <div className="font-medium text-sm">Marcar Bíblia</div>
                          <div className="text-xs text-gray-500">Registrar quem trouxe</div>
                        </div>
                      </Button>
                    )}

                    {/* Adicionar Visitante */}
                    {(meeting.status === 'AGENDADA' || meeting.status === 'EM_ANDAMENTO') && (
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => setShowVisitorModal(true)}
                      >
                        <UserPlus className="w-6 h-6 text-blue-600" />
                        <div className="text-center">
                          <div className="font-medium text-sm">Adicionar Visitante</div>
                          <div className="text-xs text-gray-500">Cadastrar novo visitante</div>
                        </div>
                      </Button>
                    )}

                    {/* Nova Nota */}
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => setShowNoteModal(true)}
                    >
                      <FileText className="w-6 h-6 text-purple-600" />
                      <div className="text-center">
                        <div className="font-medium text-sm">Nova Nota</div>
                        <div className="text-xs text-gray-500">Adicionar observação</div>
                      </div>
                    </Button>

                    {/* Cancelar Reunião */}
                    {(meeting.status === 'AGENDADA' || meeting.status === 'EM_ANDAMENTO') && (
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-300"
                        onClick={handleCancelMeeting}
                        disabled={isUpdatingStatus}
                      >
                        <XCircle className="w-6 h-6 text-red-600" />
                        <div className="text-center">
                          <div className="font-medium text-sm">Cancelar Reunião</div>
                          <div className="text-xs text-gray-500">Alterar status</div>
                        </div>
                      </Button>
                    )}

                    {/* Finalizar Reunião */}
                    {(meeting.status === 'AGENDADA' || meeting.status === 'EM_ANDAMENTO') && (
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300"
                        onClick={handleFinishMeeting}
                        disabled={isUpdatingStatus}
                      >
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div className="text-center">
                          <div className="font-medium text-sm">Finalizar Reunião</div>
                          <div className="text-xs text-gray-500">Marcar como concluída</div>
                        </div>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Tab.Panel>

          {/* Aba Participantes */}
           <Tab.Panel className="space-y-6">
             {/* Sub-abas para Membros e Visitantes */}
             <Tab.Group>
               <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                 <Tab className={({ selected }) =>
                   `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                     selected
                       ? 'bg-white shadow'
                       : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                   }`
                 }>
                   Membros ({totalMembers})
                 </Tab>
                 <Tab className={({ selected }) =>
                   `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                     selected
                       ? 'bg-white shadow'
                       : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                   }`
                 }>
                   Visitantes ({totalVisitors})
                 </Tab>
               </Tab.List>
               
               <Tab.Panels className="mt-6">
                 {/* Sub-aba Membros */}
                 <Tab.Panel>
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center justify-between">
                         <span>Lista de Membros</span>
                         <span className="text-sm text-gray-500">
                           {presentMembers} de {totalMembers} presentes ({attendanceRate}%)
                         </span>
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       {meeting.attendances && meeting.attendances.length > 0 ? (
                         <div className="space-y-3">
                           {meeting.attendances.map((attendance) => (
                             <div key={attendance.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                               <div className="flex items-center gap-3">
                                 <div className={`w-3 h-3 rounded-full ${
                                   attendance.present ? 'bg-green-500' : 'bg-gray-300'
                                 }`}></div>
                                 <div>
                                   <p className="font-medium text-gray-900">{attendance.member.name}</p>
                                   <p className="text-sm text-gray-500">{attendance.member.email}</p>
                                 </div>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                 <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                   attendance.present 
                                     ? 'bg-green-100 text-green-800' 
                                     : 'bg-gray-100 text-gray-800'
                                 }`}>
                                   {attendance.present ? 'Presente' : 'Ausente'}
                                 </span>
                                 
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   onClick={() => {
                                     // TODO: Implementar toggle de presença
                                     toast.success(`Presença de ${attendance.member.name} será alterada`);
                                   }}
                                 >
                                   {attendance.present ? 'Marcar Ausente' : 'Marcar Presente'}
                                 </Button>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center text-gray-500 py-8">
                           <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                           <p>Nenhum membro encontrado</p>
                           <p className="text-sm">Os membros do grupo aparecerão aqui</p>
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 </Tab.Panel>
                 
                 {/* Sub-aba Visitantes */}
                 <Tab.Panel>
                   <Card>
                     <CardHeader>
                       <CardTitle>Lista de Visitantes</CardTitle>
                     </CardHeader>
                     <CardContent>
                       {meeting.visitors && meeting.visitors.length > 0 ? (
                         <div className="space-y-3">
                           {meeting.visitors.map((visitor) => (
                             <div key={visitor.id} className="p-4 border border-gray-200 rounded-lg">
                               <div className="flex items-center justify-between">
                                 <div>
                                   <p className="font-medium text-gray-900">{visitor.name}</p>
                                   {visitor.email && (
                                     <p className="text-sm text-gray-500">{visitor.email}</p>
                                   )}
                                   {visitor.phone && (
                                     <p className="text-sm text-gray-500">{visitor.phone}</p>
                                   )}
                                 </div>
                                 
                                 <div className="flex items-center gap-2">
                                   <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                     Visitante
                                   </span>
                                   
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => {
                                       // TODO: Implementar edição de visitante
                                       toast.success(`Editar dados de ${visitor.name}`);
                                     }}
                                   >
                                     Editar
                                   </Button>
                                 </div>
                               </div>
                               
                               {visitor.notes && (
                                 <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                   <p className="text-sm text-gray-700">
                                     <strong>Observações:</strong> {visitor.notes}
                                   </p>
                                 </div>
                               )}
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center text-gray-500 py-8">
                           <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                           <p>Nenhum visitante cadastrado</p>
                           <p className="text-sm">Clique em &quot;Adicionar Visitante&quot; para cadastrar</p>
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 </Tab.Panel>
               </Tab.Panels>
             </Tab.Group>
           </Tab.Panel>

          {/* Aba Notas */}
           <Tab.Panel className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>Notas e Observações</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Formulário para nova nota */}
                 {isAddingNote && (
                   <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                     <div className="space-y-3">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                           Nova Observação
                         </label>
                         <textarea
                           value={newNote}
                           onChange={(e) => setNewNote(e.target.value)}
                           placeholder="Digite sua observação sobre a reunião..."
                           className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                           rows={4}
                           maxLength={500}
                         />
                         <div className="text-xs text-gray-500 mt-1">
                           {newNote.length}/500 caracteres
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <Button 
                           size="sm" 
                           onClick={handleAddNote}
                           disabled={isSavingNote || !newNote.trim()}
                         >
                           {isSavingNote ? 'Salvando...' : 'Salvar Nota'}
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline" 
                           onClick={handleCancelNote}
                           disabled={isSavingNote}
                         >
                           Cancelar
                         </Button>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Lista de notas existentes */}
                 {meeting.notes && meeting.notes.length > 0 ? (
                   <div className="space-y-4">
                     {meeting.notes.map((note) => (
                       <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-sm font-medium text-gray-900">{note.author.name}</span>
                           <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                         </div>
                         <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.content}</p>
                       </div>
                     ))}
                   </div>
                 ) : (
                   !isAddingNote && (
                     <div className="text-center text-gray-500 py-8">
                       <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                       <p>Nenhuma nota registrada ainda</p>
                       <p className="text-sm">Clique em &quot;Nova Nota&quot; para adicionar observações</p>
                     </div>
                   )
                 )}
               </CardContent>
             </Card>
           </Tab.Panel>

           {/* Aba Configurações */}
           <Tab.Panel className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>Configurações da Reunião</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 {/* Informações Básicas */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Tema da Reunião
                       </label>
                       {isEditingConfig ? (
                         <input
                           type="text"
                           value={editedMeeting.theme}
                           onChange={(e) => setEditedMeeting({...editedMeeting, theme: e.target.value})}
                           className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Digite o tema da reunião"
                         />
                       ) : (
                         <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                           {meeting.theme}
                         </div>
                       )}
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Status
                       </label>
                       <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                         {getStatusBadge(meeting.status)}
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Data e Horários */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-gray-900">Data e Horários</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Data
                       </label>
                       {isEditingConfig ? (
                         <input
                           type="date"
                           value={editedMeeting.date}
                           onChange={(e) => setEditedMeeting({...editedMeeting, date: e.target.value})}
                           className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         />
                       ) : (
                         <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                           {formatDate(meeting.date)}
                         </div>
                       )}
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Horário de Início
                       </label>
                       {isEditingConfig ? (
                         <input
                           type="time"
                           value={editedMeeting.startTime}
                           onChange={(e) => setEditedMeeting({...editedMeeting, startTime: e.target.value})}
                           className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         />
                       ) : (
                         <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                           {formatTime(meeting.startTime)}
                         </div>
                       )}
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Horário de Término
                       </label>
                       {isEditingConfig ? (
                         <input
                           type="time"
                           value={editedMeeting.endTime}
                           onChange={(e) => setEditedMeeting({...editedMeeting, endTime: e.target.value})}
                           className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Opcional"
                         />
                       ) : (
                         <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                           {meeting.endTime ? formatTime(meeting.endTime) : 'Não definido'}
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Local */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-gray-900">Local</h3>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Endereço
                     </label>
                     {isEditingConfig ? (
                       <input
                         type="text"
                         value={editedMeeting.location}
                         onChange={(e) => setEditedMeeting({...editedMeeting, location: e.target.value})}
                         className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         placeholder="Digite o endereço da reunião"
                       />
                     ) : (
                       <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                         {meeting.location}
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Ações */}
                 <div className="pt-4 border-t border-gray-200">
                   <div className="flex gap-3">
                     {isEditingConfig ? (
                       <>
                         <Button 
                           onClick={handleSaveConfig}
                           disabled={isSavingConfig}
                           className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                         >
                           <CheckCircle className="w-4 h-4 mr-2" />
                           {isSavingConfig ? 'Salvando...' : 'Salvar'}
                         </Button>
                         <Button 
                           onClick={handleCancelEditConfig}
                           disabled={isSavingConfig}
                           variant="outline"
                           className="disabled:opacity-50"
                         >
                           <XCircle className="w-4 h-4 mr-2" />
                           Cancelar
                         </Button>
                       </>
                     ) : (
                       <Button 
                         variant="outline" 
                         onClick={handleStartEditConfig}
                       >
                         <Settings className="w-4 h-4 mr-2" />
                         Editar Configurações
                       </Button>
                     )}
                     
                     {meeting.status === 'AGENDADA' && (
                       <Button 
                         variant="outline" 
                         className="text-red-600 border-red-300 hover:bg-red-50"
                         onClick={() => toast.error('Funcionalidade de cancelamento será implementada')}
                       >
                         Cancelar Reunião
                       </Button>
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>
           </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modais */}
      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        onSuccess={handleAttendanceSuccess}
        groupId={groupId}
        meetingId={meetingId}
        members={members}
        existingAttendances={meeting?.attendances || []}
      />

      <VisitorModal
        isOpen={showVisitorModal}
        onClose={() => setShowVisitorModal(false)}
        onSuccess={handleVisitorSuccess}
        groupId={groupId}
        meetingId={meetingId}
      />

      <NoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSuccess={handleNoteSuccess}
        groupId={groupId}
        meetingId={meetingId}
      />
    </div>
  );
}