import React, { useState, useRef, useEffect } from 'react';

interface MasterStep3Props {
  masterForm: any;
  setMasterForm: (data: any) => void;
  onBack: () => void;
  onNext: () => void;
}

async function fetchViaCep(cep: string) {
  if (!cep || cep.length < 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

export default function MasterStep3({ masterForm, setMasterForm, onBack, onNext }: MasterStep3Props) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const cepRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);

  // Foco automático no primeiro campo
  useEffect(() => {
    const timer = setTimeout(() => {
      cepRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCepBlur = async () => {
    setCepError('');
    if (!masterForm.cep || masterForm.cep.replace(/\D/g, '').length !== 8) {
      setCepError('CEP inválido');
      return;
    }
    setCepLoading(true);
    const data = await fetchViaCep(masterForm.cep);
    setCepLoading(false);
    if (!data) {
      setCepError('CEP não encontrado');
      return;
    }
    setMasterForm((f: any) => ({
      ...f,
      rua: data.logradouro || '',
      bairro: data.bairro || '',
      municipio: data.localidade || '',
      estado: data.uf || '',
    }));
    // Foco automático no campo número após preenchimento do CEP
    setTimeout(() => {
      numeroRef.current?.focus();
    }, 100);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-2">Endereço</h4>
        <p className="text-sm text-gray-600 mb-4">
          Informe o endereço completo do líder master. O CEP será preenchido automaticamente.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CEP</label>
        <input
          type="text"
          value={masterForm.cep || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, cep: e.target.value }))}
          onBlur={handleCepBlur}
          className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${cepError ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="00000-000"
          required
          ref={cepRef}
        />
        {cepLoading && <div className="text-xs text-gray-500 mt-1">Buscando endereço...</div>}
        {cepError && <div className="text-xs text-red-500 mt-1">{cepError}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Rua</label>
        <input
          type="text"
          value={masterForm.rua || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, rua: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Número</label>
          <input
            type="text"
            value={masterForm.numero || ''}
            onChange={e => setMasterForm((f: any) => ({ ...f, numero: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
            ref={numeroRef}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Complemento</label>
          <input
            type="text"
            value={masterForm.complemento || ''}
            onChange={e => setMasterForm((f: any) => ({ ...f, complemento: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bairro</label>
        <input
          type="text"
          value={masterForm.bairro || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, bairro: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Município</label>
          <input
            type="text"
            value={masterForm.municipio || ''}
            onChange={e => setMasterForm((f: any) => ({ ...f, municipio: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <input
            type="text"
            value={masterForm.estado || ''}
            onChange={e => setMasterForm((f: any) => ({ ...f, estado: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
      </div>
      <div className="flex justify-between gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={onBack}>Voltar</button>
        <button 
          type="button" 
          className="px-4 py-2 bg-blue-600 text-white rounded" 
          onClick={onNext} 
          disabled={!(masterForm.cep && masterForm.rua && masterForm.numero && masterForm.bairro && masterForm.municipio && masterForm.estado)}
        >
          Avançar
        </button>
      </div>
    </div>
  );
} 