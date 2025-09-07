'use client'
import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { HiOutlineUser } from 'react-icons/hi';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Menu } from '@headlessui/react';
import { HiOutlineDotsVertical } from 'react-icons/hi';

type CategoriaObservacao = 'elogio' | 'alerta' | 'urgente' | 'acompanhamento' | 'visita' | 'oração' | 'outro';

export default function MemberDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<'dados' | 'observacoes'>('dados');

  const { data: session } = useSession();
  const [observacoes, setObservacoes] = useState<any[]>([]);
  const [obsLoading, setObsLoading] = useState(false);
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsTexto, setObsTexto] = useState('');
  const [obsCategoria, setObsCategoria] = useState('');
  const [obsError, setObsError] = useState('');
  const [obsSaving, setObsSaving] = useState(false);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsModalData, setObsModalData] = useState<any>(null);
  const [editObsModalOpen, setEditObsModalOpen] = useState(false);
  const [editObsData, setEditObsData] = useState<any>(null);
  const [editObsTexto, setEditObsTexto] = useState('');
  const [editObsCategoria, setEditObsCategoria] = useState('');
  const [editObsError, setEditObsError] = useState('');
  const [editObsSaving, setEditObsSaving] = useState(false);
  const [deleteObsModalOpen, setDeleteObsModalOpen] = useState(false);
  const [deleteObsData, setDeleteObsData] = useState<any>(null);
  const [deleteObsLoading, setDeleteObsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    console.log('🔍 Buscando membro com ID:', id);
    fetch(`/api/members/${id}`)
      .then(res => res.json())
      .then(data => {
        console.log('📥 Dados recebidos da API:', data);
        console.log('👤 Dados do membro:', data.member);
        setMember(data.member);
        setLoading(false);
      })
      .catch((error) => {
        console.error('❌ Erro ao carregar membro:', error);
        setError("Erro ao carregar membro");
        setLoading(false);
      });
  }, [id]);

  // Buscar observações ao abrir aba
  useEffect(() => {
    if (tab === 'observacoes') {
      setObsLoading(true);
      fetch(`/api/members/${id}/observacoes`)
        .then(res => res.json())
        .then(data => setObservacoes(data.observacoes || []))
        .finally(() => setObsLoading(false));
    }
  }, [tab, id]);

  // Função para adicionar observação
  async function handleAddObservacao() {
    setObsError('');
    if (!obsTexto.trim()) {
      setObsError('Digite a observação.');
      return;
    }
    setObsSaving(true);
    try {
      const res = await fetch(`/api/members/${id}/observacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: obsTexto, categoria: obsCategoria })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar observação');
      setObservacoes([data.observacao, ...observacoes]);
      setShowObsModal(false);
      setObsTexto('');
      setObsCategoria('');
    } catch (e: any) {
      setObsError(e.message || 'Erro ao salvar observação');
    } finally {
      setObsSaving(false);
    }
  }

  function openObsModal(obs: any) {
    setObsModalData(obs);
    setObsModalOpen(true);
  }
  function closeObsModal() {
    setObsModalOpen(false);
    setObsModalData(null);
  }

  function openEditObsModal(obs: any) {
    setEditObsData(obs);
    setEditObsTexto(obs.texto);
    setEditObsCategoria(obs.categoria || '');
    setEditObsError('');
    setEditObsModalOpen(true);
  }
  function closeEditObsModal() {
    setEditObsModalOpen(false);
    setEditObsData(null);
    setEditObsTexto('');
    setEditObsCategoria('');
    setEditObsError('');
  }
  async function handleEditObs() {
    setEditObsError('');
    if (!editObsTexto.trim()) {
      setEditObsError('Digite a observação.');
      return;
    }
    setEditObsSaving(true);
    try {
      const res = await fetch(`/api/members/${id}/observacoes/${editObsData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: editObsTexto, categoria: editObsCategoria })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao editar observação');
      setObservacoes(observacoes.map(o => o.id === editObsData.id ? data.observacao : o));
      closeEditObsModal();
    } catch (e: any) {
      setEditObsError(e.message || 'Erro ao editar observação');
    } finally {
      setEditObsSaving(false);
    }
  }
  function openDeleteObsModal(obs: any) {
    setDeleteObsData(obs);
    setDeleteObsModalOpen(true);
  }
  function closeDeleteObsModal() {
    setDeleteObsModalOpen(false);
    setDeleteObsData(null);
  }
  async function handleDeleteObs() {
    setDeleteObsLoading(true);
    try {
      const res = await fetch(`/api/members/${id}/observacoes/${deleteObsData.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir observação');
      setObservacoes(observacoes.filter(o => o.id !== deleteObsData.id));
      closeDeleteObsModal();
    } catch (e: any) {
      // Pode exibir erro se quiser
    } finally {
      setDeleteObsLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!member) return <div className="p-8 text-center">Membro não encontrado</div>;

  function calcularIdade(dataNascimento: string | Date | undefined): number | null {
    if (!dataNascimento) return null;
    const data = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
    if (isNaN(data.getTime())) return null;
    const diff = Date.now() - data.getTime();
    const idade = new Date(diff).getUTCFullYear() - 1970;
    return idade;
  }

  function formatarSexo(sexo: string | undefined): string {
    if (sexo === 'M') return 'Masculino';
    if (sexo === 'F') return 'Feminino';
    return '-';
  }

  function formatarEstadoCivil(estadoCivil: string | undefined): string {
    switch (estadoCivil) {
      case 'solteiro': return 'Solteiro(a)';
      case 'casado': return 'Casado(a)';
      case 'divorciado': return 'Divorciado(a)';
      case 'viuvo': return 'Viúvo(a)';
      default: return '-';
    }
  }

  // Função utilitária para badge de categoria
  function CategoriaBadge({ categoria }: { categoria: CategoriaObservacao }) {
    const map: Record<CategoriaObservacao, string> = {
      elogio: 'bg-blue-100 text-blue-700',
      alerta: 'bg-yellow-100 text-yellow-700',
      urgente: 'bg-red-100 text-red-700',
      acompanhamento: 'bg-green-100 text-green-700',
      visita: 'bg-purple-100 text-purple-700',
      oração: 'bg-pink-100 text-pink-700',
      outro: 'bg-gray-100 text-gray-700',
    };
    const labelMap: Record<CategoriaObservacao, string> = {
      elogio: 'Elogio',
      alerta: 'Alerta',
      urgente: 'Urgente',
      acompanhamento: 'Acompanhamento',
      visita: 'Visita',
      oração: 'Oração',
      outro: 'Outro',
    };
    if (!categoria) return null;
    return <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${map[categoria]}`}>{labelMap[categoria]}</span>;
  }
  // Função para avatar com iniciais
  function Avatar({ name }: { name: string }) {
    if (!name) return <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full"><HiOutlineUser className="text-gray-500" /></span>;
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full">{initials}</span>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Detalhes do Membro</h2>
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-semibold border-b-2 ${tab === 'dados' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
          onClick={() => setTab('dados')}
        >
          Dados do Membro
        </button>
        <button
          className={`ml-4 px-4 py-2 font-semibold border-b-2 ${tab === 'observacoes' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
          onClick={() => setTab('observacoes')}
        >
          Observações
        </button>
      </div>
      {tab === 'dados' && (
        <>
          {/* Dados Pessoais */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Dados Pessoais</h3>
            <div><b>Nome:</b> {member.name}</div>
            <div><b>Data de Nascimento:</b> {member.dataNascimento ? new Date(member.dataNascimento).toLocaleDateString('pt-BR') : '-'}</div>
            <div><b>Idade:</b> {calcularIdade(member.dataNascimento) ?? '-'}</div>
            <div><b>Sexo:</b> {formatarSexo(member.sexo)}</div>
            <div><b>Estado Civil:</b> {formatarEstadoCivil(member.estadoCivil)}</div>
          </div>
          {/* Contato */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Contato</h3>
            <div><b>Celular:</b> {member.phone || '-'}</div>
            <div><b>E-mail:</b> {member.email || '-'}</div>
          </div>
          {/* Endereço */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Endereço</h3>
            <div><b>CEP:</b> {member.cep || '-'}</div>
            <div><b>Rua:</b> {member.rua || '-'}</div>
            <div><b>Número:</b> {member.numero || '-'}</div>
            <div><b>Complemento:</b> {member.complemento || '-'}</div>
            <div><b>Bairro:</b> {member.bairro || '-'}</div>
            <div><b>Município:</b> {member.municipio || '-'}</div>
            <div><b>Estado:</b> {member.estado || '-'}</div>
          </div>
          {/* Responsáveis */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Responsáveis</h3>
            {member.responsaveis && member.responsaveis.length > 0 ? (
              <ul className="ml-6">
                {member.responsaveis.map((r: any, idx: number) => (
                  <li key={idx} className="mb-4 p-3 border rounded bg-gray-50">
                    <div><b>Tipo:</b> {r.tipo}</div>
                    <div><b>Nome:</b> {r.nome}</div>
                    <div><b>Celular:</b> {r.celular}</div>
                  </li>
                ))}
              </ul>
            ) : <div>Nenhum responsável informado</div>}
          </div>
          {/* Vínculos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Vínculos</h3>
            <div><b>Irmãos no ministério:</b> {member.irmaos && member.irmaos.length > 0 ? member.irmaos.map((i: any) => i.name).join(', ') : 'Nenhum'}</div>
            <div><b>Primos no ministério:</b> {member.primos && member.primos.length > 0 ? member.primos.map((p: any) => p.name).join(', ') : 'Nenhum'}</div>
          </div>
          {/* Dados Ministeriais */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Dados Ministeriais</h3>
            <div><b>Batizado:</b> {member.batizado ? 'Sim' : 'Não'}</div>
            <div><b>Data de Ingresso:</b> {member.dataIngresso ? new Date(member.dataIngresso).toLocaleDateString('pt-BR') : '-'}</div>
            <div><b>Status:</b> {member.status || '-'}</div>
            <div><b>Ministério:</b> {member.ministry?.name || '-'}</div>
            <div><b>Igreja:</b> {member.ministry?.church?.name || '-'}</div>
          </div>
        </>
      )}
      {tab === 'observacoes' && (
        <div>
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Observações</h3>
          <p className="text-sm text-gray-600 mb-4">Registre observações importantes sobre o membro, como elogios, alertas, acompanhamentos, pedidos de oração, visitas ou outras informações relevantes.</p>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowObsModal(true)}
          >
            Adicionar Observação
          </button>
          <h4 className="text-base font-bold text-gray-700 mb-2">Lista de observações de {member.name}</h4>
          <Dialog open={showObsModal} onOpenChange={setShowObsModal}>
            <DialogContent>
              <DialogTitle>Nova Observação</DialogTitle>
              <p className="text-sm text-gray-600 mb-3">Preencha o campo abaixo para registrar uma observação sobre o membro. Utilize a categoria para classificar o tipo de observação, como elogio, alerta, acompanhamento, pedido de oração, etc.</p>
              <textarea
                className="w-full border rounded p-2 mt-2 mb-2"
                rows={4}
                placeholder="Digite a observação..."
                value={obsTexto}
                onChange={e => setObsTexto(e.target.value)}
                disabled={obsSaving}
              />
              <Select
                label="Categoria (opcional)"
                value={obsCategoria}
                onChange={e => setObsCategoria(e.target.value as CategoriaObservacao)}
                options={[
                  { value: '', label: 'Sem categoria' },
                  { value: 'elogio', label: 'Elogio' },
                  { value: 'alerta', label: 'Alerta' },
                  { value: 'urgente', label: 'Urgente' },
                  { value: 'acompanhamento', label: 'Acompanhamento' },
                  { value: 'visita', label: 'Visita' },
                  { value: 'oração', label: 'Oração' },
                  { value: 'outro', label: 'Outro' },
                ]}
                disabled={obsSaving}
              />
              {obsError && <div className="text-red-600 text-sm mt-2">{obsError}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setShowObsModal(false)} disabled={obsSaving}>Cancelar</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleAddObservacao} disabled={obsSaving}>{obsSaving ? 'Adicionando...' : 'Adicionar'}</button>
              </div>
            </DialogContent>
          </Dialog>
          {obsLoading ? (
            <div className="text-center text-gray-500 mt-8">Carregando observações...</div>
          ) : (
            <div className="overflow-x-auto mt-4 max-h-[400px]">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left w-2/5">Observação</th>
                    <th className="px-4 py-2 text-left w-1/6">Autor</th>
                    <th className="px-4 py-2 text-left w-1/6">Data/Hora</th>
                    <th className="px-4 py-2 text-left w-1/6">Categoria</th>
                    <th className="px-2 py-2 w-10 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {observacoes.length === 0 && (
                    <tr><td colSpan={5} className="text-gray-500 text-center py-8">Nenhuma observação cadastrada.</td></tr>
                  )}
                  {observacoes.map(obs => (
                    <tr key={obs.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      {/* Observação */}
                      <td className="px-4 py-3 align-top whitespace-pre-line text-gray-800 cursor-pointer hover:underline" onClick={() => openObsModal(obs)} title="Clique para ver a observação completa">
                        {obs.texto.length > 60 ? obs.texto.slice(0, 60) + '...' : obs.texto}
                      </td>
                      {/* Autor */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <Avatar name={obs.autor?.name || ''} />
                          <span className="font-semibold text-blue-700">{obs.autor?.name || 'Autor desconhecido'}</span>
                        </div>
                      </td>
                      {/* Data/Hora */}
                      <td className="px-4 py-3 align-top">
                        <span className="text-xs text-gray-500" title={new Date(obs.createdAt).toLocaleString('pt-BR')}>{new Date(obs.createdAt).toLocaleDateString('pt-BR')}<br />{new Date(obs.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      {/* Categoria */}
                      <td className="px-4 py-3 align-top">
                        <CategoriaBadge categoria={obs.categoria as CategoriaObservacao} />
                      </td>
                      {/* Ações */}
                      <td className="px-2 py-3 align-top text-center">
                        <Menu as="div" className="relative inline-block text-left">
                          <Menu.Button className="p-1 rounded hover:bg-gray-100 text-gray-500">
                            <HiOutlineDotsVertical size={18} />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-2 w-36 origin-top-right bg-white border border-gray-200 rounded shadow-lg z-20 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''} text-blue-700`} onClick={() => openObsModal(obs)}>Ver observação</button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''} text-gray-700`} onClick={() => openEditObsModal(obs)}>Editar</button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''} text-red-600`} onClick={() => openDeleteObsModal(obs)}>Excluir</button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* Modal de visualização da observação */}
      <Dialog open={obsModalOpen} onOpenChange={v => { if (!v) closeObsModal(); }}>
        <DialogContent>
          <DialogTitle>Observação completa</DialogTitle>
          {obsModalData && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Observação</div>
                <div className="whitespace-pre-line text-gray-800 border rounded p-3 bg-gray-50 text-base font-medium">{obsModalData.texto}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Categoria</div>
                {obsModalData.categoria ? <CategoriaBadge categoria={obsModalData.categoria as CategoriaObservacao} /> : <span className="text-gray-400 text-xs">Sem categoria</span>}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Autor</div>
                  <div className="flex items-center gap-2">
                    <Avatar name={obsModalData.autor?.name || ''} />
                    <span className="font-semibold text-blue-700">{obsModalData.autor?.name || 'Autor desconhecido'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Data de criação</div>
                  <span className="text-xs text-gray-500">{new Date(obsModalData.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={closeObsModal}>Fechar</button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de edição de observação */}
      <Dialog open={editObsModalOpen} onOpenChange={v => { if (!v) closeEditObsModal(); }}>
        <DialogContent>
          <DialogTitle>Editar Observação</DialogTitle>
          <p className="text-sm text-gray-600 mb-3">Altere o texto ou a categoria da observação conforme necessário.</p>
          <textarea
            className="w-full border rounded p-2 mt-2 mb-2"
            rows={4}
            placeholder="Digite a observação..."
            value={editObsTexto}
            onChange={e => setEditObsTexto(e.target.value)}
            disabled={editObsSaving}
          />
          <Select
            label="Categoria (opcional)"
            value={editObsCategoria}
            onChange={e => setEditObsCategoria(e.target.value as CategoriaObservacao)}
            options={[
              { value: '', label: 'Sem categoria' },
              { value: 'elogio', label: 'Elogio' },
              { value: 'alerta', label: 'Alerta' },
              { value: 'urgente', label: 'Urgente' },
              { value: 'acompanhamento', label: 'Acompanhamento' },
              { value: 'visita', label: 'Visita' },
              { value: 'oração', label: 'Oração' },
              { value: 'outro', label: 'Outro' },
            ]}
            disabled={editObsSaving}
          />
          {editObsError && <div className="text-red-600 text-sm mt-2">{editObsError}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={closeEditObsModal} disabled={editObsSaving}>Cancelar</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleEditObs} disabled={editObsSaving}>{editObsSaving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteObsModalOpen} onOpenChange={v => { if (!v) closeDeleteObsModal(); }}>
        <DialogContent>
          <DialogTitle>Excluir Observação</DialogTitle>
          <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja excluir esta observação? Esta ação não poderá ser desfeita.</p>
          <div className="whitespace-pre-line text-gray-800 border rounded p-3 bg-gray-50 text-base font-medium mb-4">{deleteObsData?.texto}</div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={closeDeleteObsModal} disabled={deleteObsLoading}>Cancelar</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDeleteObs} disabled={deleteObsLoading}>{deleteObsLoading ? 'Excluindo...' : 'Excluir'}</button>
          </div>
        </DialogContent>
      </Dialog>
      <button className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => router.back()}>Voltar</button>
    </div>
  );
}