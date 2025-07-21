"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FREQUENCIAS_LABEL } from "@/constants/frequencias";
import { Tab } from '@headlessui/react';

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
                    <h2 className="text-lg font-semibold mb-2">Líderes</h2>
                    {group.leaders?.length ? (
                      <ul className="divide-y divide-gray-100">
                        {group.leaders.map((leader: any) => (
                          <li key={leader.id} className="py-2">
                            <span className="font-medium">{leader.user?.name}</span>
                            {leader.user?.email && <span className="ml-2 text-gray-500 text-sm">({leader.user.email})</span>}
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
                    <h2 className="text-lg font-semibold mb-2">Membros</h2>
                    {group.members?.length ? (
                      <ul className="divide-y divide-gray-100">
                        {group.members.map((m: any) => (
                          <li key={m.id} className="py-2">
                            <span className="font-medium">{m.member?.name}</span>
                            {m.member?.email && <span className="ml-2 text-gray-500 text-sm">({m.member.email})</span>}
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
    </div>
  );
} 