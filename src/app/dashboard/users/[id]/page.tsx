"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) throw new Error("Usuário não encontrado");
        const data = await res.json();
        setUser(data.user);
      } catch (e: any) {
        setError(e.message || "Erro ao buscar usuário");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchUser();
  }, [id]);

  if (loading) return <div className="container mx-auto py-8 px-4 max-w-2xl">Carregando...</div>;
  if (error || !user) return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Usuário não encontrado</h1>
      <p className="text-gray-600">O usuário solicitado não existe ou ocorreu um erro ao buscar os dados.</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => router.back()}>Voltar</button>
    </div>
  );

  function calcularIdade(dataNascimento: string | Date | undefined): number | null {
    if (!dataNascimento) return null;
    const data = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
    if (isNaN(data.getTime())) return null;
    const diff = Date.now() - data.getTime();
    const idade = new Date(diff).getUTCFullYear() - 1970;
    return idade;
  }

  function formatarSexo(sexo: string | undefined): string {
    if (sexo === 'M') return 'Masculino';
    if (sexo === 'F') return 'Feminino';
    return '-';
  }

  function formatarEstadoCivil(estadoCivil: string | undefined): string {
    switch (estadoCivil) {
      case 'solteiro': return 'Solteiro(a)';
      case 'casado': return 'Casado(a)';
      case 'divorciado': return 'Divorciado(a)';
      case 'viuvo': return 'Viúvo(a)';
      default: return '-';
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Detalhes do Usuário</h1>
      <div className="bg-white rounded shadow p-6">
        {/* Dados Pessoais */}
        <h2 className="text-lg font-semibold mb-2 text-blue-700">Dados Pessoais</h2>
        <div className="mb-1"><span className="font-semibold">Nome:</span> {user.name}</div>
        <div className="mb-1"><span className="font-semibold">Data de Nascimento:</span> {user.dataNascimento && user.dataNascimento !== '' ? new Date(user.dataNascimento).toLocaleDateString() : "-"}</div>
        <div className="mb-1"><span className="font-semibold">Idade:</span> {calcularIdade(user.dataNascimento) ?? '-'}</div>
        <div className="mb-1"><span className="font-semibold">Sexo:</span> {formatarSexo(user.sexo)}</div>
        <div className="mb-1"><span className="font-semibold">Estado Civil:</span> {formatarEstadoCivil(user.estadoCivil)}</div>
        <div className="mb-6"></div>
        {/* Contato */}
        <h2 className="text-lg font-semibold mb-2 text-blue-700">Contato</h2>
        <div className="mb-1"><span className="font-semibold">Email:</span> {user.email}</div>
        <div className="mb-1"><span className="font-semibold">Telefone:</span> {user.celular || "-"}</div>
        <div className="mb-6"></div>
        {/* Endereço */}
        <h2 className="text-lg font-semibold mb-2 text-blue-700">Endereço</h2>
        <div className="mb-1"><span className="font-semibold">Rua:</span> {user.rua || "-"}</div>
        <div className="mb-1"><span className="font-semibold">Número:</span> {user.numero || "-"}</div>
        <div className="mb-1"><span className="font-semibold">Complemento:</span> {user.complemento || "-"}</div>
        <div className="mb-1"><span className="font-semibold">Bairro:</span> {user.bairro || "-"}</div>
        <div className="mb-1"><span className="font-semibold">Município:</span> {user.municipio || "-"}</div>
        <div className="mb-1"><span className="font-semibold">Estado:</span> {user.estado || "-"}</div>
        <div className="mb-1"><span className="font-semibold">CEP:</span> {user.cep || "-"}</div>
        <div className="mb-6"></div>
        {/* Vínculo */}
        <h2 className="text-lg font-semibold mb-2 text-blue-700">Vínculo</h2>
        <div className="mb-1"><span className="font-semibold">Ministério:</span> {user.ministry?.name || "-"}</div>
        <div className="mb-1"><span className="font-semibold">Papel:</span> {user.role || "-"}</div>
        <div className="mb-1"><span className="font-semibold">Status:</span> {user.isActive ? "Ativo" : "Inativo"}</div>
        <div className="mb-1"><span className="font-semibold">Data de Ingresso:</span> {user.dataIngresso ? new Date(user.dataIngresso).toLocaleDateString() : "-"}</div>
      </div>
      {/* Seção Alterar Senha */}
      <div className="mt-10 bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-700">Alterar Senha</h2>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Nova Senha</label>
          <input
            type={showPassword ? "text" : "password"}
            className="border rounded px-3 py-2 w-full"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Confirmar Nova Senha</label>
          <input
            type={showPassword ? "text" : "password"}
            className="border rounded px-3 py-2 w-full"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input type="checkbox" id="showPassword" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
          <label htmlFor="showPassword" className="text-sm">Mostrar senha</label>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={passwordLoading || !password || !confirmPassword || password.length < 6 || password !== confirmPassword}
          onClick={async () => {
            setPasswordLoading(true);
            setPasswordFeedback(null);
            if (password !== confirmPassword) {
              setPasswordFeedback({ type: 'error', message: 'As senhas não coincidem.' });
              setPasswordLoading(false);
              return;
            }
            if (password.length < 6) {
              setPasswordFeedback({ type: 'error', message: 'A senha deve ter pelo menos 6 caracteres.' });
              setPasswordLoading(false);
              return;
            }
            try {
              const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
              });
              if (!res.ok) throw new Error('Erro ao alterar senha');
              setPasswordFeedback({ type: 'success', message: 'Senha alterada com sucesso!' });
              setPassword("");
              setConfirmPassword("");
            } catch (e) {
              setPasswordFeedback({ type: 'error', message: 'Erro ao alterar senha' });
            } finally {
              setPasswordLoading(false);
            }
          }}
        >
          {passwordLoading ? 'Salvando...' : 'Alterar Senha'}
        </button>
        {passwordFeedback && (
          <div className={`mt-4 px-4 py-2 rounded text-white font-semibold ${passwordFeedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{passwordFeedback.message}</div>
        )}
        {/* Botão Voltar, uma linha abaixo */}
        <div className="mt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => router.push('/dashboard/users')}>Voltar</button>
        </div>
      </div>
    </div>
  );
} 