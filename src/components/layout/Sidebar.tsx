'use client';

import React from 'react';
import Link from 'next/link'; // Importar o componente Link
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

export default function Sidebar() {
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
    <div className="flex flex-col w-64 bg-gray-800 text-white"> {/* Sidebar fixa com largura e cor de fundo */}
      <div className="flex items-center justify-center h-16 bg-gray-900"> {/* Área do Logo/Título */}
        <span className="text-xl font-semibold">Sistema Lider</span>
      </div>
      <nav className="flex-1 overflow-y-auto"> {/* Área de Navegação Rolável */}
        <ul className="space-y-2 py-4"> {/* Lista de Links */}
          {filteredLinks.map((link) => (
              <li key={link.href}> {/* Item da Lista */}
              <Link href={link.href} className="flex items-center px-4 py-2 text-gray-200 hover:bg-gray-700">
                  {link.label}
                </Link>
              </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 bg-gray-900"> {/* Área Inferior (Ex: User Info, Logout) */}
        <p className="text-xs text-gray-300 mb-1">Ministério: {ministryName}</p>
        <p className="text-sm text-gray-400">Usuário: {name || '---'}</p>
        <p className="text-xs text-gray-500">Perfil: {role || '---'}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition"
        >
          Sair
        </button>
      </div>
    </div>
  );
} 