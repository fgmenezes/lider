'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/forms/Select';
import { useRef } from 'react';
import { useSession } from 'next-auth/react';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

// Função utilitária para formatar data YYYY-MM-DD para DD/MM/YYYY
function formatDateBR(dateStr: string) {
  if (!dateStr) return '';
  // Extrai apenas a parte da data se vier no formato ISO
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
}
// Função para aplicar máscara de data DD/MM/AAAA
function maskDateBR(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
    .slice(0, 10);
}
// Função para converter DD/MM/AAAA para YYYY-MM-DD
function brToISO(date: string) {
  const [d, m, y] = date.split('/');
  if (d && m && y) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return '';
}
// Função para formatar valor como moeda brasileira
function formatCurrencyInput(value: string) {
  // Remove tudo que não for número
  const onlyNums = value.replace(/\D/g, '');
  if (!onlyNums) return '';
  // Converte para centavos
  const cents = parseInt(onlyNums, 10);
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
// Função para extrair valor numérico do input formatado
function parseCurrencyInput(value: string) {
  return Number(value.replace(/[^\d,]/g, '').replace(',', '.'));
}

// Função para aplicar máscara de valor em moeda brasileira (R$)
function maskCurrencyBR(value: string) {
  // Remove tudo que não for número
  const onlyNums = value.replace(/\D/g, '');
  if (!onlyNums) return '';
  // Converte para centavos
  const cents = parseInt(onlyNums, 10);
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função utilitária para converter ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ) para DD/MM/YYYY
function isoToBR(dateStr: string) {
  if (!dateStr) return '';
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
}

function NewFinanceModal({ open, onClose, onSuccess, ministryId, initialData, isEdit }: { open: boolean, onClose: () => void, onSuccess: () => void, ministryId: string, initialData?: any, isEdit?: boolean }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setType(initialData.type);
      setDate(initialData.date ? isoToBR(initialData.date) : '');
      setAmount(maskCurrencyBR(initialData.amount.toString()));
      setCategory(initialData.category || '');
      setDescription(initialData.description || '');
    } else {
      setTitle('');
      setType('ENTRADA');
      setDate('');
      setAmount('');
      setCategory('');
      setDescription('');
    }
  }, [initialData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (parseCurrencyInput(amount) <= 0) {
        setError('O valor deve ser maior que zero.');
        setLoading(false);
        return;
      }
      const financeData = {
        title,
        type,
        date: brToISO(date),
        amount: parseCurrencyInput(amount),
        category: category || undefined,
        description: description || undefined,
      };
      let res;
      if (isEdit && initialData?.id) {
        res = await fetch(`/api/ministries/${ministryId}/finance`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...financeData, id: initialData.id }),
        });
      } else {
        res = await fetch(`/api/ministries/${ministryId}/finance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(financeData),
        });
      }
      if (!res.ok) throw new Error('Erro ao salvar lançamento');
      onSuccess();
      onClose();
      setTitle(''); setType('ENTRADA'); setDate(''); setAmount(''); setCategory(''); setDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogTitle>{isEdit ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            label="Título *"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Select
            label="Tipo *"
            value={type}
            onChange={e => setType(e.target.value as 'ENTRADA' | 'SAIDA')}
            options={[
              { value: 'ENTRADA', label: 'Entrada' },
              { value: 'SAIDA', label: 'Saída' }
            ]}
            required
          />
          <Input
            label="Data *"
            type="text"
            placeholder="DD/MM/AAAA"
            value={date}
            onChange={e => setDate(maskDateBR(e.target.value))}
            maxLength={10}
            required
          />
          <Input
            label="Valor (R$) *"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(maskCurrencyBR(e.target.value))}
            required
          />
          <Select
            label="Categoria"
            value={category}
            onChange={e => setCategory(e.target.value)}
            options={[
              { value: '', label: 'Selecione uma categoria' },
              ...['Ofertas', 'Dízimos', 'Doações', 'Eventos (arrecadação)', 'Vendas', 'Contribuição de membros', 'Parcerias/Patrocínios', 'Reembolsos recebidos', 'Aluguéis recebidos', 'Pagamento de contas', 'Aluguel de espaço', 'Compra de materiais', 'Manutenção', 'Salários/honorários', 'Ajuda social/beneficente', 'Alimentação/eventos', 'Transporte/combustível', 'Material de divulgação', 'Cursos/treinamentos', 'Presentes/brindes', 'Taxas bancárias', 'Outros'].map(cat => ({ value: cat, label: cat }))
            ]}
            required
          />
          {category === 'Outros' && (
            <Input
              type="text"
              placeholder="Digite a categoria personalizada"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            />
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Descrição</label>
            <textarea 
              className="w-full border rounded px-3 py-2" 
              style={{ 
                borderColor: 'var(--color-neutral)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
          </div>
          {error && <div style={{ color: 'var(--color-danger)' }} className="text-sm">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Salvando...' : 'Adicionar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MinistryFinancePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [finances, setFinances] = useState<any[]>([]);
  const [saldo, setSaldo] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ministryId = params.id;
  const [modalOpen, setModalOpen] = useState(false);

  // Estados para modais
  const [viewModal, setViewModal] = useState<{ open: boolean, lanc?: any }>({ open: false });
  const [editModal, setEditModal] = useState<{ open: boolean, lanc?: any }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, lanc?: any }>({ open: false });

  // Estados para filtros
  const [search, setSearch] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  // 1. No início do componente MinistryFinancePage, defina as categorias possíveis:
  const CATEGORIES = [
    'Ofertas', 'Dízimos', 'Doações', 'Eventos (arrecadação)', 'Vendas', 'Contribuição de membros',
    'Parcerias/Patrocínios', 'Reembolsos recebidos', 'Aluguéis recebidos', 'Pagamento de contas',
    'Aluguel de espaço', 'Compra de materiais', 'Manutenção', 'Salários/honorários',
    'Ajuda social/beneficente', 'Alimentação/eventos', 'Transporte/combustível',
    'Material de divulgação', 'Cursos/treinamentos', 'Presentes/brindes', 'Taxas bancárias', 'Outros'
  ];
  // 2. Atualize o estado filters para type e category como arrays:
  const [filters, setFilters] = useState<{
    period: string;
    customStart: string;
    customEnd: string;
    type: string[];
    category: string[];
    minValue: string;
    maxValue: string;
  }>({
    period: '',
    customStart: '',
    customEnd: '',
    type: [],
    category: [],
    minValue: '',
    maxValue: '',
  });
  const [filteredFinances, setFilteredFinances] = useState<any[]>([]);
  const [filteredSaldo, setFilteredSaldo] = useState<number | null>(null);

  function handleView(lanc: any) {
    setViewModal({ open: true, lanc });
  }
  function handleEdit(lanc: any) {
    setEditModal({ open: true, lanc });
  }
  function handleDelete(lanc: any) {
    setDeleteModal({ open: true, lanc });
  }
  async function confirmDelete() {
    if (!deleteModal.lanc) return;
    try {
      await fetch(`/api/ministries/${ministryId}/finance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteModal.lanc.id }),
      });
      setDeleteModal({ open: false });
      fetchFinances();
    } catch (err) {
      alert('Erro ao excluir lançamento');
    }
  }

  const fetchFinances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ministries/${ministryId}/finance`);
      if (!res.ok) throw new Error('Erro ao buscar lançamentos');
      const data = await res.json();
      setFinances(data.finances);
      setSaldo(data.saldo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ministryId]);

  useEffect(() => {
    fetchFinances();
  }, [ministryId, fetchFinances]);

  // Filtro local (pode ser adaptado para backend depois)
  useEffect(() => {
    let result = finances;
    if (search) {
      const s = search.toLowerCase();
      // Tentar extrair valor numérico do termo de busca
      const valorBusca = parseFloat(s.replace(/[^0-9,\.]/g, '').replace(',', '.'));
      result = result.filter(lanc =>
        lanc.title.toLowerCase().includes(s) ||
        (lanc.category || '').toLowerCase().includes(s) ||
        (lanc.description || '').toLowerCase().includes(s) ||
        (!isNaN(valorBusca) && Math.abs(lanc.amount - valorBusca) < 0.01)
      );
    }
    // Filtro por tipo
    if (filters.type.length > 0) {
      result = result.filter(lanc => filters.type.includes(lanc.type));
    }
    // Filtro por categoria
    if (filters.category.length > 0) {
      result = result.filter(lanc => filters.category.includes(lanc.category));
    }
    // Filtro por valor
    if (filters.minValue) {
      result = result.filter(lanc => lanc.amount >= parseFloat(filters.minValue.replace(',', '.')));
    }
    if (filters.maxValue) {
      result = result.filter(lanc => lanc.amount <= parseFloat(filters.maxValue.replace(',', '.')));
    }
    // Filtro por período
    if (filters.period && filters.period !== 'custom') {
      const now = new Date();
      let start: Date;
      if (filters.period === '7d') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (filters.period === '14d') start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      else if (filters.period === '1m') { start = new Date(now); start.setMonth(now.getMonth() - 1); }
      else if (filters.period === '2m') { start = new Date(now); start.setMonth(now.getMonth() - 2); }
      else start = new Date(0);
      result = result.filter(lanc => new Date(lanc.date) >= start && new Date(lanc.date) <= now);
    }
    if (filters.period === 'custom' && filters.customStart && filters.customEnd) {
      const [d1, m1, y1] = filters.customStart.split('/');
      const [d2, m2, y2] = filters.customEnd.split('/');
      const start = new Date(`${y1}-${m1}-${d1}`);
      const end = new Date(`${y2}-${m2}-${d2}`);
      result = result.filter(lanc => new Date(lanc.date) >= start && new Date(lanc.date) <= end);
    }
    setFilteredFinances(result);
    setFilteredSaldo(result.reduce((acc, lanc) => acc + (lanc.type === 'ENTRADA' ? lanc.amount : -lanc.amount), 0));
  }, [finances, search, filters]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Gerenciamento Financeiro</h1>
      <div>
        {/* Botão Novo Lançamento */}
        <div className="flex justify-end mb-4">
          {userRole !== 'LEADER' && (
            <Button
              variant="primary"
              onClick={() => setModalOpen(true)}
            >
              Novo Lançamento
            </Button>
          )}
        </div>
        <div 
          className="rounded shadow p-4 mb-6" 
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Saldo disponível:</span>
            <span 
              className="text-2xl font-bold" 
              style={{ color: saldo >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
              {formatCurrency(saldo)}
            </span>
          </div>
          {((search || filters.period || filters.type || filters.category || filters.minValue || filters.maxValue) && filteredFinances.length !== finances.length) && (
            <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Saldo dos lançamentos filtrados (de acordo com os filtros aplicados):
              <span 
                className="font-bold" 
                style={{ color: (filteredSaldo ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {formatCurrency(filteredSaldo ?? 0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mb-4">
          <Input
            type="text"
            placeholder="Buscar por título, categoria ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setSearch(e.currentTarget.value);
              }
            }}
          />
          <Button variant="primary" onClick={() => setFilterModalOpen(true)}>
            Filtrar
          </Button>
        </div>
        {loading ? (
          <div className="text-center" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
        ) : error ? (
          <div className="text-center" style={{ color: 'var(--color-danger)' }}>{error}</div>
        ) : filteredFinances.length === 0 ? (
          <div className="text-center" style={{ color: 'var(--text-muted)' }}>Nenhum lançamento encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-primary)' }}>Título</th>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-primary)' }}>Tipo</th>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-primary)' }}>Data</th>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-primary)' }}>Valor</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-primary)' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFinances.map((lanc) => (
                  <tr 
                    key={lanc.id} 
                    className="border-b hover:bg-[var(--bg-secondary)]" 
                    style={{ 
                      borderBottomColor: 'var(--color-neutral)'
                    }}
                  >
                    <td className="px-4 py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{lanc.title}</td>
                    <td className="px-4 py-2">
                      <span 
                        className="px-2 py-1 rounded text-xs font-bold" 
                        style={{
                          backgroundColor: lanc.type === 'ENTRADA' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                          color: lanc.type === 'ENTRADA' ? 'var(--color-success)' : 'var(--color-danger)'
                        }}
                      >
                        {lanc.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{formatDateBR(lanc.date)}</td>
                    <td 
                      className="px-4 py-2 font-bold" 
                      style={{ color: lanc.type === 'ENTRADA' ? 'var(--color-success)' : 'var(--color-danger)' }}
                    >
                      {formatCurrency(lanc.amount)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded hover:bg-gray-200" aria-label="Ações">
                            <MoreVertical size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={4}>
                          <DropdownMenuItem autoFocus onSelect={() => handleView(lanc)}>
                            Ver lançamento
                          </DropdownMenuItem>
                          {userRole !== 'LEADER' && (
                            <>
                              <DropdownMenuItem onSelect={() => handleEdit(lanc)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDelete(lanc)}>
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <NewFinanceModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchFinances}
          ministryId={ministryId}
        />
        {/* Modal de Visualização */}
        <Dialog open={viewModal.open} onOpenChange={v => !v && setViewModal({ open: false })}>
          <DialogContent>
            <DialogTitle>Detalhes do Lançamento</DialogTitle>
            {viewModal.lanc && (
              <div className="space-y-2 mt-2">
                <div><b>Título:</b> {viewModal.lanc.title}</div>
                <div><b>Tipo:</b> {viewModal.lanc.type === 'ENTRADA' ? 'Entrada' : 'Saída'}</div>
                <div><b>Data:</b> {formatDateBR(viewModal.lanc.date)}</div>
                <div><b>Valor:</b> {formatCurrency(viewModal.lanc.amount)}</div>
                <div><b>Categoria:</b> {viewModal.lanc.category || '-'}</div>
                <div><b>Descrição:</b> {viewModal.lanc.description || '-'}</div>
                <div><b>Responsável:</b> {viewModal.lanc.responsavel?.name || '-'}</div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setViewModal({ open: false })}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Modal de Edição */}
        <NewFinanceModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false })}
          onSuccess={fetchFinances}
          ministryId={ministryId}
          initialData={editModal.lanc}
          isEdit
        />
        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={deleteModal.open} onOpenChange={v => !v && setDeleteModal({ open: false })}>
          <DialogContent>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <div className="mt-2">Deseja realmente excluir o lançamento <b>{deleteModal.lanc?.title}</b>?</div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteModal({ open: false })}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Modal de filtros */}
        <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
          <DialogContent>
            <DialogTitle>Filtros Avançados</DialogTitle>
            <form className="space-y-4 mt-2">
              <Select
                label="Período"
                value={filters.period}
                onChange={e => setFilters(f => ({ ...f, period: e.target.value }))}
                options={[
                  { value: '', label: 'Todos' },
                  { value: '7d', label: 'Últimos 7 dias' },
                  { value: '14d', label: 'Últimos 14 dias' },
                  { value: '1m', label: 'Último mês' },
                  { value: '2m', label: 'Últimos 2 meses' },
                  { value: 'custom', label: 'Personalizado' }
                ]}
              />
              {filters.period === 'custom' && (
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    placeholder="Data inicial (DD/MM/AAAA)" 
                    className="w-1/2" 
                    value={filters.customStart} 
                    onChange={e => setFilters(f => ({ ...f, customStart: maskDateBR(e.target.value) }))} 
                    maxLength={10} 
                  />
                  <Input 
                    type="text" 
                    placeholder="Data final (DD/MM/AAAA)" 
                    className="w-1/2" 
                    value={filters.customEnd} 
                    onChange={e => setFilters(f => ({ ...f, customEnd: maskDateBR(e.target.value) }))} 
                    maxLength={10} 
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <div className="flex gap-4">
                  {['ENTRADA', 'SAIDA'].map(t => (
                    <label key={t} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={filters.type.includes(t)}
                        onChange={e => {
                          setFilters(f => ({
                            ...f,
                            type: e.target.checked
                              ? [...(f.type as string[]), t]
                              : (f.type as string[]).filter(val => val !== t)
                          }));
                        }}
                      />
                      {t === 'ENTRADA' ? 'Entrada' : 'Saída'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
                  {CATEGORIES.map(cat => {
                    const checked = filters.category.includes(cat);
                    return (
                      <label key={cat} className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer border transition-colors ${checked ? 'bg-green-100 border-green-500 font-semibold' : 'border-transparent hover:bg-gray-100'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            setFilters(f => ({
                              ...f,
                              category: e.target.checked
                                ? [...(f.category as string[]), cat]
                                : (f.category as string[]).filter(val => val !== cat)
                            }));
                          }}
                        />
                        {cat}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  label="Valor mínimo"
                  type="text"
                  className="w-1/2"
                  value={filters.minValue}
                  onChange={e => setFilters(f => ({ ...f, minValue: e.target.value.replace(/[^0-9.,]/g, '') }))}
                />
                <Input
                  label="Valor máximo"
                  type="text"
                  className="w-1/2"
                  value={filters.maxValue}
                  onChange={e => setFilters(f => ({ ...f, maxValue: e.target.value.replace(/[^0-9.,]/g, '') }))}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setFilterModalOpen(false)}>Cancelar</Button>
                <Button type="button" variant="secondary" onClick={() => setFilters({ period: '', customStart: '', customEnd: '', type: [], category: [], minValue: '', maxValue: '' })}>Limpar filtros</Button>
                <Button type="button" variant="primary" onClick={() => setFilterModalOpen(false)}>Filtrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}