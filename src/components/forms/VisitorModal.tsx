"use client";
import { useState, useEffect, useCallback } from "react";
import { UserPlus, User, Phone, Mail, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

interface VisitorFormData {
  name: string;
  phone: string;
  invitedById?: string;
}

interface Member {
  id: string;
  name: string;
}

interface VisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  groupId: string;
  onSuccess: () => void;
}

export default function VisitorModal({
  isOpen,
  onClose,
  meetingId,
  groupId,
  onSuccess
}: VisitorModalProps) {
  const [formData, setFormData] = useState<VisitorFormData>({
    name: '',
    phone: '',
    invitedById: ''
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Buscar membros do grupo e resetar formulário quando o modal abrir
  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/small-groups/${groupId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar membros do grupo');
      }
      const data = await response.json();
      const groupMembers = data.group?.members?.map((m: any) => ({
        id: m.member.id,
        name: m.member.name
      })) || [];
      setMembers(groupMembers);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      toast.error('Erro ao carregar membros do grupo');
    } finally {
      setLoadingMembers(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (isOpen && groupId) {
      setFormData({
        name: '',
        phone: '',
        invitedById: ''
      });
      setError("");
      fetchMembers();
    }
  }, [isOpen, groupId, fetchMembers]);



  const handleInputChange = (field: keyof VisitorFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Telefone é obrigatório');
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}/visitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          invitedById: formData.invitedById || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar visitante');
      }

      toast.success('Visitante adicionado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar visitante:', error);
      setError(error instanceof Error ? error.message : 'Erro ao adicionar visitante');
      toast.error('Erro ao adicionar visitante');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
          <UserPlus className="w-6 h-6 text-blue-600" />
          Adicionar Visitante
        </DialogTitle>

        <p className="text-gray-600 mb-4">
          Registre as informações do visitante que participou da reunião.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
          {/* Nome - Obrigatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o nome completo do visitante"
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Telefone - Obrigatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celular <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Membro que convidou */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Membro que convidou
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.invitedById || ''}
                onChange={(e) => handleInputChange('invitedById', e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                disabled={submitting || loadingMembers}
              >
                <option value="">Selecione um membro</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {loadingMembers && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
              )}
            </div>
          </div>
        </form>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || !formData.name.trim() || !formData.phone.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Adicionar Visitante
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}