"use client";
import { useState, useEffect } from "react";
import { UserCheck, Users, Check, X, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface AttendanceData {
  [memberId: string]: boolean;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  groupId: string;
  members: Member[];
  existingAttendances: any[];
  onSuccess: () => void;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  meetingId,
  groupId,
  members,
  existingAttendances,
  onSuccess
}: AttendanceModalProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Inicializar dados de presença quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      const initialData: AttendanceData = {};
      
      // Marcar membros que já têm presença registrada
      members.forEach(member => {
        const hasAttendance = existingAttendances.some(
          attendance => attendance.memberId === member.id
        );
        initialData[member.id] = hasAttendance;
      });
      
      setAttendanceData(initialData);
      setError("");
      setSearchTerm("");
    }
  }, [isOpen, members, existingAttendances]);

  const handleToggleAttendance = (memberId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = members.every(member => attendanceData[member.id]);
    const newData: AttendanceData = {};
    
    members.forEach(member => {
      newData[member.id] = !allSelected;
    });
    
    setAttendanceData(newData);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao registrar presença');
      }

      toast.success('Presença registrada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao registrar presença:', error);
      setError(error instanceof Error ? error.message : 'Erro ao registrar presença');
      toast.error('Erro ao registrar presença');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  // Filtrar membros com base no termo de busca
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedCount = Object.values(attendanceData).filter(Boolean).length;
  const totalMembers = members.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
          <UserCheck className="w-6 h-6 text-green-600" />
          Marcar Presença
        </DialogTitle>

        <p className="text-gray-600 mb-4">
          Selecione os membros presentes na reunião. {selectedCount} de {totalMembers} membros selecionados.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Campo de Busca */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar membro..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Botão Selecionar Todos */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            disabled={submitting}
          >
            <Users className="w-4 h-4" />
            {members.every(member => attendanceData[member.id]) ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
        </div>

        {/* Lista de Membros */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm ? 'Nenhum membro encontrado com esse nome.' : 'Nenhum membro ativo encontrado neste grupo.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMembers.map((member) => {
                const isPresent = attendanceData[member.id] || false;
                
                return (
                  <div
                    key={member.id}
                    className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      isPresent ? 'bg-green-50 border-l-4 border-green-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {member.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {isPresent ? 'Presente' : 'Ausente'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAttendanceData(prev => ({ ...prev, [member.id]: true }))}
                        disabled={submitting}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          isPresent
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                        } disabled:opacity-50`}
                      >
                        <Check className="w-4 h-4" />
                        Presente
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceData(prev => ({ ...prev, [member.id]: false }))}
                        disabled={submitting}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          !isPresent
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                        } disabled:opacity-50`}
                      >
                        <X className="w-4 h-4" />
                        Ausente
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
            type="button"
            onClick={handleSubmit}
            disabled={submitting || members.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Salvar Presença
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}