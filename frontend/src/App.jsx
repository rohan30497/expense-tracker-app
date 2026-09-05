import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { apiUrl } from './lib/api';
import KpiCards from './components/KpiCards';
import ExpenseCharts from './components/ExpenseCharts';
import TransactionList from './components/TransactionList';
import AddExpenseModal from './components/AddExpenseModal';
import { useTheme } from './context/ThemeContext';
import { Check } from 'lucide-react';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('none');

  // Generate year options (current year and past 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  }, []);

  // Month names for filter dropdown
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // 1. Fetch expenses from backend API
  const fetchExpenses = async () => {
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/expenses'));

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      setExpenses(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error('Failed to fetch expenses from backend:', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load data once on startup
  useEffect(() => {
    fetchExpenses();

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'expenses' },
          (payload) => {
            console.log('Realtime INSERT received:', payload.new);
            setExpenses((prev) => [payload.new, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'expenses' },
          (payload) => {
            console.log('Realtime UPDATE received:', payload.new);
            setExpenses((prev) =>
              prev.map((item) => (item.id === payload.new.id ? payload.new : item))
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // 3. Add Manual Expense Handler
  const handleAddExpense = async (newExpense) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase is not configured. Add is disabled in DB-only mode.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([newExpense])
        .select();

      if (!error && data) {
        setExpenses((prev) => [data[0], ...prev]);
      }
    } catch (err) {
      console.error('Error inserting into Supabase:', err);
    }
  };

  // 4. Update Category Handler
  const handleUpdateCategory = async (id, newCategory) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase is not configured. Category updates are disabled in DB-only mode.');
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .update({ category: newCategory })
      .eq('id', id);

    if (error) {
      console.error('Error updating category in Supabase:', error);
      alert('Failed to update category: ' + error.message);
      return;
    }

    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category: newCategory } : item))
    );
  };

  // 5. Edit Transaction Handler
  const handleEditExpense = async (id, updates) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase is not configured. Edit is disabled in DB-only mode.');
      return;
    }

    const { error } = await supabase.from('expenses').update(updates).eq('id', id);

    if (error) {
      console.error('Error updating in Supabase:', error);
      alert('Failed to update expense: ' + error.message);
      return;
    }

    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // 6. Delete Transaction Handler
  const handleDeleteExpense = async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase is not configured. Delete is disabled in DB-only mode.');
      return;
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      console.error('Error deleting from Supabase:', error);
      alert('Failed to delete expense: ' + error.message);
      return;
    }

    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    const headers = ['Date', 'Merchant', 'Category', 'Amount (INR)', 'Account', 'Raw Info'];
    const rows = expenses.map(item => [
      item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('en-IN') : 'N/A',
      item.merchant || 'Unknown',
      item.category || 'Other',
      Number(item.amount || 0).toFixed(2),
      item.account_no || 'N/A',
      item.raw_info || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${selectedYear}_${String(selectedMonth + 1).padStart(2, '0')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

      // Title
      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241);
      doc.text('AutoExpense - Expense Report', 20, 20);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`${monthNames[selectedMonth]} ${selectedYear}`, 20, 30);

      // Summary
      const totalSpent = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Transactions: ${expenses.length}`, 20, 45);
      doc.text(`Total Amount: INR ${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, 52);

      // Table
      const headers = [['Date', 'Merchant', 'Category', 'Amount (INR)']];
      const data = expenses.map(item => [
        item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('en-IN') : 'N/A',
        item.merchant || 'Unknown',
        item.category || 'Other',
        Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
      ]);

      doc.autoTable({
        head: headers,
        body: data,
        startY: 60,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
        alternateRowStyles: { fillColor: [245, 245, 250] }
      });

      doc.save(`expenses_${selectedYear}_${String(selectedMonth + 1).padStart(2, '0')}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export requires jspdf and jspdf-autotable packages. Install them or use CSV export.');
    }
  };

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar */}
      <div style={{
        width: 280,
        flexShrink: 0,
        background: theme === 'dark' ? 'var(--bg-sidebar)' : '#fff',
        color: theme === 'dark' ? 'var(--text-sidebar)' : '#1e293b',
        height: '100vh',
        overflowY: 'auto',
        borderRight: '1px solid var(--border-primary)',
        padding: 'var(--space-6) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="lucide Wallet" width={20} height={20} color="#fff" />
          </div>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>AutoExpense</span>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}>
            <li style={{ marginBottom: 'var(--space-2)' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: theme === 'dark' ? 'var(--text-sidebar)' : '#1e293b',
                  background: 'transparent',
                  border: 'none',
                  width: '100%',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginRight: 'var(--space-1)',
                }}
                onClick={() => setActiveFilter('overview')}
              >
                <i className="lucide Layout" width={18} height={18} style={{ color: '#64748b', marginRight: 'var(--space-2)' }} />
                Overview
              </button>
            </li>
            <li style={{ marginBottom: 'var(--space-2)' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: theme === 'dark' ? 'var(--text-sidebar)' : '#1e293b',
                  background: 'transparent',
                  border: 'none',
                  width: '100%',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginRight: 'var(--space-1)',
                }}
                onClick={() => setActiveFilter('charts')}
              >
                <i className="lucide Chart" width={18} height={18} style={{ color: '#64748b', marginRight: 'var(--space-2)' }} />
                Charts
              </button>
            </li>
            <li style={{ marginBottom: 'var(--space-2)' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: theme === 'dark' ? 'var(--text-sidebar)' : '#1e293b',
                  background: 'transparent',
                  border: 'none',
                  width: '100%',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginRight: 'var(--space-1)',
                }}
                onClick={() => setActiveFilter('transactions')}
              >
                <i className="lucide List" width={18} height={18} style={{ color: '#64748b', marginRight: 'var(--space-2)' }} />
                Transactions
              </button>
            </li>
          </ul>
        </nav>

        <div style={{ padding: 'var(--space-4)', marginTop: 'auto', borderTop: '1px solid var(--border-primary)' }}>
          <button
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: 'var(--bg)',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              marginBottom: 'var(--space-2)',
            }}
            onClick={() => setIsModalOpen(true)}
          >
            <i className="lucide Plus" width={16} height={16} style={{ marginRight: 'var(--space-2)' }} /> Add Expense
          </button>
          <button
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            Theme
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, width: '100%', overflowY: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <button
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
            onClick={() => setActiveFilter('overview')}
            {...activeFilter === 'overview' && { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            Overview
          </button>
          <button
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              background: 'transparent',
              color: activeFilter === 'charts' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
            onClick={() => setActiveFilter('charts')}
            {...activeFilter === 'charts' && { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            Charts
          </button>
          <button
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              background: 'transparent',
              color: activeFilter === 'transactions' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
            onClick={() => setActiveFilter('transactions')}
            {...activeFilter === 'transactions' && { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            Transactions
          </button>
        </div>

        {/* KPI Cards + Charts */}
        {activeFilter !== 'transactions' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 'var(--space-5)',
            marginBottom: 'var(--space-6)',
          }}>
            <KpiCards expenses={expenses} selectedMonth={selectedMonth} selectedYear={selectedYear} />
            <ExpenseCharts expenses={expenses} selectedMonth={selectedMonth} selectedYear={selectedYear} />
          </div>
        )}

        {/* Transaction List */}
        {activeFilter === 'transactions' && (
          <TransactionList
            expenses={expenses}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            monthNames={monthNames}
            yearOptions={yearOptions}
            onUpdateCategory={handleUpdateCategory}
            onEdit={(id, updates) => handleEditExpense(id, updates)}
            onDelete={handleDeleteExpense}
            onDuplicate={(item) => {
              // Handle duplicate - just add with new ID
              if (isSupabaseConfigured && supabase) {
                supabase.from('expenses').insert([{ ...item, id: undefined, created_at: new Date().toISOString() }]).then(() => fetchExpenses());
              }
            }}
            onExport={handleExportCSV}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
      </main>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        mode="add"
        onSubmit={handleAddExpense}
      />
    </div>
  );
}