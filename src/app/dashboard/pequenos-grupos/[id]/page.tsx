"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FREQUENCIAS_LABEL } from "@/constants/frequencias";
import { Tab } from '@headlessui/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSession } from "next-auth/react";

export default function SmallGroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id as string;
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState("");
  const [showAddLeaderModal, setShowAddLeaderModal] = useState(false);
  const [searchLeader, setSearchLeader] = useState("");
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [eligibleLeaders, setEligibleLeaders] = useState<any[]>([]);
  const [eligibleLeadersLoading, setEligibleLeadersLoading] = useState(false);
  const [eligibleLeadersError, setEligibleLeadersError] = useState("");
  const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
  const [eligibleMembersLoading, setEligibleMembersLoading] = useState(false);
  const [eligibleMembersError, setEligibleMembersError] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [removingLeaderId, setRemovingLeaderId] = useState<string | null>(null);
  const [confirmRemoveLeader, setConfirmRemoveLeader] = useState<null | { id: string; name: string }>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<null | { id: string; name: string }>(null);

  const { data: session } = useSession();

  useEffect(() => {
    async function fetchGroup() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/small-groups/${groupId}`);
        if (!res.ok) throw new Error("Erro ao buscar grupo");
        const data = await res.json();
        setGroup(data.group);
        setMeetings(data.group.meetings || []);
      } catch (e: any) {
        setError(e.message || "Erro ao buscar grupo");
      } finally {
        setLoading(false);
      }
    }
    if (groupId) fetchGroup();
  }, [groupId]);

  // Buscar líderes elegíveis ao abrir modal
  useEffect(() => {
    if (showAddLeaderModal && group?.ministryId) {
      setEligibleLeadersLoading(true);
      setEligibleLeadersError("");
      const excludeIds = group.leaders?.map((l: any) => l.userId).join(",") || "";
      fetch(`/api/ministries/${group.ministryId}/leaders?search=${encodeURIComponent(searchLeader)}&excludeIds=${excludeIds}`)
        .then(res => res.json())
        .then(data => setEligibleLeaders(data.leaders || []))
        .catch(() => setEligibleLeadersError("Erro ao buscar líderes."))
        .finally(() => setEligibleLeadersLoading(false));
    }
  }, [showAddLeaderModal, searchLeader, group?.ministryId, group?.leaders]);

  // Buscar membros elegíveis ao abrir modal
  useEffect(() => {
    if (showAddMemberModal && group?.ministryId) {
      setEligibleMembersLoading(true);
      setEligibleMembersError("");
      const excludeIds = group.members?.map((m: any) => m.memberId).join(",") || "";
      fetch(`/api/members?ministryId=${group.ministryId}&search=${encodeURIComponent(searchMember)}`)
        .then(res => res.json())
        .then(data => {
          // Excluir já associados
          const filtered = (data.members || []).filter((m: any) => !group.members.some((gm: any) => gm.memberId === m.id));
          setEligibleMembers(filtered);
        })
        .catch(() => setEligibleMembersError("Erro ao buscar membros."))
        .finally(() => setEligibleMembersLoading(false));
    }
  }, [showAddMemberModal, searchMember, group?.ministryId, group?.members]);

  // Função para associar líderes
  async function handleAddLeaders() {
    if (!selectedLeaders.length) return;
    setFeedback(null);
    try {
      const res = await fetch(`/api/small-groups/${groupId}/add-leaders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedLeaders }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Erro ao associar líderes.");
      setShowAddLeaderModal(false);
      setSelectedLeaders([]);
      setFeedback("Líderes adicionados com sucesso!");
      // Atualizar grupo
      await fetchGroup();
    } catch (e: any) {
      setFeedback(e.message || "Erro ao associar líderes.");
    }
  }

  // Função para associar membros
  async function handleAddMembers() {
    if (!selectedMembers.length) return;
    setFeedback(null);
    try {
      const res = await fetch(`/api/small-groups/${groupId}/add-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: selectedMembers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Erro ao associar membros.");
      setShowAddMemberModal(false);
      setSelectedMembers([]);
      setFeedback("Membros adicionados com sucesso!");
      // Atualizar grupo
      await fetchGroup();
    } catch (e: any) {
      setFeedback(e.message || "Erro ao associar membros.");
    }
  }

  // Função para remover líder
  async function handleRemoveLeader(leaderId: string) {
    setRemovingLeaderId(leaderId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/small-groups/${groupId}/remove-leader`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: leaderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Erro ao remover líder.");
      setFeedback("Líder removido com sucesso!");
      await fetchGroup();
    } catch (e: any) {
      setFeedback(e.message || "Erro ao remover líder.");
    } finally {
      setRemovingLeaderId(null);
      setConfirmRemoveLeader(null);
    }
  }

  // Função para remover membro
  async function handleRemoveMember(memberId: string) {
    setRemovingMemberId(memberId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/small-groups/${groupId}/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Erro ao remover membro.");
      setFeedback("Membro removido com sucesso!");
      await fetchGroup();
    } catch (e: any) {
      setFeedback(e.message || "Erro ao remover membro.");
    } finally {
      setRemovingMemberId(null);
      setConfirmRemoveMember(null);
    }
  }

  // Tornar fetchGroup acessível para atualização
  async function fetchGroup() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/small-groups/${groupId}`);
      if (!res.ok) throw new Error("Erro ao buscar grupo");
      const data = await res.json();
      setGroup(data.group);
      setMeetings(data.group.meetings || []);
    } catch (e: any) {
      setError(e.message || "Erro ao buscar grupo");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!group) return <div className="p-8 text-center text-gray-500">Grupo não encontrado.</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Detalhes do Pequeno Grupo</h1>
        <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => router.back()}>Voltar</button>
      </div>
      <Tab.Group>
        <Tab.List className="flex space-x-2 border-b-2 border-gray-200 mb-8 bg-gray-50 rounded-t-lg p-2 shadow-sm">
          <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Resumo</Tab>
          <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Pessoas</Tab>
          <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Reuniões</Tab>
        </Tab.List>
        <Tab.Panels>
          {/* Aba Resumo */}
          <Tab.Panel>
            <div className="bg-white rounded shadow p-6 mb-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-700">Dados do Grupo</h2>
                <div className="mb-1"><span className="font-semibold">Nome:</span> {group.name}</div>
                <div className="mb-1"><span className="font-semibold">Descrição:</span> {group.description || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Status:</span> {group.status}</div>
                <div className="mb-1"><span className="font-semibold">Recorrência:</span> {group.frequency ? FREQUENCIAS_LABEL[group.frequency] || group.frequency : '-'}</div>
                <div className="mb-1"><span className="font-semibold">Dia da Semana:</span> {group.dayOfWeek || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Horário:</span> {group.time || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Data de Início:</span> {group.startDate ? new Date(group.startDate).toLocaleDateString() : '-'}</div>
                <div className="mb-1"><span className="font-semibold">Anfitrião:</span> {group.hostName || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Celular Anfitrião:</span> {group.hostPhone || '-'}</div>
                <div className="mb-1"><span className="font-semibold">Endereço:</span> {`${group.rua || '-'}, ${group.numero || '-'}${group.complemento ? ', ' + group.complemento : ''}, ${group.bairro || '-'}, ${group.municipio || '-'}, ${group.estado || '-'}, CEP: ${group.cep || '-'}`}</div>
              </div>
              <div className="flex space-x-4 mt-4">
                <div className="bg-gray-100 rounded p-4 text-center">
                  <div className="text-2xl font-bold">{group.members?.length || 0}</div>
                  <div className="text-xs text-gray-600">Membros</div>
                </div>
                <div className="bg-gray-100 rounded p-4 text-center">
                  <div className="text-2xl font-bold">{group.leaders?.length || 0}</div>
                  <div className="text-xs text-gray-600">Líderes</div>
                </div>
                <div className="bg-gray-100 rounded p-4 text-center">
                  <div className="text-2xl font-bold">{meetings?.length || 0}</div>
                  <div className="text-xs text-gray-600">Reuniões</div>
                </div>
              </div>
            </div>
          </Tab.Panel>
          {/* Aba Pessoas com sub-abas */}
          <Tab.Panel>
            <Tab.Group>
              <Tab.List className="flex space-x-2 border-b border-gray-200 mb-4 bg-gray-50 rounded-t p-1 shadow-sm">
                <Tab className={({ selected }) => `px-4 py-1.5 text-sm font-medium rounded-t transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Líderes</Tab>
                <Tab className={({ selected }) => `px-4 py-1.5 text-sm font-medium rounded-t transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Membros</Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <div className="bg-white rounded shadow p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-semibold">Líderes</h2>
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium shadow"
                        onClick={() => setShowAddLeaderModal(true)}
                        type="button"
                      >
                        + Adicionar Líder
                      </button>
                    </div>
                    {group.leaders?.length ? (
                      <ul className="divide-y divide-gray-100">
                        {group.leaders.map((leader: any) => (
                          <li key={leader.id} className="py-2 flex items-center justify-between">
                            <div>
                              <span className="font-medium">{leader.user?.name}</span>
                              {leader.user?.email && <span className="ml-2 text-gray-500 text-sm">({leader.user.email})</span>}
                            </div>
                            <button
                              className="ml-4 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                              disabled={removingLeaderId === leader.userId}
                              onClick={() => setConfirmRemoveLeader({ id: leader.userId, name: leader.user?.name })}
                            >
                              Remover
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500">Nenhum líder cadastrado.</div>
                    )}
                  </div>
                </Tab.Panel>
                <Tab.Panel>
                  <div className="bg-white rounded shadow p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-semibold">Membros</h2>
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium shadow"
                        onClick={() => setShowAddMemberModal(true)}
                        type="button"
                      >
                        + Adicionar Membro
                      </button>
                    </div>
                    {group.members?.length ? (
                      <ul className="divide-y divide-gray-100">
                        {group.members.map((m: any) => (
                          <li key={m.id} className="py-2 flex items-center justify-between">
                            <div>
                              <span className="font-medium">{m.member?.name}</span>
                              {m.member?.email && <span className="ml-2 text-gray-500 text-sm">({m.member.email})</span>}
                            </div>
                            <button
                              className="ml-4 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                              disabled={removingMemberId === m.memberId}
                              onClick={() => setConfirmRemoveMember({ id: m.memberId, name: m.member?.name })}
                            >
                              Remover
                            </button>
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
          </Tab.Panel>
          {/* Aba Reuniões com sub-abas */}
          <Tab.Panel>
            <Tab.Group>
              <Tab.List className="flex space-x-2 border-b border-gray-200 mb-4 bg-gray-50 rounded-t p-1 shadow-sm">
                <Tab className={({ selected }) => `px-4 py-1.5 text-sm font-medium rounded-t transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Próximas</Tab>
                <Tab className={({ selected }) => `px-4 py-1.5 text-sm font-medium rounded-t transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Realizadas</Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <div className="bg-white rounded shadow p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-2">Próximas Reuniões</h2>
                    {meetings.filter((m: any) => new Date(m.date) >= new Date()).length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {meetings.filter((m: any) => new Date(m.date) >= new Date()).map((meeting: any) => (
                              <tr key={meeting.id}>
                                <td className="px-4 py-2">{meeting.date ? new Date(meeting.date).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-2">{meeting.date ? new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td className="px-4 py-2">{meeting.status || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500">Nenhuma reunião futura encontrada.</div>
                    )}
                  </div>
                </Tab.Panel>
                <Tab.Panel>
                  <div className="bg-white rounded shadow p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-2">Reuniões Realizadas</h2>
                    {meetings.filter((m: any) => new Date(m.date) < new Date()).length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {meetings.filter((m: any) => new Date(m.date) < new Date()).map((meeting: any) => (
                              <tr key={meeting.id}>
                                <td className="px-4 py-2">{meeting.date ? new Date(meeting.date).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-2">{meeting.date ? new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td className="px-4 py-2">{meeting.status || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500">Nenhuma reunião realizada encontrada.</div>
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modal de seleção múltipla de líderes */}
      <Dialog open={showAddLeaderModal} onOpenChange={setShowAddLeaderModal}>
        <DialogContent>
          <DialogTitle>Adicionar Líder(es) ao Pequeno Grupo</DialogTitle>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchLeader}
            onChange={e => setSearchLeader(e.target.value)}
            className="border rounded px-3 py-2 w-full mb-3"
            autoFocus
          />
          <div className="max-h-60 overflow-y-auto mb-4">
            {eligibleLeadersLoading ? (
              <div className="text-center py-4">Carregando líderes...</div>
            ) : eligibleLeadersError ? (
              <div className="text-center py-4 text-red-600">{eligibleLeadersError}</div>
            ) : eligibleLeaders.length ? (
              eligibleLeaders.map(l => (
                <label key={l.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLeaders.includes(l.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedLeaders(prev => [...prev, l.id]);
                      else setSelectedLeaders(prev => prev.filter(id => id !== l.id));
                    }}
                  />
                  <span className="font-medium">{l.name}</span>
                  <span className="text-gray-500 text-xs">{l.email}</span>
                  <span className="text-gray-400 text-xs">{l.phone}</span>
                </label>
              ))
            ) : (
              <div className="text-gray-500 text-sm">Nenhum líder encontrado.</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowAddLeaderModal(false)}>Cancelar</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-50" disabled={selectedLeaders.length === 0 || eligibleLeadersLoading} onClick={handleAddLeaders}>
              Adicionar {selectedLeaders.length > 0 ? `(${selectedLeaders.length})` : ''}
            </button>
          </div>
          {feedback && <div className={`mt-4 p-3 rounded ${feedback.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback}</div>}
        </DialogContent>
      </Dialog>

      {/* Modal de seleção múltipla de membros */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent>
          <DialogTitle>Adicionar Membro(s) ao Pequeno Grupo</DialogTitle>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchMember}
            onChange={e => setSearchMember(e.target.value)}
            className="border rounded px-3 py-2 w-full mb-3"
            autoFocus
          />
          <div className="max-h-60 overflow-y-auto mb-4">
            {eligibleMembersLoading ? (
              <div className="text-center py-4">Carregando membros...</div>
            ) : eligibleMembersError ? (
              <div className="text-center py-4 text-red-600">{eligibleMembersError}</div>
            ) : eligibleMembers.length ? (
              eligibleMembers.map(m => (
                <label key={m.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(m.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedMembers(prev => [...prev, m.id]);
                      else setSelectedMembers(prev => prev.filter(id => id !== m.id));
                    }}
                  />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-gray-500 text-xs">{m.email}</span>
                  <span className="text-gray-400 text-xs">{m.phone}</span>
                </label>
              ))
            ) : (
              <div className="text-gray-500 text-sm">Nenhum membro encontrado.</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowAddMemberModal(false)}>Cancelar</button>
            <button className="px-4 py-2 rounded bg-green-600 text-white font-semibold disabled:opacity-50" disabled={selectedMembers.length === 0 || eligibleMembersLoading} onClick={handleAddMembers}>
              Adicionar {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
            </button>
          </div>
          {feedback && <div className={`mt-4 p-3 rounded ${feedback.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback}</div>}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de remoção de líder */}
      {confirmRemoveLeader && (
        <Dialog open={true} onOpenChange={() => setConfirmRemoveLeader(null)}>
          <DialogContent>
            <DialogTitle>Remover Líder</DialogTitle>
            <div className="mb-4">Tem certeza que deseja remover <span className="font-semibold">{confirmRemoveLeader.name}</span> deste pequeno grupo?</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setConfirmRemoveLeader(null)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold disabled:opacity-50" disabled={removingLeaderId === confirmRemoveLeader.id} onClick={() => handleRemoveLeader(confirmRemoveLeader.id)}>
                Remover
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de confirmação de remoção de membro */}
      {confirmRemoveMember && (
        <Dialog open={true} onOpenChange={() => setConfirmRemoveMember(null)}>
          <DialogContent>
            <DialogTitle>Remover Membro</DialogTitle>
            <div className="mb-4">Tem certeza que deseja remover <span className="font-semibold">{confirmRemoveMember.name}</span> deste pequeno grupo?</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setConfirmRemoveMember(null)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold disabled:opacity-50" disabled={removingMemberId === confirmRemoveMember.id} onClick={() => handleRemoveMember(confirmRemoveMember.id)}>
                Remover
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}