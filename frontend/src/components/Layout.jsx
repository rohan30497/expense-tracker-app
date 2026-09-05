import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ 
  children, 
  activeItem = 'overview', 
  onNavigate, 
  onSearch, 
  onExport,
  searchQuery = '' 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        activeItem={activeItem}
        onNavigate={onNavigate}
      />
      <Header 
        onMenuClick={handleMenuClick}
        onSearch={onSearch}
        onExport={onExport}
      />
      <main 
        className="main-content"
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : 280,
          transition: 'margin-left var(--transition-base)',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <div className="container" style={{ padding: 'var(--space-6) var(--space-4)' }}>
          {children}
        </div>
      </main>
      
      <style jsx>{`
        @media (max-width: 1023px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .sidebar-overlay { display: none !important; }
        }
      `}</style>
    </div>
  );
}