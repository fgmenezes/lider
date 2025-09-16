"use client";
import React, { useState, useEffect } from 'react';
// Importe componentes de layout como Sidebar ou Header aqui, se já existirem
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Iniciar aberto no desktop (lg+) e fechado no mobile/tablet
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  
  // Ajustar estado inicial baseado no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop: sidebar sempre aberto
        setSidebarOpen(true);
      } else {
        // Mobile/Tablet: sidebar fechado por padrão
        setSidebarOpen(false);
      }
    };

    // Definir estado inicial
    handleResize();
    
    // Escutar mudanças de tamanho da tela
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100"> {/* Contêiner principal flexbox */}
      {/* Sidebar com as propriedades necessárias */}
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden"> {/* Contêiner para Header e Conteúdo */}
        {/* Header com botão hambúrguer */}
        <Header isSidebarOpen={sidebarOpen} toggleSidebar={handleToggleSidebar} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6"> {/* Área do Conteúdo Principal */}
          {children}
        </main>
      </div>
    </div>
  );
}