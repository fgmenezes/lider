import React, { useRef, useEffect } from 'react';

interface MasterStep1Props {
  masterForm: any;
  setMasterForm: (data: any) => void;
  onBack: () => void;
  onNext: () => void;
}

function calculateAge(dateStr: string) {
  if (!dateStr) return '';
  
  const birthDate = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age > 0 ? age.toString() : '';
}

export default function MasterStep1({ masterForm, setMasterForm, onBack, onNext }: MasterStep1Props) {
  const nomeRef = useRef<HTMLInputElement>(null);

  // Foco automático no primeiro campo
  useEffect(() => {
    const timer = setTimeout(() => {
      nomeRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDataNascimentoChange = (value: string) => {
    setMasterForm((prev: any) => ({
      ...prev,
      dataNascimento: value
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-2">Dados Pessoais</h4>
        <p className="text-sm text-gray-600 mb-4">
          Informe os dados pessoais do líder master
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome completo</label>
        <input
          type="text"
          value={masterForm.nome || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, nome: e.target.value }))}
          className="mt-1 block w-full border border-[var(--color-border)] rounded-md shadow-sm p-2"
          required
          ref={nomeRef}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">E-mail</label>
        <input
          type="email"
          value={masterForm.email || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, email: e.target.value }))}
          className="mt-1 block w-full border border-[var(--color-border)] rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
          <input
            type="date"
            value={masterForm.dataNascimento}
            onChange={(e) => handleDataNascimentoChange(e.target.value)}
            className="mt-1 block w-full border border-[var(--color-border)] rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Idade</label>
          <input
            type="text"
            value={masterForm.dataNascimento ? calculateAge(masterForm.dataNascimento) : ''}
            readOnly
            className="mt-1 block w-full border border-[var(--color-border)] bg-[var(--bg-secondary)] rounded-md p-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Sexo</label>
        <select
          value={masterForm.sexo || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, sexo: e.target.value }))}
          className="mt-1 block w-full border border-[var(--color-border)] rounded-md shadow-sm p-2"
          required
        >
          <option value="">Selecione</option>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Estado civil</label>
        <select
          value={masterForm.estadoCivil || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, estadoCivil: e.target.value }))}
          className="mt-1 block w-full border border-[var(--color-border)] rounded-md shadow-sm p-2"
          required
        >
          <option value="">Selecione</option>
          <option value="solteiro">Solteiro(a)</option>
          <option value="casado">Casado(a)</option>
          <option value="divorciado">Divorciado(a)</option>
          <option value="viuvo">Viúvo(a)</option>
        </select>
      </div>
      <div className="flex justify-between gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded" onClick={onBack}>Voltar</button>
        <button 
          type="button" 
          className="px-4 py-2 bg-blue-600 text-white rounded" 
          onClick={onNext} 
          disabled={!(masterForm.nome && masterForm.email && masterForm.dataNascimento && masterForm.sexo && masterForm.estadoCivil)}
        >
          Avançar
        </button>
      </div>
    </div>
  );
}