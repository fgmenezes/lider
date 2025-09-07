"use client";
import { useState, useEffect } from "react";
import { Crown, Shield, UserCheck, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface EditLeaderRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: any;
  onSuccess: () => void;
  existingLeaders: any[];
}

interface RoleChange {
  role: string;
  since: string;
  until?: string;
  reason?: string;
}

export default function EditLeaderRoleModal({ 
  isOpen, 
  onClose, 
  leader, 
  onSuccess, 
  existingLeaders 
}: EditLeaderRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState(leader?.role || 'AUXILIAR');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && leader) {
      setSelectedRole(leader.role || 'AUXILIAR');
      setStartDate(leader.since ? new Date(leader.since).toISOString().split('T')[0] : '');
      setEndDate('');
      setReason('');
      setError('');
      setWarnings([]);
    }
  }, [isOpen, leader]);

  // Validate role changes
  useEffect(() => {
    const newWarnings: string[] = [];
    
    // Check if trying to set multiple LIDER_PRINCIPAL
    if (selectedRole === 'LIDER_PRINCIPAL') {
      const hasPrincipal = existingLeaders.some(l => 
        l.id !== leader.id && l.role === 'LIDER_PRINCIPAL'
      );
      if (hasPrincipal) {
        newWarnings.push('Já existe um Líder Principal. Apenas um pode ter este role.');
      }
    }

    // Check if start date is in the future
    if (startDate && new Date(startDate) > new Date()) {
      newWarnings.push('Data de início não pode ser no futuro.');
    }

    // Check if end date is before start date
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      newWarnings.push('Data de fim deve ser posterior à data de início.');
    }

    setWarnings(newWarnings);
  }, [selectedRole, startDate, endDate, existingLeaders, leader]);

  const handleSubmit = async () => {
    if (!startDate) {
      setError('Data de início é obrigatória');
      return;
    }

    if (warnings.length > 0) {
      setError('Corrija os avisos antes de continuar');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/small-groups/${leader.smallGroupId}/leaders/${leader.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          since: startDate,
          until: endDate || null,
          reason: reason || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Erro ao atualizar role');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar role');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'LIDER_PRINCIPAL':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      case 'CO_LIDER':
        return <Shield className="w-5 h-5 text-blue-600" />;
      case 'AUXILIAR':
        return <UserCheck className="w-5 h-5 text-green-600" />;
      default:
        return <UserCheck className="w-5 h-5 text-gray-600" />;
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'LIDER_PRINCIPAL':
        return 'Responsável principal pelo grupo, com autoridade máxima';
      case 'CO_LIDER':
        return 'Auxilia o líder principal e pode assumir responsabilidades';
      case 'AUXILIAR':
        return 'Apoia nas atividades do grupo e pode liderar ocasionalmente';
      default:
        return 'Role não definido';
    }
  };

  const canSubmit = startDate && warnings.length === 0 && !submitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
          {getRoleIcon(selectedRole)}
          Editar Role do Líder
        </DialogTitle>

        <div className="space-y-4">
          {/* Informações do líder */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">{leader?.user?.name}</h4>
            <p className="text-sm text-gray-600">Role atual: {getRoleLabel(leader?.role)}</p>
          </div>

          {/* Seleção de role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Novo Role
            </label>
            <div className="space-y-2">
              {['LIDER_PRINCIPAL', 'CO_LIDER', 'AUXILIAR'].map((role) => (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRole === role
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    {getRoleIcon(role)}
                    <span className="font-medium">{getRoleLabel(role)}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {getRoleDescription(selectedRole)}
            </p>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Fim (opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da Mudança (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Promoção, reorganização do grupo..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

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
                  <CheckCircle className="w-4 h-4" />
                  Atualizar Role
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
