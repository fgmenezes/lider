'use client';

import React, { useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MaterialApoioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  meetingId: string;
}

export default function MaterialApoioModal({
  isOpen,
  onClose,
  onSuccess,
  meetingId
}: MaterialApoioModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (apenas PDF)
    if (file.type !== 'application/pdf') {
      toast.error('⚠️ Apenas arquivos PDF são permitidos', {
        duration: 4000,
        style: {
          background: '#F59E0B',
          color: '#fff',
          fontWeight: '500'
        }
      });
      return;
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('⚠️ O arquivo deve ter no máximo 10MB', {
        duration: 4000,
        style: {
          background: '#F59E0B',
          color: '#fff',
          fontWeight: '500'
        }
      });
      return;
    }

    setArquivo(file);
    
    // Se o nome não foi preenchido, usar o nome do arquivo
    if (!nome.trim()) {
      const fileName = file.name.replace('.pdf', '');
      setNome(fileName);
    }
  };

  const handleRemoveFile = () => {
    setArquivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error('⚠️ Digite um nome para o material', {
        duration: 3000,
        style: {
          background: '#F59E0B',
          color: '#fff',
          fontWeight: '500'
        }
      });
      return;
    }

    if (!arquivo) {
      toast.error('⚠️ Selecione um arquivo PDF', {
        duration: 3000,
        style: {
          background: '#F59E0B',
          color: '#fff',
          fontWeight: '500'
        }
      });
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('nome', nome.trim());
      formData.append('descricao', descricao.trim());
      formData.append('arquivo', arquivo);

      // Usar XMLHttpRequest para monitorar progresso apenas para arquivos grandes (>1MB)
      if (arquivo.size > 1024 * 1024) {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error || 'Erro ao fazer upload do material'));
              } catch {
                reject(new Error('Erro ao fazer upload do material'));
              }
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('Erro de conexão durante o upload'));
          });
          
          xhr.open('POST', `/api/reunioes/${meetingId}/material-apoio`);
          xhr.send(formData);
        });
      } else {
        // Para arquivos pequenos, usar fetch normal
        const response = await fetch(`/api/reunioes/${meetingId}/material-apoio`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao fazer upload do material');
        }
      }

      toast.success('📎 Material de apoio adicionado com sucesso!', {
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981'
        }
      });
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast.error(`❌ ${error instanceof Error ? error.message : 'Erro ao salvar material'}`, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNome('');
      setDescricao('');
      setArquivo(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Adicionar Material de Apoio
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nome do Material */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Material *
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Estudo sobre Oração"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxLength={100}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {nome.length}/100 caracteres
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Breve descrição do material..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {descricao.length}/500 caracteres
                    </div>
                  </div>

                  {/* Upload de Arquivo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arquivo PDF *
                    </label>
                    
                    {!arquivo ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="sm:hidden">Toque para selecionar PDF</span>
                          <span className="hidden sm:inline">Clique para selecionar um arquivo PDF</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Máximo 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{arquivo.name}</p>
                              <p className="text-sm text-gray-500">{formatFileSize(arquivo.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveFile}
                            disabled={isLoading}
                            className="min-h-[36px] justify-center flex-shrink-0"
                          >
                            <X className="w-4 h-4 mr-1 sm:mr-0" />
                            <span className="sm:hidden">Remover</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Barra de progresso para uploads grandes */}
                  {isLoading && arquivo && arquivo.size > 1024 * 1024 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progresso do upload</span>
                        <span className="font-medium text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Enviando arquivo grande... Por favor, aguarde.
                      </p>
                    </div>
                  )}

                  {/* Aviso sobre tipos de arquivo */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700">
                      <p className="font-medium mb-1">Informações importantes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Apenas arquivos PDF são aceitos</li>
                        <li>Tamanho máximo: 10MB</li>
                        <li>O material ficará disponível para todos os membros do grupo</li>
                        <li>Arquivos maiores que 1MB mostrarão progresso do upload</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="min-h-[44px] sm:min-h-[36px] justify-center"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || !nome.trim() || !arquivo}
                    className="bg-blue-600 hover:bg-blue-700 min-h-[44px] sm:min-h-[36px] justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="sm:hidden">Enviando Material...</span>
                        <span className="hidden sm:inline">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        <span className="sm:hidden">Adicionar Material</span>
                        <span className="hidden sm:inline">Adicionar Material</span>
                      </>
                    )}
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