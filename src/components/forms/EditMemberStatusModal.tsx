"use client";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, Calendar, Check, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';

interface EditMemberStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
  onSuccess: () => void;
  group?: {
    ministryId: string;
    leaders: Array<{ userId: string }>;
  };
}

export default function EditMemberStatusModal({ 
  isOpen, 
  onClose, 
  member, 
  onSuccess,
  group 
}: EditMemberStatusModalProps) {
  const { data: session } = useSession();
  const [selectedStatus, setSelectedStatus] = useState(member?.status || 'ATIVO');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && member) {
      setSelectedStatus(member.status || 'ATIVO');
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      setReason('');
      setRequiresApproval(false);
      setError('');
      setWarnings([]);
    }
  }, [isOpen, member]);

  // Verificar permissões do usuário
  const hasPermission = () => {
    if (!session?.user) return false;
    
    // ADMIN sempre tem permissão
    if (session.user.role === 'ADMIN') return true;
    
    // MASTER do ministério tem permissão
    if (session.user.role === 'MASTER' && session.user.masterMinistryId === group?.ministryId) return true;
    
    // Líder do grupo tem permissão
    if (group?.leaders?.some(leader => leader.userId === session.user.id)) return true;
    
    return false;
  };

  // Validate status changes
  useEffect(() => {
    const newWarnings: string[] = [];
    
    // Check if status is changing to something critical
    if (selectedStatus === 'INATIVO' || selectedStatus === 'AFASTADO') {
      newWarnings.push('Este status pode afetar a participação do membro no grupo.');
      // Só requer aprovação se o usuário não tiver permissão
      setRequiresApproval(!hasPermission());
    } else {
      setRequiresApproval(false);
    }

    // Check if effective date is in the future
    if (effectiveDate && new Date(effectiveDate) > new Date()) {
      newWarnings.push('Data de efetivação está no futuro.');
    }

    setWarnings(newWarnings);
  }, [selectedStatus, effectiveDate, reason]);

  const handleSubmit = async () => {
    if (!effectiveDate) {
      setError('Data de efetivação é obrigatória');
      return;
    }

    // Verificar se a data está no futuro
    if (effectiveDate && new Date(effectiveDate) > new Date()) {
      setError('Data de efetivação não pode estar no futuro');
      return;
    }

    // Verificar se motivo é obrigatório para status críticos
    if ((selectedStatus === 'INATIVO' || selectedStatus === 'AFASTADO') && !reason.trim()) {
      setError('Motivo é obrigatório para mudanças de status críticas');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/small-groups/${member.smallGroupId}/members/${member.memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          effectiveDate,
          statusChangeReason: reason || null,
          requiresApproval
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Erro ao atualizar status');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'INATIVO':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'TEMPORARIO':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'AFASTADO':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'Membro participa normalmente das atividades do grupo';
      case 'INATIVO':
        return 'Membro não participa mais das atividades do grupo';
      case 'TEMPORARIO':
        return 'Membro está temporariamente ausente (viagem, saúde, etc.)';
      case 'AFASTADO':
        return 'Membro está afastado por questões pessoais ou disciplinares';
      default:
        return 'Status não definido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-green-100 text-green-800';
      case 'INATIVO':
        return 'bg-red-100 text-red-800';
      case 'TEMPORARIO':
        return 'bg-yellow-100 text-yellow-800';
      case 'AFASTADO':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Verificar se pode submeter - não bloquear por warnings informativos
  const canSubmit = effectiveDate && !submitting && !(effectiveDate && new Date(effectiveDate) > new Date());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
          {getStatusIcon(selectedStatus)}
          Editar Status do Membro
        </DialogTitle>

        <div className="space-y-4">
          {/* Informações do membro */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">{member?.member?.name}</h4>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member?.status)}`}>
                {getStatusLabel(member?.status)}
              </span>
              <span className="text-sm text-gray-600">Status atual</span>
            </div>
          </div>

          {/* Seleção de status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Novo Status
            </label>
            <div className="space-y-2">
              {['ATIVO', 'TEMPORARIO', 'AFASTADO', 'INATIVO'].map((status) => (
                <label
                  key={status}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStatus === status
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="font-medium">{getStatusLabel(status)}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {getStatusDescription(selectedStatus)}
            </p>
          </div>

          {/* Data de efetivação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Efetivação *
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da Mudança {(selectedStatus === 'INATIVO' || selectedStatus === 'AFASTADO') && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={(selectedStatus === 'INATIVO' || selectedStatus === 'AFASTADO') ? "Motivo obrigatório para esta mudança..." : "Ex: Viagem, saúde, questões pessoais..."}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={selectedStatus === 'INATIVO' || selectedStatus === 'AFASTADO'}
            />
          </div>

          {/* Aviso de aprovação */}
          {requiresApproval && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Aprovação Necessária</span>
              </div>
              <p className="text-sm text-orange-700">
                Esta mudança de status requer aprovação de um líder ou administrador.
              </p>
            </div>
          )}

          {/* Avisos */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Avisos</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Atualizando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {requiresApproval ? 'Solicitar Aprovação' : 'Atualizar Status'}
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
