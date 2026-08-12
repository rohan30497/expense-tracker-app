import React, { useState } from 'react';
import { Search, Calendar, Edit2, Tag, Trash2, Pencil } from 'lucide-react';

export default function TransactionTable({ expenses, onUpdateCategory, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingId, setEditingId] = useState(null);

  const categories = [
    'ALL',
    'Food & Dining',
    'Transport',
    'Shopping',
    'Bills & Utilities',
    'Donation/Charity',
    'Entertainment & Leisure',
    'Other'
  ];

  const filteredExpenses = expenses.filter(item => {
    const matchesSearch = 
      (item.merchant || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.raw_info || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const getBadgeClass = (category) => {
    if (!category) return 'badge-cat';
    if (category.includes('Food')) return 'badge-cat cat-Food';
    if (category.includes('Transport')) return 'badge-cat cat-Transport';
    if (category.includes('Shopping')) return 'badge-cat cat-Shopping';
    if (category.includes('Bills')) return 'badge-cat cat-Bills';
    if (category.includes('Donation') || category.includes('Charity')) return 'badge-cat cat-Donation';
    if (category.includes('Entertainment')) return 'badge-cat cat-Entertainment';
    return 'badge-cat';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-card">
      <div className="controls-bar">
        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 600 }}>
          Transaction History ({filteredExpenses.length})
        </h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search merchant, info..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Merchant / Info</th>
              <th>Category</th>
              <th>Date & Time</th>
              <th>Account</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="merchant-cell">
                      <span>{item.merchant || 'Unknown Merchant'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      {item.raw_info}
                    </div>
                  </td>
                  <td>
                    {editingId === item.id ? (
                      <select
                        autoFocus
                        defaultValue={item.category || 'Other'}
                        onChange={(e) => {
                          onUpdateCategory(item.id, e.target.value);
                          setEditingId(null);
                        }}
                        onBlur={() => setEditingId(null)}
                        style={{
                          background: '#0f172a',
                          color: '#fff',
                          border: '1px solid #6366f1',
                          borderRadius: '4px',
                          padding: '0.2rem 0.4rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        {categories.filter(c => c !== 'ALL').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={getBadgeClass(item.category)}
                        onClick={() => setEditingId(item.id)}
                        title="Click to edit category"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Tag size={10} />
                        {item.category || 'Other'}
                        <Edit2 size={10} style={{ opacity: 0.6 }} />
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.825rem' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {formatDate(item.transaction_date)}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.825rem' }}>
                    {item.account_no || 'Axis Bank'}
                  </td>
                  <td style={{ textAlign: 'right' }} className="amount-text">
                    ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      title="Edit transaction"
                      onClick={() => onEdit && onEdit(item)}
                      style={{
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        color: '#a5b4fc',
                        borderRadius: '6px',
                        padding: '0.3rem 0.5rem',
                        cursor: 'pointer',
                        marginRight: '0.4rem',
                        lineHeight: 0
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      title="Delete transaction"
                      onClick={() => {
                        if (window.confirm(`Delete "${item.merchant || 'this transaction'}"?`)) {
                          onDelete && onDelete(item.id);
                        }
                      }}
                      style={{
                        background: 'rgba(239,68,68,0.10)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#f87171',
                        borderRadius: '6px',
                        padding: '0.3rem 0.5rem',
                        cursor: 'pointer',
                        lineHeight: 0
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No transaction alerts match your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
