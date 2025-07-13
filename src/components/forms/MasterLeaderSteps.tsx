import React from 'react';
import MasterStep1 from './MasterStep1';
import MasterStep2 from './MasterStep2';
import MasterStep3 from './MasterStep3';
import MasterStep4 from './MasterStep4';

interface MasterLeaderStepsProps {
  masterForm: any;
  setMasterForm: (data: any) => void;
  masterStep: number;
  setMasterStep: (step: number) => void;
  onBack: () => void;
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

export default function MasterLeaderSteps({ 
  masterForm, 
  setMasterForm, 
  masterStep, 
  setMasterStep, 
  onBack 
}: MasterLeaderStepsProps) {
  
  // Etapa 1: Dados pessoais
  if (masterStep === 1) {
    return (
      <MasterStep1
        masterForm={masterForm}
        setMasterForm={setMasterForm}
        onBack={onBack}
        onNext={() => setMasterStep(2)}
      />
    );
  }

  // Etapa 2: Contato
  if (masterStep === 2) {
    return (
      <MasterStep2
        masterForm={masterForm}
        setMasterForm={setMasterForm}
        onBack={() => setMasterStep(1)}
        onNext={() => setMasterStep(3)}
      />
    );
  }

  // Etapa 3: Endereço
  if (masterStep === 3) {
    return (
      <MasterStep3
        masterForm={masterForm}
        setMasterForm={setMasterForm}
        onBack={() => setMasterStep(2)}
        onNext={() => setMasterStep(4)}
      />
    );
  }

  // Etapa 4: Senha
  if (masterStep === 4) {
    return (
      <MasterStep4
        masterForm={masterForm}
        setMasterForm={setMasterForm}
        onBack={() => setMasterStep(3)}
        onFinish={() => {/* Finalizar cadastro */}}
      />
    );
  }

  return null;
} 