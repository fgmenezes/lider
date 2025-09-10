'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { X, BookOpen, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface MarcarBiblia {
  id: string;
  memberId: string;
  member: {
    id: string;
    name: string;
  };
}

interface MarcarBibliaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupId: string;
  meetingId: string;
  members: Member[];
  existingMarcacoes?: MarcarBiblia[];
}

export default function MarcarBibliaModal({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  meetingId,
  members,
  existingMarcacoes = []
}: MarcarBibliaModalProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Inicializar com membros já marcados
  useEffect(() => {
    if (isOpen) {
      const marcados = existingMarcacoes.map(m => m.memberId);
      setSelectedMembers(marcados);
    }
  }, [isOpen, existingMarcacoes]);

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Determinar quais membros adicionar e remover
      const currentMarcados = existingMarcacoes.map(m => m.memberId);
      const toAdd = selectedMembers.filter(id => !currentMarcados.includes(id));
      const toRemove = currentMarcados.filter(id => !selectedMembers.includes(id));

      // Adicionar novos
      for (const memberId of toAdd) {
        const response = await fetch(`/api/reunioes/${meetingId}/marcar-biblia`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ memberId })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao marcar membro');
        }
      }

      // Remover desmarcados
      for (const memberId of toRemove) {
        const marcacao = existingMarcacoes.find(m => m.memberId === memberId);
        if (marcacao) {
          const response = await fetch(`/api/reunioes/${meetingId}/marcar-biblia`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ memberId })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao desmarcar membro');
          }
        }
      }

      toast.success('Marcações de Bíblia atualizadas com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar marcações:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar marcações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Marcar Quem Trouxe Bíblia
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Selecione os membros que trouxeram a Bíblia para esta reunião:
                  </p>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {members.map((member) => {
                      const isSelected = selectedMembers.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleToggleMember(member.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {members.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum membro encontrado</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Marcações'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}