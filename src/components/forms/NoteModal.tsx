"use client";
import { useState, useEffect } from "react";
import { FileText, Edit3, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

interface NoteFormData {
  title: string;
  content: string;
}

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  groupId: string;
  onSuccess: () => void;
}

export default function NoteModal({
  isOpen,
  onClose,
  meetingId,
  groupId,
  onSuccess
}: NoteModalProps) {
  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Resetar formulário quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        content: ''
      });
      setError("");
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof NoteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    if (!formData.content.trim()) {
      setError('Conteúdo é obrigatório');
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/small-groups/${groupId}/meetings/${meetingId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar nota');
      }

      toast.success('Nota criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar nota');
      toast.error('Erro ao criar nota');
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
          <FileText className="w-6 h-6 text-purple-600" />
          Nova Nota
        </DialogTitle>

        <p className="text-gray-600 mb-4">
          Adicione uma nota importante sobre esta reunião.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
          {/* Título - Obrigatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Edit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Digite o título da nota"
                disabled={submitting}
                required
                maxLength={100}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 caracteres
            </p>
          </div>

          {/* Conteúdo - Obrigatório */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Digite o conteúdo da nota...\n\nVocê pode incluir:\n• Pontos principais discutidos\n• Decisões tomadas\n• Ações a serem realizadas\n• Observações importantes"
              rows={12}
              disabled={submitting}
              required
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length}/2000 caracteres
            </p>
          </div>

          {/* Dicas de formatação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Dicas para uma boa nota:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use títulos descritivos (ex: &quot;Decisões da Reunião&quot;, &quot;Pontos de Oração&quot;)</li>
              <li>• Organize o conteúdo em tópicos ou listas</li>
              <li>• Inclua datas e responsáveis quando relevante</li>
              <li>• Mantenha a linguagem clara e objetiva</li>
            </ul>
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
            disabled={submitting || !formData.title.trim() || !formData.content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Criar Nota
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}