"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MemberModal from "@/components/MemberModal";

interface Member {
  id: string;
  name: string;
  email: string;
  ministryId: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const optionRefs = useRef<HTMLDivElement[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data: Member[] = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpenModal = useCallback((member: Member | null = null) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMember(null);
    setIsModalOpen(false);
  }, []);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Campo de busca + botão Adicionar */}
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Buscar membro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => handleOpenModal(null)}>Adicionar Membro</Button>
      </div>

      {/* Tabela de membros */}
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-500">
                Nome
              </th>
              <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 border-b"></th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b text-sm text-gray-700">
                  {member.name}
                </td>
                <td className="px-6 py-4 border-b text-sm text-gray-700">
                  {member.email}
                </td>
                <td className="px-6 py-4 border-b text-sm text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(member)}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de criação/edição */}
      {isModalOpen && (
        <MemberModal
          member={selectedMember}
          onClose={handleCloseModal}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  );
}
