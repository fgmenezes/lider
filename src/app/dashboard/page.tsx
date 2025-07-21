'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Calendar, Users2, MessageSquare, Gift, TrendingUp, TrendingDown, PiggyBank, UserPlus, UserCheck } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    totalSmallGroups: 0,
    totalEventsThisMonth: 0,
    totalLeaders: 0,
    totalMasters: 0,
    nextMeetings7Days: 0,
    birthdayMembersThisMonth: 0,
    avgAttendance: null,
    totalVisitorsThisMonth: 0,
    totalReceitasMes: 0,
    totalDespesasMes: 0,
    saldoMes: 0,
    saldoAcumulado: 0,
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const fetchPermissions = async () => {
        try {
          const response = await fetch('/api/user/permissions');
          if (!response.ok) {
            throw new Error(`Erro ao buscar permissões: ${response.statusText}`);
          }
          const data = await response.json();
          setUserPermissions(data);
        } catch (error) {
          console.error('Erro ao buscar permissões:', error);
        } finally {
          setIsLoadingPermissions(false);
        }
      };

      const fetchMetrics = async () => {
        try {
          const response = await fetch('/api/user/metrics');
          if (!response.ok) {
            throw new Error(`Erro ao buscar métricas: ${response.statusText}`);
          }
          const data = await response.json();
          setMetrics(data);
        } catch (error) {
          console.error('Erro ao buscar métricas:', error);
        } finally {
          setIsLoadingMetrics(false);
        }
      };

      fetchPermissions();
      fetchMetrics();
    }
  }, [status, router]);

  if (status === 'loading' || isLoadingPermissions || isLoadingMetrics) {
    return <div>Carregando...</div>;
  }

  if (status === 'authenticated' && session) {
    const quickAccessCards = [
      {
        title: 'Membros',
        description: 'Gerencie os membros do ministério',
        icon: <Users className="h-6 w-6" />,
        href: '/dashboard/members',
        featureName: 'Membros'
      },
      {
        title: 'Financeiro',
        description: 'Acompanhe as finanças do ministério',
        icon: <DollarSign className="h-6 w-6" />,
        href: '/dashboard/finance',
        featureName: 'Financeiro'
      },
      {
        title: 'Eventos',
        description: 'Gerencie eventos e calendário',
        icon: <Calendar className="h-6 w-6" />,
        href: '/dashboard/events',
        featureName: 'Eventos'
      },
      {
        title: 'Pequenos Grupos',
        description: 'Gerencie os pequenos grupos',
        icon: <Users2 className="h-6 w-6" />,
        href: '/dashboard/groups',
        featureName: 'Pequenos Grupos'
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo, {session.user?.name || 'usuário'}!</h1>
          <p className="text-gray-600">Aqui está o resumo do seu ministério</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Membros</CardTitle>
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
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.birthdayMembersThisMonth}</div>
              <p className="text-xs text-muted-foreground">Membros aniversariantes</p>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receitas do mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">R$ {metrics.totalReceitasMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Entradas financeiras</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Despesas do mês</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">R$ {metrics.totalDespesasMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Saídas financeiras</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo do mês</CardTitle>
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.saldoMes >= 0 ? 'text-blue-700' : 'text-red-700'}`}>R$ {metrics.saldoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
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

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Nenhuma atividade recente para exibir.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
} 