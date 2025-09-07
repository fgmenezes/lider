"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FREQUENCIAS_LABEL } from "@/constants/frequencias";
import { Tab } from '@headlessui/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSession } from "next-auth/react";
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle, MoreVertical, Eye, Users, UserPlus, FileText } from "lucide-react";
import PeopleTab from "@/components/forms/PeopleTab";
import GroupObservationsSection from "./GroupObservationsSection";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import AttendanceModal from '@/components/forms/AttendanceModal';
import VisitorModal from '@/components/forms/VisitorModal';
import NoteModal from '@/components/forms/NoteModal';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export default function SmallGroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id as string;
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState("");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [removingLeaderId, setRemovingLeaderId] = useState<string | null>(null);
  const [confirmRemoveLeader, setConfirmRemoveLeader] = useState<null | { id: string; name: string }>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<null | { id: string; name: string }>(null);
  
  // Estados para gerenciamento de reuniões
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingType, setMeetingType] = useState("PG");
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingError, setMeetingError] = useState("");
  const [meetingSuccess, setMeetingSuccess] = useState(false);
  
  // Estados para modais de ações das reuniões
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [confirmDeleteMeeting, setConfirmDeleteMeeting] = useState<null | { id: string; date: string }>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const { data: session } = useSession();

  useEffect(() => {
    async function fetchGroup() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/small-groups/${groupId}`);
        if (!res.ok) throw new Error("Erro ao buscar grupo");
        const data = await res.json();
        setGroup(data.group);
        setMeetings(data.group.meetings || []);
      } catch (e: any) {
        setError(e.message || "Erro ao buscar grupo");
      } finally {
        setLoading(false);
      }
    }
    if (groupId) fetchGroup();
  }, [groupId]);

  // Função para recarregar dados do grupo
  const fetchGroup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/small-groups/${groupId}`);
      if (!res.ok) throw new Error("Erro ao buscar grupo");
      const data = await res.json();
      setGroup(data.group);
      setMeetings(data.group.meetings || []);
    } catch (e: any) {
      setError(e.message || "Erro ao buscar grupo");
    } finally {
      setLoading(false);
    }
  };

  // Funções para ações das reuniões
  const handleCancelMeeting = async (meetingId: string) => {
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
      await fetchGroup();
    } catch (error) {
      console.error('Erro ao cancelar reunião:', error);
      toast.error('Erro ao cancelar reunião');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFinishMeeting = async (meetingId: string) => {
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
      await fetchGroup();
    } catch (error) {
      console.error('Erro ao finalizar reunião:', error);
      toast.error('Erro ao finalizar reunião');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenAttendance = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowAttendanceModal(true);
  };

  const handleOpenVisitor = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setShowVisitorModal(true);
  };

  const handleOpenNote = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setShowNoteModal(true);
  };

  // Função para remover líder
  async function handleRemoveLeader(leaderId: string) {
    setRemovingLeaderId(leaderId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/small-groups/${groupId}/remove-leader`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: leaderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Erro ao remover líder.");
      setFeedback("Líder removido com sucesso!");
      await fetchGroup();
    } catch (e: any) {
      setFeedback(e.message || "Erro ao remover líder.");
    } finally {
      setRemovingLeaderId(null);
      setConfirmRemoveLeader(null);
    }
  }

  // Função para remover membro
  async function handleRemoveMember(memberId: string) {
    setRemovingMemberId(memberId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/small-groups/${groupId}/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Erro ao remover membro.");
      setFeedback("Membro removido com sucesso!");
      await fetchGroup();
    } catch (e: any) {
      setFeedback(e.message || "Erro ao remover membro.");
    } finally {
      setRemovingMemberId(null);
      setConfirmRemoveMember(null);
    }
  }

  // Funções para ações das reuniões
  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/small-groups/${groupId}/members`);
      if (!response.ok) throw new Error('Erro ao carregar membros');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros do grupo');
    }
  };

  // Função para criar nova reunião
  async function handleAddMeeting() {
    if (!meetingDate || !meetingTime) {
      setMeetingError("Data e horário são obrigatórios");
      return;
    }
    
    setMeetingSubmitting(true);
    setMeetingError("");
    setMeetingSuccess(false);
    
    try {
      const res = await fetch(`/api/small-groups/${groupId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: `${meetingDate}T${meetingTime}:00`,
          type: meetingType
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar reunião");
      }
      
      setMeetingSuccess(true);
      setMeetingDate("");
      setMeetingTime("");
      // Atualizar lista de reuniões
      await fetchGroup();
      
      // Fechar modal após 1.5 segundos
      setTimeout(() => {
        setShowAddMeetingModal(false);
        setMeetingSuccess(false);
      }, 1500);
      
    } catch (e: any) {
      setMeetingError(e.message || "Erro ao criar reunião");
    } finally {
      setMeetingSubmitting(false);
    }
  }
  
  // Função para excluir reunião
  async function handleDeleteMeeting(meetingId: string) {
    if (!meetingId) return;
    
    setDeletingMeetingId(meetingId);
    
    try {
      const res = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir reunião");
      }
      
      setFeedback("Reunião excluída com sucesso!");
      // Atualizar lista de reuniões
      await fetchGroup();
      
    } catch (e: any) {
      setFeedback(e.message || "Erro ao excluir reunião");
    } finally {
      setDeletingMeetingId(null);
      setConfirmDeleteMeeting(null);
    }
  }

  if (loading) return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Carregando...</div>;
  if (error) return <div className="p-8 text-center" style={{ color: 'var(--color-danger)' }}>{error}</div>;
  if (!group) return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Grupo não encontrado.</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Detalhes do Pequeno Grupo</h1>
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
      <Tab.Group>
        <Tab.List className="flex space-x-2 border-b-2 border-gray-200 mb-8 bg-gray-50 rounded-t-lg p-2 shadow-sm">
          <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Resumo</Tab>
          <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Pessoas</Tab>
          <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Reuniões</Tab>
          <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Observações</Tab>
        </Tab.List>
        <Tab.Panels>
          {/* Aba Resumo */}
          <Tab.Panel>
            <div className="rounded shadow p-6 mb-6 space-y-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-700">Dados do Grupo</h2>
                <div className="mb-1"><span className="font-semibold">Nome:</span> {group.name}</div>
                <div className="mb-1"><span className="font-semibold">Descrição:</span> {group.description || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Status:</span> {group.status}</div>
                <div className="mb-1"><span className="font-semibold">Recorrência:</span> {group.frequency ? FREQUENCIAS_LABEL[group.frequency] || group.frequency : '-'}</div>
                <div className="mb-1"><span className="font-semibold">Dia da Semana:</span> {group.dayOfWeek || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Horário:</span> {group.time || '-'}{group.endTime ? ` às ${group.endTime}` : ''}</div>
                <div className="mb-1"><span className="font-semibold">Data de Início:</span> {group.startDate ? new Date(group.startDate).toLocaleDateString() : '-'}</div>
                <div className="mb-1"><span className="font-semibold">Anfitrião:</span> {group.hostName || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Celular Anfitrião:</span> {group.hostPhone || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Endereço:</span> {`${group.rua || '-'}, ${group.numero || '-'}${group.complemento ? ', ' + group.complemento : ''}, ${group.bairro || '-'}, ${group.municipio || '-'}, ${group.estado || '-'}, CEP: ${group.cep || '-'}`}</div>
              </div>
              <div className="flex space-x-4 mt-4">
                <div className="rounded p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{group.members?.length || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Membros</div>
                </div>
                <div className="rounded p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{group.leaders?.length || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Líderes</div>
                </div>
                <div className="rounded p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{meetings?.length || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Reuniões</div>
                </div>
              </div>
            </div>
          </Tab.Panel>
          {/* Aba Pessoas */}
          <Tab.Panel>
            <PeopleTab group={group} onRefresh={fetchGroup} />
          </Tab.Panel>
          {/* Aba Reuniões com sub-abas */}
          <Tab.Panel>
            <Tab.Group>
              <Tab.List className="flex space-x-2 border-b border-gray-200 mb-4 bg-gray-50 rounded-t p-1 shadow-sm">
                <Tab className={({ selected }) => `px-4 py-1.5 text-sm font-medium rounded-t transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Próximas</Tab>
                <Tab className={({ selected }) => `px-4 py-1.5 text-sm font-medium rounded-t transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Realizadas</Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <div className="rounded shadow p-4 mb-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <h2 className="text-lg font-semibold mb-2">Próximas Reuniões</h2>
                    {meetings.filter((m: any) => new Date(m.date) >= new Date()).length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y rounded shadow" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--color-neutral)' }}>
                          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Data</th>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Horário</th>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Status</th>
                              <th className="px-4 py-2 text-center text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: 'var(--color-neutral)' }}>
                            {meetings
                              .filter((m: any) => new Date(m.date) >= new Date())
                              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((meeting: any) => (
                              <tr key={meeting.id} className="hover:opacity-80" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                <td className="px-4 py-2 cursor-pointer" style={{ color: 'var(--text-primary)' }} onClick={() => router.push(`/dashboard/pequenos-grupos/${group.id}/reunioes/${meeting.id}`)}>{meeting.date ? new Date(meeting.date).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-2 cursor-pointer" style={{ color: 'var(--text-primary)' }} onClick={() => router.push(`/dashboard/pequenos-grupos/${group.id}/reunioes/${meeting.id}`)}>{meeting.date ? new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td className="px-4 py-2 cursor-pointer" style={{ color: 'var(--text-primary)' }} onClick={() => router.push(`/dashboard/pequenos-grupos/${group.id}/reunioes/${meeting.id}`)}>{meeting.status || '-'}</td>
                                <td className="px-4 py-2 text-center">
                                  <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                      <button className="p-1 hover:opacity-80 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                                      </button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content align="end" className="rounded shadow-lg p-1 min-w-[140px] z-50" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:opacity-80 rounded cursor-pointer flex items-center" style={{ color: 'var(--text-primary)' }} onSelect={() => router.push(`/dashboard/pequenos-grupos/${group.id}/reunioes/${meeting.id}`)}>
                                        <Eye className="w-4 h-4 mr-2" style={{ color: 'var(--text-primary)' }} />
                                        Ver reunião
                                      </DropdownMenu.Item>
                                      {(meeting.status === 'AGENDADA' || meeting.status === 'EM_ANDAMENTO') && (
                                        <>
                                          <DropdownMenu.Item className="px-3 py-2 text-sm hover:opacity-80 rounded cursor-pointer flex items-center" style={{ color: 'var(--text-primary)' }} onSelect={() => handleOpenAttendance(meeting)}>
                                            <Users className="w-4 h-4 mr-2" style={{ color: 'var(--text-primary)' }} />
                                            Marcar presença
                                          </DropdownMenu.Item>
                                          <DropdownMenu.Item className="px-3 py-2 text-sm hover:opacity-80 rounded cursor-pointer flex items-center" style={{ color: 'var(--text-primary)' }} onSelect={() => handleOpenVisitor(meeting.id)}>
                                            <UserPlus className="w-4 h-4 mr-2" style={{ color: 'var(--text-primary)' }} />
                                            Adicionar visitante
                                          </DropdownMenu.Item>
                                        </>
                                      )}
                                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:opacity-80 rounded cursor-pointer flex items-center" style={{ color: 'var(--text-primary)' }} onSelect={() => handleOpenNote(meeting.id)}>
                                        <FileText className="w-4 h-4 mr-2" style={{ color: 'var(--text-primary)' }} />
                                        Adicionar nota
                                      </DropdownMenu.Item>
                                      {(meeting.status === 'AGENDADA' || meeting.status === 'EM_ANDAMENTO') && (
                                        <>
                                          <DropdownMenu.Item className="px-3 py-2 text-sm hover:opacity-80 rounded cursor-pointer flex items-center" style={{ color: 'var(--color-danger)' }} onSelect={() => handleCancelMeeting(meeting.id)}>
                                            <XCircle className="w-4 h-4 mr-2" style={{ color: 'var(--color-danger)' }} />
                                            Cancelar reunião
                                          </DropdownMenu.Item>
                                          <DropdownMenu.Item className="px-3 py-2 text-sm hover:opacity-80 rounded cursor-pointer flex items-center" style={{ color: 'var(--color-success)' }} onSelect={() => handleFinishMeeting(meeting.id)}>
                                            <CheckCircle className="w-4 h-4 mr-2" style={{ color: 'var(--color-success)' }} />
                                            Finalizar reunião
                                          </DropdownMenu.Item>
                                        </>
                                      )}
                                    </DropdownMenu.Content>
                                  </DropdownMenu.Root>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500">Nenhuma reunião futura encontrada.</div>
                    )}
                  </div>
                </Tab.Panel>
                <Tab.Panel>
                  <div className="bg-white rounded shadow p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-2">Reuniões Realizadas</h2>
                    {meetings.filter((m: any) => new Date(m.date) < new Date()).length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {meetings
                              .filter((m: any) => new Date(m.date) < new Date())
                              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((meeting: any) => (
                              <tr key={meeting.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 cursor-pointer" onClick={() => router.push(`/dashboard/pequenos-grupos/${group.id}/reunioes/${meeting.id}`)}>{meeting.date ? new Date(meeting.date).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-2 cursor-pointer" onClick={() => router.push(`/dashboard/pequenos-grupos/${group.id}/reunioes/${meeting.id}`)}>{meeting.date ? new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td className="px-4 py-2 cursor-pointer" onClick={() => router.push(`/dashboard/pequenos-grupos/${group.id}/reunioes/${meeting.id}`)}>{meeting.status || '-'}</td>
                                <td className="px-4 py-2 text-center">
                                  <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                      <button className="p-1 hover:bg-gray-100 rounded">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content align="end" className="bg-white rounded shadow-lg p-1 min-w-[140px] z-50">
                                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center" onSelect={() => router.push(`/dashboard/pequenos-grupos/${group.id}/reunioes/${meeting.id}`)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Ver reunião
                                      </DropdownMenu.Item>
                                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center" onSelect={() => handleOpenNote(meeting.id)}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Adicionar nota
                                      </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                  </DropdownMenu.Root>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500">Nenhuma reunião realizada encontrada.</div>
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </Tab.Panel>
          {/* Aba Observações do Grupo */}
          <Tab.Panel>
            <GroupObservationsSection groupId={group.id} members={group.members || []} onRefresh={fetchGroup} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>





      {/* Modal de confirmação de remoção de líder */}
      {confirmRemoveLeader && (
        <Dialog open={true} onOpenChange={() => setConfirmRemoveLeader(null)}>
          <DialogContent>
            <DialogTitle>Remover Líder</DialogTitle>
            <div className="mb-4">Tem certeza que deseja remover <span className="font-semibold">{confirmRemoveLeader.name}</span> deste pequeno grupo?</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setConfirmRemoveLeader(null)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold disabled:opacity-50" disabled={removingLeaderId === confirmRemoveLeader.id} onClick={() => handleRemoveLeader(confirmRemoveLeader.id)}>
                Remover
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de confirmação de remoção de membro */}
      {confirmRemoveMember && (
        <Dialog open={true} onOpenChange={() => setConfirmRemoveMember(null)}>
          <DialogContent>
            <DialogTitle>Remover Membro</DialogTitle>
            <div className="mb-4">Tem certeza que deseja remover <span className="font-semibold">{confirmRemoveMember.name}</span> deste pequeno grupo?</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setConfirmRemoveMember(null)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold disabled:opacity-50" disabled={removingMemberId === confirmRemoveMember.id} onClick={() => handleRemoveMember(confirmRemoveMember.id)}>
                Remover
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Presença */}
      {showAttendanceModal && selectedMeeting && (
        <AttendanceModal
          isOpen={showAttendanceModal}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedMeeting(null);
          }}
          meetingId={selectedMeeting.id}
          groupId={group?.id || ''}
          members={group?.members || []}
          existingAttendances={selectedMeeting.attendances || []}
          onSuccess={() => {
            setShowAttendanceModal(false);
            setSelectedMeeting(null);
            fetchGroup();
          }}
        />
      )}

      {/* Modal de Visitante */}
      {showVisitorModal && selectedMeetingId && (
        <VisitorModal
          isOpen={showVisitorModal}
          onClose={() => {
            setShowVisitorModal(false);
            setSelectedMeetingId(null);
          }}
          meetingId={selectedMeetingId}
          groupId={group?.id || ''}
          onSuccess={() => {
            setShowVisitorModal(false);
            setSelectedMeetingId(null);
            fetchGroup();
          }}
        />
      )}

      {/* Modal de Nota */}
      {showNoteModal && selectedMeetingId && (
        <NoteModal
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setSelectedMeetingId(null);
          }}
          meetingId={selectedMeetingId}
          groupId={group?.id || ''}
          onSuccess={() => {
            setShowNoteModal(false);
            setSelectedMeetingId(null);
            fetchGroup();
          }}
        />
      )}
    </div>
  );
}