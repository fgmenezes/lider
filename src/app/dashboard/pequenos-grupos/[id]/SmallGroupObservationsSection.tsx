"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Search, Filter, FileText, User, PlusCircle, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Trash2, X } from "lucide-react";

interface SmallGroupObservationsSectionProps {
  groupId: string;
  onRefresh: () => void;
}

type CategoriaObservacao = '' | 'geral' | 'crescimento' | 'desafio' | 'celebração' | 'oração' | 'planejamento' | 'visitação' | 'outro';

const categoriaOptions = [
  { value: '', label: 'Todas as categorias' },
  { value: 'geral', label: 'Geral' },
  { value: 'crescimento', label: 'Crescimento' },
  { value: 'desafio', label: 'Desafio' },
  { value: 'celebração', label: 'Celebração' },
  { value: 'oração', label: 'Oração' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'visitação', label: 'Visitação' },
  { value: 'outro', label: 'Outro' }
];

export default function SmallGroupObservationsSection({ groupId, onRefresh }: SmallGroupObservationsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaObservacao>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitulo, setAddTitulo] = useState("");
  const [addTexto, setAddTexto] = useState("");
  const [addCategoria, setAddCategoria] = useState<CategoriaObservacao>("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  
  // Paginação e ordenação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<any>(null);
  
  // Feedback de erros
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCategoria) params.set('categoria', selectedCategoria);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    params.set('page', currentPage.toString());
    params.set('limit', pageSize.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    return params.toString();
  }, [selectedCategoria, dateFrom, dateTo, currentPage, pageSize, sortBy, sortOrder]);

  const fetchObservacoes = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const res = await fetch(`/api/small-groups/${groupId}/observacoes${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar observações');
      setObservacoes(data.observacoes || []);
      setPagination(data.pagination || null);
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao buscar observações');
      setObservacoes([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [groupId, buildQuery]);

  useEffect(() => {
    fetchObservacoes();
  }, [groupId, selectedCategoria, dateFrom, dateTo, currentPage, pageSize, sortBy, sortOrder, fetchObservacoes]);

  const filtered = useMemo(() => {
    if (!searchTerm) return observacoes;
    const s = searchTerm.toLowerCase();
    return observacoes.filter((o) =>
      (o.titulo || '').toLowerCase().includes(s) ||
      (o.texto || '').toLowerCase().includes(s) ||
      (o.autor?.name || '').toLowerCase().includes(s)
    );
  }, [observacoes, searchTerm]);

  async function handleAddObservacao() {
    setAddError('');
    setErrorMessage('');
    if (!addTitulo.trim()) {
      setAddError('Digite o título da observação.');
      return;
    }
    if (!addTexto.trim()) {
      setAddError('Digite o conteúdo da observação.');
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch(`/api/small-groups/${groupId}/observacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titulo: addTitulo.trim(), 
          texto: addTexto.trim(), 
          categoria: addCategoria || 'geral' 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar observação');
      setShowAddModal(false);
      setAddTitulo('');
      setAddTexto('');
      setAddCategoria('');
      setSuccessMessage("Observação adicionada com sucesso!");
      await fetchObservacoes();
      onRefresh();
    } catch (e: any) {
      setAddError(e.message || 'Erro ao salvar observação');
    } finally {
      setAddSaving(false);
    }
  }

  // Editar/Excluir observações
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string>("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editTexto, setEditTexto] = useState("");
  const [editCategoria, setEditCategoria] = useState<CategoriaObservacao>("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit(obs: any) {
    setEditData(obs);
    setEditTitulo(obs.titulo);
    setEditTexto(obs.texto);
    setEditCategoria((obs.categoria || 'geral') as CategoriaObservacao);
    setEditModalOpen(true);
    setActionMenuOpenId("");
  }

  function closeEdit() {
    setEditModalOpen(false);
    setEditData(null);
    setEditTitulo('');
    setEditTexto('');
    setEditCategoria('');
  }

  async function handleSaveEdit() {
    if (!editData) return;
    if (!editTitulo.trim()) {
      setErrorMessage("Título é obrigatório");
      return;
    }
    if (!editTexto.trim()) {
      setErrorMessage("Conteúdo é obrigatório");
      return;
    }
    setEditSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/small-groups/${groupId}/observacoes/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titulo: editTitulo.trim(), 
          texto: editTexto.trim(), 
          categoria: editCategoria || 'geral' 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao editar observação');
      closeEdit();
      setSuccessMessage("Observação editada com sucesso!");
      await fetchObservacoes();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao editar observação');
    } finally {
      setEditSaving(false);
    }
  }

  function openDelete(obs: any) {
    setDeleteData(obs);
    setDeleteModalOpen(true);
    setActionMenuOpenId("");
  }

  function closeDelete() {
    setDeleteModalOpen(false);
    setDeleteData(null);
  }

  async function handleDelete() {
    if (!deleteData) return;
    setDeleteLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/small-groups/${groupId}/observacoes/${deleteData.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir observação');
      closeDelete();
      setSuccessMessage("Observação excluída com sucesso!");
      await fetchObservacoes();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao excluir observação');
    } finally {
      setDeleteLoading(false);
    }
  }

  function getCategoriaLabel(categoria: string) {
    const option = categoriaOptions.find(opt => opt.value === categoria);
    return option ? option.label : categoria || 'Geral';
  }

  function getCategoriaColor(categoria: string) {
    switch (categoria) {
      case 'crescimento': return 'bg-green-100 text-green-800';
      case 'desafio': return 'bg-red-100 text-red-800';
      case 'celebração': return 'bg-yellow-100 text-yellow-800';
      case 'oração': return 'bg-purple-100 text-purple-800';
      case 'planejamento': return 'bg-blue-100 text-blue-800';
      case 'visitação': return 'bg-indigo-100 text-indigo-800';
      case 'outro': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Mensagens de feedback */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Observações do Grupo</h3>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Nova Observação
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value as CategoriaObservacao)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categoriaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Data inicial"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Data final"
            />
          </div>
        </div>
      </div>

      {/* Lista de observações */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma observação encontrada</p>
            <div className="text-sm text-gray-500 mt-1">
                    Clique em &quot;Nova Observação&quot; para registrar informações importantes sobre este pequeno grupo.
                  </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((obs) => (
              <div key={obs.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{obs.titulo}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(obs.categoria)}`}>
                        {getCategoriaLabel(obs.categoria)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{obs.texto}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {obs.autor?.name}
                      </div>
                      <span>{new Date(obs.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpenId(actionMenuOpenId === obs.id ? "" : obs.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {actionMenuOpenId === obs.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => openEdit(obs)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => openDelete(obs)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} observações
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={!pagination.hasPrev}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={!pagination.hasNext}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de adicionar observação */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogTitle>Nova Observação do Grupo</DialogTitle>
          <div className="space-y-4">
            {addError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{addError}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={addTitulo}
                onChange={(e) => setAddTitulo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o título da observação"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observação *
              </label>
              <textarea
                value={addTexto}
                onChange={(e) => setAddTexto(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite a observação sobre o grupo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={addCategoria}
                onChange={(e) => setAddCategoria(e.target.value as CategoriaObservacao)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categoriaOptions.slice(1).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={addSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddObservacao}
                disabled={addSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {addSaving ? 'Salvando...' : 'Criar'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de editar observação */}
      <Dialog open={editModalOpen} onOpenChange={closeEdit}>
        <DialogContent className="max-w-md">
          <DialogTitle>Editar Observação</DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observação *
              </label>
              <textarea
                value={editTexto}
                onChange={(e) => setEditTexto(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={editCategoria}
                onChange={(e) => setEditCategoria(e.target.value as CategoriaObservacao)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categoriaOptions.slice(1).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={closeEdit}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={editSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={closeDelete}>
        <DialogContent className="max-w-md">
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <div className="space-y-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir a observação &quot;{deleteData?.titulo}&quot;?
            </p>
            <p className="text-sm text-gray-500">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={closeDelete}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}