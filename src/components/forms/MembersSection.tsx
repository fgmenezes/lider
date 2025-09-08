"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Users, Phone, Mail, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle, Edit, History, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import EditMemberStatusModal from "./EditMemberStatusModal";

interface FrequencyData {
  memberId: string;
  member: {
    id: string;
    nome: string;
    email?: string;
  };
  frequency: {
    status: 'alta' | 'media' | 'baixa';
    attendanceRate: number;
    presentCount: number;
    totalMeetings: number;
    streak: {
      count: number;
      type: 'present' | 'absent' | null;
    };
    lastAttendances: Array<{
      meetingId: string;
      date: string;
      present: boolean;
    }>;
  };
}

interface MembersSectionProps {
  members: any[];
  onRefresh: () => void;
  group?: {
    id: string;
    ministryId: string;
    leaders: Array<{ userId: string }>;
  };
}

export default function MembersSection({ members, onRefresh, group }: MembersSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFrequency, setFilterFrequency] = useState("all");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<null | { id: string; name: string }>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([]);
  const [loadingFrequency, setLoadingFrequency] = useState(false);

  // Carregar dados de frequência
  useEffect(() => {
    if (group?.id) {
      fetchFrequencyData();
    }
  }, [group?.id, fetchFrequencyData]);

  const fetchFrequencyData = useCallback(async () => {
    if (!group?.id) return;
    
    setLoadingFrequency(true);
    try {
      const response = await fetch(`/api/small-groups/${group.id}/members/frequency`);
      if (response.ok) {
        const data = await response.json();
        setFrequencyData(data.membersFrequency || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de frequência:', error);
    } finally {
      setLoadingFrequency(false);
    }
  }, [group?.id]);

  // Função para obter dados de frequência de um membro
  const getMemberFrequencyData = (memberId?: string): FrequencyData | undefined => {
    if (!memberId || !frequencyData) return undefined;
    return frequencyData.find(data => data.member.id === memberId);
  };

  // Filtrar membros baseado na busca e filtros
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.member?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.member?.phone?.includes(searchTerm);
    
    const matchesStatus = filterStatus === "all" || member.status === filterStatus;
    
    const memberFreqData = getMemberFrequencyData(member.member?.id);
    const memberFreqStatus = memberFreqData?.frequency.status || 'media';
    const matchesFrequency = filterFrequency === "all" || memberFreqStatus === filterFrequency;
    
    return matchesSearch && matchesStatus && matchesFrequency;
  });

  // Função para obter o status de frequência real
  const getFrequencyStatus = (member: any) => {
    const memberFreqData = getMemberFrequencyData(member.member?.id);
    return memberFreqData?.frequency.status || 'media';
  };

  // Função para obter o ícone de frequência
  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "alta":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "media":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "baixa":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Função para obter o label de frequência
  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "alta":
        return "Alta Frequência";
      case "media":
        return "Frequência Média";
      case "baixa":
        return "Baixa Frequência";
      default:
        return "Frequência Média";
    }
  };

  // Função para obter o ícone de status
  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'INATIVO':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'TEMPORARIO':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'AFASTADO':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  // Função para obter o label de status
  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
        return 'Ativo';
      case 'INATIVO':
        return 'Inativo';
      case 'TEMPORARIO':
        return 'Temporário';
      case 'AFASTADO':
        return 'Afastado';
      default:
        return status || 'Ativo';
    }
  };

  // Função para remover membro
  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    try {
      // Aqui você implementaria a chamada para a API
      // await removeMember(memberId);
      onRefresh();
    } catch (error) {
      console.error("Erro ao remover membro:", error);
    } finally {
      setRemovingMemberId(null);
      setShowRemoveConfirm(null);
    }
  };

  // Função para editar status
  const handleEditStatus = (member: any) => {
    setSelectedMember(member);
    setShowEditStatusModal(true);
  };

  // Função para fechar modais
  const handleCloseModals = () => {
    setShowEditStatusModal(false);
    setSelectedMember(null);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Cabeçalho com busca e filtros */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Membros do Grupo</h3>
            <div className="text-sm text-gray-500">
              {filteredMembers.length} de {members.length} membros
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar membros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            {/* Filtro por status */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos os status</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="TEMPORARIO">Temporário</option>
                <option value="AFASTADO">Afastado</option>
              </select>
            </div>
            
            {/* Filtro por frequência */}
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterFrequency}
                onChange={(e) => setFilterFrequency(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todas as frequências</option>
                <option value="alta">Alta Frequência</option>
                <option value="media">Frequência Média</option>
                <option value="baixa">Baixa Frequência</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de membros */}
      <div className="p-6">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== "all" || filterFrequency !== "all" ? "Nenhum membro encontrado" : "Nenhum membro cadastrado"}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== "all" || filterFrequency !== "all"
                ? "Tente ajustar os filtros de busca" 
                : "Adicione membros para começar a gerenciar o grupo"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map((member) => {
              const frequencyStatus = getFrequencyStatus(member);
              const memberFreqData = getMemberFrequencyData(member.member?.id);
              
              return (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-lg">
                              {member.member?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">
                              {member.member?.name || 'Nome não informado'}
                            </h4>
                            {getStatusIcon(member.status)}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {getStatusLabel(member.status)}
                            </span>
                          </div>
                          
                          {/* Informações de frequência detalhadas */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              {getFrequencyIcon(frequencyStatus)}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                frequencyStatus === 'alta' ? 'bg-green-100 text-green-800' :
                                frequencyStatus === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {getFrequencyLabel(frequencyStatus)}
                              </span>
                              {memberFreqData && (
                                <span className="text-sm font-medium text-gray-700">
                                  {memberFreqData.frequency.attendanceRate}% de presença
                                </span>
                              )}
                            </div>
                            
                            {memberFreqData && (
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="w-4 h-4" />
                                  <span>{memberFreqData.frequency.presentCount}/{memberFreqData.frequency.totalMeetings} reuniões</span>
                                </div>
                                {memberFreqData.frequency.streak.count > 1 && (
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                    memberFreqData.frequency.streak.type === 'present' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {memberFreqData.frequency.streak.type === 'present' ? (
                                      <CheckCircle className="w-3 h-3" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                                    <span>
                                      {memberFreqData.frequency.streak.count} {memberFreqData.frequency.streak.type === 'present' ? 'presenças' : 'faltas'} seguidas
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {member.member?.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{member.member.email}</span>
                              </div>
                            )}
                            {member.member?.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{member.member.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Desde {formatDate(member.joinedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditStatus(member)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar status"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowRemoveConfirm({ id: member.memberId, name: member.member?.name })}
                        disabled={removingMemberId === member.memberId}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remover membro"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmação de remoção */}
      {showRemoveConfirm && (
        <Dialog open={true} onOpenChange={() => setShowRemoveConfirm(null)}>
          <DialogContent>
            <DialogTitle>Remover Membro</DialogTitle>
            <div className="mb-4">
              <p className="text-gray-600">
                Tem certeza que deseja remover <span className="font-semibold">{showRemoveConfirm.name}</span> deste pequeno grupo?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação não pode ser desfeita e removerá o membro de todas as atividades do grupo.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRemoveMember(showRemoveConfirm.id)}
                disabled={removingMemberId === showRemoveConfirm.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {removingMemberId === showRemoveConfirm.id ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de edição de status */}
      {showEditStatusModal && selectedMember && (
        <EditMemberStatusModal
          isOpen={showEditStatusModal}
          onClose={handleCloseModals}
          member={selectedMember}
          onSuccess={onRefresh}
          group={group}
        />
      )}
    </div>
  );
}
