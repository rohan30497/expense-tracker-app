import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, INITIAL_DEMO_EXPENSES } from './lib/supabaseClient';
import KpiCards from './components/KpiCards';
import ExpenseCharts from './components/ExpenseCharts';
import TransactionTable from './components/TransactionTable';
import AddExpenseModal from './components/AddExpenseModal';
import EditExpenseModal from './components/EditExpenseModal';
import { Wallet, Plus, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // 1. Fetch Expenses from Supabase or Backend API Fallback
  const fetchExpenses = async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('transaction_date', { ascending: false });

        if (error) throw error;
        setExpenses(data || []);
      } catch (err) {
        console.warn('Failed to fetch from Supabase, loading fallback demo data:', err);
        setExpenses(INITIAL_DEMO_EXPENSES);
      }
    } else {
      // Local / Mock Mode: Fetch from backend API /api/expenses
      try {
        const res = await fetch('/api/expenses');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setExpenses(json.data);
          } else {
            setExpenses(INITIAL_DEMO_EXPENSES);
          }
        } else {
          setExpenses(INITIAL_DEMO_EXPENSES);
        }
      } catch (e) {
        setExpenses(INITIAL_DEMO_EXPENSES);
      }
    }
    setLoading(false);
  };

  // 2. Realtime WebSocket Subscription & Mock Auto-Polling
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
    } else {
      // Auto-poll backend /api/expenses every 3 seconds for local testing
      const interval = setInterval(() => {
        fetch('/api/expenses')
          .then((res) => res.json())
          .then((json) => {
            if (json.data && json.data.length > 0) {
              setExpenses(json.data);
            }
          })
          .catch(() => {});
      }, 3000);

      return () => clearInterval(interval);
    }
  }, []);

  // 3. Add Manual Expense Handler
  const handleAddExpense = async (newExpense) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert([newExpense])
          .select();
        
        if (!error && data) {
          setExpenses((prev) => [data[0], ...prev]);
          return;
        }
      } catch (err) {
        console.error('Error inserting into Supabase:', err);
      }
    }

    // Local state fallback
    const mockRecord = {
      ...newExpense,
      id: Date.now().toString()
    };
    setExpenses((prev) => [mockRecord, ...prev]);
  };

  // 4. Update Category Handler
  const handleUpdateCategory = async (id, newCategory) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category: newCategory } : item))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('expenses')
          .update({ category: newCategory })
          .eq('id', id);
      } catch (err) {
        console.error('Error updating category in Supabase:', err);
      }
    }
  };

  // 5. Edit Transaction Handler
  const handleEditExpense = async (id, updates) => {
    // Optimistic update
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('expenses').update(updates).eq('id', id);
      } catch (err) {
        console.error('Error updating in Supabase:', err);
      }
    } else {
      try {
        await fetch(`/api/expenses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.error('Error updating via API:', err);
      }
    }
  };

  // 6. Delete Transaction Handler
  const handleDeleteExpense = async (id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting from Supabase:', err);
      }
    } else {
      try {
        await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Error deleting via API:', err);
      }
    }
  };

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
      <KpiCards expenses={expenses} />

      {/* Visual Graphs */}
      <ExpenseCharts expenses={expenses} />

      {/* Transaction Table */}
      <TransactionTable
        expenses={expenses}
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
