"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const optionRefs = useRef<HTMLDivElement[]>([]);

  // Correção do useEffect com dependências corretas
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error("Erro ao carregar membros", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Correção: encapsular handleOpenModal com useCallback
  const handleOpenModal = useCallback((id: string) => {
    console.log("Abrindo modal para membro:", id);
  }, []);

  if (loading) {
    return <p>Carregando membros...</p>;
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Lista de Membros</h1>
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 border">Nome</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr key={member.id} ref={(el) => {
                if (el) optionRefs.current[idx] = el;
              }}>
                <td className="px-4 py-2 border">{member.name}</td>
                <td className="px-4 py-2 border">{member.email}</td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleOpenModal(member.id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
