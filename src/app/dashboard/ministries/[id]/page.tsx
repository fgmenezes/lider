"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tab } from '@headlessui/react';
import SelectMasterModal from '@/components/forms/SelectMasterModal';

export default function MinistryDetailsPage() {
  const { id: rawId } = useParams();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const [ministry, setMinistry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSelectMaster, setShowSelectMaster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function fetchMinistry() {
      setLoading(true);
      try {
        const res = await fetch(`/api/ministries/${id}`);
        if (!res.ok) throw new Error('Erro ao buscar ministério');
        const data = await res.json();
        setMinistry(data.ministry);
      } catch (e: any) {
        setError(e.message || 'Erro ao buscar ministério');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMinistry();
  }, [id]);

  async function handleSelectMaster(user: any) {
    setSaving(true);
    try {
      const res = await fetch(`/api/ministries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterId: user.id }),
      });
      if (!res.ok) throw new Error('Erro ao associar líder master');
      // Atualiza dados do ministério
      const data = await res.json();
      setMinistry(data.ministry);
      alert('Líder master associado com sucesso!');
    } catch (e) {
      alert('Erro ao associar líder master');
    } finally {
      setSaving(false);
      setShowSelectMaster(false);
    }
  }

  if (loading) return <div className="container mx-auto py-8 px-4 max-w-2xl">Carregando...</div>;
  if (error || !ministry) return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Ministério não encontrado</h1>
      <p className="text-gray-600">O ministério solicitado não existe ou ocorreu um erro ao buscar os dados.</p>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Detalhes do Ministério</h1>
      <Tab.Group>
        <Tab.List className="flex space-x-2 border-b mb-6">
          <Tab className={({ selected }) => `px-4 py-2 text-sm font-medium rounded-t ${selected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Dados do Ministério</Tab>
          <Tab className={({ selected }) => `px-4 py-2 text-sm font-medium rounded-t ${selected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Líder Master</Tab>
          <Tab className={({ selected }) => `px-4 py-2 text-sm font-medium rounded-t ${selected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Membros</Tab>
        </Tab.List>
        <Tab.Panels>
          {/* Guia 1: Dados do Ministério */}
          <Tab.Panel>
            <div className="bg-white rounded shadow p-6 mb-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-700">Dados do Ministério</h2>
                <div className="mb-1"><span className="font-semibold">Nome:</span> {ministry.name}</div>
                <div className="mb-1"><span className="font-semibold">Igreja:</span> {ministry.church?.name || ministry.churchName || 'Sem igreja'}</div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-700">Endereço da Igreja</h2>
                <div className="mb-1"><span className="font-semibold">Rua:</span> {ministry.rua || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">Número:</span> {ministry.numero || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">Complemento:</span> {ministry.complemento || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">Bairro:</span> {ministry.bairro || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">Município:</span> {ministry.municipio || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">Estado:</span> {ministry.estado || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">CEP:</span> {ministry.cep || 'Não informado'}</div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-700">Contato da Igreja</h2>
                <div className="mb-1"><span className="font-semibold">Telefone:</span> {ministry.churchPhone || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">Email:</span> {ministry.churchEmail || 'Não informado'}</div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-700">Dados do Pastor</h2>
                <div className="mb-1"><span className="font-semibold">Nome:</span> {ministry.pastorName || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">Telefone:</span> {ministry.pastorPhone || 'Não informado'}</div>
                <div className="mb-1"><span className="font-semibold">Email:</span> {ministry.pastorEmail || 'Não informado'}</div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-700">Status e Datas</h2>
                <div className="mb-1"><span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded text-xs font-semibold ${ministry.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{ministry.status === 'ATIVO' ? 'Ativo' : 'Desativado'}</span></div>
                <div className="mb-1"><span className="font-semibold">Criado em:</span> {ministry.createdAt ? new Date(ministry.createdAt).toLocaleDateString() : '-'}</div>
                <div className="mb-1"><span className="font-semibold">Atualizado em:</span> {ministry.updatedAt ? new Date(ministry.updatedAt).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          </Tab.Panel>
          {/* Guia 2: Líder Master */}
          <Tab.Panel>
            <div className="bg-white rounded shadow p-6 mb-6">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                aria-label="Associar Líder Master"
                onClick={() => setShowSelectMaster(true)}
                disabled={saving}
              >
                Associar Líder Master
              </button>
              <SelectMasterModal
                open={showSelectMaster}
                onClose={() => setShowSelectMaster(false)}
                onSelect={handleSelectMaster}
                ministryId={id}
              />
              {/* Tabela de líder master */}
              <div className="mt-6">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ministry.master ? (
                      <tr>
                        <td className="px-4 py-2">
                          <a
                            href={`/dashboard/users/${ministry.master.id}`}
                            className="text-blue-700 hover:underline font-semibold cursor-pointer"
                            title="Ver detalhes do usuário"
                          >
                            {ministry.master.name}
                          </a>
                        </td>
                        <td className="px-4 py-2">{ministry.master.email}</td>
                        <td className="px-4 py-2">{ministry.master.celular || ministry.master.phone || '-'}</td>
                        <td className="px-4 py-2">
                          <button
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs disabled:opacity-50"
                            disabled={saving}
                            onClick={async () => {
                              if (!confirm('Tem certeza que deseja desassociar este líder master?')) return;
                              setSaving(true);
                              setFeedback(null);
                              try {
                                const res = await fetch(`/api/ministries/${id}/dissociate-master`, { method: 'POST' });
                                if (!res.ok) throw new Error('Erro ao desassociar líder master');
                                const data = await res.json();
                                setMinistry(data.ministry);
                                setFeedback({ type: 'success', message: 'Líder master desassociado com sucesso!' });
                                setTimeout(() => setFeedback(null), 3500);
                              } catch (e) {
                                setFeedback({ type: 'error', message: 'Erro ao desassociar líder master' });
                                setTimeout(() => setFeedback(null), 3500);
                              } finally {
                                setSaving(false);
                              }
                            }}
                          >
                            Desassociar
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-gray-500 text-center py-4">Nenhum líder master associado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>
          {/* Guia 3: Membros */}
          <Tab.Panel>
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-semibold mb-2">Membros</h2>
              {ministry.members?.length ? (
                <ul className="divide-y divide-gray-100">
                  {ministry.members.map((member: any) => (
                    <li key={member.id} className="py-2">
                      <span className="font-medium">{member.name}</span>
                      {member.email && <span className="ml-2 text-gray-500 text-sm">({member.email})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">Nenhum membro cadastrado.</div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      {/* Feedback visual tipo toast */}
      {feedback && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white text-sm font-semibold transition-all duration-300 ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
} 