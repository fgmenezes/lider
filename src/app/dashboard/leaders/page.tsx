"use client";
import React from "react";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tab } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import LeaderCreateModal from "@/components/forms/LeaderCreateModal";
import { HiOutlineDotsVertical } from 'react-icons/hi';

interface Leader {
  id: string;
  name: string;
  email?: string;
  celular?: string;
  isActive?: boolean;
  ministry?: { id: string; name: string; church?: { name: string } };
  role?: 'ADMIN' | 'MASTER' | 'LEADER' | null;
  // ... outros campos se necessário
}

export default function LeadersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ministryFilter, setMinistryFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [ministries, setMinistries] = useState<{ id: string; name: string }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editLeader, setEditLeader] = useState<Leader | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Função para calcular idade
  function calculateAge(dateStr: string) {
    if (!dateStr || dateStr.length !== 10) return '';
    const [d, m, y] = dateStr.split('/');
    const birth = new Date(`${y}-${m}-${d}`);
    if (isNaN(birth.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
  }

  // Função para converter data brasileira para americana
  function toISODate(dateBr: string) {
    if (!dateBr || dateBr.length !== 10) return '';
    const [d, m, y] = dateBr.split('/');
    if (!d || !m || !y) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      let url = `/api/users?role=LEADER,MASTER&search=${search}&page=${page}&perPage=${perPage}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (ministryFilter) url += `&ministryId=${ministryFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setLeaders(data.users || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError("Erro ao buscar líderes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
    // eslint-disable-next-line
  }, [search, page, statusFilter, ministryFilter]);

  useEffect(() => {
    fetch('/api/ministries?perPage=100')
      .then(res => res.json())
      .then(data => setMinistries(data.ministries || []));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leaders.length) setSelectedIds([]);
    else setSelectedIds(leaders.map(l => l.id));
  };
  const toggleSelectOne = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  // Função para excluir líder
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const text = await res.text();
      if (!res.ok) {
        console.error('Erro ao excluir líder:', text);
        alert("Erro ao excluir líder: " + text);
        return;
      }
      fetchLeaders();
    } catch (e: any) {
      console.error('Erro inesperado ao excluir líder:', e);
      alert("Erro inesperado ao excluir líder: " + (e?.message || ''));
    }
  };

  // Função para ativar/inativar líder
  const handleBulkStatus = async (newStatus: boolean, leaderIds: string[]) => {
    if (leaderIds.length === 0) return;
    for (const id of leaderIds) {
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
    }
    fetchLeaders();
  };

  // Atalhos de teclado
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setShowCreateModal(true);
      }
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (selectedIds.length > 0) {
          setSelectedIds([]);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  if (loading) return (
    <div className="p-8 text-center">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm animate-pulse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-2 text-center"><div className="w-4 h-4 bg-gray-200 rounded mx-auto" /></th>
            <th className="px-4 py-2 text-left"><div className="w-24 h-4 bg-gray-200 rounded" /></th>
            <th className="px-4 py-2 text-left"><div className="w-32 h-4 bg-gray-200 rounded" /></th>
            <th className="px-4 py-2 text-left"><div className="w-20 h-4 bg-gray-200 rounded" /></th>
            <th className="px-4 py-2 text-left"><div className="w-24 h-4 bg-gray-200 rounded" /></th>
            <th className="px-4 py-2 text-left"><div className="w-24 h-4 bg-gray-200 rounded" /></th>
            <th className="px-4 py-2 text-left"><div className="w-16 h-4 bg-gray-200 rounded" /></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b last:border-b-0">
              <td className="px-2 py-2 text-center"><div className="w-4 h-4 bg-gray-200 rounded mx-auto" /></td>
              <td className="px-4 py-2"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
              <td className="px-4 py-2"><div className="w-32 h-4 bg-gray-200 rounded" /></td>
              <td className="px-4 py-2"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
              <td className="px-4 py-2"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
              <td className="px-4 py-2"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
              <td className="px-4 py-2"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (error) return <div className="p-8 text-center text-[var(--color-danger)]">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Líderes</h1>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          Novo Líder
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <Input
          ref={searchInputRef}
          placeholder="Buscar por nome ou e-mail"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setSearch(searchInput);
              setPage(1);
            }
          }}
          className="mb-2 md:mb-0 w-full md:w-auto"
          aria-label="Buscar líderes"
        />
      </div>
      {/* Barra de ações em massa */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-[var(--color-primary-light)] border border-[var(--color-border)] rounded">
          <span className="text-[var(--color-text-primary)]">{selectedIds.length} selecionado(s)</span>
          <Button size="sm" variant="outline" className="text-[var(--color-success)] border-[var(--color-success)] hover:bg-[var(--color-success-light)]" onClick={() => handleBulkStatus(true, selectedIds)}>Ativar</Button>
          <Button size="sm" variant="secondary" onClick={() => handleBulkStatus(false, selectedIds)}>Inativar</Button>
          <Button size="sm" variant="danger" onClick={async () => { if (confirm('Tem certeza que deseja excluir os líderes selecionados?')) { for (const id of selectedIds) { await handleDelete(id); } setSelectedIds([]); } }}>Excluir</Button>
          <Button size="sm" variant="secondary" onClick={() => setSelectedIds([])}>Limpar seleção</Button>
        </div>
      )}
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-center">
                <input type="checkbox" checked={selectedIds.length === leaders.length && leaders.length > 0} onChange={toggleSelectAll} aria-label="Selecionar todos os líderes" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Celular</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ministério</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Igreja</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaders.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-[var(--color-text-secondary)]">Nenhum líder encontrado</td></tr>
            ) : leaders.map(leader => (
              <tr key={leader.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-2 py-4 text-center">
                  <input type="checkbox" checked={selectedIds.includes(leader.id)} onChange={() => toggleSelectOne(leader.id)} aria-label={`Selecionar líder ${leader.name}`} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-700 hover:underline cursor-pointer" onClick={() => router.push(`/dashboard/leaders/${leader.id}`)}>{leader.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{leader.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{leader.celular || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{leader.ministry?.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{leader.ministry?.church?.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{leader.role === 'MASTER' ? 'Líder Master' : leader.role === 'LEADER' ? 'Líder' : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{leader.isActive === undefined ? '-' : leader.isActive ? <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">Ativo</span> : <span className="inline-block px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-semibold">Inativo</span>}</td>
                <td className="px-6 py-4 whitespace-nowrap flex gap-2 relative">
                  <LeaderActionsMenu
                    leader={leader}
                    onEdit={() => { setEditLeader(leader); setShowEditModal(true); }}
                    onDelete={async () => { if (confirm('Tem certeza que deseja excluir este líder?')) { try { const res = await fetch(`/api/users/${leader.id}`, { method: "DELETE" }); const text = await res.text(); if (!res.ok) { console.error('Erro ao excluir líder:', text); alert("Erro ao excluir líder: " + text); return; } fetchLeaders(); } catch (e: any) { console.error('Erro inesperado ao excluir líder:', e); alert("Erro inesperado ao excluir líder: " + (e?.message || '')); } } }}
                    onToggleStatus={async () => { const novoStatus = leader.isActive ? false : true; if (confirm(`Tem certeza que deseja ${novoStatus ? 'ativar' : 'inativar'} este líder?`)) { try { const res = await fetch(`/api/users/${leader.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: novoStatus }) }); const text = await res.text(); if (!res.ok) { console.error('Erro ao atualizar status do líder:', text); alert("Erro ao atualizar status do líder: " + text); return; } fetchLeaders(); } catch (e: any) { console.error('Erro inesperado ao atualizar status do líder:', e); alert("Erro inesperado ao atualizar status do líder: " + (e?.message || '')); } } }}
                    onView={() => { window.location.href = `/dashboard/leaders/${leader.id}`; }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Paginação */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-primary)]">Itens por página:</span>
          <Select
            value={perPage.toString()}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            options={[
              { value: "10", label: "10" },
              { value: "20", label: "20" },
              { value: "50", label: "50" },
              { value: "100", label: "100" }
            ]}
          >
          </Select>
        </div>
        <span className="text-[var(--color-text-primary)]">Total: {(pagination.total !== undefined ? pagination.total : leaders.length)} líderes</span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-[var(--color-text-primary)]">Página {pagination.page || 1} de {pagination.totalPages || 1}</span>
          <Button
            variant="secondary"
            disabled={!pagination.hasNext}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
      <LeaderCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        ministryId={session?.user?.ministryId ?? undefined}
      />
      {showEditModal && editLeader && (
        <LeaderEditTabs
          leader={editLeader}
          open={showEditModal}
          onClose={() => { setShowEditModal(false); setEditLeader(null); }}
          onSave={() => { setShowEditModal(false); setEditLeader(null); fetchLeaders(); }}
          ministries={ministries}
          session={session}
        />
      )}
    </div>
  );
}

function LeaderActionsMenu({ leader, onEdit, onDelete, onToggleStatus, onView }: {
  leader: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onView: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const optionRef0 = React.useRef<HTMLButtonElement>(null);
  const optionRef1 = React.useRef<HTMLButtonElement>(null);
  const optionRef2 = React.useRef<HTMLButtonElement>(null);
  const optionRef3 = React.useRef<HTMLButtonElement>(null);
  const optionRefs = React.useMemo(() => [optionRef0, optionRef1, optionRef2, optionRef3], []);
  const optionCount = 4;

  React.useEffect(() => {
    if (open) {
      setTimeout(() => optionRefs[0].current?.focus(), 0);
    }
  }, [open, optionRefs]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        setOpen(true);
        setTimeout(() => optionRefs[0].current?.focus(), 0);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    }
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const current = optionRefs.findIndex(ref => ref.current === document.activeElement);
      let next = 0;
      if (e.key === 'ArrowDown') {
        next = current === -1 ? 0 : (current + 1) % optionCount;
      } else {
        next = current === -1 ? optionCount - 1 : (current - 1 + optionCount) % optionCount;
      }
      optionRefs[next].current?.focus();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => { setOpen(o => !o); setTimeout(() => optionRefs[0].current?.focus(), 0); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="true"
        aria-expanded={open}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
        tabIndex={0}
        title="Ações"
      >
        <HiOutlineDotsVertical className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-[var(--color-background)] border border-[var(--color-border)] rounded shadow-lg z-50 flex flex-col" role="menu">
          <button
            ref={optionRefs[0]}
            className="px-4 py-2 text-left hover:bg-[var(--color-neutral)] focus:bg-[var(--color-neutral)] focus:outline-none text-[var(--color-text-primary)]"
            onClick={() => { setOpen(false); onView(); }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="menuitem"
          >Ver detalhes</button>
          <button
            ref={optionRefs[1]}
            className="px-4 py-2 text-left hover:bg-[var(--color-neutral)] focus:bg-[var(--color-neutral)] focus:outline-none text-[var(--color-text-primary)]"
            onClick={() => { setOpen(false); onEdit(); }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="menuitem"
          >Editar</button>
          <button
            ref={optionRefs[2]}
            className="px-4 py-2 text-left hover:bg-[var(--color-danger-light)] focus:bg-[var(--color-danger-light)] focus:outline-none text-[var(--color-danger)]"
            onClick={() => { setOpen(false); onDelete(); }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="menuitem"
          >Excluir</button>
          <button
            ref={optionRefs[3]}
            className="px-4 py-2 text-left hover:bg-[var(--color-neutral)] focus:bg-[var(--color-neutral)] focus:outline-none text-[var(--color-text-primary)]"
            onClick={() => { setOpen(false); onToggleStatus(); }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="menuitem"
          >{leader.isActive ? 'Inativar' : 'Ativar'}</button>
        </div>
      )}
    </div>
  );
}

// Placeholder do componente LeaderEditTabs para edição em abas
function LeaderEditTabs({ leader, open, onClose, onSave, ministries, session }: any) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [form, setForm] = React.useState({ ...leader });
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const nomeRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (open && nomeRef.current) {
      nomeRef.current.focus();
    }
  }, [open]);
  const tabs = [
    { name: 'Dados Pessoais', content: (
      <div className="space-y-4">
        <label className="block text-[var(--color-text-primary)]">
          Nome completo
          <Input
            ref={nomeRef}
            value={form.name || ''}
            onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Data de Nascimento
          <Input
            type="date"
            value={form.dataNascimento || ''}
            onChange={e => setForm((f: any) => ({ ...f, dataNascimento: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Sexo
          <Select
            value={form.sexo || ''}
            onChange={e => setForm((f: any) => ({ ...f, sexo: e.target.value }))}
            options={[
              { value: "", label: "Selecione" },
              { value: "MASCULINO", label: "Masculino" },
              { value: "FEMININO", label: "Feminino" }
            ]}
          >
          </Select>
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Estado Civil
          <Input
            value={form.estadoCivil || ''}
            onChange={e => setForm((f: any) => ({ ...f, estadoCivil: e.target.value }))}
          />
        </label>
      </div>
    ) },
    { name: 'Contato', content: (
      <div className="space-y-4">
        <label className="block text-[var(--color-text-primary)]">
          Celular
          <Input
            value={form.celular || ''}
            onChange={e => setForm((f: any) => ({ ...f, celular: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          E-mail
          <Input
            type="email"
            value={form.email || ''}
            onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))}
          />
        </label>
      </div>
    ) },
    { name: 'Endereço', content: (
      <div className="space-y-4">
        <label className="block text-[var(--color-text-primary)]">
          CEP
          <Input
            value={form.cep || ''}
            onChange={e => setForm((f: any) => ({ ...f, cep: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Rua
          <Input
            value={form.rua || ''}
            onChange={e => setForm((f: any) => ({ ...f, rua: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Número
          <Input
            value={form.numero || ''}
            onChange={e => setForm((f: any) => ({ ...f, numero: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Complemento
          <Input
            value={form.complemento || ''}
            onChange={e => setForm((f: any) => ({ ...f, complemento: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Bairro
          <Input
            value={form.bairro || ''}
            onChange={e => setForm((f: any) => ({ ...f, bairro: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Município
          <Input
            value={form.municipio || ''}
            onChange={e => setForm((f: any) => ({ ...f, municipio: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Estado
          <Input
            value={form.estado || ''}
            onChange={e => setForm((f: any) => ({ ...f, estado: e.target.value }))}
          />
        </label>
      </div>
    ) },
    { name: 'Permissões', content: (
      <div className="space-y-4">
        <label className="block text-[var(--color-text-primary)]">
          Tipo de Líder
          <Select
            value={form.role || ''}
            onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))}
            options={[
              { value: "", label: "Selecione" },
              { value: "LEADER", label: "Líder" },
              { value: "MASTER", label: "Líder Master" }
            ]}
          >
          </Select>
        </label>
      </div>
    ) },
    { name: 'Login', content: (
      <div className="space-y-4">
        <label className="block text-[var(--color-text-primary)]">
          E-mail de Login
          <Input
            type="email"
            value={form.emailLogin || form.email || ''}
            onChange={e => setForm((f: any) => ({ ...f, emailLogin: e.target.value }))}
          />
        </label>
        <label className="block text-[var(--color-text-primary)]">
          Senha (deixe em branco para não alterar)
          <Input
            type="password"
            value={form.senha || ''}
            onChange={e => setForm((f: any) => ({ ...f, senha: e.target.value }))}
          />
        </label>
      </div>
    ) },
  ];

  async function handleSave() {
    setFormError("");
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        dataNascimento: form.dataNascimento,
        sexo: form.sexo,
        estadoCivil: form.estadoCivil,
        celular: form.celular,
        email: form.email,
        cep: form.cep,
        rua: form.rua,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        municipio: form.municipio,
        estado: form.estado,
        role: form.role,
        emailLogin: form.emailLogin || form.email,
      };
      if (form.senha) payload.senha = form.senha;
      const res = await fetch(`/api/users/${leader.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao salvar');
      }
      onSave();
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-background)] rounded-lg shadow-lg p-8 w-full max-w-2xl border border-[var(--color-border)]">
        <h2 className="text-xl font-bold mb-4 text-[var(--color-text-primary)]">Editar Líder</h2>
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-2 border-b border-[var(--color-border)] mb-4">
            {tabs.map((tab, idx) => (
              <Tab key={tab.name} className={({ selected }) =>
                `px-4 py-2 text-sm font-medium rounded-t ${selected ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-neutral)] text-[var(--color-text-secondary)]'}`
              }>
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            {tabs.map((tab, idx) => (
              <Tab.Panel key={tab.name} className="p-2">{tab.content}</Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
        {formError && <div className="text-[var(--color-danger)] text-sm mt-2">{formError}</div>}
      </div>
    </div>
  );
}