import React, { useRef, useEffect } from 'react';

interface MasterStep4Props {
  masterForm: any;
  setMasterForm: (data: any) => void;
  onBack: () => void;
  onFinish: () => void;
}

export default function MasterStep4({ masterForm, setMasterForm, onBack, onFinish }: MasterStep4Props) {
  const passwordRef = useRef<HTMLInputElement>(null);

  // Foco automático no primeiro campo editável
  useEffect(() => {
    const timer = setTimeout(() => {
      passwordRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-2">Senha de Acesso</h4>
        <p className="text-sm text-gray-600 mb-4">
          Defina uma senha para o acesso do líder master ao sistema
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Usuário (login)</label>
        <input
          type="text"
          value={masterForm.email || ''}
          readOnly
          className="mt-1 block w-full border border-[var(--color-border)] rounded-md shadow-sm p-2 bg-[var(--bg-secondary)] cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">O email será usado como nome de usuário para login</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Senha</label>
        <input
          type="password"
          value={masterForm.password || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, password: e.target.value }))}
          className="mt-1 block w-full border border-[var(--color-border)] rounded-md shadow-sm p-2"
          minLength={6}
          required
          ref={passwordRef}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
        <input
          type="password"
          value={masterForm.confirmPassword || ''}
          onChange={e => setMasterForm((f: any) => ({ ...f, confirmPassword: e.target.value }))}
          className="mt-1 block w-full border border-[var(--color-border)] rounded-md shadow-sm p-2"
          minLength={6}
          required
        />
        {masterForm.password && masterForm.confirmPassword && masterForm.password !== masterForm.confirmPassword && (
          <div className="text-red-500 text-sm">As senhas não coincidem</div>
        )}
      </div>
      <div className="flex justify-between gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded" onClick={onBack}>Voltar</button>
        <button 
          type="button" 
          className="px-4 py-2 bg-blue-600 text-white rounded" 
          onClick={onFinish} 
          disabled={!(masterForm.password && masterForm.confirmPassword && masterForm.password === masterForm.confirmPassword)}
        >
          Finalizar
        </button>
      </div>
    </div>
  );
}