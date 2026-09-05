import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  User, 
  LogOut, 
  ChevronDown,
  Menu,
  Settings,
  Download,
  FileText,
  Table
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header({ onMenuClick, onSearch, onExport, searchPlaceholder = "Search expenses... (⌘K)" }) {
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);
  const exportMenuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowExportMenu(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    onSearch?.(e.target.value);
  };

  const exportOptions = [
    { label: 'Export CSV', icon: FileText, action: () => onExport?.('csv') },
    { label: 'Export PDF', icon: FileText, action: () => onExport?.('pdf') },
    { label: 'Export JSON', icon: Table, action: () => onExport?.('json') },
  ];

  return (
    <header className="header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-sticky)',
      background: 'rgba(var(--bg-card), 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-primary)',
      padding: 'var(--space-3) var(--space-4)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <button
            onClick={onMenuClick}
            className="btn btn-ghost btn-icon"
            aria-label="Open menu"
            style={{
              display: 'none',
            }}
          >
            <Menu size={20} />
          </button>

          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: 480,
          }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-subtle)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={searchRef}
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearch}
              className="input"
              style={{
                paddingLeft: 'var(--space-10)',
                fontSize: '0.875rem',
              }}
              aria-label="Search expenses"
            />
            <kbd style={{
              position: 'absolute',
              right: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.65rem',
              color: 'var(--text-subtle)',
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
            }}>
              ⌘K
            </kbd>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn btn-secondary"
              aria-label="Export options"
              aria-expanded={showExportMenu}
            >
              <Download size={18} />
              <span>Export</span>
              <ChevronDown size={16} />
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + var(--space-2))',
                    right: 0,
                    minWidth: 180,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 'var(--space-2)',
                    zIndex: 'var(--z-dropdown)',
                  }}
                >
                  {exportOptions.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => { opt.action(); setShowExportMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2) var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        fontFamily: 'var(--font-sans)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <opt.icon size={18} />
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon tooltip"
            data-tip={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            className="btn btn-ghost btn-icon tooltip"
            data-tip="Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>

          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="btn btn-ghost"
              style={{
                padding: 'var(--space-1) var(--space-3)',
                gap: 'var(--space-2)',
                borderRadius: 'var(--radius-full)',
              }}
              aria-expanded={showUserMenu}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}>
                U
              </div>
              <span style={{ display: 'none' }}>User</span>
              <ChevronDown size={16} />
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + var(--space-2))',
                    right: 0,
                    minWidth: 200,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 'var(--space-2)',
                    zIndex: 'var(--z-dropdown)',
                  }}
                >
                  <div style={{
                    padding: 'var(--space-3)',
                    borderBottom: '1px solid var(--border-primary)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>User Name</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>user@example.com</p>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: 'var(--space-2)' }}
                  >
                    <User size={18} /> Profile
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: 'var(--space-2)' }}
                  >
                    <Settings size={18} /> Settings
                  </button>
                  <hr style={{ borderColor: 'var(--border-primary)', margin: 'var(--space-2) 0' }} />
                  <button
                    className="btn btn-danger"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: 'var(--space-2)' }}
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}