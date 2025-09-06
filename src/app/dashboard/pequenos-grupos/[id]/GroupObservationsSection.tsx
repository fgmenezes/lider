"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Search, Filter, FileText, User, PlusCircle, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface GroupObservationsSectionProps {
  groupId: string;
  members: any[];
  onRefresh: () => void;
}

type CategoriaObservacao = '' | 'elogio' | 'alerta' | 'urgente' | 'acompanhamento' | 'visita' | 'oração' | 'outro';

export default function GroupObservationsSection({ groupId, members, onRefresh }: GroupObservationsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaObservacao>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addMemberId, setAddMemberId] = useState<string>("");
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

  const memberOptions = useMemo(() => {
    const opts = (members || []).map((m: any) => ({ value: m.memberId, label: m.member?.name || 'Sem nome' }));
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [members]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedMemberId) params.set('memberId', selectedMemberId);
    if (selectedCategoria) params.set('categoria', selectedCategoria);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    params.set('page', currentPage.toString());
    params.set('limit', pageSize.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    return params.toString();
  }, [selectedMemberId, selectedCategoria, dateFrom, dateTo, currentPage, pageSize, sortBy, sortOrder]);

  const fetchObservacoes = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const res = await fetch(`/api/small-groups/${groupId}/observations${qs ? `?${qs}` : ''}`);
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
  }, [groupId, selectedMemberId, selectedCategoria, dateFrom, dateTo, currentPage, pageSize, sortBy, sortOrder, fetchObservacoes]);

  const filtered = useMemo(() => {
    if (!searchTerm) return observacoes;
    const s = searchTerm.toLowerCase();
    return observacoes.filter((o) =>
      (o.texto || '').toLowerCase().includes(s) ||
      (o.autor?.name || '').toLowerCase().includes(s) ||
      (o.member?.name || '').toLowerCase().includes(s)
    );
  }, [observacoes, searchTerm]);

  async function handleAddObservacao() {
    setAddError('');
    setErrorMessage('');
    if (!addMemberId) {
      setAddError('Selecione um membro.');
      return;
    }
    if (!addTexto.trim()) {
      setAddError('Digite a observação.');
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch(`/api/members/${addMemberId}/observacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: addTexto, categoria: addCategoria || '' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar observação');
      setShowAddModal(false);
      setAddMemberId('');
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

  // Editar/Excluir usando endpoints do membro
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string>("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editTexto, setEditTexto] = useState("");
  const [editCategoria, setEditCategoria] = useState<CategoriaObservacao>("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit(obs: any) {
    setEditData(obs);
    setEditTexto(obs.texto);
    setEditCategoria((obs.categoria || '') as CategoriaObservacao);
    setEditModalOpen(true);
  }
  function closeEdit() {
    setEditModalOpen(false);
    setEditData(null);
    setEditTexto('');
    setEditCategoria('');
  }
  async function handleSaveEdit() {
    if (!editData) return;
    setEditSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/members/${editData.memberId}/observacoes/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: editTexto, categoria: editCategoria || '' })
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
      const res = await fetch(`/api/members/${deleteData.memberId}/observacoes/${deleteData.id}`, { method: 'DELETE' });
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Mensagens de feedback */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-red-800 text-sm">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage("")}
                className="text-red-600 hover:text-red-800 text-xs mt-1"
              >
                ✕ Fechar
              </button>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-green-800 text-sm">{successMessage}</div>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-green-600 hover:text-green-800 text-xs mt-1"
              >
                ✕ Fechar
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /> Observações dos Membros</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Adicionar Observação
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por texto, autor ou membro..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Todos os membros</option>
                {memberOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value as CategoriaObservacao)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Todas as categorias</option>
                <option value="elogio">Elogio</option>
                <option value="alerta">Alerta</option>
                <option value="urgente">Urgente</option>
                <option value="acompanhamento">Acompanhamento</option>
                <option value="visita">Visita</option>
                <option value="oração">Oração</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          
          {/* Controles de ordenação e paginação */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="createdAt">Data de criação</option>
                  <option value="updatedAt">Data de atualização</option>
                  <option value="categoria">Categoria</option>
                  <option value="autor.name">Nome do autor</option>
                  <option value="member.name">Nome do membro</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 hover:bg-gray-100 rounded"
                  title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Itens por página:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            
            {pagination && (
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} observações
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Carregando observações...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhuma observação encontrada com os filtros selecionados.</div>
        ) : (
          <>
            <div className="space-y-3">
              {filtered.map((o) => (
                <div key={o.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-medium mb-1 whitespace-pre-line">{o.texto}</div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                        <span><b>Membro:</b> {o.member?.name || '-'}</span>
                        <span><b>Autor:</b> {o.autor?.name || '-'}</span>
                        <span><b>Data:</b> {new Date(o.createdAt).toLocaleString('pt-BR')}</span>
                        <span><b>Categoria:</b> {o.categoria || 'Sem categoria'}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => setActionMenuOpenId(actionMenuOpenId === o.id ? '' : o.id)}
                        aria-label="Ações"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      {actionMenuOpenId === o.id && (
                        <div className="relative">
                          <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow z-10">
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => { openEdit(o); setActionMenuOpenId(''); }}>Editar</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600" onClick={() => { openDelete(o); setActionMenuOpenId(''); }}>Excluir</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Controles de paginação */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={!pagination.hasPrev}
                  className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primeira página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm ${
                          pageNum === pagination.page
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={!pagination.hasNext}
                  className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Adicionar Observação */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogTitle>Nova Observação</DialogTitle>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Membro</label>
              <select
                value={addMemberId}
                onChange={(e) => setAddMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Selecione um membro</option>
                {memberOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <textarea
                value={addTexto}
                onChange={(e) => setAddTexto(e.target.value)}
                rows={4}
                placeholder="Digite a observação..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (opcional)</label>
              <select
                value={addCategoria}
                onChange={(e) => setAddCategoria(e.target.value as CategoriaObservacao)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Sem categoria</option>
                <option value="elogio">Elogio</option>
                <option value="alerta">Alerta</option>
                <option value="urgente">Urgente</option>
                <option value="acompanhamento">Acompanhamento</option>
                <option value="visita">Visita</option>
                <option value="oração">Oração</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            {addError && <div className="text-sm text-red-600">{addError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded" onClick={() => setShowAddModal(false)} disabled={addSaving}>Cancelar</button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={handleAddObservacao} disabled={addSaving}>{addSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Observação */}
      <Dialog open={editModalOpen} onOpenChange={(v) => { if (!v) closeEdit(); else setEditModalOpen(true); }}>
        <DialogContent>
          <DialogTitle>Editar Observação</DialogTitle>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <textarea
                value={editTexto}
                onChange={(e) => setEditTexto(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (opcional)</label>
              <select
                value={editCategoria}
                onChange={(e) => setEditCategoria(e.target.value as CategoriaObservacao)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Sem categoria</option>
                <option value="elogio">Elogio</option>
                <option value="alerta">Alerta</option>
                <option value="urgente">Urgente</option>
                <option value="acompanhamento">Acompanhamento</option>
                <option value="visita">Visita</option>
                <option value="oração">Oração</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded" onClick={closeEdit} disabled={editSaving}>Cancelar</button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={handleSaveEdit} disabled={editSaving}>{editSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir Observação */}
      <Dialog open={deleteModalOpen} onOpenChange={(v) => { if (!v) closeDelete(); else setDeleteModalOpen(true); }}>
        <DialogContent>
          <DialogTitle>Excluir Observação</DialogTitle>
          <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja excluir esta observação? Esta ação não poderá ser desfeita.</p>
          <div className="whitespace-pre-line text-gray-800 border rounded p-3 bg-gray-50 text-base font-medium mb-4">{deleteData?.texto}</div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded" onClick={closeDelete} disabled={deleteLoading}>Cancelar</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Excluindo...' : 'Excluir'}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


