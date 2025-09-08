"use client";
import React, { useState } from 'react';
// Importe componentes de layout como Sidebar ou Header aqui, se já existirem
import Sidebar from '@/components/layout/Sidebar';
// import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100"> {/* Contêiner principal flexbox */}
      {/* Sidebar com as propriedades necessárias */}
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden"> {/* Contêiner para Header e Conteúdo */}
        {/* Espaço reservado para o Header */}
        {/* <Header /> */}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6"> {/* Área do Conteúdo Principal */}
          {children}
        </main>
      </div>
    </div>
  );
}