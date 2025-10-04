'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Users, DollarSign, Calendar, Users2, MessageSquare, Gift, TrendingUp, TrendingDown, PiggyBank, UserPlus, UserCheck, Bell, AlertTriangle, ArrowUp, ArrowDown, Activity, Eye, MoreHorizontal, CalendarDays, Settings, User } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [metrics, setMetrics] = useState<any>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [financialTrend, setFinancialTrend] = useState<any>({});
  const [birthdayMembers, setBirthdayMembers] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  
  // Estado para atividades recentes
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchUserPermissions = async () => {
      try {
        const response = await fetch('/api/user/permissions');
        if (response.ok) {
          const data = await response.json();
          // A API retorna diretamente o array de permissões, não dentro de um objeto 'permissions'
          setUserPermissions(Array.isArray(data) ? data : data.permissions || []);
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/user/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/dashboard/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        const response = await fetch('/api/dashboard/activities?limit=10');
        if (response.ok) {
          const data = await response.json();
          setRecentActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Erro ao buscar atividades recentes:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    const fetchFinancialTrend = async () => {
      try {
        const response = await fetch('/api/dashboard/financial-trend');
        if (response.ok) {
          const data = await response.json();
          setFinancialTrend(data);
        }
      } catch (error) {
        console.error('Erro ao buscar tendência financeira:', error);
      }
    };

    const fetchBirthdayMembers = async () => {
      try {
        const response = await fetch('/api/dashboard/birthday-members');
        if (response.ok) {
          const data = await response.json();
          setBirthdayMembers(data.members || []);
        }
      } catch (error) {
        console.error('Erro ao buscar aniversariantes:', error);
      }
    };
    
    // Função para buscar atividades
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/dashboard/activities');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
      }
    };

    fetchUserPermissions();
    fetchMetrics();
    fetchNotifications();
    fetchRecentActivities();
    fetchFinancialTrend();
    fetchBirthdayMembers();
    fetchActivities();
  }, [session, status, router]);

  if (status === 'loading' || isLoadingPermissions || isLoadingMetrics) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!session) {
    return null;
  }

  const user = session.user as any;
  const isAdminOrMaster = user.role === 'ADMIN' || user.role === 'MASTER';

  const quickAccessCards = [
    {
      title: 'Membros',
      description: 'Gerencie os membros do ministério',
      icon: <Users className="h-6 w-6" />,
      href: '/dashboard/members',
      featureName: 'Membros'
    },
    {
      title: 'Pequenos Grupos',
      description: 'Gerencie os pequenos grupos',
      icon: <Users2 className="h-6 w-6" />,
      href: '/dashboard/pequenos-grupos',
      featureName: 'Pequenos Grupos'
    },
    {
      title: 'Transações',
      description: 'Controle financeiro do ministério',
      icon: <DollarSign className="h-6 w-6" />,
      href: '/dashboard/finance',
      featureName: 'Financeiro'
    },
    {
      title: 'Eventos',
      description: 'Organize eventos e atividades',
      icon: <Calendar className="h-6 w-6" />,
      href: '/dashboard/events',
      featureName: 'Eventos'
    },
    {
      title: 'Assistente',
      description: 'Obtenha ajuda do assistente virtual',
      icon: <MessageSquare className="h-6 w-6" />,
      href: '/dashboard/assistant',
      featureName: 'Assistente Virtual'
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Gerencie usuários do sistema',
      icon: <Users className="h-6 w-6" />,
      href: '/dashboard/users',
      featureName: 'Gerenciar Usuários'
    },
    {
      title: 'Gerenciar Ministérios',
      description: 'Gerencie ministérios',
      icon: <Users2 className="h-6 w-6" />,
      href: '/dashboard/ministries',
      featureName: 'Gerenciar Ministérios'
    }
  ];

  const availableCards = quickAccessCards.filter(card => 
    userPermissions.some(permission => 
      permission.name === card.featureName && permission.level !== 'NONE'
    )
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex gap-6">
        {/* Conteúdo Principal */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Bem-vindo, {session.user?.name || 'usuário'}!</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Aqui está o resumo do seu ministério</p>
          </div>

          {/* Seção Financeira Melhorada */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Resumo Financeiro</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Saldo Total do Ministério</CardTitle>
                  <PiggyBank className="h-6 w-6 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${(metrics.saldoAcumulado || 0) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    R$ {(metrics.saldoAcumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Saldo acumulado total</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold ${(metrics.saldoMes || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    R$ {(metrics.saldoMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Entradas do Mês</CardTitle>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    {financialTrend.incomeGrowth > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-600" />
                    ) : financialTrend.incomeGrowth < 0 ? (
                      <ArrowDown className="h-3 w-3 text-red-600" />
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-700">
                    R$ {(metrics.totalReceitasMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financialTrend.incomeGrowth !== undefined && (
                      <span className={financialTrend.incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {financialTrend.incomeGrowth >= 0 ? '+' : ''}{financialTrend.incomeGrowth.toFixed(1)}% vs mês anterior
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Saídas do Mês</CardTitle>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    {financialTrend.expenseGrowth > 0 ? (
                      <ArrowUp className="h-3 w-3 text-red-600" />
                    ) : financialTrend.expenseGrowth < 0 ? (
                      <ArrowDown className="h-3 w-3 text-green-600" />
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-700">
                    R$ {(metrics.totalDespesasMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financialTrend.expenseGrowth !== undefined && (
                      <span className={financialTrend.expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}>
                        {financialTrend.expenseGrowth >= 0 ? '+' : ''}{financialTrend.expenseGrowth.toFixed(1)}% vs mês anterior
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Métricas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Indicadores de Pessoas e Grupos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalMembers}</div>
                <p className="text-xs text-muted-foreground">Total de membros</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Líderes</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalLeaders}</div>
                <p className="text-xs text-muted-foreground">Total de líderes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Líderes Master</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalMasters}</div>
                <p className="text-xs text-muted-foreground">Total de líderes master</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pequenos Grupos</CardTitle>
                <Users2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalSmallGroups}</div>
                <p className="text-xs text-muted-foreground">Grupos ativos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Próx. Encontros (7 dias)</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.nextMeetings7Days}</div>
                <p className="text-xs text-muted-foreground">Encontros agendados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Aniversariantes do mês</CardTitle>
                <div className="flex items-center gap-1">
                  🎂
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{birthdayMembers.length}</div>
                <p className="text-xs text-muted-foreground">Membros aniversariantes</p>
                {birthdayMembers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium">Próximos:</p>
                    {birthdayMembers
                      .sort((a, b) => {
                        const dayA = new Date(a.dataNascimento).getDate();
                        const dayB = new Date(b.dataNascimento).getDate();
                        const today = new Date().getDate();
                        
                        // Calcular dias até o aniversário
                        const daysToA = dayA >= today ? dayA - today : (31 - today) + dayA;
                        const daysToB = dayB >= today ? dayB - today : (31 - today) + dayB;
                        
                        return daysToA - daysToB;
                      })
                      .slice(0, 3)
                      .map((member, index) => {
                        const birthDate = new Date(member.dataNascimento);
                        const age = new Date().getFullYear() - birthDate.getFullYear();
                        const hasPassedThisYear = new Date() >= new Date(new Date().getFullYear(), birthDate.getMonth(), birthDate.getDate());
                        const currentAge = hasPassedThisYear ? age : age - 1;
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-xs text-muted-foreground py-1">
                            <span>{member.name}</span>
                            <span className="flex items-center gap-1">
                              {birthDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              <span className="text-blue-600 font-medium">({currentAge + 1} anos)</span>
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Frequência Média</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgAttendance !== null ? `${metrics.avgAttendance}%` : '-'}</div>
                <p className="text-xs text-muted-foreground">Presença nos PGs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Visitantes do mês</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalVisitorsThisMonth}</div>
                <p className="text-xs text-muted-foreground">Visitantes registrados</p>
              </CardContent>
            </Card>
          </div>

          {/* Seção Atividades Recentes (apenas para ADMIN e MASTER) */}
          {isAdminOrMaster && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Atividades Recentes</h2>
                <Link href="/dashboard/activities">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Mostrar mais
                  </Button>
                </Link>
              </div>
              <Card>
                <CardContent className="pt-6">
                  {isLoadingActivities ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Carregando atividades...</p>
                  ) : recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.user} • {new Date(activity.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Nenhuma atividade recente para exibir.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Acesso Rápido */}
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCards.map((card) => (
              <Link href={card.href} key={card.title}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">{card.title}</CardTitle>
                    {card.icon}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Coluna Lateral de Notificações */}
        <div className="w-80 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Notificações</CardTitle>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingNotifications ? (
                <p className="text-sm text-muted-foreground">Carregando notificações...</p>
              ) : notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-90 ${
                      notification.priority === 'high' 
                        ? 'border-red-500 bg-red-50' 
                        : notification.priority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                    onClick={() => {
                      setSelectedNotification(notification);
                      setIsNotificationModalOpen(true);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {notification.priority === 'high' && (
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={notification.type === 'member' ? 'primary' : notification.type === 'meeting' ? 'secondary' : notification.type === 'smallgroup' ? 'secondary' : 'neutral'} className="text-xs">
                            {notification.type === 'member' ? 'Membro' : notification.type === 'meeting' ? 'Reunião' : notification.type === 'smallgroup' ? 'Pequeno Grupo' : 'Grupo'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma notificação no momento.</p>
              )}
            </CardContent>
          </Card>

          {/* Mini Gráfico Financeiro (Placeholder) */}
          {financialTrend.monthlyData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Evolução Financeira</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {financialTrend.monthlyData.slice(-6).map((month: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{month.month}</span>
                      <span className={month.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {month.balance >= 0 ? '+' : ''}{month.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          

        </div>
      </div>

      {/* Modal de Notificação */}
      <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex flex-col space-y-2">
            <DialogTitle className="text-xl font-bold">
              {selectedNotification?.title || 'Detalhes da Notificação'}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {new Date(selectedNotification?.createdAt).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tipo:</span>
              <Badge variant={
                selectedNotification?.type === 'member' ? 'primary' : 
                selectedNotification?.type === 'meeting' ? 'secondary' :
                selectedNotification?.type === 'smallgroup' ? 'secondary' : 'neutral'
              }>
                {selectedNotification?.type === 'member' ? 'Membro' : 
                 selectedNotification?.type === 'meeting' ? 'Reunião' : 
                 selectedNotification?.type === 'smallgroup' ? 'Pequeno Grupo' : 'Grupo'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Prioridade:</span>
              <Badge variant={
                selectedNotification?.priority === 'high' ? 'danger' :
                selectedNotification?.priority === 'medium' ? 'warning' : 'neutral'
              }>
                {selectedNotification?.priority === 'high' ? 'Alta' : 
                 selectedNotification?.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
            </div>
            
            {selectedNotification?.description && (
              <div className="pt-2">
                <span className="text-sm font-medium">Descrição:</span>
                <p className="text-sm mt-1">{selectedNotification?.description}</p>
              </div>
            )}
            
            {selectedNotification?.content && (
              <div className="pt-2">
                <span className="text-sm font-medium">Conteúdo:</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedNotification?.content}</p>
              </div>
            )}
            
            {selectedNotification?.author && (
              <div className="pt-2">
                <span className="text-sm font-medium">Autor:</span>
                <p className="text-sm mt-1">{selectedNotification?.author}</p>
              </div>
            )}
            
            {selectedNotification?.createdBy && (
              <div className="pt-2">
                <span className="text-sm font-medium">Criado por:</span>
                <p className="text-sm mt-1">{selectedNotification?.createdBy}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNotificationModalOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}