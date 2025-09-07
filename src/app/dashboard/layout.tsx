"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile/tablet
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      // Em desktop, sempre manter sidebar aberta
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Inicializar sidebar como aberta em desktop
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div 
      className="flex h-screen"
      style={{ backgroundColor: 'var(--color-background-secondary)' }}
    >
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header com menu hambúrguer (apenas em mobile/tablet) */}
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <main 
          className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6"
          style={{ backgroundColor: 'var(--color-background-muted)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}