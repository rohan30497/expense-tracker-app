import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { apiUrl } from './lib/api';
import KpiCards from './components/KpiCards';
import ExpenseCharts from './components/ExpenseCharts';
import TransactionTable from './components/TransactionTable';
import AddExpenseModal from './components/AddExpenseModal';
import EditExpenseModal from './components/EditExpenseModal';
import { useTheme } from './context/ThemeContext';
import { Wallet, Plus, RefreshCw, ShieldCheck, Calendar, Sun, Moon, Download } from 'lucide-react';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generate year options (current year and past 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  }, []);

  // Filter expenses by selected month/year
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      if (!item.transaction_date) return false;
      const date = new Date(item.transaction_date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

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

    try {
      await supabase
        .from('expenses')
        .update({ category: newCategory })
        .eq('id', id);

      setExpenses((prev) =>
        prev.map((item) => (item.id === id ? { ...item, category: newCategory } : item))
      );
    } catch (err) {
      console.error('Error updating category in Supabase:', err);
    }
  };

  // 5. Edit Transaction Handler
  const handleEditExpense = async (id, updates) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase is not configured. Edit is disabled in DB-only mode.');
      return;
    }

    try {
      await supabase.from('expenses').update(updates).eq('id', id);
      setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    } catch (err) {
      console.error('Error updating in Supabase:', err);
    }
  };

  // 6. Delete Transaction Handler
  const handleDeleteExpense = async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase is not configured. Delete is disabled in DB-only mode.');
      return;
    }

    try {
      await supabase.from('expenses').delete().eq('id', id);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Error deleting from Supabase:', err);
    }
  };

  // 7. Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    const headers = ['Date', 'Merchant', 'Category', 'Amount (INR)', 'Account', 'Raw Info'];
    const rows = filteredExpenses.map(item => [
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

  // 8. Export to PDF (simple text-based PDF)
  const handleExportPDF = async () => {
    if (filteredExpenses.length === 0) {
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
      const totalSpent = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Transactions: ${filteredExpenses.length}`, 20, 45);
      doc.text(`Total Amount: INR ${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, 52);
      
      // Table
      const headers = [['Date', 'Merchant', 'Category', 'Amount (INR)']];
      const data = filteredExpenses.map(item => [
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
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="logo-group">
          <div className="logo-icon">
            <Wallet size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="brand-title">AutoExpense</h1>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              Automated Bank Email Expense Tracker
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isSupabaseConfigured ? (
            <div className="live-badge">
              <span className="live-dot"></span> Realtime Supabase Sync
            </div>
          ) : (
            <div className="live-badge" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.12)' }}>
              <ShieldCheck size={12} /> Auto Mode Enabled
            </div>
          )}

          {/* Month/Year Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <select
                className="category-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ paddingLeft: '2.2rem', minWidth: '160px' }}
              >
                {[
                  { value: 0, label: 'January' },
                  { value: 1, label: 'February' },
                  { value: 2, label: 'March' },
                  { value: 3, label: 'April' },
                  { value: 4, label: 'May' },
                  { value: 5, label: 'June' },
                  { value: 6, label: 'July' },
                  { value: 7, label: 'August' },
                  { value: 8, label: 'September' },
                  { value: 9, label: 'October' },
                  { value: 10, label: 'November' },
                  { value: 11, label: 'December' }
                ].map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <select
              className="category-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ minWidth: '100px' }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            className="btn-primary"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem' }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              className="btn-primary"
              style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-success)' }}
              onClick={handleExportCSV}
              title="Export to CSV"
            >
              <Download size={16} /> CSV
            </button>
            <button
              className="btn-primary"
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-danger)' }}
              onClick={handleExportPDF}
              title="Export to PDF"
            >
              <Download size={16} /> PDF
            </button>
          </div>

          <button
            className="btn-primary"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={fetchExpenses}
            title="Refresh transactions"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>

          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <KpiCards expenses={filteredExpenses} />

      {/* Visual Graphs */}
      <ExpenseCharts expenses={filteredExpenses} />

      {/* Transaction Table */}
      <TransactionTable
        expenses={filteredExpenses}
        onUpdateCategory={handleUpdateCategory}
        onEdit={(expense) => setEditingExpense(expense)}
        onDelete={handleDeleteExpense}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddExpense={handleAddExpense}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={editingExpense !== null}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={handleEditExpense}
      />
    </div>
  );
}
