'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Calendar, 
  Bot, 
  Settings, 
  Building2, 
  Crown,
  LogOut,
  User,
  Activity
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const name = session?.user?.name;
  const sidebarRef = useRef<HTMLElement>(null);
  const firstFocusableElementRef = useRef<HTMLAnchorElement>(null);
  
  // Gerenciamento de foco para acessibilidade
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 1280) {
      // Quando o sidebar abre em mobile/tablet, foca no primeiro elemento
      const timer = setTimeout(() => {
        if (firstFocusableElementRef.current) {
          firstFocusableElementRef.current.focus();
        }
      }, 100); // Pequeno delay para garantir que a animação termine
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Nome do ministério: para ADMIN e MASTER vem de masterMinistry.name ou ministryName, para LEADER só ministryName
  let ministryName = '---';
  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MASTER') {
    ministryName = session?.user?.masterMinistry?.name || session?.user?.ministryName || '---';
  } else {
    ministryName = session?.user?.ministryName || '---';
  }

  // Definição dos links dos módulos com ícones
  const ministryId = session?.user?.masterMinistryId || session?.user?.ministryId;
  const moduleLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/members', label: 'Membros', icon: Users },
    { href: '/dashboard/pequenos-grupos', label: 'Pequenos Grupos', icon: Users },
    ...(ministryId ? [{ href: `/dashboard/ministries/${ministryId}/finance`, label: 'Financeiro', icon: DollarSign, showFor: ['ADMIN', 'MASTER', 'LEADER'] }] : []),
    { href: '/dashboard/events', label: 'Eventos', icon: Calendar },
    { href: '/dashboard/activities', label: 'Atividades', icon: Activity, onlyAdminOrMaster: true },
    { href: '/dashboard/assistant', label: 'Assistente', icon: Bot },
    { href: '/dashboard/users', label: 'Gerenciamento de Usuários', icon: Settings, adminOnly: true },
    { href: '/dashboard/ministries', label: 'Gerenciamento de Ministérios', icon: Building2, adminOnly: true },
    { href: '/dashboard/leaders', label: 'Líderes', icon: Crown, onlyAdminOrMaster: true },
  ];

  // Filtrar links conforme o papel do usuário
  const filteredLinks = moduleLinks.filter(link => {
    if (role === 'ADMIN') return true;
    if (role === 'MASTER') return !link.adminOnly;
    if (role === 'LEADER') {
      // LEADER não vê adminOnly nem onlyAdminOrMaster, mas pode ver Financeiro (visualização)
      if (link.href.startsWith('/dashboard/ministries/') && link.href.endsWith('/finance')) return true;
      return !link.adminOnly && !link.onlyAdminOrMaster && [
        '/dashboard',
        '/dashboard/members',
        '/dashboard/pequenos-grupos',
        '/dashboard/events',
        '/dashboard/assistant',
      ].includes(link.href);
    }
    return false;
  });

  // Função para verificar se o link está ativo
  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Overlay para mobile/tablet */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed xl:static inset-y-0 left-0 z-50 xl:z-auto
          flex flex-col w-72 transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
          shadow-xl xl:shadow-none
        `}
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-inverse)'
        }}
        role="navigation"
        aria-label="Menu principal de navegação"
        aria-hidden={!isOpen && typeof window !== 'undefined' && window.innerWidth < 1280 ? 'true' : 'false'}
        id="sidebar-navigation"
      >
        
        {/* Header do Sidebar */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10" 
             style={{ backgroundColor: 'var(--color-primary-dark)' }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
              SL
            </div>
            <div>
              <p className="text-white font-medium text-sm">Sistema Líder</p>
            </div>
          </div>
          
          {/* Botão de fechar (apenas mobile/tablet) */}
          <button
            onClick={onClose}
            className="xl:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Fechar menu de navegação"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Lista de navegação */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredLinks.map((link, index) => {
            const Icon = link.icon;
            const isActive = isActiveLink(link.href);
            
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={link.href === '/dashboard' ? firstFocusableElementRef : undefined}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                `}
                onClick={() => {
                   // Fechar sidebar em mobile/tablet ao clicar em um link
                   if (typeof window !== 'undefined' && window.innerWidth < 1280) {
                     onClose();
                   }
                 }}
              >
                <Icon size={20} />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer do Sidebar - Informações do usuário e botão sair */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* Informações do usuário */}
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
              {name ? getInitials(name) : <User size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <Link 
                href={`/dashboard/users/${session?.user?.id}`}
                className="text-white font-medium text-sm hover:text-white/80 transition-colors text-left w-full truncate block"
                title={name || 'Usuário'}
                onClick={() => {
                  // Fechar sidebar em mobile/tablet ao clicar
                  if (typeof window !== 'undefined' && window.innerWidth < 1280) {
                    onClose();
                  }
                }}
              >
                {name || 'Usuário'}
              </Link>
              <Link 
                href={`/dashboard/ministries/${ministryId}`}
                className="text-white/70 text-xs hover:text-white/50 transition-colors text-left w-full truncate block"
                title={ministryName}
                onClick={() => {
                  // Fechar sidebar em mobile/tablet ao clicar
                  if (typeof window !== 'undefined' && window.innerWidth < 1280) {
                    onClose();
                  }
                }}
              >
                {ministryName}
              </Link>
            </div>
          </div>
          
          {/* Botão sair */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}