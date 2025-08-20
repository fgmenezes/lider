"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { maskDate, maskPhone, maskCep } from '@/lib/utils';
import { fetchAddressByCep } from '@/lib/utils/viaCep';
import { useSession } from 'next-auth/react';
import { Tab } from '@headlessui/react';
import React from 'react';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import Checkbox from '@/components/forms/Checkbox';
import { HiOutlineDotsVertical } from 'react-icons/hi';

// Importação segura do file-saver
let saveAs: any = null;
if (typeof window !== 'undefined') {
  try {
    const fileSaver = require('file-saver');
    saveAs = fileSaver.saveAs;
  } catch (error) {
    // Silenciar erro em produção
  }
}

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  ministry?: { id: string; name: string; church?: { name: string } };
  responsaveis?: { nome: string; celular: string; tipo: string }[];
  status: string;
}

// Função para calcular idade
function calculateAge(dateStr: string) {
  if (!dateStr || dateStr.length !== 10) return '';
  const [d, m, y] = dateStr.split('/');
  const birth = new Date(`${y}-${m}-${d}`);
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age.toString();
}

function MemberFormStep1({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (nameRef.current) nameRef.current.focus(); }, []);
  useEffect(() => {
    setForm((prev: any) => ({ ...prev, idade: calculateAge(prev.dataNascimento) }));
  }, [setForm]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dados Pessoais</h3>
        <p className="text-sm text-gray-600 mb-4">
          Informe os dados pessoais do membro
        </p>
      </div>
      <Input
        label="Nome"
        value={form.name || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
        required
        ref={nameRef}
      />
      <Input
        label="Data de Nascimento"
        value={form.dataNascimento || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, dataNascimento: maskDate(e.target.value) }))}
        maxLength={10}
        placeholder="dd/mm/aaaa"
        required
        inputMode="numeric"
      />
      <Input
        label="Idade"
        value={form.idade || ''}
        readOnly
        className="bg-gray-100"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1">
            <input type="radio" name="gender" value="M" checked={form.sexo === 'M'} onChange={() => setForm((prev: any) => ({ ...prev, sexo: 'M' }))} /> Masculino
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="gender" value="F" checked={form.sexo === 'F'} onChange={() => setForm((prev: any) => ({ ...prev, sexo: 'F' }))} /> Feminino
          </label>
        </div>
      </div>
      <Select
        label="Estado Civil"
        value={form.estadoCivil || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, estadoCivil: e.target.value }))}
        required
        options={[
          { value: 'solteiro', label: 'Solteiro(a)' },
          { value: 'casado', label: 'Casado(a)' },
          { value: 'divorciado', label: 'Divorciado(a)' },
          { value: 'viuvo', label: 'Viúvo(a)' }
        ]}
      />
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function MemberFormStep2({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const phoneRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (phoneRef.current) phoneRef.current.focus(); }, []);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Contato</h3>
        <p className="text-sm text-gray-600 mb-4">
          Informe os dados de contato do membro
        </p>
      </div>
      <Input
        label="Celular"
        value={form.phone || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, phone: maskPhone(e.target.value) }))}
        maxLength={15}
        placeholder="(99) 99999-9999"
        required
        ref={phoneRef}
      />
      <Input
        label="E-mail"
        type="email"
        value={form.email || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, email: e.target.value }))}
        required
      />
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function MemberFormStep3({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const cepRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (cepRef.current) cepRef.current.focus(); }, []);
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCep(e.target.value);
    setForm((prev: any) => ({ ...prev, cep: masked }));
    if (masked.replace(/\D/g, '').length === 8) {
      try {
        const data = await fetchAddressByCep(masked);
        setForm((prev: any) => ({
          ...prev,
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          municipio: data.localidade || '',
          estado: data.uf || '',
        }));
      } catch (error: any) {
        toast.error(error.message || 'CEP inválido ou não encontrado.');
        setForm((prev: any) => ({
          ...prev,
          rua: '',
          bairro: '',
          municipio: '',
          estado: '',
        }));
      }
      setTimeout(() => { if (numeroRef.current) numeroRef.current.focus(); }, 100);
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Endereço</h3>
        <p className="text-sm text-gray-600 mb-4">
          Informe o endereço completo do membro. O CEP será preenchido automaticamente.
        </p>
      </div>
      <Input
        label="CEP"
        value={form.cep || ''}
        onChange={handleCepChange}
        maxLength={9}
        placeholder="99999-999"
        required
        ref={cepRef}
      />
      <Input
        label="Rua"
        value={form.rua || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, rua: e.target.value }))}
        required
      />
      <Input
        label="Número"
        value={form.numero || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, numero: e.target.value }))}
        required
        ref={numeroRef}
      />
      <Input
        label="Complemento"
        value={form.complemento || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, complemento: e.target.value }))}
      />
      <Input
        label="Bairro"
        value={form.bairro || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, bairro: e.target.value }))}
        required
      />
      <Input
        label="Município"
        value={form.municipio || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, municipio: e.target.value }))}
        required
      />
      <Input
        label="Estado"
        value={form.estado || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, estado: e.target.value }))}
        required
      />
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function MemberFormStep4({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const responsaveis = form.responsaveis || [];
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (addBtnRef.current) addBtnRef.current.focus();
  }, []);

  useEffect(() => {
    if (responsaveis.length > 0) {
      const lastIdx = responsaveis.length - 1;
      setTimeout(() => {
        inputRefs.current[lastIdx]?.focus();
      }, 100);
    }
  }, [responsaveis.length]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Responsáveis</h3>
        <p className="text-sm text-gray-600 mb-4">
          Informe os responsáveis pelo membro (máximo 3)
        </p>
      </div>
      {responsaveis.length > 0 && (
        <div className="space-y-2">
          {responsaveis.map((resp: any, idx: number) => (
            <div key={idx} className="flex flex-col md:flex-row gap-2 items-end border p-2 rounded bg-gray-50">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Nome do responsável</label>
                <input
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  value={resp.nome}
                  onChange={e => {
                    const arr = [...responsaveis];
                    arr[idx].nome = e.target.value;
                    setForm((prev: any) => ({ ...prev, responsaveis: arr }));
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Celular</label>
                <input
                  type="text"
                  value={resp.celular}
                  onChange={e => {
                    const arr = [...responsaveis];
                    arr[idx].celular = maskPhone(e.target.value);
                    setForm((prev: any) => ({ ...prev, responsaveis: arr }));
                  }}
                  maxLength={15}
                  placeholder="(99) 99999-9999"
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={resp.tipo}
                  onChange={e => {
                    const arr = [...responsaveis];
                    arr[idx].tipo = e.target.value;
                    setForm((prev: any) => ({ ...prev, responsaveis: arr }));
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="avô">Avô</option>
                  <option value="avó">Avó</option>
                  <option value="pai">Pai</option>
                  <option value="mãe">Mãe</option>
                  <option value="tio">Tio</option>
                  <option value="tia">Tia</option>
                  <option value="padrasto">Padrasto</option>
                  <option value="madrastra">Madrastra</option>
                  <option value="irmão">Irmão</option>
                  <option value="irmã">Irmã</option>
                </select>
              </div>
              <button type="button" className="text-red-600 hover:underline ml-2" onClick={() => {
                const arr = [...responsaveis];
                arr.splice(idx, 1);
                setForm((prev: any) => ({ ...prev, responsaveis: arr }));
              }}>Remover</button>
            </div>
          ))}
        </div>
      )}
      {responsaveis.length < 3 && (
        <button
          type="button"
          ref={addBtnRef}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded"
          onClick={() => setForm((prev: any) => ({ ...prev, responsaveis: [...responsaveis, { nome: '', celular: '', tipo: '' }] }))}
        >
          + Adicionar Responsável
        </button>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function MemberFormStep5({ onBack, onNext, initialData = {}, ministryId, editingMemberId, onCancel }: { onBack: (data?: any) => void, onNext: (data?: any) => void, initialData?: any, ministryId?: string, editingMemberId?: string, onCancel: () => void }) {
  const [temIrmaos, setTemIrmaos] = useState(initialData.temIrmaos || false);
  const [irmaos, setIrmaos] = useState<{ id: string; name: string; phone?: string }[]>(initialData.irmaosMinisterio || []);
  const [temPrimos, setTemPrimos] = useState(initialData.temPrimos || false);
  const [primos, setPrimos] = useState<{ id: string; name: string; phone?: string }[]>(initialData.primosMinisterio || []);
  const [openDialog, setOpenDialog] = useState<'irmaos' | 'primos' | null>(null);
  const [membersList, setMembersList] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/members?perPage=100&search=${search}${ministryId ? `&ministryId=${ministryId}` : ''}`)
      .then(res => res.json())
      .then(data => {
        let filtered = (data.members || []);
        if (editingMemberId) {
          filtered = filtered.filter((m: any) => m.id !== editingMemberId);
        }
        setMembersList(filtered);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [openDialog, search, ministryId, editingMemberId]);

  const handleOpenDialog = (type: 'irmaos' | 'primos') => {
    setOpenDialog(type);
    setSearchInput('');
    setSelected(type === 'irmaos' ? irmaos.map(i => i.id) : primos.map(p => p.id));
  };

  const handleConfirm = () => {
    if (openDialog === 'irmaos') {
      setIrmaos(membersList.filter(m => selected.includes(m.id)));
    } else if (openDialog === 'primos') {
      setPrimos(membersList.filter(m => selected.includes(m.id)));
    }
    setOpenDialog(null);
  };

  // Limites
  const maxIrmaos = 5;
  const maxPrimos = 5;
  const limiteAtingido = openDialog === 'irmaos' ? (selected.length >= maxIrmaos) : (selected.length >= maxPrimos);

  // Função para alternar ordenação
  function handleSort(field: string) {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  // Debounce da busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vínculos no Ministério</h3>
        <p className="text-sm text-gray-600 mb-4">
          Identifique se o membro tem irmãos ou primos no mesmo ministério
        </p>
      </div>
      <div>
        <label className="flex items-center gap-2 text-base font-medium">
          Tem irmãos no ministério?
          <input
            type="checkbox"
            checked={temIrmaos}
            onChange={e => setTemIrmaos(e.target.checked)}
            className="ml-2 w-5 h-5 accent-blue-600"
          />
        </label>
        {temIrmaos && (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
              onClick={() => handleOpenDialog('irmaos')}
            >
              + Adicionar Irmão
            </button>
            {irmaos.length > 0 && (
              <ul className="mt-2 space-y-1">
                {irmaos.map(i => (
                  <li key={i.id} className="flex items-center gap-2">
                    <span>{i.name} {i.phone && <span className="text-xs text-gray-500">({i.phone})</span>}</span>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => setIrmaos(irmaos.filter(x => x.id !== i.id))}>Remover</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div>
        <label className="flex items-center gap-2 text-base font-medium">
          Tem primos no ministério?
          <input
            type="checkbox"
            checked={temPrimos}
            onChange={e => setTemPrimos(e.target.checked)}
            className="ml-2 w-5 h-5 accent-blue-600"
          />
        </label>
        {temPrimos && (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
              onClick={() => handleOpenDialog('primos')}
            >
              + Adicionar Primo
            </button>
            {primos.length > 0 && (
              <ul className="mt-2 space-y-1">
                {primos.map(i => (
                  <li key={i.id} className="flex items-center gap-2">
                    <span>{i.name} {i.phone && <span className="text-xs text-gray-500">({i.phone})</span>}</span>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => setPrimos(primos.filter(x => x.id !== i.id))}>Remover</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={onCancel}>Cancelar</button>
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => { onBack({ temIrmaos, irmaosMinisterio: irmaos, temPrimos, primosMinisterio: primos }); }}>Voltar</button>
        <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => { onNext({ temIrmaos, irmaosMinisterio: irmaos, temPrimos, primosMinisterio: primos }); }}>Avançar</button>
      </div>
      <Dialog open={!!openDialog} onOpenChange={v => !v && setOpenDialog(null)}>
        <DialogContent>
          <DialogTitle>Selecionar {openDialog === 'irmaos' ? 'Irmãos' : 'Primos'}</DialogTitle>
          <input
            type="text"
            placeholder="Buscar membro..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="border rounded p-2 w-full mb-2"
            autoFocus
          />
          {loading ? <div>Carregando...</div> : (
            <ul className="max-h-60 overflow-y-auto space-y-1">
              {membersList.map(m => {
                const isChecked = selected.includes(m.id);
                const isDisabled = !isChecked && limiteAtingido;
                return (
                  <li key={m.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={e => {
                        if (e.target.checked) setSelected(sel => sel.length < (openDialog === 'irmaos' ? maxIrmaos : maxPrimos) ? [...sel, m.id] : sel);
                        else setSelected(sel => sel.filter(x => x !== m.id));
                      }}
                    />
                    <span>{m.name} {m.phone && <span className="text-xs text-gray-500">({m.phone})</span>}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setOpenDialog(null)}>Cancelar</button>
            <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleConfirm}>Confirmar</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Nova etapa após Vínculos
function MemberFormStepMinisterial({ form, setForm, onBack, onNext, onCancel }: { form: any, setForm: (data: any) => void, onBack: () => void, onNext: () => void, onCancel: () => void }) {
  // Função para mascarar a data no padrão brasileiro
  function maskDate(value: string) {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1');
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold mb-4 text-blue-700">Dados Ministeriais</h3>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-base font-medium">
          É batizado?
          <input
            type="checkbox"
            checked={!!form.batizado}
            onChange={e => setForm((prev: any) => ({ ...prev, batizado: e.target.checked }))}
            className="ml-2 w-5 h-5 accent-blue-600"
          />
        </label>
        <span className="text-sm ml-2">{form.batizado ? 'Sim' : 'Não'}</span>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Ingresso</label>
        <input
          type="text"
          value={form.dataIngresso || ''}
          onChange={e => setForm((prev: any) => ({ ...prev, dataIngresso: maskDate(e.target.value) }))}
          maxLength={10}
          placeholder="dd/mm/aaaa"
          required
          inputMode="numeric"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Voltar</button>
        <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded">Avançar</button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Cancelar</button>
      </div>
    </div>
  );
}

function MemberFormResumo({ form, onBack, onCreate, onCancel }: { form: any, onBack: () => void, onCreate: () => void, onCancel: () => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold mb-4 text-blue-700">Resumo do Cadastro</h3>
      {/* Dados Pessoais */}
      <div>
        <h4 className="text-base font-semibold mb-2 text-blue-700">Dados Pessoais</h4>
        <div className="mb-1"><span className="font-semibold">Nome:</span> {form.name}</div>
        <div className="mb-1"><span className="font-semibold">Data de Nascimento:</span> {form.dataNascimento}</div>
        <div className="mb-1"><span className="font-semibold">Sexo:</span> {form.sexo || '-'}</div>
        <div className="mb-1"><span className="font-semibold">Estado Civil:</span> {form.estadoCivil || '-'}</div>
      </div>
      {/* Contato */}
      <div>
        <h4 className="text-base font-semibold mb-2 text-blue-700">Contato</h4>
        <div className="mb-1"><span className="font-semibold">Celular:</span> {form.phone || '-'}</div>
        <div className="mb-1"><span className="font-semibold">E-mail:</span> {form.email || '-'}</div>
      </div>
      {/* Endereço */}
      <div>
        <h4 className="text-base font-semibold mb-2 text-blue-700">Endereço</h4>
        <div className="mb-1"><span className="font-semibold">CEP:</span> {form.cep || '-'}</div>
        <div className="mb-1"><span className="font-semibold">Rua:</span> {form.rua || '-'}</div>
        <div className="mb-1"><span className="font-semibold">Número:</span> {form.numero || '-'}</div>
        <div className="mb-1"><span className="font-semibold">Complemento:</span> {form.complemento || '-'}</div>
        <div className="mb-1"><span className="font-semibold">Bairro:</span> {form.bairro || '-'}</div>
        <div className="mb-1"><span className="font-semibold">Município:</span> {form.municipio || '-'}</div>
        <div className="mb-1"><span className="font-semibold">Estado:</span> {form.estado || '-'}</div>
      </div>
      {/* Responsáveis */}
      <div>
        <h4 className="text-base font-semibold mb-2 text-blue-700">Responsáveis</h4>
        {form.responsaveis && form.responsaveis.length > 0 ? (
          <div className="space-y-2">
            {form.responsaveis.map((r: any, idx: number) => (
              <div key={idx} className="border rounded p-2 bg-gray-50">
                <div className="mb-1"><span className="font-semibold">Nome:</span> {r.nome}</div>
                <div className="mb-1"><span className="font-semibold">Celular:</span> {r.celular}</div>
                <div className="mb-1"><span className="font-semibold">Tipo:</span> {r.tipo}</div>
              </div>
            ))}
          </div>
        ) : <div className="mb-1">Nenhum responsável informado</div>}
      </div>
      {/* Vínculos */}
      <div>
        <h4 className="text-base font-semibold mb-2 text-blue-700">Vínculos</h4>
        <div className="mb-1"><span className="font-semibold">Irmãos no ministério:</span> {form.irmaosMinisterio && form.irmaosMinisterio.length > 0 ? form.irmaosMinisterio.map((i: any) => i.name).join(', ') : 'Nenhum'}</div>
        <div className="mb-1"><span className="font-semibold">Primos no ministério:</span> {form.primosMinisterio && form.primosMinisterio.length > 0 ? form.primosMinisterio.map((p: any) => p.name).join(', ') : 'Nenhum'}</div>
      </div>
      {/* Ministério */}
      <div>
        <h4 className="text-base font-semibold mb-2 text-blue-700">Dados Ministeriais</h4>
        <div className="mb-1"><span className="font-semibold">Batizado:</span> {form.batizado ? 'Sim' : 'Não'}</div>
        <div className="mb-1"><span className="font-semibold">Data de Ingresso:</span> {form.dataIngresso || '-'}</div>
        <div className="mb-1"><span className="font-semibold">Status:</span> {form.status || '-'}</div>
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Voltar</button>
        <button onClick={onCreate} className="px-4 py-2 bg-green-600 text-white rounded">Criar</button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Cancelar</button>
      </div>
    </div>
  );
}

// Badge de status
function StatusBadge({ status }: { status: string }) {
  const color = status === 'ATIVO' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300';
  return (
    <span className={`inline-block px-2 py-1 rounded border text-xs font-semibold ${color}`}>{status}</span>
  );
}

// Função para exportar membros para CSV
// Agora recebe members e visibleColumns como parâmetros
function exportToCSV(members: any[], visibleColumns: { name: boolean; phone: boolean; status: boolean }) {
  if (!members.length || !saveAs) return;
  const headers = [
    ...(visibleColumns.name ? ['Nome'] : []),
    ...(visibleColumns.phone ? ['Celular'] : []),
    ...(visibleColumns.status ? ['Status'] : []),
  ];
  const rows = members.map((m: any) => [
    ...(visibleColumns.name ? [m.name] : []),
    ...(visibleColumns.phone ? [m.phone || ''] : []),
    ...(visibleColumns.status ? [m.status || 'ATIVO'] : []),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'membros.csv');
}

// Substituir o fluxo de steps por tabs ao editar
function MemberEditTabs({ form, setForm, onCancel, onSave, ministries, session }: any) {
  const tabs = [
    { name: 'Dados Pessoais', content: <MemberFormStep1 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Contato', content: <MemberFormStep2 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Endereço', content: <MemberFormStep3 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Vínculos', content: <MemberFormStep4 form={form} setForm={setForm} onCancel={onCancel} /> },
    // Adicione outras etapas conforme necessário
  ];
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  return (
    <div>
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
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={onCancel}>Cancelar</button>
        <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onSave}>Salvar</button>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<any[]>([]); // nunca undefined!
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  // Garanta valor inicial para pagination, incluindo hasNext
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, hasNext: false });
  const [openModal, setOpenModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [ministries, setMinistries] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    dataNascimento: '',
    idade: '',
    sexo: '',
    estadoCivil: '',
    phone: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    estado: '',
    ministryId: '',
    responsaveis: [] as { nome: string; celular: string; tipo: string }[],
    temIrmaos: false,
    irmaosMinisterio: [] as { id: string; name: string; phone?: string }[],
    temPrimos: false,
    primosMinisterio: [] as { id: string; name: string; phone?: string }[],
    batizado: false,
    dataIngresso: '',
    status: 'ATIVO',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ministryFilter, setMinistryFilter] = useState<string>('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<{ name: boolean; phone: boolean; status: boolean }>({ name: true, phone: true, status: true });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMember, setViewMember] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Verificar se o componente está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/members?search=${search}&page=${page}&perPage=${perPage}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      // Removido filtro de ministryId
      if (sortField) url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
      const res = await fetch(url);
      const data = await res.json();
      setMembers(data.members || []);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Erro ao buscar membros");
    } finally {
      setLoading(false);
    }
  }, [search, page, perPage, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Buscar ministérios para seleção
  useEffect(() => {
    fetch('/api/ministries?perPage=100')
      .then(res => res.json())
      .then(data => setMinistries(data.ministries || []));
  }, []);

  useEffect(() => {
    // Preencher ministryId automaticamente para o usuário logado
    if (session?.user) {
      if (session.user.role === 'MASTER' && session.user.masterMinistryId) {
        setForm(f => ({ ...f, ministryId: session.user.masterMinistryId }));
      } else if (session.user.ministryId) {
        setForm(f => ({ ...f, ministryId: session.user.ministryId }));
      }
    }
  }, [session?.user]);

  const handleOpenModal = useCallback(async (member?: Member) => {
    setEditMember(member || null);
    setFormStep(1);
    if (member) {
      // Buscar dados completos do membro (incluindo vínculos e responsáveis)
      try {
        const res = await fetch(`/api/members/${member.id}`);
        if (!res.ok) throw new Error('Erro ao buscar dados do membro');
        const data = await res.json();
        const m = data.member;
        setForm({
          name: m.name || '',
          dataNascimento: m.dataNascimento ? new Date(m.dataNascimento).toLocaleDateString('pt-BR') : '',
          idade: m.dataNascimento ? calculateAge(new Date(m.dataNascimento).toLocaleDateString('pt-BR')) : '',
          sexo: m.sexo || '',
          estadoCivil: m.estadoCivil || '',
          phone: m.phone || '',
          email: m.email || '',
          cep: m.cep || '',
          rua: m.rua || '',
          numero: m.numero || '',
          complemento: m.complemento || '',
          bairro: m.bairro || '',
          municipio: m.municipio || '',
          estado: m.estado || '',
          ministryId: m.ministry?.id || '',
          responsaveis: m.responsaveis?.map((r: any) => ({ nome: r.nome, celular: r.celular, tipo: r.tipo })) || [],
          temIrmaos: !!(m.irmaos && m.irmaos.length > 0),
          irmaosMinisterio: m.irmaos || [],
          temPrimos: !!(m.primos && m.primos.length > 0),
          primosMinisterio: m.primos || [],
          batizado: m.batizado || false,
          dataIngresso: m.dataIngresso ? new Date(m.dataIngresso).toISOString().slice(0, 10) : '',
          status: m.status || 'ATIVO',
        });
      } catch (e) {
        toast.error('Erro ao carregar dados completos do membro');
        setForm({
          name: member.name,
          dataNascimento: '',
          idade: '',
          sexo: '',
          estadoCivil: '',
          phone: member.phone || '',
          email: member.email || '',
          cep: '',
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          municipio: '',
          estado: '',
          ministryId: member.ministry?.id || '',
          responsaveis: member.responsaveis?.map(r => ({ nome: r.nome, celular: r.celular, tipo: r.tipo })) || [],
          temIrmaos: false,
          irmaosMinisterio: [],
          temPrimos: false,
          primosMinisterio: [],
          batizado: false,
          dataIngresso: '',
          status: 'ATIVO',
        });
      }
    } else {
      setForm({
        name: '',
        dataNascimento: '',
        idade: '',
        sexo: '',
        estadoCivil: '',
        phone: '',
        email: '',
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        estado: '',
        ministryId: session?.user?.role === 'MASTER'
          ? session?.user?.masterMinistryId || ''
          : session?.user?.ministryId || '',
        responsaveis: [],
        temIrmaos: false,
        irmaosMinisterio: [],
        temPrimos: false,
        primosMinisterio: [],
        batizado: false,
        dataIngresso: '',
        status: 'ATIVO',
      });
    }
    setOpenModal(true);
  }, [session?.user]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditMember(null);
    setForm({
      name: '',
      dataNascimento: '',
      idade: '',
      sexo: '',
      estadoCivil: '',
      phone: '',
      email: '',
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      municipio: '',
      estado: '',
      ministryId: '',
      responsaveis: [],
      temIrmaos: false,
      irmaosMinisterio: [],
      temPrimos: false,
      primosMinisterio: [],
      batizado: false,
      dataIngresso: '',
      status: 'ATIVO',
    });
    setFormStep(1);
  };

  const handleNext = (data: any) => {
    setForm(prev => ({ ...prev, ...data }));
    setFormStep(prev => prev + 1);
  };

  const handleBack = (data?: any) => {
    if (data) setForm(prev => ({ ...prev, ...data }));
    setFormStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    try {
      const method = editMember ? "PUT" : "POST";
      const url = editMember ? `/api/members/${editMember.id}` : "/api/members";
      // Conversão de dataNascimento para ISO se necessário
      let dataNascimentoISO = form.dataNascimento;
      if (form.dataNascimento && form.dataNascimento.includes('/')) {
        const [d, m, y] = form.dataNascimento.split('/');
        if (d && m && y) {
          dataNascimentoISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
      const payload = {
        ...form,
        dataNascimento: dataNascimentoISO,
        irmaosIds: form.irmaosMinisterio?.map((i: any) => i.id) || [],
        primosIds: form.primosMinisterio?.map((i: any) => i.id) || [],
      };
      delete (payload as any).irmaosMinisterio;
      delete (payload as any).primosMinisterio;
      delete (payload as any).temIrmaos;
      delete (payload as any).temPrimos;
      delete (payload as any).idade;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Erro ao salvar membro', data);
        throw new Error(data.message || "Erro ao salvar membro");
      }
      toast.success(editMember ? "Membro atualizado!" : "Membro criado!");
      handleCloseModal();
      fetchMembers();
    } catch (err: any) {
      console.error('Erro no handleSubmit', err);
      toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {

      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const text = await res.text();
      if (!res.ok) {
        console.error('Erro ao excluir membro:', text);
        toast.error("Erro ao excluir membro: " + text);
        return;
      }
      toast.success("Membro excluído!");
      fetchMembers();
    } catch (e: any) {
      console.error('Erro inesperado ao excluir membro:', e);
      toast.error("Erro inesperado ao excluir membro: " + (e?.message || ''));
    }
  };

  // Função para alternar ordenação
  function handleSort(field: string) {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  // Funções para seleção múltipla
  const allSelected = Array.isArray(members) && members.length > 0 && selectedIds.length === members.length;
  const toggleSelectAll = useCallback(() => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(members.map((m: any) => m.id));
  }, [allSelected, members]);
  
  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  }, []);
  
  const clearSelection = useCallback(() => setSelectedIds([]), []);

  // Funções de ação em massa
  async function handleBulkStatus(newStatus: string, memberIds: string[]) {
    if (memberIds.length === 0) return;
    for (const id of memberIds) {
      await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    }
    clearSelection();
    fetchMembers();
  }
  async function handleBulkDelete(memberIds: string[]) {
    if (memberIds.length === 0) return;
    for (const id of memberIds) {
      await fetch(`/api/members/${id}`, { method: 'DELETE' });
    }
    clearSelection();
    fetchMembers();
  }

  // Atalhos de teclado
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleOpenModal();
      }
      if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      if (e.key === 'Escape' && selectedIds.length > 0) {
        clearSelection();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, handleOpenModal, clearSelection, searchInputRef]);

  // Renderizar loading se não estiver montado
  if (!mounted) {
    return <div className="max-w-4xl mx-auto p-4">Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Membros</h1>
        <button onClick={() => { handleOpenModal(); }} className="px-4 py-2 bg-blue-600 text-white rounded">Novo Membro</button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setSearch(searchInput);
              setPage(1);
            }
          }}
          className="border border-gray-300 rounded p-2 mb-2 md:mb-0 w-full md:w-auto focus:outline-blue-500 focus:ring-2 focus:ring-blue-300"
          aria-label="Buscar membros"
        />
        {/* Removido seletor de status */}
      </div>
      {/* Removido controle de colunas visíveis */}
      {/* Removido botão de exportar CSV */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <span>{selectedIds.length} selecionado(s)</span>
          <button onClick={() => handleBulkStatus('ATIVO', selectedIds)} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs focus:outline-blue-500 focus:ring-2 focus:ring-blue-300" aria-label="Ativar membros selecionados">Ativar</button>
          <button onClick={() => handleBulkStatus('INATIVO', selectedIds)} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs focus:outline-blue-500 focus:ring-2 focus:ring-blue-300" aria-label="Inativar membros selecionados">Inativar</button>
          <button onClick={() => handleBulkDelete(selectedIds)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs focus:outline-blue-500 focus:ring-2 focus:ring-blue-300" aria-label="Excluir membros selecionados">Excluir</button>
          <button onClick={clearSelection} className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs focus:outline-blue-500 focus:ring-2 focus:ring-blue-300" aria-label="Limpar seleção">Limpar seleção</button>
        </div>
      )}
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-center">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos os membros" />
              </th>
              {/* Nome */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort('name')}>
                Nome {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              {/* Celular */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort('phone')}>
                Celular {sortField === 'phone' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              {/* Status */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort('status')}>
                Status {sortField === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: perPage }).map((_, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-4 text-center"><div className="h-4 bg-gray-200 rounded w-4 mx-auto animate-pulse" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" /></td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2"><div className="h-4 bg-gray-200 rounded w-12 animate-pulse" /></td>
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">Nenhum membro encontrado</td></tr>
            ) : members.map((member: any) => (
              <tr key={member.id}>
                <td className="px-2 py-4 text-center">
                  <input type="checkbox" checked={selectedIds.includes(member.id)} onChange={() => toggleSelectOne(member.id)} aria-label={`Selecionar membro ${member.name}`} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-700 hover:underline cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/members/${member.id}`}
                >
                  {member.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{member.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={member.status || 'ATIVO'} /></td>
                <td className="px-6 py-4 whitespace-nowrap flex gap-2 relative">
                  {/* Menu de 3 pontos */}
                  <MemberActionsMenu
                    member={member}
                    onEdit={() => handleOpenModal(member)}
                    onDelete={async () => {
                      if (confirm('Tem certeza que deseja excluir este membro?')) {
                        await handleDelete(member.id);
                      }
                    }}
                    onToggleStatus={async () => {
                      const novoStatus = member.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
                      if (confirm(`Tem certeza que deseja marcar este membro como ${novoStatus}?`)) {
                        await handleBulkStatus(novoStatus, [member.id]);
                      }
                    }}
                    onView={() => { window.location.href = `/dashboard/members/${member.id}`; }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Paginação */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
          <span>Itens por página:</span>
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="border rounded p-1">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <span>Total: {(pagination?.total ?? 0)} membros</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Anterior</button>
          <span>Página {(pagination?.page ?? 1)} de {(pagination?.totalPages ?? 1)}</span>
          <button disabled={!pagination || !pagination.hasNext} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>
      {/* Modal de cadastro/edição multi-etapas */}
      {openModal && (
        <Dialog open={openModal} onOpenChange={handleCloseModal}>
          <DialogContent>
            <DialogTitle>{editMember ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
            {editMember ? (
              <MemberEditTabs
                form={form}
                setForm={setForm}
                onCancel={handleCloseModal}
                onSave={handleSubmit}
                ministries={ministries}
                session={session}
              />
            ) : (
              <>
                {formStep === 1 && (
                  <MemberFormStep1 form={form} setForm={setForm} onCancel={handleCloseModal} />
                )}
                {formStep === 2 && (
                  <MemberFormStep2 form={form} setForm={setForm} onCancel={handleCloseModal} />
                )}
                {formStep === 3 && (
                  <MemberFormStep3 form={form} setForm={setForm} onCancel={handleCloseModal} />
                )}
                {formStep === 4 && (
                  <MemberFormStep4 form={form} setForm={setForm} onCancel={handleCloseModal} />
                )}
                {formStep === 5 && (
                  <MemberFormStep5
                    onBack={data => { setForm(prev => ({ ...prev, ...data })); setFormStep(4); }}
                    onNext={data => { setForm(prev => ({ ...prev, ...data })); setFormStep(6); }}
                    initialData={form}
                    ministryId={form.ministryId}
                    editingMemberId={editMember?.id || undefined}
                    onCancel={handleCloseModal}
                  />
                )}
                {formStep === 6 && (
                  <MemberFormStepMinisterial form={form} setForm={setForm} onBack={() => setFormStep(5)} onNext={() => setFormStep(7)} onCancel={handleCloseModal} />
                )}
                {formStep === 7 && !editMember && (
                  <MemberFormResumo form={form} onBack={() => setFormStep(6)} onCreate={handleSubmit} onCancel={handleCloseModal} />
                )}
                <div className="flex justify-between mt-4">
                  {formStep > 1 && formStep <= 6 && ![5,6].includes(formStep) && (
                    <button onClick={() => setFormStep(formStep - 1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Voltar</button>
                  )}
                  {formStep === 4 && (
                    <button onClick={() => setFormStep(5)} className="px-4 py-2 bg-blue-600 text-white rounded">Avançar</button>
                  )}
                  {formStep === 5 && (
                    <button onClick={() => setFormStep(6)} className="px-4 py-2 bg-blue-600 text-white rounded">Avançar</button>
                  )}
                  {formStep < 6 && ![4,5].includes(formStep) && (
                    <button onClick={() => setFormStep(formStep + 1)} className="px-4 py-2 bg-blue-600 text-white rounded">Avançar</button>
                  )}
                  {formStep === 6 && editMember && (
                    <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded">Salvar</button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
      {/* Modal de visualização rápida */}
      {viewMember && (
        <Dialog open={!!viewMember} onOpenChange={v => !v && setViewMember(null)}>
          <DialogContent className="bg-white p-6 rounded shadow max-w-md w-full mx-auto">
            <DialogTitle className="text-lg font-bold mb-4">Detalhes do Membro</DialogTitle>
            <div className="space-y-2 text-sm text-gray-700">
              <div><b>Nome:</b> {viewMember.name}</div>
              <div><b>Celular:</b> {viewMember.phone || '-'}</div>
              <div><b>Status:</b> <StatusBadge status={viewMember.status || 'ATIVO'} /></div>
              <div><b>Email:</b> {viewMember.email || '-'}</div>
              <div><b>Ministério:</b> {viewMember.ministry?.name || '-'}</div>
              <div><b>Data de Nascimento:</b> {viewMember.dataNascimento ? new Date(viewMember.dataNascimento).toLocaleDateString('pt-BR') : '-'}</div>
              <div><b>Sexo:</b> {viewMember.sexo || '-'}</div>
              <div><b>Estado Civil:</b> {viewMember.estadoCivil || '-'}</div>
              <div><b>Endereço:</b> {viewMember.rua || '-'}, {viewMember.numero || '-'} {viewMember.complemento || ''}, {viewMember.bairro || '-'}, {viewMember.municipio || '-'}-{viewMember.estado || ''}, CEP: {viewMember.cep || '-'}</div>
              <div><b>Batizado:</b> {viewMember.batizado ? 'Sim' : 'Não'}</div>
              <div><b>Data de Ingresso:</b> {viewMember.dataIngresso ? new Date(viewMember.dataIngresso).toLocaleDateString('pt-BR') : '-'}</div>
              <div><b>Responsáveis:</b> {viewMember.responsaveis?.map((r: any) => `${r.tipo}: ${r.nome} (${r.celular})`).join(', ') || '-'}</div>
              <div><b>Irmãos:</b> {viewMember.irmaos?.map((i: any) => i.name).join(', ') || '-'}</div>
              <div><b>Primos:</b> {viewMember.primos?.map((p: any) => p.name).join(', ') || '-'}</div>
              <div className="text-xs text-gray-500 mt-2">
                <div><b>Criado em:</b> {viewMember.createdAt ? new Date(viewMember.createdAt).toLocaleString('pt-BR') : '-'}</div>
                <div><b>Atualizado em:</b> {viewMember.updatedAt ? new Date(viewMember.updatedAt).toLocaleString('pt-BR') : '-'}</div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setViewMember(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded focus:outline-blue-500 focus:ring-2 focus:ring-blue-300" aria-label="Fechar detalhes do membro">Fechar</button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// NOVO COMPONENTE DE MENU DE AÇÕES PARA MEMBROS
function MemberActionsMenu({ member, onEdit, onDelete, onToggleStatus, onView }: {
  member: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onView: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const optionRef0 = React.useRef<HTMLButtonElement>(null);
  const optionRef1 = React.useRef<HTMLButtonElement>(null);
  const optionRef2 = React.useRef<HTMLButtonElement>(null);
  const optionRef3 = React.useRef<HTMLButtonElement>(null);
  const optionRefs = React.useMemo(() => [optionRef0, optionRef1, optionRef2, optionRef3], []);
  const optionCount = 4;

  // Foco automático na primeira opção ao abrir
  React.useEffect(() => {
    if (open) {
      setTimeout(() => optionRefs[0].current?.focus(), 0);
    }
  }, [open, optionRefs]);

  // Fecha ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        setOpen(true);
        setTimeout(() => optionRefs[0].current?.focus(), 0);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    }
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const current = optionRefs.findIndex(ref => ref.current === document.activeElement);
      let next = 0;
      if (e.key === 'ArrowDown') {
        next = current === -1 ? 0 : (current + 1) % optionCount;
      } else {
        next = current === -1 ? optionCount - 1 : (current - 1 + optionCount) % optionCount;
      }
      optionRefs[next].current?.focus();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => { setOpen(o => !o); setTimeout(() => optionRefs[0].current?.focus(), 0); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="true"
        aria-expanded={open}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
        tabIndex={0}
        title="Ações"
      >
        <HiOutlineDotsVertical className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col" role="menu">
          <button
            ref={optionRefs[0]}
            className="px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            onClick={() => { setOpen(false); onView(); }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="menuitem"
          >Ver detalhes</button>
          <button
            ref={optionRefs[1]}
            className="px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            onClick={() => { setOpen(false); onEdit(); }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="menuitem"
          >Editar</button>
          <button
            ref={optionRefs[2]}
            className="px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-red-600"
            onClick={() => { setOpen(false); onDelete(); }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="menuitem"
          >Excluir</button>
          <button
            ref={optionRefs[3]}
            className="px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            onClick={() => { setOpen(false); onToggleStatus(); }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="menuitem"
          >{member.status === 'ATIVO' ? 'Inativar' : 'Ativar'}</button>
        </div>
      )}
    </div>
  );
}