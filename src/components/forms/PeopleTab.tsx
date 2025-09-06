"use client";
import { useState } from "react";
import { Tab } from '@headlessui/react';
import { PlusCircle, Users, UserCheck } from "lucide-react";
import LeadersSection from "./LeadersSection";
import MembersSection from "./MembersSection";
import AddPersonModal from "./AddPersonModal";

interface PeopleTabProps {
  group: any;
  onRefresh: () => void;
}

export default function PeopleTab({ group, onRefresh }: PeopleTabProps) {
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [personType, setPersonType] = useState<'leader' | 'member'>('member');

  const handleAddPerson = (type: 'leader' | 'member') => {
    setPersonType(type);
    setShowAddPersonModal(true);
  };

  const handleModalSuccess = () => {
    setShowAddPersonModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com estatísticas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Gestão de Pessoas
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleAddPerson('leader')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar Líder
            </button>
            <button
              onClick={() => handleAddPerson('member')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar Membro
            </button>
          </div>
        </div>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{group.leaders?.length || 0}</div>
            <div className="text-sm text-blue-700 font-medium">Líderes</div>
            <div className="text-xs text-blue-600 mt-1">Ativos no grupo</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{group.members?.length || 0}</div>
            <div className="text-sm text-green-700 font-medium">Membros</div>
            <div className="text-xs text-green-600 mt-1">Participantes ativos</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {((group.leaders?.length || 0) + (group.members?.length || 0))}
            </div>
            <div className="text-sm text-purple-700 font-medium">Total</div>
            <div className="text-xs text-purple-600 mt-1">Pessoas no grupo</div>
          </div>
        </div>
      </div>

      {/* Sistema de abas para Líderes e Membros */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Tab className={({ selected }) => 
            `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 outline-none ${
              selected 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`
          }>
            <UserCheck className="w-4 h-4" />
            Líderes ({group.leaders?.length || 0})
          </Tab>
          <Tab className={({ selected }) => 
            `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 outline-none ${
              selected 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`
          }>
            <Users className="w-4 h-4" />
            Membros ({group.members?.length || 0})
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-6">
          <Tab.Panel>
            <LeadersSection 
              leaders={group.leaders || []}
              onRefresh={onRefresh}
            />
          </Tab.Panel>
          <Tab.Panel>
            <MembersSection 
              members={group.members || []}
              onRefresh={onRefresh}
              group={{
                id: group.id,
                ministryId: group.ministryId,
                leaders: group.leaders || []
              }}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modal para adicionar pessoas */}
      <AddPersonModal
        isOpen={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        type={personType}
        groupId={group.id}
        ministryId={group.ministryId}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
