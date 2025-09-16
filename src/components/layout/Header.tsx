'use client';

import React from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header 
      className="shadow-sm border-b px-4 py-3 xl:hidden"
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)'
      }}
      role="banner"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md transition-default focus-ring text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-light)]"
            aria-label={isSidebarOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar-navigation"
            role="button"
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
          <h1 className="text-subtitle" style={{ color: 'var(--color-text-primary)' }}>Sistema Lider</h1>
        </div>
      </div>
    </header>
  );
}