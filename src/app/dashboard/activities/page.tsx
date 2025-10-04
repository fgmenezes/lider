'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Users, 
  Calendar, 
  DollarSign, 
  CalendarDays, 
  Settings,
  Search,
  Filter
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function ActivitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // Filtro por período: 7, 15, 30, 90 dias
  const [focusedActivityIndex, setFocusedActivityIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activitiesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MASTER') {
      router.push('/dashboard');
    } else {
      fetchActivities();
    }
  }, [session, status, router]);

  const fetchActivities = async (searchQuery = '', type = '', action = '', days = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (type && type !== 'all') params.append('type', type);
      if (action && action !== 'all') params.append('action', action);
      if (days) params.append('days', days);
      
      const url = `/api/dashboard/activities${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao carregar atividades');
      }
      
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar filtros para usar a API
  useEffect(() => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MASTER') {
      fetchActivities(searchTerm, filterType, filterAction, dateRange);
    }
  }, [searchTerm, filterType, filterAction, dateRange, session]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target === searchInputRef.current) return; // Não interferir na busca
      
      if (activities.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedActivityIndex(prev => 
            prev < activities.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedActivityIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Home':
          e.preventDefault();
          setFocusedActivityIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedActivityIndex(activities.length - 1);
          break;
        case 'Escape':
          setFocusedActivityIndex(-1);
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activities.length]);

  // Scroll automático para item focado
  useEffect(() => {
    if (focusedActivityIndex >= 0 && activitiesListRef.current) {
      const focusedElement = activitiesListRef.current.children[focusedActivityIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedActivityIndex]);

  const getActivityIcon = (tipo: string) => {
    switch (tipo?.toUpperCase()) {
      case 'MEMBRO':
        return <User className="h-4 w-4" />;
      case 'GRUPO':
        return <Users className="h-4 w-4" />;
      case 'REUNIAO':
        return <Calendar className="h-4 w-4" />;
      case 'FINANCEIRO':
        return <DollarSign className="h-4 w-4" />;
      case 'EVENTO':
        return <CalendarDays className="h-4 w-4" />;
      case 'SISTEMA':
        return <Settings className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getActionColor = (acao: string) => {
    switch (acao?.toUpperCase()) {
      case 'CRIACAO':
        return 'bg-green-100 text-green-800';
      case 'ATUALIZACAO':
        return 'bg-blue-100 text-blue-800';
      case 'EXCLUSAO':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Remover filtro local já que agora é feito na API
  const displayActivities = activities;

  return (
    <div className="space-y-6" role="main" aria-label="Página de histórico de atividades">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight" id="page-title">
          Histórico de Atividades
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto" role="search" aria-labelledby="search-controls">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" aria-hidden="true" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar por usuário, descrição, tipo, ação ou ministério..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchActivities(searchTerm);
                }
              }}
              aria-label="Campo de busca de atividades"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              Digite para buscar atividades por usuário, descrição, tipo, ação ou ministério. Pressione Enter para buscar ou / para focar neste campo.
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={() => fetchActivities(searchTerm, filterType, filterAction, dateRange)}
              aria-label="Executar busca"
            >
              Buscar
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros de atividades">
            <Select value={filterType} onValueChange={setFilterType} aria-label="Filtrar por tipo">
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="MEMBRO">Membro</SelectItem>
                <SelectItem value="GRUPO">Grupo</SelectItem>
                <SelectItem value="REUNIAO">Reunião</SelectItem>
                <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                <SelectItem value="EVENTO">Evento</SelectItem>
                <SelectItem value="SISTEMA">Sistema</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterAction} onValueChange={setFilterAction} aria-label="Filtrar por ação">
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="CRIACAO">Criação</SelectItem>
                <SelectItem value="ATUALIZACAO">Atualização</SelectItem>
                <SelectItem value="EXCLUSAO">Exclusão</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange} aria-label="Filtrar por período">
              <SelectTrigger className="w-[130px]">
                <CalendarDays className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoje</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">6 meses</SelectItem>
                <SelectItem value="365">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle id="activities-title">Histórico de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" aria-hidden="true"></div>
              <span className="sr-only">Carregando atividades...</span>
            </div>
          ) : displayActivities.length > 0 ? (
             <div 
               className="space-y-4" 
               ref={activitiesListRef}
               role="list" 
               aria-labelledby="activities-title"
               aria-live="polite"
               aria-describedby="keyboard-help"
             >
               <div id="keyboard-help" className="sr-only">
                 Use as setas para cima e para baixo para navegar pelas atividades. Pressione Home para ir ao início, End para ir ao final, ou Escape para sair da navegação.
               </div>
               {displayActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors ${
                    focusedActivityIndex === index 
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500 ring-opacity-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  role="listitem"
                  tabIndex={focusedActivityIndex === index ? 0 : -1}
                  aria-label={`Atividade ${index + 1} de ${displayActivities.length}: ${activity.descricao || 'Atividade sem descrição'} por ${activity.usuarioNome || 'Sistema'}`}
                  aria-describedby={`activity-details-${index}`}
                >
                  <div 
                    className={`rounded-full p-2 ${activity.tipo === 'MEMBRO' ? 'bg-blue-100' : activity.tipo === 'GRUPO' ? 'bg-green-100' : activity.tipo === 'EVENTO' ? 'bg-purple-100' : 'bg-gray-100'}`}
                    aria-hidden="true"
                  >
                    {getActivityIcon(activity.tipo)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium">{activity.descricao || 'Atividade sem descrição'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-700 font-medium">
                            {activity.usuarioNome || 'Sistema'}
                          </p>
                          <span className="text-gray-400 text-xs" aria-hidden="true">•</span>
                          <p className="text-xs text-gray-500">
                            {activity.createdAt ? new Date(activity.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Data desconhecida'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2" role="group" aria-label="Categorias da atividade">
                        <Badge variant="secondary" className="capitalize" aria-label={`Tipo: ${activity.tipo?.toLowerCase() || 'desconhecido'}`}>
                          {activity.tipo?.toLowerCase() || 'desconhecido'}
                        </Badge>
                        <Badge className={`${getActionColor(activity.acao)} border-0`} aria-label={`Ação: ${activity.acao?.toLowerCase() || 'desconhecido'}`}>
                          {activity.acao?.toLowerCase() || 'desconhecido'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div id={`activity-details-${index}`} className="mt-2 text-sm text-gray-500 sr-only">
                      Detalhes da atividade: Tipo {activity.tipo || 'desconhecido'}, Ação {activity.acao || 'desconhecido'}, 
                      realizada por {activity.usuarioNome || 'Sistema'} em {
                        activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'data desconhecida'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50"
              role="status"
              aria-live="polite"
            >
              <div className="p-3 mb-4 rounded-full bg-gray-100" aria-hidden="true">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhuma atividade registrada</h3>
              <p className="mt-2 text-sm text-gray-500">
                O sistema ainda não possui atividades registradas. As atividades aparecerão aqui quando forem realizadas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}