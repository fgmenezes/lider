'use client';

import React from 'react';
import Link from 'next/link'; // Importar o componente Link
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

export default function Sidebar() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const name = session?.user?.name;
  // Nome do ministério: para LIDER_MASTER vem de masterOf.name, para outros pode vir de ministryName
  const ministryName = session?.user?.masterOf?.name || session?.user?.ministryName || '---';

  // Definição dos links dos módulos
  const moduleLinks = [
    { href: '/dashboard', label: 'Dashboard' }, // Link para a página principal da Dashboard
    { href: '/dashboard/members', label: 'Membros' },
    { href: '/dashboard/groups', label: 'Pequenos Grupos' },
    { href: '/dashboard/finance', label: 'Financeiro' },
    { href: '/dashboard/events', label: 'Eventos' },
    { href: '/dashboard/assistant', label: 'Assistente' }, // Novo link: Assistente
    { href: '/dashboard/users', label: 'Gerenciamento de Usuários', adminOnly: true }, // Novo link: Gerenciamento de Usuários (Global/Admin?)
    { href: '/dashboard/ministries', label: 'Gerenciamento de Ministérios', adminOnly: true }, // Novo link: Gerenciamento de Ministérios (Global/Admin?)
    { href: '/dashboard/leaders', label: 'Líderes' }, // Novo link: Líderes (Gerenciamento de Líderes do Ministério)
    // Adicione outros módulos conforme necessário
  ];

  // Filtrar links conforme o papel do usuário
  const filteredLinks = moduleLinks.filter(link => {
    if (role === 'ADMIN') return true;
    if (role === 'MASTER') return !link.adminOnly;
    if (role === 'LEADER') {
      // LEADER não vê adminOnly e pode ver apenas alguns módulos
      return !link.adminOnly && [
        '/dashboard',
        '/dashboard/members',
        '/dashboard/groups',
        '/dashboard/finance',
        '/dashboard/events',
        '/dashboard/assistant',
        '/dashboard/leaders',
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
              <Link href={link.href} className="flex items-center px-4 py-2 text-gray-200 hover:bg-gray-700"> {/* Link de Navegação */}
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