"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Select from '@/components/forms/Select';
// Nota: Os componentes SelectContent, SelectItem, SelectTrigger e SelectValue foram removidos da importação
// pois não estão disponíveis no componente Select atual
import { Checkbox } from "@/components/ui/checkbox";
import RadioGroup from "@/components/forms/RadioGroup";
import { fetchAddressByCep } from "@/lib/utils/viaCep";
import { useSession } from "next-auth/react";
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { FREQUENCIAS_LABEL } from "@/constants/frequencias";
import { useRouter } from "next/navigation";
import { Tab } from '@headlessui/react';
import { Button } from '@/components/ui/button';

// Função de máscara robusta para data DD/MM/AAAA
function maskDateBR(value: string) {
  let v = value.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length >= 5) return v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
  if (v.length >= 3) return v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
  return v;
}
// Função para validar data DD/MM/AAAA
function isValidDateBR(date: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return false;
  const [d, m, y] = date.split('/');
  const day = Number(d), month = Number(m) - 1, year = Number(y);
  const dt = new Date(year, month, day);
  return (
    dt &&
    dt.getFullYear() === year &&
    dt.getMonth() === month &&
    dt.getDate() === day
  );
}
// Função para converter DD/MM/AAAA para YYYY-MM-DDTHH:mm:ss.sssZ
function brToISO(date: string) {
  const [d, m, y] = date.split('/');
  const dt = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
  return dt.toISOString();
}

// Mock de grupos para exibição inicial
const MOCK_GROUPS = [
  { id: 1, name: "PG Centro" },
  { id: 2, name: "PG Norte" },
];

const DIAS_SEMANA = [
  { value: "SEGUNDA", label: "Segunda-feira" },
  { value: "TERCA", label: "Terça-feira" },
  { value: "QUARTA", label: "Quarta-feira" },
  { value: "QUINTA", label: "Quinta-feira" },
  { value: "SEXTA", label: "Sexta-feira" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];
const FREQUENCIAS = [
  { value: "DIARIO", label: "Diário" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "MENSAL", label: "Mensal" },
];

const ETAPAS = [
  {
    titulo: "Dados do Pequeno Grupo",
    descricao: "Informe o nome do pequeno grupo.",
  },
  {
    titulo: "Encontros",
    descricao: "Informe o dia, frequência, horário e, se desejar, a data de início do grupo.",
  },
  {
    titulo: "Anfitrião",
    descricao: "Informe quem está cedendo o espaço para os encontros (nome e celular).",
  },
  {
    titulo: "Endereço dos Encontros",
    descricao: "Preencha o endereço onde os encontros acontecerão. O CEP preenche automaticamente os demais campos.",
  },
  {
    titulo: "Resumo",
    descricao: "Revise os dados antes de criar o pequeno grupo.",
  },
];

function maskCep(value: string) {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 5) return clean;
  return clean.slice(0, 5) + '-' + clean.slice(5, 8);
}

function maskCelular(value: string) {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 7) return `(${clean.slice(0,2)}) ${clean.slice(2)}`;
  if (clean.length <= 11) return `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`;
  return `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7,11)}`;
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return "";
  const [yyyy, mm, dd] = dateStr.split("-");
  if (!yyyy || !mm || !dd) return dateStr;
  return `${dd}/${mm}/${yyyy}`;
}

function SmallGroupWizard({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  // Etapa 1
  const [nome, setNome] = useState("");
  const [description, setDescription] = useState("");
  // Etapa 2
  const [tipoEncontro, setTipoEncontro] = useState<'unico' | 'recorrente'>('recorrente');
  const [frequencia, setFrequencia] = useState("");
  const [diaSemana, setDiaSemana] = useState("");
  const [horario, setHorario] = useState("");
  const [horarioTermino, setHorarioTermino] = useState("");
  const [dataUnica, setDataUnica] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [validationError, setValidationError] = useState("");
  // Etapa 3
  const [anfitriaoNome, setAnfitriaoNome] = useState("");
  const [anfitriaoCelular, setAnfitriaoCelular] = useState("");
  // Etapa 4
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");
  // ViaCEP
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [lastCepSearched, setLastCepSearched] = useState("");
  // Refs para foco automático
  const nomeRef = useRef<HTMLInputElement>(null);
  const diaSemanaRef = useRef<HTMLSelectElement>(null);
  const anfitriaoNomeRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null); // já existe
  const tipoEncontroRef = useRef<HTMLFieldSetElement>(null);
  const frequenciaRef = useRef<HTMLSelectElement>(null);
  const dataUnicaRef = useRef<HTMLInputElement>(null);
  // Adicione estado de loading e erro para submissão
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  // Adicionar estado de erro para dataUnica e dataInicio
  const [erroDataUnica, setErroDataUnica] = useState("");
  const [erroDataInicio, setErroDataInicio] = useState("");

  useEffect(() => {
    if (step === 1) nomeRef.current?.focus();
    if (step === 2) {
      setTimeout(() => {
        if (tipoEncontroRef.current) {
          tipoEncontroRef.current.focus();
        } else if (frequenciaRef.current) {
          frequenciaRef.current.focus();
        } else if (dataUnicaRef.current) {
          dataUnicaRef.current.focus();
        }
      }, 100);
    }
    if (step === 3) anfitriaoNomeRef.current?.focus();
    if (step === 4) cepRef.current?.focus();
  }, [step]);

  function nextStep() {
    if (!isStepValid()) {
      setValidationError("Preencha todos os campos obrigatórios.");
      return;
    }
    // Validação de datas
    if (step === 2) {
      if (tipoEncontro === 'recorrente' && dataInicio && !isValidDateBR(dataInicio)) {
        setErroDataInicio('Data inválida');
        return;
      }
      if (tipoEncontro === 'unico' && (!isValidDateBR(dataUnica))) {
        setErroDataUnica('Data inválida');
        return;
      }
    }
    setValidationError("");
    setStep((s) => s + 1);
  }
  function prevStep() { setStep((s) => s - 1); }
  function handleCancel() {
    setStep(1);
    setNome(""); setDescription(""); setTipoEncontro('recorrente'); setFrequencia(""); setDiaSemana(""); setHorario(""); setDataUnica(""); setDataInicio("");
    setAnfitriaoNome(""); setAnfitriaoCelular("");
    setCep(""); setRua(""); setNumero(""); setComplemento(""); setBairro(""); setMunicipio(""); setEstado("");
    onClose();
  }
  function isStepValid() {
    if (step === 1) return !!nome;
    if (step === 2) {
      if (tipoEncontro === 'recorrente') {
        return !!frequencia && !!diaSemana && !!horario;
      } else {
        return !!dataUnica && !!horario;
      }
    }
    if (step === 3) return !!anfitriaoNome && !!anfitriaoCelular;
    if (step === 4) return !!cep && !!rua && !!numero && !!bairro && !!municipio && !!estado;
    return true;
  }

  async function handleCepChange(value: string) {
    const cleanValue = value.replace(/\D/g, "");
    setCep(maskCep(value));
    setCepError("");
    if (cleanValue.length === 8 && cleanValue !== lastCepSearched) {
      setCepLoading(true);
      try {
        const data = await fetchAddressByCep(cleanValue);
        setRua(data.logradouro || "");
        setBairro(data.bairro || "");
        setMunicipio(data.localidade || "");
        setEstado(data.uf || "");
        setCepError("");
        setTimeout(() => { numeroRef.current?.focus(); }, 100);
      } catch (err: any) {
        setCepError(err.message || "Erro ao buscar CEP");
        setRua("");
        setBairro("");
        setMunicipio("");
        setEstado("");
      }
      setCepLoading(false);
      setLastCepSearched(cleanValue);
    }
    if (cleanValue.length < 8) {
      setLastCepSearched("");
      setCepError("");
    }
  }
  function handleNumeroChange(value: string) {
    setNumero(value.replace(/\D/g, ""));
  }

  async function handleCreate() {
    setSubmitLoading(true);
    setSubmitError("");
    setSubmitSuccess(false);
    // Validação de datas antes de salvar
    if (tipoEncontro === 'recorrente' && dataInicio && !isValidDateBR(dataInicio)) {
      setErroDataInicio('Data inválida');
      setSubmitLoading(false);
      return;
    }
    if (tipoEncontro === 'unico' && (!isValidDateBR(dataUnica))) {
      setErroDataUnica('Data inválida');
      setSubmitLoading(false);
      return;
    }
    try {
      let ministryId = session?.user?.ministryId || session?.user?.masterMinistryId;
      if (!ministryId) throw new Error("Não foi possível identificar o ministério do usuário logado. Por favor, faça login novamente ou contate o administrador do sistema.");
      const payload: any = {
        name: nome,
        description,
        dayOfWeek: tipoEncontro === 'recorrente' ? diaSemana : null,
        frequency: tipoEncontro === 'recorrente' ? frequencia : null,
        time: horario,
        endTime: horarioTermino || null,
        startDate: tipoEncontro === 'recorrente'
          ? (dataInicio ? brToISO(dataInicio) : null)
          : (dataUnica ? brToISO(dataUnica) : null),
        hostName: anfitriaoNome,
        hostPhone: anfitriaoCelular,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        municipio,
        estado,
        ministryId,
      };
      const res = await fetch("/api/small-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar grupo");
      }
      setSubmitSuccess(true);
      handleCancel();
      if (onCreated) onCreated();
    } catch (err: any) {
      setSubmitError(err.message || "Erro ao criar grupo");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleCancel()}>
      <DialogContent>
        <div className="mb-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Etapa {step} de {ETAPAS.length}</div>
        <DialogTitle>{ETAPAS[step-1].titulo}</DialogTitle>
        <div className="mb-2 text-sm text-gray-500">{ETAPAS[step-1].descricao}</div>
        {step === 1 && (
          <div className="space-y-4 mt-2">
            <Input label="Nome do Pequeno Grupo" value={nome} onChange={e => setNome(e.target.value)} required ref={nomeRef} />
            <Input label="Descrição do Pequeno Grupo" value={description} onChange={e => setDescription(e.target.value)} placeholder="Adicione uma breve descrição..." />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 mt-2">
            <fieldset>
              <legend className="font-semibold mb-2">Tipo de Encontro</legend>
              <RadioGroup
                label="Tipo de Encontro"
                options={[
                  { label: "Encontro único", value: "unico" },
                  { label: "Encontro recorrente", value: "recorrente" }
                ]}
                value={tipoEncontro}
                onChange={v => setTipoEncontro(v as 'unico' | 'recorrente')}
                ref={tipoEncontroRef}
              />
            </fieldset>
            <div className="text-xs text-gray-500 mb-2">
              {tipoEncontro === 'recorrente'
                ? 'O grupo se reunirá periodicamente conforme a frequência escolhida.'
                : 'O grupo terá um único encontro na data selecionada.'}
            </div>
            {tipoEncontro === 'recorrente' && (
              <>
                <Select label="Frequência *" value={frequencia} onChange={e => setFrequencia(e.target.value)} options={FREQUENCIAS} required error={!frequencia && validationError ? 'Obrigatório' : undefined} ref={frequenciaRef} />
                <Select label="Dia da Semana *" value={diaSemana} onChange={e => setDiaSemana(e.target.value)} options={DIAS_SEMANA} required error={!diaSemana && validationError ? 'Obrigatório' : undefined} />
                <Input label="Horário de Início *" type="time" value={horario} onChange={e => setHorario(e.target.value)} required error={!horario && validationError ? 'Obrigatório' : undefined} />
                <Input label="Horário de Término" type="time" value={horarioTermino} onChange={e => setHorarioTermino(e.target.value)} />
                <Input label="Data de início (opcional)"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={dataInicio}
                  onChange={e => {
                    const masked = maskDateBR(e.target.value);
                    setDataInicio(masked);
                    setErroDataInicio("");
                  }}
                  maxLength={10}
                  error={erroDataInicio}
                />
              </>
            )}
            {tipoEncontro === 'unico' && (
              <>
                <Input label="Data do Encontro *"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={dataUnica}
                  onChange={e => {
                    const masked = maskDateBR(e.target.value);
                    setDataUnica(masked);
                    setErroDataUnica("");
                  }}
                  maxLength={10}
                  required
                  error={erroDataUnica || (!dataUnica && validationError ? 'Obrigatório' : undefined)}
                  ref={dataUnicaRef}
                />
                <Input label="Horário de Início *" type="time" value={horario} onChange={e => setHorario(e.target.value)} required error={!horario && validationError ? 'Obrigatório' : undefined} />
                <Input label="Horário de Término" type="time" value={horarioTermino} onChange={e => setHorarioTermino(e.target.value)} />
              </>
            )}
            {validationError && (
              <div className="text-red-600 text-xs mt-1">{validationError}</div>
            )}
            {/* Resumo dinâmico */}
            <div className="bg-gray-50 border rounded p-3 mt-2 text-sm text-gray-700">
              <b>Resumo:</b> {tipoEncontro === 'recorrente'
                ? `Seu grupo se reunirá ${frequencia ? FREQUENCIAS_LABEL[frequencia] : ''}${frequencia && diaSemana ? ', ' : ''}${diaSemana ? 'toda ' + DIAS_SEMANA.find(d => d.value === diaSemana)?.label : ''}${horario ? ', das ' + horario : ''}${horarioTermino ? ' às ' + horarioTermino : ''}${dataInicio ? ', a partir de ' + formatDateBR(dataInicio) : ''}.`
                : `Seu grupo terá um encontro único em ${dataUnica ? formatDateBR(dataUnica) : '[data não definida]'}${horario ? ', das ' + horario : ''}${horarioTermino ? ' às ' + horarioTermino : ''}.`}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 mt-2">
            <Input label="Nome do Anfitrião" value={anfitriaoNome} onChange={e => setAnfitriaoNome(e.target.value)} required ref={anfitriaoNomeRef} />
            <Input
              label="Celular do Anfitrião"
              value={anfitriaoCelular}
              onChange={e => setAnfitriaoCelular(maskCelular(e.target.value))}
              required
              maxLength={15}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="(99) 99999-9999"
            />
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4 mt-2">
            <Input
              label="CEP"
              value={cep}
              onChange={e => handleCepChange(e.target.value)}
              required
              maxLength={9}
              error={cepError}
              inputMode="numeric"
              pattern="[0-9]*"
              ref={cepRef}
            />
            {cepLoading && <div className="text-xs text-gray-500 mt-1">Buscando endereço...</div>}
            <Input label="Rua" value={rua} onChange={e => setRua(e.target.value)} required />
            <Input
              label="Número"
              value={numero}
              onChange={e => handleNumeroChange(e.target.value)}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              ref={numeroRef}
            />
            <Input label="Complemento" value={complemento} onChange={e => setComplemento(e.target.value)} />
            <Input label="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} required />
            <Input label="Município" value={municipio} onChange={e => setMunicipio(e.target.value)} required />
            <Input label="Estado" value={estado} onChange={e => setEstado(e.target.value)} required />
          </div>
        )}
        {step === 5 && (
          <div className="space-y-6 text-sm mt-2">
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">Dados do Grupo</h4>
              <div><b>Nome:</b> {nome}</div>
              <div><b>Descrição:</b> {description}</div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">Encontros</h4>
              <div><b>Tipo:</b> {tipoEncontro === 'recorrente' ? 'Recorrente' : 'Único'}</div>
              {tipoEncontro === 'recorrente' ? (
                <>
                  <div><b>Frequência:</b> {FREQUENCIAS_LABEL[frequencia] || '-'}</div>
                  <div><b>Dia da Semana:</b> {DIAS_SEMANA.find(d => d.value === diaSemana)?.label || '-'}</div>
                  <div><b>Horário:</b> {horario || '-'}{horarioTermino ? ` às ${horarioTermino}` : ''}</div>
                  <div><b>Data de início:</b> {dataInicio ? formatDateBR(dataInicio) : '-'}</div>
                </>
              ) : (
                <>
                  <div><b>Data do Encontro:</b> {dataUnica ? formatDateBR(dataUnica) : '-'}</div>
                  <div><b>Horário:</b> {horario || '-'}{horarioTermino ? ` às ${horarioTermino}` : ''}</div>
                </>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">Anfitrião</h4>
              <div><b>Nome:</b> {anfitriaoNome}</div>
              <div><b>Celular:</b> {anfitriaoCelular}</div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">Endereço</h4>
              <div><b>CEP:</b> {cep}</div>
              <div><b>Rua:</b> {rua}</div>
              <div><b>Número:</b> {numero}</div>
              <div><b>Complemento:</b> {complemento ? complemento : "-"}</div>
              <div><b>Bairro:</b> {bairro}</div>
              <div><b>Município:</b> {municipio}</div>
              <div><b>Estado:</b> {estado}</div>
            </div>
          </div>
        )}
        <div className="flex justify-between gap-2 mt-6">
          <button className="bg-gray-200 px-4 py-2 rounded" onClick={handleCancel} disabled={submitLoading}>Cancelar</button>
          {step > 1 && (
            <button className="bg-gray-200 px-4 py-2 rounded" onClick={prevStep} disabled={submitLoading}>Voltar</button>
          )}
          {step < 5 && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={nextStep} disabled={!isStepValid() || submitLoading}>Avançar</button>
          )}
          {step === 5 && (
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleCreate} disabled={!isStepValid() || submitLoading}>
              {submitLoading ? "Criando..." : "Criar"}
            </button>
          )}
        </div>
        {submitError && (
          <div className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-2 text-sm font-semibold">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <span>{submitError}</span>
          </div>
        )}
        {submitSuccess && <div className="text-green-600 text-sm mt-2">Pequeno grupo criado com sucesso!</div>}
      </DialogContent>
    </Dialog>
  );
}

// NOVO COMPONENTE DE EDIÇÃO POR ABAS
function SmallGroupEditTabsModal({ open, onClose, group, onUpdated }: { open: boolean; onClose: () => void; group: any; onUpdated: () => void }) {
  const [tabIdx, setTabIdx] = useState(0);
  // Dados do grupo
  const [nome, setNome] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  // Recorrência (apenas leitura)
  const tipoEncontro = group?.frequency ? 'recorrente' : 'unico';
  const frequencia = group?.frequency || "";
  const diaSemana = group?.dayOfWeek || "";
  const horario = group?.time || "";
  const dataUnica = tipoEncontro === 'unico' ? (group?.startDate ? group.startDate.slice(0,10) : "") : "";
  const dataInicio = tipoEncontro === 'recorrente' ? (group?.startDate ? group.startDate.slice(0,10) : "") : "";
  // Anfitrião
  const [anfitriaoNome, setAnfitriaoNome] = useState(group?.hostName || "");
  const [anfitriaoCelular, setAnfitriaoCelular] = useState(group?.hostPhone || "");
  // Endereço
  const [cep, setCep] = useState(group?.cep || "");
  const [rua, setRua] = useState(group?.rua || "");
  const [numero, setNumero] = useState(group?.numero || "");
  const [complemento, setComplemento] = useState(group?.complemento || "");
  const [bairro, setBairro] = useState(group?.bairro || "");
  const [municipio, setMunicipio] = useState(group?.municipio || "");
  const [estado, setEstado] = useState(group?.estado || "");
  // ViaCEP
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [lastCepSearched, setLastCepSearched] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const numeroRef = useRef<HTMLInputElement>(null);

  async function handleCepChange(value: string) {
    const cleanValue = value.replace(/\D/g, "");
    setCep(maskCep(value));
    setCepError("");
    if (cleanValue.length === 8 && cleanValue !== lastCepSearched) {
      setCepLoading(true);
      try {
        const data = await fetchAddressByCep(cleanValue);
        setRua(data.logradouro || "");
        setBairro(data.bairro || "");
        setMunicipio(data.localidade || "");
        setEstado(data.uf || "");
        setCepError("");
        setTimeout(() => { numeroRef.current?.focus(); }, 100);
      } catch (err: any) {
        setCepError(err.message || "Erro ao buscar CEP");
        setRua(""); setBairro(""); setMunicipio(""); setEstado("");
      }
      setCepLoading(false);
      setLastCepSearched(cleanValue);
    }
    if (cleanValue.length < 8) {
      setLastCepSearched("");
      setCepError("");
    }
  }
  function handleNumeroChange(value: string) { setNumero(value.replace(/\D/g, "")); }

  async function handleUpdate() {
    setSubmitLoading(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      const payload: any = {
        name: nome,
        description,
        hostName: anfitriaoNome,
        hostPhone: anfitriaoCelular,
        cep, rua, numero, complemento, bairro, municipio, estado
      };
      const res = await fetch(`/api/small-groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar grupo");
      }
      setSubmitSuccess(true);
      onClose();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setSubmitError(err.message || "Erro ao atualizar grupo");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogTitle>Editar Pequeno Grupo</DialogTitle>
        <Tab.Group selectedIndex={tabIdx} onChange={setTabIdx}>
          <Tab.List className="flex space-x-2 border-b-2 border-gray-200 mb-6 bg-gray-50 rounded-t-lg p-2 shadow-sm">
            <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Dados do Grupo</Tab>
            <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Anfitrião</Tab>
            <Tab className={({ selected }) => `px-6 py-2 text-base font-semibold rounded-t-lg transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Endereço</Tab>
          </Tab.List>
          <Tab.Panels>
            {/* Aba Dados do Grupo */}
            <Tab.Panel>
              <div className="space-y-4 mt-2">
                <Input label="Nome do Pequeno Grupo" value={nome} onChange={e => setNome(e.target.value)} required />
                <Input label="Descrição do Pequeno Grupo" value={description} onChange={e => setDescription(e.target.value)} placeholder="Adicione uma breve descrição..." />
                <fieldset className="mt-4 opacity-70 pointer-events-none select-none">
                  <legend className="font-semibold mb-2">Recorrência (apenas leitura)</legend>
                  <div className="flex flex-col gap-2">
                    <div><b>Tipo de Encontro:</b> {tipoEncontro === 'recorrente' ? 'Recorrente' : 'Único'}</div>
                    {tipoEncontro === 'recorrente' ? (
                      <>
                        <div><b>Frequência:</b> {FREQUENCIAS_LABEL[frequencia] || '-'}</div>
                        <div><b>Dia da Semana:</b> {DIAS_SEMANA.find(d => d.value === diaSemana)?.label || '-'}</div>
                        <div><b>Horário:</b> {horario || '-'}{group?.endTime ? ` às ${group.endTime}` : ''}</div>
                        <div><b>Data de início:</b> {dataInicio ? formatDateBR(dataInicio) : '-'}</div>
                      </>
                    ) : (
                      <>
                        <div><b>Data do Encontro:</b> {dataUnica ? formatDateBR(dataUnica) : '-'}</div>
                        <div><b>Horário:</b> {horario || '-'}{group?.endTime ? ` às ${group.endTime}` : ''}</div>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-yellow-700 mt-2">Para editar os dados desta etapa, exclua e crie um novo grupo ou aguarde futura atualização.</div>
                </fieldset>
              </div>
            </Tab.Panel>
            {/* Aba Anfitrião */}
            <Tab.Panel>
              <div className="space-y-4 mt-2">
                <Input label="Nome do Anfitrião" value={anfitriaoNome} onChange={e => setAnfitriaoNome(e.target.value)} required />
                <Input
                  label="Celular do Anfitrião"
                  value={anfitriaoCelular}
                  onChange={e => setAnfitriaoCelular(maskCelular(e.target.value))}
                  required
                  maxLength={15}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="(99) 99999-9999"
                />
              </div>
            </Tab.Panel>
            {/* Aba Endereço */}
            <Tab.Panel>
              <div className="space-y-4 mt-2">
                <Input
                  label="CEP"
                  value={cep}
                  onChange={e => handleCepChange(e.target.value)}
                  required
                  maxLength={9}
                  error={cepError}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {cepLoading && <div className="text-xs text-gray-500 mt-1">Buscando endereço...</div>}
                <Input label="Rua" value={rua} onChange={e => setRua(e.target.value)} required />
                <Input
                  label="Número"
                  value={numero}
                  onChange={e => handleNumeroChange(e.target.value)}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  ref={numeroRef}
                />
                <Input label="Complemento" value={complemento} onChange={e => setComplemento(e.target.value)} />
                <Input label="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} required />
                <Input label="Município" value={municipio} onChange={e => setMunicipio(e.target.value)} required />
                <Input label="Estado" value={estado} onChange={e => setEstado(e.target.value)} required />
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        <div className="flex justify-end gap-2 mt-6">
          <button className="bg-gray-200 px-4 py-2 rounded" onClick={onClose} disabled={submitLoading}>Cancelar</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleUpdate} disabled={submitLoading}>
            {submitLoading ? "Salvando..." : "Salvar"}
          </button>
        </div>
        {submitError && (
          <div className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-2 text-sm font-semibold">
            <span>{submitError}</span>
          </div>
        )}
        {submitSuccess && <div className="text-green-600 text-sm mt-2">Pequeno grupo atualizado com sucesso!</div>}
      </DialogContent>
    </Dialog>
  );
}

function getNextMeetingDate(group: any) {
  const meetings = Array.isArray(group.meetings) ? group.meetings : [];
  const now = new Date();
  const futureMeetings = meetings
    .filter((m: any) => m.date && new Date(m.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (futureMeetings.length === 0) return '';
  return format(new Date(futureMeetings[0].date), 'dd/MM/yyyy');
}

// Badge de status
function StatusBadge({ status }: { status?: string }) {
  const normalized = (status || '').toUpperCase();
  let color = 'bg-gray-400';
  let text = 'Indefinido';
  if (normalized === 'ATIVO') {
    color = 'bg-green-500';
    text = 'Ativo';
  } else if (normalized === 'INATIVO') {
    color = 'bg-gray-500';
    text = 'Inativo';
  } else if (normalized) {
    text = normalized.charAt(0) + normalized.slice(1).toLowerCase();
  }
  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full ${color}`}>{text}</span>
  );
}

// Componente de menu de ações rápidas
function ActionsMenu({ onView, onEdit, onToggleStatus, onDelete, status, canEdit }: {
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  status?: string;
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        firstItemRef.current?.focus();
      }, 10);
    }
  }, [open]);

  return (
    <div className="relative inline-block text-left">
      <button
        className="p-2 rounded hover:bg-gray-200"
        title="Ações"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg py-1">
          <button ref={firstItemRef} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setOpen(false); onView(); }}>Ver Detalhes</button>
          {canEdit && (
            <>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setOpen(false); onEdit(); }}>Editar Grupo</button>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setOpen(false); onToggleStatus(); }}>{status === 'ATIVO' ? 'Inativar' : 'Ativar'}</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100" onClick={() => { setOpen(false); onDelete(); }}>Excluir definitivamente</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Modal de confirmação de exclusão
function ConfirmDeleteModal({ open, onConfirm, onCancel, groupName }: { open: boolean; onConfirm: () => void; onCancel: () => void; groupName: string }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent>
        <div className="mb-2 text-lg font-bold mb-2 text-red-700">Excluir definitivamente</div>
        <p className="mb-4">Tem certeza que deseja <b>excluir definitivamente</b> o grupo <b>{groupName}</b>?<br/>Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.</p>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onCancel}>Cancelar</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={onConfirm}>Excluir</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmToggleStatusModal({ open, onConfirm, onCancel, groupName, newStatus }: { open: boolean; onConfirm: () => void; onCancel: () => void; groupName: string; newStatus: string }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent>
        <div className={`mb-2 text-lg font-bold ${newStatus === 'INATIVO' ? 'text-yellow-700' : 'text-green-700'}`}>{newStatus === 'INATIVO' ? 'Inativar' : 'Ativar'} grupo</div>
        <p className="mb-4">
          Tem certeza que deseja <b>{newStatus === 'INATIVO' ? 'inativar' : 'ativar'}</b> o grupo <b>{groupName}</b>?<br/>
          {newStatus === 'INATIVO' ? 'O grupo ficará indisponível para uso até ser reativado.' : 'O grupo ficará disponível para uso.'}
        </p>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onCancel}>Cancelar</button>
          <button className={`px-4 py-2 rounded ${newStatus === 'INATIVO' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`} onClick={onConfirm}>{newStatus === 'INATIVO' ? 'Inativar' : 'Ativar'}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SmallGroupsPage() {
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const [toggleStatusModalOpen, setToggleStatusModalOpen] = useState(false);
  const [groupToToggleStatus, setGroupToToggleStatus] = useState<any>(null);
  const [toggleStatusTarget, setToggleStatusTarget] = useState<'ATIVO' | 'INATIVO'>('INATIVO');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "", dayOfWeek: "", frequency: "", leader: "" });
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState("");

  async function fetchGroups(page = pagination.page, perPage = pagination.perPage) {
    setLoading(true);
    setError("");
    try {
      // Montar query string com filtros e paginação
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (filters.status) params.append('status', filters.status);
      if (filters.dayOfWeek) params.append('dayOfWeek', filters.dayOfWeek);
      if (filters.frequency) params.append('frequency', filters.frequency);
      params.append('page', String(page));
      params.append('perPage', String(perPage));
      const url = `/api/small-groups?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar grupos");
      const data = await res.json();
      setGroups(data.groups || []);
      setPagination(data.pagination || { page, perPage, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
    } catch (e: any) {
      setError(e.message || "Erro ao buscar grupos");
    } finally {
      setLoading(false);
    }
  }

  // Atualizar busca/filtros
  useEffect(() => {
    fetchGroups(1, pagination.perPage); // Sempre volta para página 1 ao mudar filtro/busca
    // eslint-disable-next-line
  }, [search, filters.status, filters.dayOfWeek, filters.frequency]);

  async function handleExport(type: 'csv' | 'pdf') {
    setExporting(type);
    setExportError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (filters.status) params.append('status', filters.status);
      if (filters.dayOfWeek) params.append('dayOfWeek', filters.dayOfWeek);
      if (filters.frequency) params.append('frequency', filters.frequency);
      const url = `/api/small-groups/export${type === 'pdf' ? '/pdf' : ''}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao exportar');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = type === 'csv' ? 'pequenos-grupos.csv' : 'pequenos-grupos.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      setExportError(e.message || 'Erro ao exportar');
    } finally {
      setExporting(null);
    }
  }

  async function handleToggleStatus(group: any) {
    setGroupToToggleStatus(group);
    setToggleStatusTarget(group.status === 'ATIVO' ? 'INATIVO' : 'ATIVO');
    setToggleStatusModalOpen(true);
  }

  async function confirmToggleStatus() {
    if (!groupToToggleStatus) return;
    setActionLoading(true);
    try {
      const newStatus = toggleStatusTarget;
      const res = await fetch(`/api/small-groups/${groupToToggleStatus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Erro ao alterar status');
      setToggleStatusModalOpen(false);
      setGroupToToggleStatus(null);
      setFeedback({ type: 'success', message: `Grupo ${newStatus === 'ATIVO' ? 'ativado' : 'inativado'} com sucesso!` });
      setTimeout(() => setFeedback(null), 3500);
      await fetchGroups();
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao alterar status do grupo.' });
      setTimeout(() => setFeedback(null), 3500);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteGroup(group: any) {
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  }

  async function confirmDeleteGroup() {
    if (!groupToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/small-groups/${groupToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao excluir grupo');
      setDeleteModalOpen(false);
      setGroupToDelete(null);
      await fetchGroups();
    } catch (e) {
      alert('Erro ao excluir grupo.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEditGroup(group: any) {
    setGroupToEdit(group);
    setEditModalOpen(true);
  }

  // Remover filtragem frontend, pois agora é feita no backend
  // const filteredGroups = groups.filter(group => {
  //   // Filtro por busca (nome do grupo)
  //   const matchesSearch = search.trim() === "" || (group.name || "").toLowerCase().includes(search.trim().toLowerCase());
  //   // Filtro por status
  //   const matchesStatus = !filters.status || group.status === filters.status;
  //   // Filtro por dia da semana
  //   const matchesDay = !filters.dayOfWeek || group.dayOfWeek === filters.dayOfWeek;
  //   // Filtro por frequência
  //   const matchesFreq = !filters.frequency || group.frequency === filters.frequency;
  //   return matchesSearch && matchesStatus && matchesDay && matchesFreq;
  // });

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Pequenos Grupos</h1>
      <div className="flex justify-end mb-6">
        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
        >Novo Pequeno Grupo</Button>
      </div>
      {exportError && <div className="text-red-600 text-sm mb-2">{exportError}</div>}
      <div className="flex justify-between items-center mb-4 gap-2">
        <div className="flex gap-2 w-full max-w-xl">
          <Input
            type="text"
            placeholder="Buscar por nome do grupo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full"
          />
          <Button
            variant="primary"
            onClick={() => setFilterModalOpen(true)}
          >
            Filtrar
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
          >{exporting === 'csv' ? 'Exportando...' : 'Exportar CSV'}</Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
          >{exporting === 'pdf' ? 'Exportando...' : 'Exportar PDF'}</Button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      ) : error ? (
        <div className="text-center py-8" style={{ color: 'var(--color-danger)' }}>{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded shadow divide-y" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <thead>
                <tr className="text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <th className="px-4 py-2 text-left">Grupo</th>
                  <th className="px-4 py-2 text-left">Dia da Semana</th>
                  <th className="px-4 py-2 text-left">Recorrência</th>
                  <th className="px-4 py-2 text-left">Próximo Encontro</th>
                  <th className="px-4 py-2 text-left">Horário</th>
                  <th className="px-4 py-2 text-center">Qtd. Líderes</th>
                  <th className="px-4 py-2 text-center">Qtd. Membros</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-3 text-center" style={{ color: 'var(--text-muted)' }}>Nenhum grupo encontrado.</td></tr>
                ) : (
                  groups.map((group) => {
                    const canEdit = session?.user?.role === 'ADMIN' || session?.user?.masterMinistryId === group.ministryId;
                    return (
                      <tr key={group.id} className="border-b hover:bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--color-neutral)' }}>
                        <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          <button
                            className="text-blue-700 hover:underline focus:outline-none"
                            onClick={() => router.push(`/dashboard/pequenos-grupos/${group.id}`)}
                            title={`Ver detalhes de ${group.name}`}
                            type="button"
                          >
                            {group.name}
                          </button>
                        </td>
                        <td className="px-4 py-2" style={{ color: 'var(--color-text-primary)' }}>{group.dayOfWeek || '-'}</td>
                        <td className="px-4 py-2" style={{ color: 'var(--color-text-primary)' }}>{group.frequency ? FREQUENCIAS_LABEL[group.frequency] || group.frequency : '-'}</td>
                        <td className="px-4 py-2" style={{ color: 'var(--color-text-primary)' }}>{getNextMeetingDate(group)}</td>
                        <td className="px-4 py-2" style={{ color: 'var(--color-text-primary)' }}>{group.time || '-'}</td>
                        <td className="px-4 py-2 text-center" style={{ color: 'var(--color-text-primary)' }}>{group.leaders?.length || 0}</td>
                        <td className="px-4 py-2 text-center" style={{ color: 'var(--color-text-primary)' }}>{group.members?.length || 0}</td>
                        <td className="px-4 py-2 text-center"><StatusBadge status={group.status} /></td>
                        <td className="px-4 py-2 text-center">
                          <ActionsMenu
                            status={group.status}
                            onView={() => router.push(`/dashboard/pequenos-grupos/${group.id}`)}
                            onEdit={() => handleEditGroup(group)}
                            onToggleStatus={() => handleToggleStatus(group)}
                            onDelete={() => handleDeleteGroup(group)}
                            canEdit={canEdit}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Controles de paginação */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Página {pagination.page} de {pagination.totalPages} | Total: {pagination.total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchGroups(1, pagination.perPage)}
                disabled={pagination.page === 1}
              >{'<<'}</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchGroups(pagination.page - 1, pagination.perPage)}
                disabled={pagination.page === 1}
              >{'<'}</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchGroups(pagination.page + 1, pagination.perPage)}
                disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
              >{'>'}</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchGroups(pagination.totalPages, pagination.perPage)}
                disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
              >{'>>'}</Button>
              <Select
                label=""
                className="ml-2"
                value={pagination.perPage.toString()}
                onChange={e => fetchGroups(1, Number(e.target.value))}
                options={[5, 10, 20, 50].map(n => ({ value: n.toString(), label: `${n} por página` }))}
              />
            </div>
          </div>
        </>
      )}
      <SmallGroupWizard open={modalOpen} onClose={() => setModalOpen(false)} onCreated={fetchGroups} />
      <Dialog open={filterModalOpen} onOpenChange={v => !v && setFilterModalOpen(false)}>
        <DialogContent>
          <DialogTitle>Filtros Avançados</DialogTitle>
          <div className="space-y-4 mt-2">
            <Select
              label="Status"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: "", label: "Todos" },
                { value: "ATIVO", label: "Ativo" },
                { value: "INATIVO", label: "Inativo" }
              ]}
            />
            <Select
              label="Dia da Semana"
              value={filters.dayOfWeek}
              onChange={e => setFilters(f => ({ ...f, dayOfWeek: e.target.value }))}
              options={[
                { value: "", label: "Todos" },
                ...DIAS_SEMANA.map(d => ({ value: d.value, label: d.label }))
              ]}
            />
            <Select
              label="Frequência"
              value={filters.frequency}
              onChange={e => setFilters(f => ({ ...f, frequency: e.target.value }))}
              options={[
                { value: "", label: "Todas" },
                ...FREQUENCIAS.map(f => ({ value: f.value, label: f.label }))
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setFilterModalOpen(false)}>Fechar</Button>
            <Button variant="secondary" onClick={() => setFilters({ status: "", dayOfWeek: "", frequency: "", leader: "" })}>Limpar</Button>
            <Button variant="primary" onClick={() => setFilterModalOpen(false)}>Aplicar</Button>
          </div>
        </DialogContent>
      </Dialog>
      {deleteModalOpen && (
        <ConfirmDeleteModal
          open={deleteModalOpen}
          groupName={groupToDelete?.name || ''}
          onCancel={() => { setDeleteModalOpen(false); setGroupToDelete(null); }}
          onConfirm={confirmDeleteGroup}
        />
      )}
      {toggleStatusModalOpen && (
        <ConfirmToggleStatusModal
          open={toggleStatusModalOpen}
          groupName={groupToToggleStatus?.name || ''}
          newStatus={toggleStatusTarget}
          onCancel={() => { setToggleStatusModalOpen(false); setGroupToToggleStatus(null); }}
          onConfirm={confirmToggleStatus}
        />
      )}
      {editModalOpen && groupToEdit && (
        <SmallGroupEditTabsModal
          open={editModalOpen}
          group={groupToEdit}
          onClose={() => { setEditModalOpen(false); setGroupToEdit(null); }}
          onUpdated={fetchGroups}
        />
      )}
      {feedback && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white text-sm font-semibold transition-all duration-300 ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}