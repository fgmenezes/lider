"use client";
import { useState } from "react";
import { Search, Filter, MoreVertical, Crown, Shield, UserCheck, Phone, Mail, Calendar, Edit, History } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import EditLeaderRoleModal from "./EditLeaderRoleModal";
import LeaderHistoryModal from "./LeaderHistoryModal";

interface LeadersSectionProps {
  leaders: any[];
  onRefresh: () => void;
}

export default function LeadersSection({ leaders, onRefresh }: LeadersSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<null | { id: string; name: string }>(null);
  const [removingLeaderId, setRemovingLeaderId] = useState<string | null>(null);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<any>(null);

  // Filtrar líderes baseado na busca e filtro
  const filteredLeaders = leaders.filter(leader => {
    const matchesSearch = leader.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leader.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leader.user?.celular?.includes(searchTerm);
    
    const matchesRole = filterRole === "all" || leader.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Função para remover líder
  const handleRemoveLeader = async (leaderId: string) => {
    setRemovingLeaderId(leaderId);
    try {
      // Aqui você implementaria a chamada para a API
      // await removeLeader(leaderId);
      onRefresh();
    } catch (error) {
      console.error("Erro ao remover líder:", error);
    } finally {
      setRemovingLeaderId(null);
      setShowRemoveConfirm(null);
    }
  };

  // Função para editar role
  const handleEditRole = (leader: any) => {
    setSelectedLeader(leader);
    setShowEditRoleModal(true);
  };

  // Função para visualizar histórico
  const handleViewHistory = (leader: any) => {
    setSelectedLeader(leader);
    setShowHistoryModal(true);
  };

  // Função para fechar modais
  const handleCloseModals = () => {
    setShowEditRoleModal(false);
    setShowHistoryModal(false);
    setSelectedLeader(null);
  };

  // Função para obter o ícone baseado no role
  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'LIDER_PRINCIPAL':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'CO_LIDER':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'AUXILIAR':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-gray-600" />;
    }
  };

  // Função para obter o label do role
  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'LIDER_PRINCIPAL':
        return 'Líder Principal';
      case 'CO_LIDER':
        return 'Co-líder';
      case 'AUXILIAR':
        return 'Auxiliar';
      default:
        return role || 'Líder';
    }
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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Líderes do Grupo</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar líderes por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos os roles</option>
                <option value="LIDER_PRINCIPAL">Líder Principal</option>
                <option value="CO_LIDER">Co-líder</option>
                <option value="AUXILIAR">Auxiliar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de líderes */}
      <div className="p-6">
        {filteredLeaders.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterRole !== "all" ? "Nenhum líder encontrado" : "Nenhum líder cadastrado"}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterRole !== "all" 
                ? "Tente ajustar os filtros de busca" 
                : "Adicione líderes para começar a gerenciar o grupo"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeaders.map((leader) => (
              <div
                key={leader.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {leader.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {leader.user?.name || 'Nome não informado'}
                          </h4>
                          {getRoleIcon(leader.role)}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getRoleLabel(leader.role)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {leader.user?.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{leader.user.email}</span>
                            </div>
                          )}
                          {leader.user?.celular && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{leader.user.celular}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Desde {formatDate(leader.since)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditRole(leader)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar role"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewHistory(leader)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Ver histórico"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowRemoveConfirm({ id: leader.userId, name: leader.user?.name })}
                      disabled={removingLeaderId === leader.userId}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remover líder"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de remoção */}
      {showRemoveConfirm && (
        <Dialog open={true} onOpenChange={() => setShowRemoveConfirm(null)}>
          <DialogContent>
            <DialogTitle>Remover Líder</DialogTitle>
            <div className="mb-4">
              <p className="text-gray-600">
                Tem certeza que deseja remover <span className="font-semibold">{showRemoveConfirm.name}</span> como líder deste pequeno grupo?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação não pode ser desfeita e removerá todas as permissões de liderança.
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
                onClick={() => handleRemoveLeader(showRemoveConfirm.id)}
                disabled={removingLeaderId === showRemoveConfirm.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {removingLeaderId === showRemoveConfirm.id ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de edição de role */}
      {showEditRoleModal && selectedLeader && (
        <EditLeaderRoleModal
          isOpen={showEditRoleModal}
          onClose={handleCloseModals}
          leader={selectedLeader}
          onSuccess={onRefresh}
          existingLeaders={leaders}
        />
      )}

      {/* Modal de histórico */}
      {showHistoryModal && selectedLeader && (
        <LeaderHistoryModal
          isOpen={showHistoryModal}
          onClose={handleCloseModals}
          leader={selectedLeader}
        />
      )}
    </div>
  );
}
