"use client";
import { useState, useEffect } from "react";
import { History, Crown, Shield, UserCheck, Calendar, Clock, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface LeaderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: any;
}

interface RoleHistory {
  id: string;
  role: string;
  since: string;
  until?: string;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}

export default function LeaderHistoryModal({ isOpen, onClose, leader }: LeaderHistoryModalProps) {
  const [history, setHistory] = useState<RoleHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock data - será substituído por API real
  useEffect(() => {
    if (isOpen && leader) {
      setLoading(true);
      // Simular carregamento de histórico
      setTimeout(() => {
        const mockHistory: RoleHistory[] = [
          {
            id: '1',
            role: 'AUXILIAR',
            since: '2024-01-15',
            until: '2024-03-20',
            reason: 'Início como auxiliar do grupo',
            createdAt: '2024-01-15T10:00:00Z',
            createdBy: 'Administrador'
          },
          {
            id: '2',
            role: 'CO_LIDER',
            since: '2024-03-20',
            until: '2024-06-15',
            reason: 'Promoção por bom desempenho',
            createdAt: '2024-03-20T14:30:00Z',
            createdBy: 'Líder Principal'
          },
          {
            id: '3',
            role: 'CO_LIDER',
            since: '2024-06-15',
            reason: 'Role atual',
            createdAt: '2024-06-15T09:15:00Z',
            createdBy: 'Sistema'
          }
        ];
        setHistory(mockHistory);
        setLoading(false);
      }, 500);
    }
  }, [isOpen, leader]);

  const getRoleIcon = (role: string) => {
    switch (role) {
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

  const getRoleLabel = (role: string) => {
    switch (role) {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const isCurrentRole = (historyItem: RoleHistory) => {
    return !historyItem.until;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
          <History className="w-6 h-6 text-blue-600" />
          Histórico de Roles - {leader?.user?.name}
        </DialogTitle>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Carregando histórico...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum histórico encontrado</h3>
              <p className="text-gray-500">Este líder ainda não teve mudanças de role registradas.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isCurrentRole(item)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Header do item */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(item.role)}
                      <div>
                        <h4 className={`font-semibold ${
                          isCurrentRole(item) ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {getRoleLabel(item.role)}
                        </h4>
                        {isCurrentRole(item) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Role Atual
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(item.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Período */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="text-xs text-gray-500">Desde</div>
                        <div className="font-medium">{formatDate(item.since)}</div>
                      </div>
                    </div>
                    {item.until ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="text-xs text-gray-500">Até</div>
                          <div className="font-medium">{formatDate(item.until)}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Status</div>
                          <div className="font-medium text-blue-600">Em andamento</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Motivo e responsável */}
                  <div className="grid grid-cols-2 gap-4">
                    {item.reason && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-600 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Motivo</div>
                          <div className="text-sm">{item.reason}</div>
                        </div>
                      </div>
                    )}
                    {item.createdBy && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-600 font-medium">
                            {item.createdBy.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Alterado por</div>
                          <div className="text-sm font-medium">{item.createdBy}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Indicador de duração */}
                  {item.until && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Duração: {Math.ceil((new Date(item.until).getTime() - new Date(item.since).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Total de mudanças: {history.length}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
