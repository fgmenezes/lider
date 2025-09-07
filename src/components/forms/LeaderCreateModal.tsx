"use client";
import React, { useReducer, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import RadioGroup from "./RadioGroup";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useState } from "react";
import { fetchAddressByCep } from "../../lib/utils/viaCep";

// Tipos dos campos do formulário
interface PermissaoGranular {
  view: boolean;
  edit: boolean;
  deny?: boolean;
}

interface PermissoesGranulares {
  membros: PermissaoGranular;
  pequenosGrupos: PermissaoGranular;
  financeiro: PermissaoGranular;
  eventos: PermissaoGranular;
  lideres: PermissaoGranular;
  assistente: PermissaoGranular;
  relatorio: PermissaoGranular;
}

interface LeaderFormState {
  // Etapa 1: Dados Pessoais
  nomeCompleto: string;
  dataNascimento: string;
  idade: number;
  sexo: "MASCULINO" | "FEMININO" | "";
  estadoCivil: string;
  // Etapa 2: Dados de Contato
  celular: string;
  email: string;
  // Etapa 3: Endereço
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  estado: string;
  // Etapa 4: Permissões
  tipoLider: "LEADER" | "MASTER" | "CUSTOM" | "";
  // Etapa 5: Login
  emailLogin: string;
  senha: string;
  confirmarSenha: string;
  permissoesGranulares?: PermissoesGranulares;
}

const initialState: LeaderFormState = {
  nomeCompleto: "",
  dataNascimento: "",
  idade: 0,
  sexo: "",
  estadoCivil: "",
  celular: "",
  email: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  estado: "",
  tipoLider: "",
  emailLogin: "",
  senha: "",
  confirmarSenha: "",
  permissoesGranulares: {
    assistente: { view: false, edit: false, deny: false },
    eventos: { view: false, edit: false, deny: false },
    financeiro: { view: false, edit: false, deny: false },
    lideres: { view: false, edit: false, deny: false },
    membros: { view: false, edit: false, deny: false },
    pequenosGrupos: { view: false, edit: false, deny: false },
    relatorio: { view: false, edit: false, deny: false },
  },
};

type Action = 
  | { field: keyof LeaderFormState; value: string | number | PermissoesGranulares } 
  | { type: "RESET" };

function reducer(state: LeaderFormState, action: Action): LeaderFormState {
  if ('type' in action && action.type === "RESET") return initialState;
  if ('field' in action && 'value' in action) {
    return {
      ...state,
      [action.field]: action.value,
      ...(action.field === "dataNascimento"
        ? { idade: calcularIdade(action.value as string) }
        : {}),
    };
  }
  return state;
}

function calcularIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0;
  const [ano, mes, dia] = dataNascimento.split("-").map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

const ESTADOS_CIVIS = [
  { label: "Solteiro(a)", value: "solteiro" },
  { label: "Casado(a)", value: "casado" },
  { label: "Divorciado(a)", value: "divorciado" },
  { label: "Viúvo(a)", value: "viuvo" },
];

const PERMISSOES_DESCRICAO = {
  MASTER: "Este usuário terá acesso total ao ministério, podendo gerenciar líderes, membros e configurações.",
  LEADER: "Este usuário poderá gerenciar apenas membros e atividades do seu ministério.",
};

// Configurações das etapas
const ETAPAS_CONFIG = {
  1: {
    titulo: "Dados Pessoais",
    descricao: "Informe os dados pessoais básicos do líder que será cadastrado no sistema.",
    ref: "nomeCompleto"
  },
  2: {
    titulo: "Dados de Contato", 
    descricao: "Forneça as informações de contato para comunicação com o líder.",
    ref: "celular"
  },
  3: {
    titulo: "Endereço",
    descricao: "Digite o CEP para preenchimento automático do endereço ou informe manualmente.",
    ref: "cep"
  },
  4: {
    titulo: "Permissões de Acesso",
    descricao: "Defina o nível de acesso e permissões que o líder terá no sistema.",
    ref: "tipoLider"
  },
  5: {
    titulo: "Dados de Login",
    descricao: "Configure as credenciais de acesso do líder ao sistema.",
    ref: "emailLogin"
  },
  6: {
    titulo: "Resumo e Confirmação",
    descricao: "Revise todos os dados informados antes de finalizar o cadastro.",
    ref: null
  }
};

interface LeaderCreateModalProps {
  open: boolean;
  onClose: () => void;
  ministryId?: string;
}

export default function LeaderCreateModal({ open, onClose, ministryId }: LeaderCreateModalProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [step, setStep] = React.useState(1);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [lastCepSearched, setLastCepSearched] = useState("");
  const [permissaoError, setPermissaoError] = useState("");
  const [senhaError, setSenhaError] = useState("");

  // Refs para foco automático
  const nomeCompletoRef = useRef<HTMLInputElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);
  const emailLoginRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);

  // Foco automático ao mudar de etapa
  useEffect(() => {
    const config = ETAPAS_CONFIG[step as keyof typeof ETAPAS_CONFIG];
    if (config?.ref) {
      setTimeout(() => {
        switch (config.ref) {
          case 'nomeCompleto':
            nomeCompletoRef.current?.focus();
            break;
          case 'celular':
            celularRef.current?.focus();
            break;
          case 'cep':
            cepRef.current?.focus();
            break;
          case 'emailLogin':
            emailLoginRef.current?.focus();
            break;
        }
      }, 100);
    }
  }, [step]);

  function handleChange(field: keyof LeaderFormState, value: string | number | PermissoesGranulares) {
    dispatch({ field, value });
  }

  function handleChangeGranular(area: keyof PermissoesGranulares, type: 'view' | 'edit' | 'deny', value: boolean) {
    if (!state.permissoesGranulares) return;
    
    const currentPerm = state.permissoesGranulares[area];
    let newPerm: PermissaoGranular = { ...currentPerm, [type]: value };
    
    if (type === 'deny' && value) {
      newPerm = { view: false, edit: false, deny: true };
    } else if (type === 'deny' && !value) {
      newPerm = { ...newPerm, deny: false };
    }
    
    const updatedPermissoes = {
      ...state.permissoesGranulares,
      [area]: newPerm,
    };
    
    handleChange('permissoesGranulares', updatedPermissoes);
  }

  async function handleCepChange(cep: string) {
    handleChange("cep", cep);
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8 && cleanCep !== lastCepSearched) {
      setCepLoading(true);
      setCepError("");
      try {
        const data = await fetchAddressByCep(cleanCep);
        if (data && !data.erro) {
          handleChange("rua", data.logradouro || "");
          handleChange("bairro", data.bairro || "");
          handleChange("municipio", data.localidade || "");
          handleChange("estado", data.uf || "");
          setTimeout(() => { numeroRef.current?.focus(); }, 100);
        } else {
          setCepError("CEP não encontrado");
        }
      } catch {
        setCepError("Erro ao buscar CEP");
      }
      setCepLoading(false);
      setLastCepSearched(cleanCep);
    }
    if (cleanCep.length < 8) {
      setLastCepSearched("");
      setCepError("");
    }
  }

  function nextStep() {
    if (step === 4 && !state.tipoLider) {
      setPermissaoError("Selecione uma permissão para avançar.");
      return;
    }
    setPermissaoError("");
    if (step === 5) {
      if (!state.emailLogin || !state.senha || !state.confirmarSenha) {
        setSenhaError("Preencha todos os campos de login.");
        return;
      }
      if (state.senha !== state.confirmarSenha) {
        setSenhaError("As senhas não coincidem.");
        return;
      }
      setSenhaError("");
    }
    // Preencher emailLogin automaticamente ao entrar na etapa 5
    if (step === 4 && !state.emailLogin && state.email) {
      handleChange("emailLogin", state.email);
    }
    setStep((s) => s + 1);
  }
  
  function prevStep() {
    setStep((s) => (s > 1 ? s - 1 : s));
  }
  
  function handleClose() {
    dispatch({ type: "RESET" });
    setStep(1);
    onClose();
  }

  // Função para formatar data para padrão brasileiro
  function formatarDataBrasileira(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // Função para converter data brasileira para americana
  function converterDataParaAmericana(data: string): string {
    if (!data) return '';
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
  }

  async function handleSubmit() {
    try {
      // Preparar o payload com os campos corretos
      const payload = {
        // Dados pessoais
        nomeCompleto: state.nomeCompleto,
        dataNascimento: state.dataNascimento, // Já está no formato americano (YYYY-MM-DD)
        idade: state.idade, // Calculado automaticamente
        sexo: state.sexo,
        estadoCivil: state.estadoCivil,
        
        // Dados de contato
        celular: state.celular,
        email: state.email, // Email de contato
        
        // Endereço
        cep: state.cep,
        rua: state.rua,
        numero: state.numero,
        complemento: state.complemento,
        bairro: state.bairro,
        municipio: state.municipio,
        estado: state.estado,
        
        // Permissões
        tipoLider: state.tipoLider,
        permissoesGranulares: state.permissoesGranulares,
        
        // Login
        emailLogin: state.emailLogin, // Email para login
        senha: state.senha,
        confirmarSenha: state.confirmarSenha,
        
        // ministryId será ignorado pelo backend e substituído pelo do usuário logado
        ministryId: ministryId,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar líder');
      }

      const result = await response.json();
      
      // Fechar modal e resetar formulário
      handleClose();
      
      // TODO: Atualizar lista de líderes ou mostrar mensagem de sucesso
      console.log('Líder criado com sucesso:', result);
      
    } catch (error: any) {
      console.error('Erro ao criar líder:', error);
      // TODO: Mostrar mensagem de erro para o usuário
      alert(`Erro ao criar líder: ${error.message}`);
    }
  }

  const configAtual = ETAPAS_CONFIG[step as keyof typeof ETAPAS_CONFIG];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby="desc-lider-modal">
        <h2 id="dialog-title-lider" className="text-xl font-bold">Cadastro de Líder</h2>
        <p id="desc-lider-modal" className="text-gray-600 mb-4">
          {configAtual?.descricao}
        </p>
        <div className="p-6 w-full max-w-lg bg-white rounded-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Cadastro de Líder</h2>
            <span className="text-sm">Etapa {step} de 6</span>
          </div>
          
          {/* Título e descrição da etapa */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {configAtual?.titulo}
            </h3>
            <p className="text-sm text-gray-600">
              {configAtual?.descricao}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Nome completo"
                value={state.nomeCompleto}
                onChange={(e) => handleChange("nomeCompleto", e.target.value)}
                required
                ref={nomeCompletoRef}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                <input
                  type="date"
                  value={state.dataNascimento}
                  onChange={e => handleChange("dataNascimento", e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Idade</label>
                <input
                  type="text"
                  value={state.dataNascimento ? calcularIdade(state.dataNascimento) : ''}
                  readOnly
                  className="mt-1 block w-full border border-gray-200 bg-gray-100 rounded-md p-2"
                />
              </div>
              <RadioGroup
                label="Sexo"
                options={[
                  { label: "Masculino", value: "MASCULINO" },
                  { label: "Feminino", value: "FEMININO" },
                ]}
                value={state.sexo}
                onChange={(v) => handleChange("sexo", v)}
                required
              />
              <Select
                label="Estado civil"
                options={ESTADOS_CIVIS}
                value={state.estadoCivil}
                onChange={e => handleChange("estadoCivil", (e.target as HTMLSelectElement).value)}
                required
              />
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <Input
                label="Celular"
                value={state.celular}
                onChange={e => handleChange("celular", e.target.value.replace(/\D/g, ""))}
                required
                placeholder="(99) 99999-9999"
                inputMode="numeric"
                pattern="[0-9]*"
                ref={celularRef}
              />
              <Input
                label="E-mail"
                type="email"
                value={state.email}
                onChange={e => handleChange("email", e.target.value)}
                required
                placeholder="exemplo@email.com"
              />
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <Input
                label="CEP"
                value={state.cep}
                onChange={e => handleCepChange(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                placeholder="99999999"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                ref={cepRef}
              />
              {cepLoading && <div className="text-xs text-gray-500 mt-1">Buscando endereço...</div>}
              {cepError && <div className="text-xs text-red-500 mt-1">{cepError}</div>}
              <Input
                label="Rua/Avenida"
                value={state.rua}
                onChange={e => handleChange("rua", e.target.value)}
                required
              />
              <Input
                label="Número"
                value={state.numero}
                onChange={e => handleChange("numero", e.target.value)}
                required
                ref={numeroRef}
              />
              <Input
                label="Complemento"
                value={state.complemento}
                onChange={e => handleChange("complemento", e.target.value)}
              />
              <Input
                label="Bairro"
                value={state.bairro}
                onChange={e => handleChange("bairro", e.target.value)}
                required
              />
              <Input
                label="Município"
                value={state.municipio}
                onChange={e => handleChange("municipio", e.target.value)}
                required
              />
              <Input
                label="Estado"
                value={state.estado}
                onChange={e => handleChange("estado", e.target.value)}
                required
              />
            </div>
          )}
          
          {step === 4 && (
            <div className="space-y-2">
              <RadioGroup
                label="Permissão de Acesso"
                options={[
                  { label: "Líder Master", value: "MASTER" },
                  { label: "Líder", value: "LEADER" },
                  { label: "Permissão Personalizada", value: "CUSTOM" },
                ]}
                value={state.tipoLider}
                onChange={v => { handleChange("tipoLider", v); setPermissaoError(""); }}
                required
                error={permissaoError}
              />
              {state.tipoLider && state.tipoLider !== "CUSTOM" && (
                <div className="text-xs text-blue-700 mt-2">
                  {PERMISSOES_DESCRICAO[state.tipoLider as "MASTER" | "LEADER"]}
                </div>
              )}
              {state.tipoLider === "CUSTOM" && (
                <div className="mt-4">
                  <label className="block text-xs text-gray-700 font-semibold mb-1">Permissões Específicas:</label>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-200 rounded">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-1 text-left">Área</th>
                          <th className="px-2 py-1 text-center">Não permitido</th>
                          <th className="px-2 py-1 text-center">Visualização</th>
                          <th className="px-2 py-1 text-center">Edição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: "assistente", label: "Assistente" },
                          { key: "eventos", label: "Eventos" },
                          { key: "financeiro", label: "Financeiro" },
                          { key: "lideres", label: "Líderes" },
                          { key: "membros", label: "Membros" },
                          { key: "pequenosGrupos", label: "Pequenos Grupos" },
                          { key: "relatorio", label: "Relatório" },
                        ].map(area => (
                          <tr key={area.key}>
                            <td className="px-2 py-1">{area.label}</td>
                            <td className="px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={!!state.permissoesGranulares?.[area.key as keyof PermissoesGranulares]?.deny}
                                onChange={e => handleChangeGranular(area.key as keyof PermissoesGranulares, 'deny', e.target.checked)}
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={!!state.permissoesGranulares?.[area.key as keyof PermissoesGranulares]?.view}
                                disabled={!!state.permissoesGranulares?.[area.key as keyof PermissoesGranulares]?.deny}
                                onChange={e => handleChangeGranular(area.key as keyof PermissoesGranulares, 'view', e.target.checked)}
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={!!state.permissoesGranulares?.[area.key as keyof PermissoesGranulares]?.edit}
                                disabled={!!state.permissoesGranulares?.[area.key as keyof PermissoesGranulares]?.deny}
                                onChange={e => handleChangeGranular(area.key as keyof PermissoesGranulares, 'edit', e.target.checked)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {step === 5 && (
            <div className="space-y-4">
              <Input
                label="E-mail de Login"
                type="email"
                value={state.emailLogin}
                onChange={e => handleChange("emailLogin", e.target.value)}
                required
                placeholder="exemplo@email.com"
                ref={emailLoginRef}
              />
              <Input
                label="Senha"
                type="password"
                value={state.senha}
                onChange={e => handleChange("senha", e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
              <Input
                label="Confirme sua Senha"
                type="password"
                value={state.confirmarSenha}
                onChange={e => handleChange("confirmarSenha", e.target.value)}
                required
                minLength={6}
                placeholder="Repita a senha"
              />
              {senhaError && <div className="text-xs text-red-500 mt-1">{senhaError}</div>}
            </div>
          )}
          
          {step === 6 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Dados Pessoais</h4>
                  <div className="text-sm text-gray-700"><b>Nome:</b> {state.nomeCompleto}</div>
                  <div className="text-sm text-gray-700"><b>Data de Nascimento:</b> {formatarDataBrasileira(state.dataNascimento)}</div>
                  <div className="text-sm text-gray-700"><b>Idade:</b> {state.dataNascimento ? calcularIdade(state.dataNascimento) : ''}</div>
                  <div className="text-sm text-gray-700"><b>Sexo:</b> {state.sexo === 'MASCULINO' ? 'Masculino' : state.sexo === 'FEMININO' ? 'Feminino' : ''}</div>
                  <div className="text-sm text-gray-700"><b>Estado Civil:</b> {ESTADOS_CIVIS.find(e => e.value === state.estadoCivil)?.label || ''}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Contato</h4>
                  <div className="text-sm text-gray-700"><b>Celular:</b> {state.celular}</div>
                  <div className="text-sm text-gray-700"><b>E-mail:</b> {state.email}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Endereço</h4>
                  <div className="text-sm text-gray-700"><b>CEP:</b> {state.cep}</div>
                  <div className="text-sm text-gray-700"><b>Rua/Avenida:</b> {state.rua}</div>
                  <div className="text-sm text-gray-700"><b>Número:</b> {state.numero}</div>
                  <div className="text-sm text-gray-700"><b>Complemento:</b> {state.complemento}</div>
                  <div className="text-sm text-gray-700"><b>Bairro:</b> {state.bairro}</div>
                  <div className="text-sm text-gray-700"><b>Município:</b> {state.municipio}</div>
                  <div className="text-sm text-gray-700"><b>Estado:</b> {state.estado}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Permissões</h4>
                  <div className="text-sm text-gray-700"><b>Tipo:</b> {state.tipoLider === 'MASTER' ? 'Líder Master' : state.tipoLider === 'LEADER' ? 'Líder' : 'Personalizada'}</div>
                  {state.tipoLider === 'CUSTOM' && (
                    <div className="mt-2">
                      <table className="min-w-full text-xs border border-gray-200 rounded">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left">Área</th>
                            <th className="px-2 py-1 text-center">Não permitido</th>
                            <th className="px-2 py-1 text-center">Visualização</th>
                            <th className="px-2 py-1 text-center">Edição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: "assistente", label: "Assistente" },
                            { key: "eventos", label: "Eventos" },
                            { key: "financeiro", label: "Financeiro" },
                            { key: "lideres", label: "Líderes" },
                            { key: "membros", label: "Membros" },
                            { key: "pequenosGrupos", label: "Pequenos Grupos" },
                            { key: "relatorio", label: "Relatório" },
                          ].map(area => (
                            <tr key={area.key}>
                              <td className="px-2 py-1">{area.label}</td>
                              <td className="px-2 py-1 text-center">{state.permissoesGranulares?.[area.key as keyof PermissoesGranulares]?.deny ? 'Sim' : ''}</td>
                              <td className="px-2 py-1 text-center">{state.permissoesGranulares?.[area.key as keyof PermissoesGranulares]?.view ? 'Sim' : ''}</td>
                              <td className="px-2 py-1 text-center">{state.permissoesGranulares?.[area.key as keyof PermissoesGranulares]?.edit ? 'Sim' : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-1">Login</h4>
                  <div className="text-sm text-gray-700"><b>E-mail de Login:</b> {state.emailLogin}</div>
                </div>
              </div>
              
              {/* Botões específicos da etapa de resumo */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                  onClick={handleClose}
                >
                  Cancelar
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                    onClick={prevStep}
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
                    onClick={handleSubmit}
                  >
                    Criar
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Botões padrão para etapas 1-5 */}
          {step !== 6 && (
            <div className="flex justify-between mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                onClick={handleClose}
              >
                Cancelar
              </button>
              <div className="flex gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                    onClick={prevStep}
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={nextStep}
                >
                  Avançar
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}