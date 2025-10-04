"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Save, X, Eye, EyeOff, User, Phone, MapPin, Building, Shield, Key, Calendar, Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Usuário não encontrado</h1>
        <p className="text-gray-600 mb-4">O usuário solicitado não existe ou ocorreu um erro ao buscar os dados.</p>
        <Button onClick={() => router.push('/dashboard/users')}>
          Voltar para Usuários
        </Button>
      </div>
    );
  }

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

  function formatarRole(role: string | undefined): string {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'MASTER': return 'Líder Master';
      case 'LEADER': return 'Líder';
      default: return '-';
    }
  }

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    setUser(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
  };

  const handlePasswordChange = async () => {
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
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com navegação e ações */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/users')}
            className="hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Perfil do Usuário</h1>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/dashboard/users/${id}/edit`)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 transition-all"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar informações do usuário</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Cartão de perfil com avatar e informações principais */}
      <Card className="mb-6 overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32"></div>
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative -mt-16 mb-4 md:mb-0">
              <Avatar
                userId={user.id}
                userName={user.name}
                avatarUrl={user.avatarUrl}
                size="xl"
                editable={true}
                onAvatarUpdate={handleAvatarUpdate}
              />
            </div>
            <div className="text-center md:text-left pt-4 md:pt-0">
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{user.name}</h2>
              <p className="text-md mb-2" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Ativo' : 'Inativo'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {formatarRole(user.role)}
                </span>
                {user.ministry?.name && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {user.ministry.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para organizar as informações */}
      <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Dados Pessoais</span>
            <span className="inline md:hidden">Pessoal</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden md:inline">Contato</span>
            <span className="inline md:hidden">Contato</span>
          </TabsTrigger>
          <TabsTrigger value="ministry" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden md:inline">Ministério</span>
            <span className="inline md:hidden">Ministério</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Segurança</span>
            <span className="inline md:hidden">Segurança</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Dados Pessoais */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Informações pessoais do usuário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">Nome Completo</Label>
                    <p className="text-md font-medium">{user.name}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">Idade</Label>
                    <p className="text-md font-medium">{calcularIdade(user.dataNascimento) ?? '-'} anos</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Data de Nascimento
                      </div>
                    </Label>
                    <p className="text-md font-medium">
                      {user.dataNascimento && user.dataNascimento !== '' 
                        ? new Date(user.dataNascimento).toLocaleDateString('pt-BR') 
                        : "-"
                      }
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-gray-500 block mb-1">Sexo</Label>
                      <p className="text-md font-medium">{formatarSexo(user.sexo)}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-gray-500 block mb-1">Estado Civil</Label>
                      <p className="text-md font-medium">{formatarEstadoCivil(user.estadoCivil)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Contato */}
        <TabsContent value="contact" className="space-y-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Informações de Contato
              </CardTitle>
              <CardDescription>Contato e endereço do usuário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Email
                      </div>
                    </Label>
                    <p className="text-md font-medium">{user.email}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        Telefone
                      </div>
                    </Label>
                    <p className="text-md font-medium">{user.celular || "-"}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        Endereço Completo
                      </div>
                    </Label>
                    <p className="text-md font-medium">
                      {user.rua ? `${user.rua}${user.numero ? `, ${user.numero}` : ''}` : '-'}
                      {user.complemento && ` - ${user.complemento}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.bairro && `${user.bairro}, `}
                      {user.municipio && `${user.municipio}`}
                      {user.estado && ` - ${user.estado}`}
                      {user.cep && ` (CEP: ${user.cep})`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Ministério */}
        <TabsContent value="ministry" className="space-y-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Vínculo Ministerial
              </CardTitle>
              <CardDescription>Informações sobre o vínculo com o ministério</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">Ministério</Label>
                    <p className="text-md font-medium">{user.ministry?.name || "-"}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">Função</Label>
                    <p className="text-md font-medium">{formatarRole(user.role)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Data de Ingresso
                      </div>
                    </Label>
                    <p className="text-md font-medium">
                      {user.dataIngresso 
                        ? new Date(user.dataIngresso).toLocaleDateString('pt-BR') 
                        : "-"
                      }
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-500 block mb-1">Status</Label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Segurança */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Alterar Senha
              </CardTitle>
              <CardDescription>Defina uma nova senha para este usuário</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Nova Senha</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Nova Senha</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                <Button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading || !password || !confirmPassword || password.length < 6 || password !== confirmPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {passwordLoading ? 'Salvando...' : 'Alterar Senha'}
                </Button>
              </div>
              
              {passwordFeedback && (
                <div className={`p-4 rounded-md text-sm font-medium ${
                  passwordFeedback.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {passwordFeedback.type === 'success' ? (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {passwordFeedback.message}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {passwordFeedback.message}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}