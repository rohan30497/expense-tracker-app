import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  CreditCard, 
  BarChart2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Home, href: '#overview' },
  { id: 'expenses', label: 'Expenses', icon: CreditCard, href: '#expenses' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, href: '#analytics' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '#settings' },
];

export default function Sidebar({ isOpen, onClose, activeItem, onNavigate }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--bg-overlay)',
              zIndex: 249,
              display: 'block',
            }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="sidebar"
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-primary)',
          zIndex: 250,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--border-primary)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px var(--accent-primary-muted)',
            }}>
              <Wallet size={20} color="white" />
            </div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              AutoExpense
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close sidebar"
            style={{ display: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: 'var(--space-4)', overflow: 'auto' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      background: isActive ? 'var(--accent-primary-muted)' : 'transparent',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Icon size={20} style={{ flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--border-primary)',
        }}>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={18} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={18} />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      <button
        className="mobile-menu-btn"
        onClick={() => onClose(false)}
        aria-label="Open menu"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 'var(--space-4)',
          left: 'var(--space-4)',
          zIndex: 260,
        }}
      >
        <Menu size={24} />
      </button>
    </>
  );
}