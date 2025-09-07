"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Users, UserCheck, Phone, Mail, X, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'leader' | 'member';
  groupId: string;
  ministryId: string;
  onSuccess: () => void;
}

interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  celular?: string;
  ministryId?: string;
}

export default function AddPersonModal({ isOpen, onClose, type, groupId, ministryId, onSuccess }: AddPersonModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Debounce para busca
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Buscar pessoas elegíveis
  const fetchPeople = useCallback(async () => {
    if (!isOpen || !groupId || !ministryId) return;

    setLoading(true);
    setError("");

    try {
      let url = "";
      if (type === 'leader') {
        // Buscar líderes elegíveis do ministério
        url = `/api/ministries/${ministryId}/leaders?search=${encodeURIComponent(debouncedSearchTerm)}`;
      } else {
        // Buscar membros elegíveis do ministério
        url = `/api/members?ministryId=${ministryId}&search=${encodeURIComponent(debouncedSearchTerm)}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar pessoas");
      
      const data = await response.json();
      setPeople(data.leaders || data.members || []);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar pessoas");
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, groupId, ministryId, type, debouncedSearchTerm]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  // Filtrar pessoas baseado nos filtros
  const filteredPeople = people.filter(person => {
    const matchesSearch = person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.phone?.includes(searchTerm) ||
                         person.celular?.includes(searchTerm);
    
    // Por enquanto, filtros simples - serão expandidos na Fase 2
    return matchesSearch;
  });

  // Alternar seleção de pessoa
  const togglePersonSelection = (personId: string) => {
    setSelectedPeople(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  // Adicionar pessoas selecionadas
  const handleAddPeople = async () => {
    if (selectedPeople.length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      let url = "";
      let body = {};

      if (type === 'leader') {
        url = `/api/small-groups/${groupId}/add-leaders`;
        body = { userIds: selectedPeople };
      } else {
        url = `/api/small-groups/${groupId}/add-members`;
        body = { memberIds: selectedPeople };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Erro ao adicionar pessoas");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar pessoas");
    } finally {
      setSubmitting(false);
    }
  };

  // Limpar estado ao fechar modal
  const handleClose = () => {
    setSearchTerm("");
    setFilterRegion("all");
    setFilterStatus("all");
    setSelectedPeople([]);
    setPeople([]);
    setError("");
    onClose();
  };

  const getModalTitle = () => {
    return type === 'leader' ? 'Adicionar Líder(es)' : 'Adicionar Membro(s)';
  };

  const getModalDescription = () => {
    return type === 'leader' 
      ? 'Selecione um ou mais líderes para adicionar ao pequeno grupo'
      : 'Selecione um ou mais membros para adicionar ao pequeno grupo';
  };

  const getButtonText = () => {
    if (submitting) return 'Adicionando...';
    if (selectedPeople.length === 0) return 'Selecionar Pessoas';
    return `Adicionar ${selectedPeople.length} ${selectedPeople.length === 1 ? 'pessoa' : 'pessoas'}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
          {type === 'leader' ? (
            <UserCheck className="w-6 h-6 text-blue-600" />
          ) : (
            <Users className="w-6 h-6 text-green-600" />
          )}
          {getModalTitle()}
        </DialogTitle>

        <p className="text-gray-600 mb-6">{getModalDescription()}</p>

        {/* Filtros e busca */}
        <div className="space-y-4 mb-6">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Buscar ${type === 'leader' ? 'líderes' : 'membros'} por nome, email ou telefone...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todas as regiões</option>
                <option value="norte">Norte</option>
                <option value="sul">Sul</option>
                <option value="leste">Leste</option>
                <option value="oeste">Oeste</option>
                <option value="centro">Centro</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos os status</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="TEMPORARIO">Temporário</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de pessoas */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Buscando pessoas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">{error}</div>
              <button
                onClick={fetchPeople}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa disponível"}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? "Tente ajustar os termos de busca" 
                  : "Não há pessoas elegíveis para adicionar ao grupo"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {filteredPeople.map((person) => (
                <label
                  key={person.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPeople.includes(person.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPeople.includes(person.id)}
                    onChange={() => togglePersonSelection(person.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {person.name}
                      </h4>
                      {selectedPeople.includes(person.id) && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      {person.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{person.email}</span>
                        </div>
                      )}
                      {(person.phone || person.celular) && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{person.phone || person.celular}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com ações */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedPeople.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {selectedPeople.length} {selectedPeople.length === 1 ? 'pessoa selecionada' : 'pessoas selecionadas'}
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPeople}
                disabled={selectedPeople.length === 0 || submitting}
                className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  type === 'leader'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
