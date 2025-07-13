"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import LeaderCreateModal from "@/components/forms/LeaderCreateModal";

interface Leader {
  id: string;
  name: string;
  email?: string;
  celular?: string;
  isActive?: boolean;
  ministry?: { id: string; name: string; church?: { name: string } };
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

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Líderes</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={() => setShowCreateModal(true)}
        >
          Adicionar Líder
        </button>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar por nome ou e-mail"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="border rounded p-2 w-64"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Buscar</button>
        {/* Removido seletor de status */}
      </form>
      {/* Removido controle de colunas visíveis */}
      <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-2 text-center"><input type="checkbox" checked={selectedIds.length === leaders.length && leaders.length > 0} onChange={toggleSelectAll} /></th>
            <th className="px-4 py-2 text-left">Nome</th>
            <th className="px-4 py-2 text-left">E-mail</th>
            <th className="px-4 py-2 text-left">Telefone</th>
            <th className="px-4 py-2 text-left">Ministério</th>
            <th className="px-4 py-2 text-left">Igreja</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {leaders.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8">Nenhum líder encontrado</td></tr>
          ) : leaders.map(leader => (
            <tr key={leader.id} className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer">
              <td className="px-2 py-2 text-center">
                <input type="checkbox" checked={selectedIds.includes(leader.id)} onChange={() => toggleSelectOne(leader.id)} />
              </td>
              <td className="px-4 py-2 text-blue-700 hover:underline" onClick={() => router.push(`/dashboard/leaders/${leader.id}`)}>{leader.name}</td>
              <td className="px-4 py-2">{leader.email || '-'}</td>
              <td className="px-4 py-2">{leader.celular || '-'}</td>
              <td className="px-4 py-2">{leader.ministry?.name || '-'}</td>
              <td className="px-4 py-2">{leader.ministry?.church?.name || '-'}</td>
              <td className="px-4 py-2">{leader.isActive === undefined ? '-' : leader.isActive ? 'Ativo' : 'Inativo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
        <span>Total: {(pagination.total !== undefined ? pagination.total : leaders.length)} líderes</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Anterior</button>
          <span>Página {pagination.page || 1} de {pagination.totalPages || 1}</span>
          <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>
      <LeaderCreateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} ministryId={session?.user?.ministryId} />
    </div>
  );
} 