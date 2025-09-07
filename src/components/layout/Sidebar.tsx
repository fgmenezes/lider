'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const name = session?.user?.name;
  // Nome do ministério: para ADMIN e MASTER vem de masterMinistry.name ou ministryName, para LEADER só ministryName
  let ministryName = '---';
  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MASTER') {
    ministryName = session?.user?.masterMinistry?.name || session?.user?.ministryName || '---';
  } else {
    ministryName = session?.user?.ministryName || '---';
  }

  // Definição dos links dos módulos
  const ministryId = session?.user?.masterMinistryId || session?.user?.ministryId;
  const moduleLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/members', label: 'Membros' },
    { href: '/dashboard/pequenos-grupos', label: 'Pequenos Grupos' },
    ...(ministryId ? [{ href: `/dashboard/ministries/${ministryId}/finance`, label: 'Financeiro', showFor: ['ADMIN', 'MASTER', 'LEADER'] }] : []),
    { href: '/dashboard/events', label: 'Eventos' },
    { href: '/dashboard/assistant', label: 'Assistente' },
    { href: '/dashboard/users', label: 'Gerenciamento de Usuários', adminOnly: true },
    { href: '/dashboard/ministries', label: 'Gerenciamento de Ministérios', adminOnly: true },
    { href: '/dashboard/leaders', label: 'Líderes', onlyAdminOrMaster: true },
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

  return (
    <>
      {/* Overlay para mobile/tablet */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        flex flex-col w-64 transition-default lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      style={{
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-text-inverse)'
      }}>
      <div className="flex items-center justify-between h-16 px-4" style={{ backgroundColor: 'var(--color-primary-dark)' }}> {/* Área do Logo/Título */}
        <span className="text-title">Sistema Lider</span>
        {/* Botão de fechar apenas em mobile/tablet */}
        <button
          onClick={onClose}
          className="p-2 rounded-md lg:hidden transition-default focus-ring"
          style={{
            color: 'var(--color-text-muted)',
            ':hover': {
              color: 'var(--color-text-inverse)',
              backgroundColor: 'var(--color-primary-light)'
            }
          }}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto"> {/* Área de Navegação Rolável */}
        <ul className="space-y-2 py-4"> {/* Lista de Links */}
          {filteredLinks.map((link) => (
              <li key={link.href}> {/* Item da Lista */}
              <Link 
                href={link.href} 
                className="flex items-center px-4 py-2 transition-default hover:bg-opacity-20"
                style={{
                  color: 'var(--color-text-inverse)',
                  ':hover': {
                    backgroundColor: 'var(--color-primary-light)'
                  }
                }}
                onClick={() => {
                  // Fechar sidebar em mobile/tablet ao clicar em um link
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
              >
                  {link.label}
                </Link>
              </li>
          ))}
        </ul>
      </nav>
      <div className="p-4" style={{ backgroundColor: 'var(--color-primary-dark)' }}> {/* Área Inferior (Ex: User Info, Logout) */}
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Ministério: {ministryName}</p>
        <p className="text-sm" style={{ color: 'var(--color-text-inverse)' }}>Usuário: {name || '---'}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Perfil: {role || '---'}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-4 w-full px-4 py-2 rounded text-sm font-medium transition-default focus-ring"
          style={{
            backgroundColor: 'var(--color-danger)',
            color: 'var(--color-text-inverse)',
            ':hover': {
              backgroundColor: 'var(--color-danger-dark)'
            }
          }}
        >
          Sair
        </button>
      </div>
      </div>
    </>
  );
}