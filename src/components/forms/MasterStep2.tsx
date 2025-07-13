import React, { useRef, useEffect } from 'react';

interface MasterStep2Props {
  masterForm: any;
  setMasterForm: (data: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function MasterStep2({ masterForm, setMasterForm, onBack, onNext }: MasterStep2Props) {
  const phoneRef = useRef<HTMLInputElement>(null);

  // Foco automático no primeiro campo
  useEffect(() => {
    const timer = setTimeout(() => {
      phoneRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-2">Contato</h4>
        <p className="text-sm text-gray-600 mb-4">
          Informe os dados de contato do líder master
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Celular</label>
        <input
          type="tel"
          value={masterForm.phone || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, phone: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          placeholder="(99) 99999-9999"
          required
          ref={phoneRef}
        />
      </div>
      <div className="flex justify-between gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={onBack}>Voltar</button>
        <button 
          type="button" 
          className="px-4 py-2 bg-blue-600 text-white rounded" 
          onClick={onNext} 
          disabled={!masterForm.phone}
        >
          Avançar
        </button>
      </div>
    </div>
  );
} 