"use client";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import MinistryCreateModal from '@/components/forms/MinistryCreateModal';
import { useRouter } from 'next/navigation';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import * as React from 'react';

interface Ministry {
  id: string;
  name: string;
  churchName?: string;
  status: string;
  master?: { id: string; name: string; email: string };
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'ATIVO' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300';
  return (
    <span className={`inline-block px-2 py-1 rounded border text-xs font-semibold ${color}`}>{status}</span>
  );
}

function ActionsMenu({ ministry, onEdit, onDelete, onToggleStatus, onView }: { ministry: any, onEdit: () => void, onDelete: () => void, onToggleStatus: () => void, onView: () => void }) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);
  return (
    <div className="relative" ref={menuRef}>
      <button
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(o => !o)}
        aria-label="Ações"
      >
        <HiOutlineDotsVertical size={20} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-44 bg-white border border-gray-200 rounded shadow-lg py-1">
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { onView(); setOpen(false); }}>Ver detalhes</button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { onEdit(); setOpen(false); }}>Editar</button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600" onClick={() => { onDelete(); setOpen(false); }}>Excluir</button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { onToggleStatus(); setOpen(false); }}>{ministry.status === 'ATIVO' ? 'Desativar' : 'Ativar'}</button>
        </div>
      )}
    </div>
  );
}

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState<any>({});
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editMinistry, setEditMinistry] = useState<Ministry | null>(null);
  const router = useRouter();

  const handleOpenModal = (ministry?: Ministry) => {
    setEditMinistry(ministry || null);
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditMinistry(null);
  };
  const handleSuccess = () => {
    handleCloseModal();
    fetchMinistries();
  };

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      let url = `/api/ministries?search=${search}&page=${page}&perPage=${perPage}`;
      if (sortField) url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
      const res = await fetch(url);
      const data = await res.json();
      setMinistries(data.ministries);
      setPagination({ total: data.total, totalPages: data.totalPages, page: data.page });
    } catch (err) {
      toast.error("Erro ao buscar ministérios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinistries();
    // eslint-disable-next-line
  }, [search, page, sortField, sortOrder]);

  // Debounce da busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ministério?")) return;
    try {
      const res = await fetch(`/api/ministries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir ministério");
      toast.success("Ministério excluído!");
      fetchMinistries();
    } catch {
      toast.error("Erro ao excluir ministério");
    }
  };
  const handleToggleStatus = async (ministry: Ministry) => {
    try {
      const newStatus = ministry.status === 'ATIVO' ? 'DESATIVADO' : 'ATIVO';
      const res = await fetch(`/api/ministries/${ministry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      toast.success(`Ministério ${newStatus === 'ATIVO' ? 'ativado' : 'desativado'}!`);
      fetchMinistries();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Ministérios</h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie, cadastre, edite, ative/desative e exclua ministérios da sua organização. Utilize o menu de ações para acessar todas as funcionalidades.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 text-white rounded">Novo Ministério</button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar por nome ou igreja..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="border border-gray-300 rounded p-2 mb-2 md:mb-0 w-full md:w-auto focus:outline-blue-500 focus:ring-2 focus:ring-blue-300"
          aria-label="Buscar ministérios"
        />
      </div>
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort('name')}>
                Nome {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort('churchName')}>
                Igreja {sortField === 'churchName' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Líder Master</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort('status')}>
                Status {sortField === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: perPage }).map((_, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" /></td>
                </tr>
              ))
            ) : ministries.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8">Nenhum ministério encontrado</td></tr>
            ) : ministries.map((ministry: any) => (
              <tr key={ministry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-blue-700 hover:underline cursor-pointer"
                    onClick={() => router.push(`/dashboard/ministries/${ministry.id}`)}
                >
                  {ministry.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{ministry.churchName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ministry.master?.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={ministry.status || 'ATIVO'} /></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ActionsMenu
                    ministry={ministry}
                    onEdit={() => handleOpenModal(ministry)}
                    onDelete={() => handleDelete(ministry.id)}
                    onToggleStatus={() => handleToggleStatus(ministry)}
                    onView={() => router.push(`/dashboard/ministries/${ministry.id}`)}
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
          <span>Itens por página:</span>
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="border rounded p-1">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <span>Total: {pagination.total || 0} ministérios</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Anterior</button>
          <span>Página {pagination.page || 1} de {pagination.totalPages || 1}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>
      <MinistryCreateModal
        open={openModal}
        onOpenChange={setOpenModal}
        onSuccess={handleSuccess}
        ministry={editMinistry}
      />
    </div>
  );
} 