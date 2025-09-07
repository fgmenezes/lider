import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { Tab } from '@headlessui/react';

interface MinistryCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  ministry?: any; // para edição futura
}

function maskCep(value: string) {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

async function fetchViaCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

export default function MinistryCreateModal({ open, onOpenChange, onSuccess, ministry }: MinistryCreateModalProps) {
  const [form, setForm] = useState({
    ministryName: ministry?.ministryName || '',
    churchName: ministry?.churchName || '',
    cep: ministry?.cep || '',
    rua: ministry?.rua || '',
    numero: ministry?.numero || '',
    complemento: ministry?.complemento || '',
    bairro: ministry?.bairro || '',
    municipio: ministry?.municipio || '',
    estado: ministry?.estado || '',
    churchPhone: ministry?.churchPhone || '',
    churchEmail: ministry?.churchEmail || '',
    pastorName: ministry?.pastorName || '',
    pastorPhone: ministry?.pastorPhone || '',
    pastorEmail: ministry?.pastorEmail || '',
    // Removido: masterOption, masterId
    // Adicione outros campos depois
  });
  const [step, setStep] = useState(1);
  const ministryNameRef = useRef<HTMLInputElement>(null);
  const churchNameRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);
  const churchPhoneRef = useRef<HTMLInputElement>(null);
  const pastorNameRef = useRef<HTMLInputElement>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [lastCepSearched, setLastCepSearched] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0); // mover para o topo

  // Resetar o formulário ao fechar o modal
  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setForm({ ministryName: '', churchName: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', municipio: '', estado: '', churchPhone: '', churchEmail: '', pastorName: '', pastorPhone: '', pastorEmail: '' });
      setStep(1);
    }
  };

  useEffect(() => {
    if (ministry) {
      setForm({
        ministryName: ministry.name || '',
        churchName: ministry.churchName || '',
        cep: ministry.cep || '',
        rua: ministry.rua || '',
        numero: ministry.numero || '',
        complemento: ministry.complemento || '',
        bairro: ministry.bairro || '',
        municipio: ministry.municipio || '',
        estado: ministry.estado || '',
        churchPhone: ministry.churchPhone || '',
        churchEmail: ministry.churchEmail || '',
        pastorName: ministry.pastorName || '',
        pastorPhone: ministry.pastorPhone || '',
        pastorEmail: ministry.pastorEmail || '',
      });
      setStep(1);
    }
  }, [ministry]);

  useEffect(() => {
    const cleanCep = form.cep.replace(/\D/g, '');
    if (cleanCep.length === 8 && cleanCep !== lastCepSearched) {
      setCepLoading(true);
      setCepError('');
      fetchViaCep(form.cep).then(data => {
        if (data) {
          setForm(f => ({
            ...f,
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            municipio: data.localidade || '',
            estado: data.uf || '',
            cep: form.cep
          }));
          setTimeout(() => { numeroRef.current?.focus(); }, 100);
        } else {
          setCepError('CEP não encontrado');
        }
        setCepLoading(false);
        setLastCepSearched(cleanCep);
      }).catch(() => {
        setCepError('Erro ao buscar CEP');
        setCepLoading(false);
        setLastCepSearched(cleanCep);
      });
    }
    if (cleanCep.length < 8) {
      setLastCepSearched('');
      setCepError('');
    }
  }, [form.cep, lastCepSearched]);

  useEffect(() => {
    if (step === 1 && ministryNameRef.current) ministryNameRef.current.focus();
    if (step === 2 && churchNameRef.current) setTimeout(() => churchNameRef.current?.focus(), 100);
    if (step === 3 && cepRef.current) setTimeout(() => cepRef.current?.focus(), 100);
    if (step === 4 && churchPhoneRef.current) churchPhoneRef.current.focus();
    if (step === 5 && pastorNameRef.current) pastorNameRef.current.focus();
  }, [step]);

  async function handleSubmit() {
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/ministries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.ministryName,
          churchName: form.churchName,
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          municipio: form.municipio,
          estado: form.estado,
          churchPhone: form.churchPhone,
          churchEmail: form.churchEmail,
          pastorName: form.pastorName,
          pastorPhone: form.pastorPhone,
          pastorEmail: form.pastorEmail,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar ministério');
      }
      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao criar ministério');
    } finally {
      setSubmitLoading(false);
    }
  }

  // Funções de renderização de cada etapa
  function Step1() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dados do Ministério</h3>
        <p className="text-sm text-gray-600 mb-4">Informe o nome do ministério que será {ministry ? 'editado' : 'criado'}.</p>
        <Input
          label="Nome do Ministério"
          value={form.ministryName}
          onChange={e => setForm(f => ({ ...f, ministryName: e.target.value }))}
          required
          ref={ministryNameRef}
        />
      </div>
    );
  }
  function Step2() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dados da Igreja</h3>
        <p className="text-sm text-gray-600 mb-4">Informe o nome da igreja onde o ministério será estabelecido.</p>
        <Input
          label="Nome da Igreja"
          value={form.churchName}
          onChange={e => setForm(f => ({ ...f, churchName: e.target.value }))}
          required
          ref={churchNameRef}
        />
      </div>
    );
  }
  function Step3() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Endereço da Igreja</h3>
        <p className="text-sm text-gray-600 mb-4">Informe o endereço completo da igreja. O CEP será preenchido automaticamente.</p>
        <Input
          label="CEP"
          value={form.cep}
          onChange={e => setForm(f => ({ ...f, cep: maskCep(e.target.value) }))}
          maxLength={9}
          placeholder="99999-999"
          error={cepError}
          required
          ref={cepRef}
        />
        {cepLoading && <div className="text-xs text-gray-500 mt-1">Buscando endereço...</div>}
        <Input
          label="Rua"
          value={form.rua}
          onChange={e => setForm(f => ({ ...f, rua: e.target.value }))}
          required
        />
        <Input
          label="Número"
          value={form.numero}
          onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
          required
          ref={numeroRef}
        />
        <Input
          label="Complemento"
          value={form.complemento}
          onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))}
        />
        <Input
          label="Bairro"
          value={form.bairro}
          onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))}
          required
        />
        <Input
          label="Município"
          value={form.municipio}
          onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))}
          required
        />
        <Input
          label="Estado"
          value={form.estado}
          onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
          required
        />
      </div>
    );
  }
  function Step4() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Contato da Igreja</h3>
        <p className="text-sm text-gray-600 mb-4">Informe os dados de contato da igreja.</p>
        <Input
          label="Telefone da Igreja"
          value={form.churchPhone}
          onChange={e => setForm(f => ({ ...f, churchPhone: e.target.value }))}
          placeholder="(99) 99999-9999"
          required
          ref={churchPhoneRef}
        />
        <Input
          label="Email da Igreja"
          value={form.churchEmail}
          onChange={e => setForm(f => ({ ...f, churchEmail: e.target.value }))}
          type="email"
          required
        />
      </div>
    );
  }
  function Step5() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dados do Pastor</h3>
        <p className="text-sm text-gray-600 mb-4">Informe os dados do pastor responsável pelo ministério.</p>
        <Input
          label="Nome do Pastor"
          value={form.pastorName}
          onChange={e => setForm(f => ({ ...f, pastorName: e.target.value }))}
          required
          ref={pastorNameRef}
        />
        <Input
          label="Telefone do Pastor"
          value={form.pastorPhone}
          onChange={e => setForm(f => ({ ...f, pastorPhone: e.target.value }))}
          placeholder="(99) 99999-9999"
          required
        />
        <Input
          label="Email do Pastor"
          value={form.pastorEmail}
          onChange={e => setForm(f => ({ ...f, pastorEmail: e.target.value }))}
          type="email"
          required
        />
      </div>
    );
  }
  function Step6() {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Resumo do Ministério</h3>
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-blue-700 mb-1">Dados do Ministério</h4>
            <div className="text-sm text-gray-700"><b>Nome:</b> {form.ministryName}</div>
            <div className="text-sm text-gray-700"><b>Igreja:</b> {form.churchName}</div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-700 mb-1">Endereço da Igreja</h4>
            <div className="text-sm text-gray-700"><b>Rua:</b> {form.rua}, <b>Número:</b> {form.numero} {form.complemento && <span>- <b>Compl.:</b> {form.complemento}</span>}, <b>Bairro:</b> {form.bairro}, <b>Município:</b> {form.municipio}, <b>Estado:</b> {form.estado}, <b>CEP:</b> {form.cep}</div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-700 mb-1">Contato da Igreja</h4>
            <div className="text-sm text-gray-700"><b>Telefone:</b> {form.churchPhone}</div>
            <div className="text-sm text-gray-700"><b>Email:</b> {form.churchEmail}</div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-700 mb-1">Dados do Pastor</h4>
            <div className="text-sm text-gray-700"><b>Nome:</b> {form.pastorName}</div>
            <div className="text-sm text-gray-700"><b>Telefone:</b> {form.pastorPhone}</div>
            <div className="text-sm text-gray-700"><b>Email:</b> {form.pastorEmail}</div>
          </div>
        </div>
        {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
      </div>
    );
  }

  // Renderização condicional: wizard para criação, abas para edição
  if (ministry) {
    // Edição: abas
    const tabs = [
      { name: 'Ministério', content: <Step1 /> },
      { name: 'Igreja', content: <Step2 /> },
      { name: 'Endereço', content: <Step3 /> },
      { name: 'Contato', content: <Step4 /> },
      { name: 'Pastor', content: <Step5 /> },
      // { name: 'Resumo', content: <Step6 /> }, // removido
    ];
    return (
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <Dialog.Title className="text-xl font-bold mb-4">Editar Ministério</Dialog.Title>
            <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
              <Tab.List className="flex space-x-2 border-b mb-4">
                {tabs.map((tab, idx) => (
                  <Tab key={tab.name} className={({ selected }) =>
                    `px-4 py-2 text-sm font-medium rounded-t ${selected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`
                  }>
                    {tab.name}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels>
                {tabs.map((tab, idx) => (
                  <Tab.Panel key={tab.name} className="p-2">{tab.content}</Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => handleOpenChange(false)} aria-label="Cancelar">Cancelar</button>
              <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit} disabled={submitLoading}>
                {submitLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
            {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
            <Dialog.Close asChild>
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">×</button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // Se não for edição, renderizar o wizard sequencial como antes
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
          <Dialog.Title className="text-xl font-bold mb-4">{ministry ? 'Editar Ministério' : 'Criar Novo Ministério'}</Dialog.Title>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dados do Ministério</h3>
              <p className="text-sm text-gray-600 mb-4">Informe o nome do ministério que será criado.</p>
              <Input
                label="Nome do Ministério"
                value={form.ministryName}
                onChange={e => setForm(f => ({ ...f, ministryName: e.target.value }))}
                required
                ref={ministryNameRef}
              />
              <div className="flex justify-between gap-2 mt-6">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => handleOpenChange(false)} aria-label="Cancelar">Cancelar</button>
                <div className="flex gap-2">
                  {step > 1 && <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setStep(step - 1)} aria-label="Voltar">Voltar</button>}
                  {step < 6 ? (
                    <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(step + 1)} disabled={!(form.ministryName)}>Avançar</button>
                  ) : (
                    <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit} disabled={submitLoading}>{submitLoading ? 'Criando...' : 'Criar'}</button>
                  )}
                </div>
              </div>
              {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dados da Igreja</h3>
              <p className="text-sm text-gray-600 mb-4">Informe o nome da igreja onde o ministério será estabelecido.</p>
              <Input
                label="Nome da Igreja"
                value={form.churchName}
                onChange={e => setForm(f => ({ ...f, churchName: e.target.value }))}
                required
                ref={churchNameRef}
              />
              <div className="flex justify-between gap-2 mt-6">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => handleOpenChange(false)} aria-label="Cancelar">Cancelar</button>
                <div className="flex gap-2">
                  {step > 1 && <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setStep(step - 1)} aria-label="Voltar">Voltar</button>}
                  {step < 6 ? (
                    <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(step + 1)} disabled={!(form.churchName)}>Avançar</button>
                  ) : (
                    <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit} disabled={submitLoading}>{submitLoading ? 'Criando...' : 'Criar'}</button>
                  )}
                </div>
              </div>
              {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Endereço da Igreja</h3>
              <p className="text-sm text-gray-600 mb-4">Informe o endereço completo da igreja. O CEP será preenchido automaticamente.</p>
              <Input
                label="CEP"
                value={form.cep}
                onChange={e => setForm(f => ({ ...f, cep: maskCep(e.target.value) }))}
                maxLength={9}
                placeholder="99999-999"
                error={cepError}
                required
                ref={cepRef}
              />
              {cepLoading && <div className="text-xs text-gray-500 mt-1">Buscando endereço...</div>}
              <Input
                label="Rua"
                value={form.rua}
                onChange={e => setForm(f => ({ ...f, rua: e.target.value }))}
                required
              />
              <Input
                label="Número"
                value={form.numero}
                onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                required
                ref={numeroRef}
              />
              <Input
                label="Complemento"
                value={form.complemento}
                onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))}
              />
              <Input
                label="Bairro"
                value={form.bairro}
                onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))}
                required
              />
              <Input
                label="Município"
                value={form.municipio}
                onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))}
                required
              />
              <Input
                label="Estado"
                value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                required
              />
              <div className="flex justify-between gap-2 mt-6">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => handleOpenChange(false)} aria-label="Cancelar">Cancelar</button>
                <div className="flex gap-2">
                  {step > 1 && <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setStep(step - 1)} aria-label="Voltar">Voltar</button>}
                  {step < 6 ? (
                    <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(step + 1)} disabled={!(form.cep && form.rua && form.numero && form.bairro && form.municipio && form.estado)}>Avançar</button>
                  ) : (
                    <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit} disabled={submitLoading}>{submitLoading ? 'Criando...' : 'Criar'}</button>
                  )}
                </div>
              </div>
              {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Contato da Igreja</h3>
              <p className="text-sm text-gray-600 mb-4">Informe os dados de contato da igreja.</p>
              <Input
                label="Telefone da Igreja"
                value={form.churchPhone}
                onChange={e => setForm(f => ({ ...f, churchPhone: e.target.value }))}
                placeholder="(99) 99999-9999"
                required
                ref={churchPhoneRef}
              />
              <Input
                label="Email da Igreja"
                value={form.churchEmail}
                onChange={e => setForm(f => ({ ...f, churchEmail: e.target.value }))}
                type="email"
                required
              />
              <div className="flex justify-between gap-2 mt-6">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => handleOpenChange(false)} aria-label="Cancelar">Cancelar</button>
                <div className="flex gap-2">
                  {step > 1 && <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setStep(step - 1)} aria-label="Voltar">Voltar</button>}
                  {step < 6 ? (
                    <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(step + 1)} disabled={!(form.churchPhone && form.churchEmail)}>Avançar</button>
                  ) : (
                    <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit} disabled={submitLoading}>{submitLoading ? 'Criando...' : 'Criar'}</button>
                  )}
                </div>
              </div>
              {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
            </div>
          )}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dados do Pastor</h3>
              <p className="text-sm text-gray-600 mb-4">Informe os dados do pastor responsável pelo ministério.</p>
              <Input
                label="Nome do Pastor"
                value={form.pastorName}
                onChange={e => setForm(f => ({ ...f, pastorName: e.target.value }))}
                required
                ref={pastorNameRef}
              />
              <Input
                label="Telefone do Pastor"
                value={form.pastorPhone}
                onChange={e => setForm(f => ({ ...f, pastorPhone: e.target.value }))}
                placeholder="(99) 99999-9999"
                required
              />
              <Input
                label="Email do Pastor"
                value={form.pastorEmail}
                onChange={e => setForm(f => ({ ...f, pastorEmail: e.target.value }))}
                type="email"
                required
              />
              <div className="flex justify-between gap-2 mt-6">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => handleOpenChange(false)} aria-label="Cancelar">Cancelar</button>
                <div className="flex gap-2">
                  {step > 1 && <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setStep(step - 1)} aria-label="Voltar">Voltar</button>}
                  {step < 6 ? (
                    <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(step + 1)} disabled={!(form.pastorName && form.pastorPhone && form.pastorEmail)}>Avançar</button>
                  ) : (
                    <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit} disabled={submitLoading}>{submitLoading ? 'Criando...' : 'Criar'}</button>
                  )}
                </div>
              </div>
              {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
            </div>
          )}
          {step === 6 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Resumo do Ministério</h3>
              <div className="bg-white rounded-lg border p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Dados do Ministério</h4>
                  <div className="text-sm text-gray-700"><b>Nome:</b> {form.ministryName}</div>
                  <div className="text-sm text-gray-700"><b>Igreja:</b> {form.churchName}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Endereço da Igreja</h4>
                  <div className="text-sm text-gray-700"><b>Rua:</b> {form.rua}, <b>Número:</b> {form.numero} {form.complemento && <span>- <b>Compl.:</b> {form.complemento}</span>}, <b>Bairro:</b> {form.bairro}, <b>Município:</b> {form.municipio}, <b>Estado:</b> {form.estado}, <b>CEP:</b> {form.cep}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Contato da Igreja</h4>
                  <div className="text-sm text-gray-700"><b>Telefone:</b> {form.churchPhone}</div>
                  <div className="text-sm text-gray-700"><b>Email:</b> {form.churchEmail}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Dados do Pastor</h4>
                  <div className="text-sm text-gray-700"><b>Nome:</b> {form.pastorName}</div>
                  <div className="text-sm text-gray-700"><b>Telefone:</b> {form.pastorPhone}</div>
                  <div className="text-sm text-gray-700"><b>Email:</b> {form.pastorEmail}</div>
                </div>
              </div>
              {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
              <div className="flex justify-between gap-2 mt-6">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => handleOpenChange(false)} aria-label="Cancelar">Cancelar</button>
                <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(5)} aria-label="Voltar">Voltar</button>
                <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit} disabled={submitLoading}>
                  {submitLoading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          )}
          {/* Steps futuros aqui */}
          <Dialog.Close asChild>
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">×</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}