import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, onAddExpense }) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [accountNo, setAccountNo] = useState('XX3065');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!merchant || !amount) return;

    onAddExpense({
      merchant,
      amount: parseFloat(amount),
      currency: 'INR',
      category,
      account_no: accountNo,
      raw_info: 'Manual Entry',
      transaction_date: new Date().toISOString()
    });

    setMerchant('');
    setAmount('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 600 }}>
            Add Manual Expense
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
              placeholder="e.g. Swiggy, Uber, Local Market"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Amount (₹)</label>
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
              <option value="Food & Dining">Food & Dining</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills & Utilities">Bills & Utilities</option>
              <option value="Donation/Charity">Donation/Charity</option>
              <option value="Entertainment & Leisure">Entertainment & Leisure</option>
              <option value="Other">Other</option>
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
              <PlusCircle size={16} /> Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
