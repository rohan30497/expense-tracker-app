import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar,
  ArrowLeftRight,
  Repeat,
  CreditCard,
  Tag,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';

const ACTION_TYPES = ['New Transaction', 'Split Transaction', 'Recurring Transaction'];

function ActionChip({ label, onSelect, isSelected = false }) {
  const isActive = isSelected;
  return (
    <button
      onClick={onSelect}
      className={`chip ${isActive ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 'var(--space-2) var(--space-3)',
        fontSize: '0.8125rem',
        fontWeight: 500,
        borderRadius: 'var(--radius-full)',
        background: isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
        color: isActive ? 'var(--bg)' : 'var(--text-primary)',
        border: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function ExpenseFormField({ label, value, onChange, type = 'text', placeholder, error }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '0.7rem', 
        color: 'var(--text-muted)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em', 
        marginBottom: 'var(--space-1)' 
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ''}
        className="input"
        style={{
          width: '100%',
          padding: 'var(--space-2) var(--space-3)',
          fontSize: '0.9375rem',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
        }}
      />
      {error && (
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--accent-danger)', 
          marginTop: 'var(--space-1)' 
        }}>
          {error}
        </p>
      )}
    </div>
  );
}

function AmountInput({ value, onChange, error }) {
  const handleChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 0) {
      const num = Number(val) / 100;
      if (!isNaN(num) && num > 0) {
        onChange(num.toFixed(2));
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="0.00"
        style={{
          flex: 1,
          padding: 'var(--space-2) var(--space-3)',
          fontSize: '1rem',
          fontFamily: 'var(--font-mono)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
        }}
      />
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>₹</span>
    </div>
  );
}

function FrequencySelector({ value, onChange }) {
  const frequencies = [
    { label: 'One-time', value: 'one-time' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)' }}>
      {frequencies.map(f => (
        <label key={f.value} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
          background: value === f.value ? 'var(--accent-primary)' : 'var(--bg-card)',
          color: value === f.value ? 'var(--bg)' : 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 500,
        }}>
          <input
            type="radio"
            value={f.value}
            checked={value === f.value}
            style={{ display: 'none', cursor: 'pointer' }}
          />
          {f.label}
        </label>
      ))}
    </div>
  );
}

function SplitItems({ items, onRemove, onAdd, onAmountChange, onCategoryChange }) {
  const [localItems, setLocalItems] = useState([{ amount: '', category: '' }]);

  useEffect(() => {
    if (items.length > localItems.length) {
      setLocalItems([...localItems, { amount: '', category: '' }]);
    } else if (items.length < localItems.length) {
      setLocalItems(items.slice(0, Math.max(1, items.length)));
    }
  }, [items.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {localItems.map((item, idx) => (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)' }}>
          <input
            type="text"
            value={item.amount}
            onChange={(e) => onAmountChange(idx, Number(e.target.value) || 0)}
            style={{
              width: 120,
              padding: 'var(--space-1) var(--space-2)',
              fontSize: '0.875rem',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
            }}
          />
          <select
            value={item.category || ''}
            onChange={(e) => onCategoryChange(idx, e.target.value)}
            className="input"
            style={{
              minWidth: 160,
              padding: 'var(--space-1) var(--space-2)',
              fontSize: '0.875rem',
            }}
          >
            <option value="">Select Category</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => onRemove(idx)}
            className="btn btn-ghost btn-sm"
            style={{
              padding: 'var(--space-1) var(--space-2)',
              fontSize: '0.75rem',
            }}
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
      ))}

      <button
        onClick={() => onAdd()}
        className="btn btn-sm"
        style={{
          padding: 'var(--space-1) var(--space-2)',
          fontSize: '0.75rem',
          marginTop: 'var(--space-2)',
        }}
      >
        <Plus size={12} /> Add Item
      </button>
    </div>
  );
}

function SlideOverPanel({ 
  isOpen, 
  onClose, 
  initialFocus = null,
  mode = 'add',
  initialData = {},
  onSubmit,
  onActionChange,
  ctaText = 'Save Transaction'
}) {
  const formRef = useRef(null);
  const [actionType, setActionType] = useState('new');
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    merchant: initialData.merchant || '',
    amount: initialData.amount || '',
    category: initialData.category || 'Food & Dining',
    date: initialData.date || new Date().toISOString().split('T')[0],
    notes: initialData.notes || '',
    raw_info: initialData.raw_info || '',
    account_no: initialData.account_no || '',
    parser_used: initialData.parser_used || 'regex',
  });

  const [splitItems, setSplitItems] = useState(
    initialData.split_items || [{ amount: '', category: '' }]
  );

  const [frequency, setFrequency] = useState(initialData.frequency || 'one-time');
  const [recurringEnd, setRecurringEnd] = useState(
    initialData.recurring_end ? new Date(initialData.recurring_end) : null
  );

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formState.merchant?.trim()) newErrors.merchant = 'Merchant is required';
    const amount = Number(formState.amount);
    if (isNaN(amount) || amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!formState.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    
    const submitData = {
      ...formState,
      action_type: actionType,
      frequency,
      ...(frequency !== 'one-time' && { recurring_end: recurringEnd?.toISOString() }),
      ...(actionType === 'split' && { split_items: splitItems }),
    };

    onSubmit?.(submitData);
    setIsEditing(false);
    onClose();
  }, [formState, actionType, frequency, splitItems, recurringEnd, onSubmit, onClose]);

  const handleActionChange = useCallback((type) => {
    setActionType(type);
    setIsEditing(false);
    setFormState({
      merchant: initialData.merchant || '',
      amount: initialData.amount || '',
      category: initialData.category || 'Food & Dining',
      date: initialData.date || new Date().toISOString().split('T')[0],
      notes: initialData.notes || '',
      raw_info: initialData.raw_info || '',
      account_no: initialData.account_no || '',
      parser_used: initialData.parser_used || 'regex',
    });
    setSplitItems([{ amount: '', category: '' }]);
    setFrequency('one-time');
    setRecurringEnd(null);
  }, [initialData]);

  const categories = ['Food & Dining', 'Transport', 'Online Shopping', 'Online Groceries', 'Shopping', 'Bills & Utilities', 'Investment', 'Donation/Charity', 'Entertainment & Leisure', 'Other'];

  const handleCategoryChange = useCallback((category) => {
    setFormState(prev => ({ ...prev, category }));
  }, []);

  // Handle real-time keyword matching
  useEffect(() => {
    const merchant = formState.merchant.toLowerCase();
    let autoCategory = formState.category;

    const keywords = {
      amazon: 'Online Shopping',
      flipkart: 'Online Shopping',
      blinkit: 'Online Groceries',
      bigbasket: 'Online Groceries',
      zepto: 'Online Groceries',
      lic: 'Investment',
      groww: 'Investment',
      zerodha: 'Investment',
      sip: 'Investment',
      nps: 'Investment',
    };

    for (const [kw, cat] of Object.entries(keywords)) {
      if (merchant.includes(kw)) {
        autoCategory = cat;
        break;
      }
    }

    setFormState(prev => ({ ...prev, category: autoCategory }));
  }, [formState.merchant]);

  // Keep references to split items in sync
  useEffect(() => {
    if (splitItems.length > 0) {
      setSplitItems(splitItems);
    }
  }, [splitItems]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="slide-over"
      style={{
        width: '100%',
        maxWidth: 520,
        height: '100vh',
        maxHeight: '100vh',
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : 'calc(100% - var(--sidebar-width, 280px))',
        zIndex: 100,
        overflowY: 'auto',
        borderLeft: '1px solid var(--border-primary)',
        background: 'var(--bg-card)',
        transition: 'right var(--transition-base)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : 'calc(100% - var(--sidebar-width, 280px))',
        left: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 99,
        cursor: 'pointer',
      }}
        onClick={onClose}
      />

      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : 'calc(100% - var(--sidebar-width, 280px))',
        width: '100%',
        maxWidth: 520,
        height: '100vh',
        maxHeight: '100vh',
        zIndex: 100,
        overflowY: 'auto',
        background: 'var(--bg-card)',
      }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--border-primary)',
        }}>
          <h3 style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)' 
          }}>
            {mode === 'add' ? 'New Transaction' : 'Edit Transaction'}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} /> Close
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ padding: 'var(--space-4)' }}
        >

          <ExpenseFormField
            label="Merchant / Description"
            value={formState.merchant}
            onChange={(e) => setFormState(prev => ({ ...prev, merchant: e.target.trim() }))}
            placeholder="e.g. Amazon, Blinkit, Reliance Fresh"
            error={errors.merchant}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <AmountInput
              value={formState.amount}
              onChange={(e) => setFormState(prev => ({ ...prev, amount: e }))}
            />
            <select
              value={formState.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="input"
              style={{
                minWidth: 180,
                padding: 'var(--space-1) var(--space-2)',
                fontSize: '0.875rem',
              }}
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <ExpenseFormField
            label="Date"
            value={formState.date}
            onChange={(e) => setFormState(prev => ({ ...prev, date: e.target.value }))}
            type="date"
          />

          <ExpenseFormField
            label="Notes / Details"
            value={formState.notes}
            onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.trim() }))}
            placeholder="Additional details..."
          />

          <ExpenseFormField
            label="Account No."
            value={formState.account_no}
            onChange={(e) => setFormState(prev => ({ ...prev, account_no: e.target.trim() }))}
            placeholder="Optional"
          />

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <ActionChip
              label="New Transaction"
              isSelected={actionType === 'new'}
              onSelect={() => handleActionChange('new')}
            />
            <ActionChip
              label="Split Transaction"
              isSelected={actionType === 'split'}
              onSelect={() => handleActionChange('split')}
            />
            <ActionChip
              label="Recurring Transaction"
              isSelected={actionType === 'recurring'}
              onSelect={() => handleActionChange('recurring')}
            />
          </div>

          {actionType === 'split' && (
            <SplitItems
              items={splitItems}
              onRemove={(idx) => setSplitItems(prev => prev.filter((_, i) => i !== idx))}
              onAdd={() => setSplitItems(prev => [...prev, { amount: '', category: '' }])}
              onAmountChange={(idx, amount) => {
                const newItems = [...splitItems];
                newItems[idx] = { ...newItems[idx], amount };
                setSplitItems(newItems);
              }}
              onCategoryChange={(idx, category) => {
                const newItems = [...splitItems];
                newItems[idx] = { ...newItems[idx], category };
                setSplitItems(newItems);
              }}
            />
          )}

          {actionType === 'recurring' && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <FrequencySelector
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
              {frequency !== 'one-time' && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <label style={{
                    fontSize: '0.7rem', 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    marginBottom: 'var(--space-1)' 
                  }}>
                    Ends on
                  </label>
                  <input
                    type="date"
                    value={recurringEnd?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setRecurringEnd(new Date(e.target.value))}
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      fontSize: '0.875rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!Object.keys(errors).length === 0}
              className="btn btn-primary"
            >
              {ctaText}
            </button>
          </div>

        </form>
      </div>
    </motion.div>
  );
}

export default function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  initialData = {},
  mode = 'add' 
}) {
  return (
    <SlideOverPanel
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      initialData={initialData}
      onSubmit={onSubmit}
      initialFocus="merchant"
    />
  );
}

export function ActionChips({ onActionChange }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
      {ACTION_TYPES.map((action, idx) => (
        <ActionChip
          key={action}
          label={action}
          isSelected={idx === 0}
          onSelect={() => onActionChange(action.toLowerCase().replace(/\s+/g, '-'))}
        />
      ))}
    </div>
  );
}