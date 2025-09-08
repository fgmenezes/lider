"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
// Nota: Os componentes SelectContent, SelectItem, SelectTrigger e SelectValue foram removidos da importação
// pois não estão disponíveis no componente Select atual
import { Badge } from '@/components/ui/badge';
import { fetchAddressByCep } from '@/lib/utils/viaCep';
import { Tab } from '@headlessui/react';

function maskDate(value: string) {
  // Mascara para dd/mm/aaaa
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
    .replace(/(\d{10})\d+?$/, "$1");
}

function calculateAge(dateStr: string) {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.length !== 10) return '';
  const [d, m, y] = dateStr.split('/');
  if (!d || !m || !y || d.length !== 2 || m.length !== 2 || y.length !== 4) return '';
  
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
  
  const birth = new Date(year, month - 1, day);
  if (isNaN(birth.getTime())) return '';
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  
  return age >= 0 ? age.toString() : '';
}

function maskPhone(value: string) {
  // Mascara para (99) 99999-9999
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(\d{4})-(\d{5})/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
}

function maskCep(value: string) {
  // Mascara para 99999-999
  return value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

async function fetchViaCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

function UserFormStep1({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const nameRef = useRef<HTMLInputElement>(null);
  const birthRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (nameRef.current) nameRef.current.focus();
  }, []);
  useEffect(() => {
    if (form.dataNascimento) {
      const idade = calculateAge(form.dataNascimento);
      if (idade !== form.idade) {
        setForm((prev: any) => ({ ...prev, idade }));
      }
    }
  }, [form.dataNascimento]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Dados Pessoais</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Informe os dados pessoais do usuário
        </p>
      </div>
      <Input
        label="Nome completo"
        value={form.name || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
        required
        ref={nameRef}
      />
      <Input
        label="Data de nascimento"
        value={form.dataNascimento || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, dataNascimento: maskDate(e.target.value) }))}
        maxLength={10}
        placeholder="dd/mm/aaaa"
        ref={birthRef}
        inputMode="numeric"
        required
      />
      <Input
        label="Idade"
        value={form.idade || ''}
        readOnly
        className="bg-[var(--color-neutral)]"
      />
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Sexo</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-[var(--color-text-primary)]">
            <input type="radio" name="gender" value="M" checked={form.sexo === "M"} onChange={() => setForm((prev: any) => ({ ...prev, sexo: "M" }))}/>
            Masculino
          </label>
          <label className="flex items-center gap-1 text-[var(--color-text-primary)]">
            <input type="radio" name="gender" value="F" checked={form.sexo === "F"} onChange={() => setForm((prev: any) => ({ ...prev, sexo: "F" }))}/>
            Feminino
          </label>
        </div>
      </div>
      <Select
        label="Estado civil"
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
      <div className="flex justify-end mt-6">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function UserFormStep2({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const phoneRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (phoneRef.current) phoneRef.current.focus(); }, []);
  const isValid = (form.phone || '').length === 15 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email || '');
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Contato</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Informe os dados de contato do usuário
        </p>
      </div>
      <Input
        label="Telefone celular"
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
      <div className="flex justify-end mt-6 gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function UserFormStep3({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const cepRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  useEffect(() => { if (cepRef.current) cepRef.current.focus(); }, []);
  useEffect(() => {
    const cleanCep = (form.cep || '').replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      fetchViaCep(form.cep).then(data => {
        if (data) {
          setForm((prev: any) => ({
            ...prev,
            rua: data.logradouro || "",
            bairro: data.bairro || "",
            municipio: data.localidade || "",
            estado: data.uf || "",
          }));
          // Foco automático no campo número após preenchimento do CEP
          setTimeout(() => {
            numeroRef.current?.focus();
          }, 100);
        } else {
          setCepError("CEP não encontrado");
        }
        setLoadingCep(false);
      }).catch(() => {
        setCepError("Erro ao buscar CEP");
        setLoadingCep(false);
      });
    }
  }, [form.cep, setForm]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Endereço</h3>
        <p className="text-sm text-gray-600 mb-4">
          Informe o endereço completo do usuário. O CEP será preenchido automaticamente.
        </p>
      </div>
      <Input
        label="CEP"
        value={form.cep || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, cep: maskCep(e.target.value) }))}
        maxLength={9}
        placeholder="99999-999"
        error={cepError}
        ref={cepRef}
        required
      />
      {loadingCep && <div className="text-xs text-gray-500 mt-1">Buscando endereço...</div>}
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
      <div className="flex justify-end mt-6 gap-2">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function UserFormStep4({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const [ministries, setMinistries] = useState<{ value: string, label: string, church: { id: string, name: string } }[]>([]);
  const [loadingMinistries, setLoadingMinistries] = useState(false);
  const ministryRef = useRef<HTMLSelectElement>(null);
  useEffect(() => { if (ministryRef.current) ministryRef.current.focus(); }, []);
  useEffect(() => {
    if (form.cargo === 'MASTER' || form.cargo === 'LEADER') {
      setLoadingMinistries(true);
      fetch('/api/ministries?perPage=100')
        .then(res => res.json())
        .then(data => {
          setMinistries(data.ministries.map((m: any) => ({ value: m.id, label: m.name, church: m.church })));
          setLoadingMinistries(false);
        });
    }
  }, [form.cargo]);
  useEffect(() => {
    if (form.cargo === 'MASTER' || form.cargo === 'LEADER') {
      const ministry = ministries.find(m => m.value === form.ministryId);
      if (ministry) {
        setForm((prev: any) => ({ ...prev, church: ministry.church.name }));
      } else {
        setForm((prev: any) => ({ ...prev, church: '' }));
      }
    } else {
      setForm((prev: any) => ({ ...prev, church: '' }));
    }
  }, [form.ministryId, ministries, form.cargo, setForm]);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cargo e Vínculos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Defina o cargo do usuário e seus vínculos com ministérios
        </p>
      </div>
      <Select
        label="Cargo"
        value={form.cargo || ''}
        onChange={e => setForm((prev: any) => ({ ...prev, cargo: e.target.value }))}
        required
        ref={ministryRef}
        options={[
          { value: 'ADMIN', label: 'Administrador' },
          { value: 'MASTER', label: 'Líder Master' },
          { value: 'LEADER', label: 'Líder' }
        ]}
      />
      {(form.cargo === 'MASTER' || form.cargo === 'LEADER') && (
        <>
          <Select
            label="Ministério"
            value={form.ministryId || ''}
            onChange={e => setForm((prev: any) => ({ ...prev, ministryId: e.target.value }))}
            required
            options={ministries.map((m) => ({
              value: m.value,
              label: m.label
            }))}
          />
          <Input
            label="Igreja"
            value={form.church || ''}
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />
          <Input
            label="Data de Ingresso"
            value={form.dataIngresso || ''}
            onChange={e => setForm((prev: any) => ({ ...prev, dataIngresso: maskDate(e.target.value) }))}
            placeholder="dd/mm/aaaa"
            maxLength={10}
            required
          />
        </>
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
        name="isActive"
          checked={form.isActive ?? true}
          onChange={e => setForm((prev: any) => ({ ...prev, isActive: e.target.checked }))}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
        <label htmlFor="isActive" className="block text-sm text-gray-900">Usuário Ativo</label>
      </div>
      <div className="flex justify-end mt-6 gap-2">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function UserFormStep5({ form, setForm, onCancel }: { form: any, setForm: (data: any) => void, onCancel: () => void }) {
  const email = form.email || "";
  const [password, setPassword] = useState(form.password || "");
  const [confirmPassword, setConfirmPassword] = useState(form.password || "");
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  const isValid =
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword;

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setError("As senhas não coincidem");
    } else {
      setError("");
    }
    setForm((prev: any) => ({ ...prev, password, confirmPassword }));
  }, [password, confirmPassword, setForm]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Senha de Acesso</h3>
        <p className="text-sm text-gray-600 mb-4">
          Defina uma senha para o acesso do usuário ao sistema
        </p>
      </div>
      <Input
        label="Usuário (login)"
        value={email}
        readOnly
        className="bg-gray-100 cursor-not-allowed"
        ref={emailRef}
      />
      <Input
        label="Senha"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        minLength={6}
        required
      />
      <Input
        label="Confirmar Senha"
        type="password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        minLength={6}
        required
        error={error}
      />
      <div className="flex justify-end mt-6 gap-2">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function UserFormResumo({ form, onCancel }: { form: any, onCancel: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Resumo</h3>
        <p className="text-sm text-gray-600 mb-4">Confira os dados antes de criar o usuário.</p>
      </div>
      <div className="bg-gray-50 rounded p-4 text-sm space-y-4">
        <div>
          <h4 className="font-semibold mb-1">Dados Pessoais</h4>
          <div><b>Nome:</b> {form.name}</div>
          <div><b>Data de Nascimento:</b> {form.dataNascimento}</div>
          <div><b>Idade:</b> {form.idade}</div>
          <div><b>Sexo:</b> {form.sexo === 'M' ? 'Masculino' : form.sexo === 'F' ? 'Feminino' : ''}</div>
          <div><b>Estado Civil:</b> {form.estadoCivil}</div>
        </div>
        <div>
          <h4 className="font-semibold mb-1 mt-2">Contato</h4>
          <div><b>Telefone:</b> {form.phone}</div>
          <div><b>Email:</b> {form.email}</div>
        </div>
        <div>
          <h4 className="font-semibold mb-1 mt-2">Endereço</h4>
          <div><b>CEP:</b> {form.cep}</div>
          <div><b>Rua:</b> {form.rua}</div>
          <div><b>Número:</b> {form.numero}</div>
          <div><b>Complemento:</b> {form.complemento}</div>
          <div><b>Bairro:</b> {form.bairro}</div>
          <div><b>Município:</b> {form.municipio}</div>
          <div><b>Estado:</b> {form.estado}</div>
        </div>
        <div>
          <h4 className="font-semibold mb-1 mt-2">Status</h4>
          <div><b>Usuário Ativo:</b> {form.isActive === false ? 'Não' : 'Sim'}</div>
        </div>
      </div>
      <div className="flex justify-end mt-6 gap-2">
        <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function UserEditTabs({ form, setForm, onCancel, onSave }: any) {
  const tabs = [
    { name: 'Dados Pessoais', content: <UserFormStep1 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Contato', content: <UserFormStep2 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Endereço', content: <UserFormStep3 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Vínculos', content: <UserFormStep4 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Acesso', content: <UserFormStep5 form={form} setForm={setForm} onCancel={onCancel} /> },
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

function UserCreateWizard({ form, setForm, onCancel, onSave, submitError, submitLoading }: any) {
  const steps = [
    { name: 'Dados Pessoais', content: <UserFormStep1 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Contato', content: <UserFormStep2 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Endereço', content: <UserFormStep3 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Acesso', content: <UserFormStep5 form={form} setForm={setForm} onCancel={onCancel} /> },
    { name: 'Resumo', content: <UserFormResumo form={form} onCancel={onCancel} /> },
  ];
  const [currentStep, setCurrentStep] = React.useState(0);
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.name} className={`h-2 w-8 rounded ${idx <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        ))}
      </div>
      {steps[currentStep].content}
      <div className="flex justify-end mt-6 gap-2">
        {/* Removido botão Cancelar duplicado aqui */}
        <div className="flex gap-2">
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setCurrentStep(currentStep - 1)}>Voltar</button>
          )}
          {currentStep < steps.length - 2 ? (
            <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setCurrentStep(currentStep + 1)}>Avançar</button>
          ) : currentStep === steps.length - 2 ? (
            <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setCurrentStep(currentStep + 1)}>Avançar</button>
          ) : (
            <>
              <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setCurrentStep(currentStep - 1)}>Voltar</button>
              <button type="button" className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60" onClick={onSave} disabled={submitLoading}>{submitLoading ? 'Criando...' : 'Criar'}</button>
            </>
          )}
        </div>
      </div>
      {submitError && (
        <div className="text-red-600 text-sm mt-2" role="alert">{submitError}</div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [editUser, setEditUser] = useState<any>(null);
  const [formStep, setFormStep] = useState(1);
  // Estado inicial
  const [formData, setFormData] = useState<any>({
    name: "",
    dataNascimento: "",
    dataIngresso: "",
    idade: "",
    sexo: "",
    estadoCivil: "",
    phone: "",
    email: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    municipio: "",
    estado: "",
    cargo: "",
    ministryId: "",
    church: "",
    password: "",
    isActive: true
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();

  const fetchUsers = async (searchValue = "", pageValue = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(searchValue)}&page=${pageValue}&perPage=${perPage}`);
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || data.users?.length || 0);
      setPage(data.page || 1);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(search, page);
    // eslint-disable-next-line
  }, [search, open, page]);

  const totalPages = Math.ceil(total / perPage);

  // Placeholder para ações
  const handleDelete = async (id: string) => {
    toast("Funcionalidade de exclusão em breve!");
  };

  function toISODate(dateStr: string) {
    // Converte dd/mm/aaaa para yyyy-mm-dd
    if (!dateStr || typeof dateStr !== 'string') return '';
    const [d, m, y] = dateStr.split('/');
    if (!d || !m || !y) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const validateDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.length !== 10) return false;
    const [d, m, y] = dateStr.split('/');
    if (!d || !m || !y || d.length !== 2 || m.length !== 2 || y.length !== 4) return false;
    
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) return false;
    
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  const handleSaveUser = async () => {
    setSubmitLoading(true);
    setSubmitError("");
    if (!validateDate(formData.dataNascimento)) {
      setSubmitError('Data de nascimento obrigatória e válida!');
      setSubmitLoading(false);
      toast.error('Data de nascimento obrigatória e válida!');
      return;
    }
    try {
      // Garante que a idade está correta antes de enviar
      const idade = calculateAge(formData.dataNascimento);
      const mapDate = (dateStr: string) => {
        if (typeof dateStr !== "string" || !dateStr.includes("/")) return undefined;
        const parts = dateStr.split("/");
        if (parts.length !== 3) return undefined;
        const [d, m, y] = parts;
        if (!d || !m || !y || d.length !== 2 || m.length !== 2 || y.length !== 4) return undefined;
        // Validar se é uma data válida
        const date = new Date(`${y}-${m}-${d}`);
        if (isNaN(date.getTime())) return undefined;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      };
      const roleMap = {
        'ADMIN': 'ADMIN',
        'MASTER': 'MASTER',
        'LEADER': 'LEADER',
      };
      const payload = {
        name: formData.name || '',
        email: formData.email || '',
        password: formData.password || '',
        isActive: formData.isActive,
        ministryId: formData.ministryId || undefined,
        dataIngresso: (typeof formData.dataIngresso === 'string' && formData.dataIngresso && formData.dataIngresso.includes('/')) ? mapDate(formData.dataIngresso) : undefined,
        celular: formData.phone || '',
        cep: formData.cep || '',
        rua: formData.rua || '',
        numero: formData.numero || '',
        complemento: formData.complemento || '',
        bairro: formData.bairro || '',
        municipio: formData.municipio || '',
        estado: formData.estado || '',
        sexo: formData.sexo || '',
        estadoCivil: formData.estadoCivil || '',
        dataNascimento: toISODate(formData.dataNascimento),
      };
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao atualizar usuário');
      }
      setEditUser(null);
      setFormStep(1);
      setFormData({
        name: "",
        dataNascimento: "",
        dataIngresso: "",
        idade: "",
        sexo: "",
        estadoCivil: "",
        phone: "",
        email: "",
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        municipio: "",
        estado: "",
        cargo: "",
        ministryId: "",
        church: "",
        password: "",
        isActive: true
      });
      fetchUsers(search, page);
      toast.success('Usuário atualizado com sucesso!');
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao atualizar usuário');
      toast.error(err.message || 'Erro ao atualizar usuário');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h1>
      <div className="flex items-center justify-end mb-4">
        <Dialog.Root open={open || !!editUser} onOpenChange={(v) => { 
            setOpen(v); 
            if (!v) {
              setEditUser(null);
              // Limpar completamente o formulário ao fechar o modal
              setFormStep(1);
              setFormData({
                name: "",
                dataNascimento: "",
                dataIngresso: "",
                idade: "",
                sexo: "",
                estadoCivil: "",
                phone: "",
                email: "",
                cep: "",
                rua: "",
                numero: "",
                complemento: "",
                bairro: "",
                municipio: "",
                estado: "",
                cargo: "",
                ministryId: "",
                church: "",
                password: "",
                isActive: true
              });
            }
          }}>
          <Dialog.Trigger asChild>
            <Button variant="primary">
              Adicionar Usuário
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content aria-label={editUser ? 'Editar Usuário' : 'Criar Novo Usuário'} className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-background)] rounded-lg shadow-lg p-8 w-full max-w-lg border border-[var(--color-border)]">
              <Dialog.Title className="text-xl font-bold mb-4 text-[var(--color-text-primary)]">{editUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</Dialog.Title>
              {editUser ? (
                <Dialog.Root open={!!editUser} onOpenChange={() => { setEditUser(null); setFormStep(1); setFormData({}); }}>
                  <Dialog.Content>
                    <Dialog.Title>Editar Usuário</Dialog.Title>
                    <UserEditTabs
                      form={formData}
                      setForm={setFormData}
                      onCancel={() => { setEditUser(null); setFormStep(1); setFormData({}); }}
                      onSave={handleSaveUser}
                    />
                  </Dialog.Content>
                </Dialog.Root>
              ) : (
                <UserCreateWizard
                  form={formData}
                  setForm={setFormData}
                  onCancel={() => { 
                    setOpen(false); 
                    setFormStep(1); 
                    setFormData({
                      name: "",
                      dataNascimento: "",
                      dataIngresso: "",
                      idade: "",
                      sexo: "",
                      estadoCivil: "",
                      phone: "",
                      email: "",
                      cep: "",
                      rua: "",
                      numero: "",
                      complemento: "",
                      bairro: "",
                      municipio: "",
                      estado: "",
                      cargo: "",
                      ministryId: "",
                      church: "",
                      password: "",
                      isActive: true
                    }); 
                  }}
                  onSave={async () => {
                    setSubmitLoading(true);
                    setSubmitError("");
                    if (!validateDate(formData.dataNascimento)) {
                      setSubmitError('Data de nascimento obrigatória e válida!');
                      setSubmitLoading(false);
                      toast.error('Data de nascimento obrigatória e válida!');
                      return;
                    }
                    try {
                      // Garante que a idade está correta antes de enviar
                      const idade = calculateAge(formData.dataNascimento);
                      const mapDate = (dateStr: string) => {
                        if (typeof dateStr !== "string" || !dateStr.includes("/")) return undefined;
                        const parts = dateStr.split("/");
                        if (parts.length !== 3) return undefined;
                        const [d, m, y] = parts;
                        if (!d || !m || !y) return undefined;
                        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                      };
                      const roleMap = {
                        'ADMIN': 'ADMIN',
                        'MASTER': 'MASTER',
                        'LEADER': 'LEADER',
                      };
                      const payload = {
                        nomeCompleto: formData.name || '',
                        emailLogin: formData.email || '',
                        senha: formData.password || '',
                        isActive: formData.isActive,
                        ministryId: formData.ministryId || undefined,
                        dataIngresso: (typeof formData.dataIngresso === 'string' && formData.dataIngresso && formData.dataIngresso.includes('/')) ? mapDate(formData.dataIngresso) : undefined,
                        celular: formData.phone || '',
                        cep: formData.cep || '',
                        rua: formData.rua || '',
                        numero: formData.numero || '',
                        complemento: formData.complemento || '',
                        bairro: formData.bairro || '',
                        municipio: formData.municipio || '',
                        estado: formData.estado || '',
                        sexo: formData.sexo || '',
                        estadoCivil: formData.estadoCivil || '',
                        dataNascimento: toISODate(formData.dataNascimento),
                        tipoLider: formData.cargo || 'LEADER',
                      };
                      const res = await fetch(`/api/users`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.message || 'Erro ao criar usuário');
                      }
                      setOpen(false);
                      setFormStep(1);
                      setFormData({
                        name: "",
                        dataNascimento: "",
                        dataIngresso: "",
                        idade: "",
                        sexo: "",
                        estadoCivil: "",
                        phone: "",
                        email: "",
                        cep: "",
                        rua: "",
                        numero: "",
                        complemento: "",
                        bairro: "",
                        municipio: "",
                        estado: "",
                        cargo: "",
                        ministryId: "",
                        church: "",
                        password: "",
                        isActive: true
                      });
                      fetchUsers(search, page);
                      toast.success('Usuário criado com sucesso!');
                    } catch (err: any) {
                      setSubmitError(err.message || 'Erro ao criar usuário');
                      toast.error(err.message || 'Erro ao criar usuário');
                    } finally {
                      setSubmitLoading(false);
                    }
                  }}
                  submitError={submitError}
                  submitLoading={submitLoading}
                />
              )}
              <Dialog.Close asChild>
                <button className="absolute top-2 right-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">×</button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <div className="mb-6">
        <Input
          placeholder="Buscar usuário..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-64"
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">Usuários Cadastrados</h2>
        {error && <div className="text-[var(--color-danger)] mb-4">{error}</div>}
        {loading ? (
          <div aria-live="polite">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="text-[var(--color-text-secondary)]">Nenhum usuário encontrado.</div>
        ) : (
          <>
            {/* Tabela para desktop */}
            <div className="hidden md:block overflow-x-auto rounded-md shadow bg-[var(--color-background)]">
              <table className="min-w-full divide-y divide-[var(--color-border)]">
                <thead className="bg-[var(--color-neutral)]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Nome</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Papel</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[var(--color-neutral)]">
                      <td className="px-4 py-2 font-medium text-[var(--color-text-primary)]">{user.name}</td>
                      <td className="px-4 py-2 text-[var(--color-text-primary)]">{user.email}</td>
                      <td className="px-4 py-2 text-[var(--color-text-primary)]">{user.role}</td>
                      <td className="px-4 py-2">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button aria-label="Abrir menu de ações" className="p-2 rounded-full hover:bg-[var(--color-neutral)] focus:outline-none focus-ring transition-default" tabIndex={0}>
                              <MoreVertical size={20} />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content aria-label="Menu de ações do usuário" className="bg-[var(--color-background)] rounded shadow-lg p-1 min-w-[140px] z-50 border border-[var(--color-border)]">
                            <DropdownMenu.Item aria-label="Ver detalhes" className="px-3 py-2 text-sm hover:bg-[var(--color-neutral)] rounded cursor-pointer text-[var(--color-text-primary)]" onSelect={() => router.push(`/dashboard/users/${user.id}`)}>Detalhes</DropdownMenu.Item>
                            <DropdownMenu.Item aria-label="Editar usuário" className="px-3 py-2 text-sm hover:bg-[var(--color-neutral)] rounded cursor-pointer text-[var(--color-text-primary)]" onSelect={() => setEditUser(user)}>Editar</DropdownMenu.Item>
                            <DropdownMenu.Item aria-label="Excluir usuário" className="px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded cursor-pointer" onSelect={() => handleDelete(user.id)}>Excluir</DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Cards para mobile */}
            <div className="md:hidden space-y-4">
              {users.map((user, idx) => (
                <div
                  key={user.id}
                  tabIndex={0}
                  aria-label={`Usuário ${user.name}`}
                  role="region"
                  className="user-card bg-[var(--color-background)] rounded shadow p-4 flex flex-col gap-2 transition-default hover:shadow-lg focus-within:ring-2 focus-within:ring-[var(--color-primary)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-[var(--color-text-primary)]">{user.name}</div>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button aria-label="Abrir menu de ações" className="p-2 rounded-full hover:bg-[var(--color-neutral)] focus:outline-none focus-ring transition-default" tabIndex={0}>
                          <MoreVertical size={20} />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content aria-label="Menu de ações do usuário" className="bg-[var(--color-background)] rounded shadow-lg p-1 min-w-[140px] z-50 border border-[var(--color-border)]">
                        <DropdownMenu.Item aria-label="Ver detalhes" className="px-3 py-2 text-sm hover:bg-[var(--color-neutral)] rounded cursor-pointer text-[var(--color-text-primary)]" onSelect={() => router.push(`/dashboard/users/${user.id}`)}>Detalhes</DropdownMenu.Item>
                        <DropdownMenu.Item aria-label="Editar usuário" className="px-3 py-2 text-sm hover:bg-[var(--color-neutral)] rounded cursor-pointer text-[var(--color-text-primary)]" onSelect={() => setEditUser(user)}>Editar</DropdownMenu.Item>
                        <DropdownMenu.Item aria-label="Excluir usuário" className="px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded cursor-pointer" onSelect={() => handleDelete(user.id)}>Excluir</DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Email: {user.email}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Papel: {user.role}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="secondary"
              className="disabled:opacity-50"
            >
              Anterior
            </Button>
            <span className="mx-2 text-[var(--color-text-primary)]">Página {page} de {totalPages}</span>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="secondary"
              className="disabled:opacity-50"
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}