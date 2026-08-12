import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Donation/Charity',
  'Entertainment & Leisure',
  'Other'
];

export default function EditExpenseModal({ isOpen, expense, onClose, onSave }) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [accountNo, setAccountNo] = useState('');

  useEffect(() => {
    if (expense) {
      setMerchant(expense.merchant || '');
      setAmount(expense.amount != null ? String(expense.amount) : '');
      setCategory(expense.category || 'Other');
      setAccountNo(expense.account_no || '');
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!merchant || !amount) return;
    onSave(expense.id, {
      merchant,
      amount: parseFloat(amount),
      category,
      account_no: accountNo
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 600 }}>
            ?? Edit Transaction
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Merchant / Payee Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Swiggy, Uber"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Amount (INR)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 250.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Account / Source</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. XX3065"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid var(--bg-card-border)',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
