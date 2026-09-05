import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronRight,
  Edit2, 
  Trash2, 
  Copy,
  MoreVertical,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';

const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Online Shopping',
  'Online Groceries',
  'Shopping',
  'Bills & Utilities',
  'Investment',
  'Donation/Charity',
  'Entertainment & Leisure',
  'Other'
];

const CATEGORY_COLORS = {
  'Food & Dining': 'warning',
  'Transport': 'primary',
  'Online Shopping': 'primary',
  'Online Groceries': 'success',
  'Shopping': 'danger',
  'Bills & Utilities': 'danger',
  'Investment': 'warning',
  'Donation/Charity': 'success',
  'Entertainment & Leisure': 'warning',
  'Other': 'primary',
};

function CategoryBadge({ category, size = 'sm' }) {
  const color = CATEGORY_COLORS[category] || 'primary';
  const padding = size === 'sm' ? 'var(--space-1) var(--space-2)' : 'var(--space-1) var(--space-3)';
  const fontSize = size === 'sm' ? '0.65rem' : '0.75rem';
  
  const colorMap = {
    primary: 'var(--accent-primary)',
    success: 'var(--accent-success)',
    warning: 'var(--accent-warning)',
    danger: 'var(--accent-danger)',
  };
  const mutedMap = {
    primary: 'var(--accent-primary-muted)',
    success: 'var(--accent-success-muted)',
    warning: 'var(--accent-warning-muted)',
    danger: 'var(--accent-danger-muted)',
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      padding,
      fontSize,
      fontWeight: 600,
      borderRadius: 'var(--radius-full)',
      background: mutedMap[color],
      color: colorMap[color],
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  );
}

function ActionButton({ icon: Icon, onClick, tooltip, disabled, variant = 'ghost' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-icon tooltip`}
      data-tip={tooltip}
      aria-label={tooltip}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Icon size={16} />
    </button>
  );
}

function TransactionRow({ 
  item, 
  index, 
  isExpanded, 
  onToggleExpand, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onCategoryChange,
  isEditing,
  editCategory,
  onEditCategoryChange,
  isDeleting,
}) {
  const date = item.transaction_date ? new Date(item.transaction_date) : null;
  const formattedDate = date ? format(date, 'dd MMM • HH:mm') : 'N/A';
  const formattedAmount = new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    minimumFractionDigits: 2 
  }).format(Number(item.amount) || 0);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      style={{ 
        background: isEditing ? 'var(--accent-primary-muted)' : 'transparent',
        transition: 'background var(--transition-fast)',
      }}
    >
      <td style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={onToggleExpand}
            className="btn btn-ghost btn-icon"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            style={{ padding: 'var(--space-1)' }}
          >
            <ChevronRight size={16} style={{ 
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform var(--transition-fast)',
            }} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-1)',
            }}>
              <CategoryBadge category={item.category || 'Other'} />
              <span style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.merchant || 'Unknown Merchant'}
              </span>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <Calendar size={12} /> {formattedDate}
              </span>
              {item.account_no && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <CreditCard size={12} /> {item.account_no}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td style={{ 
        padding: 'var(--space-3) var(--space-4)', 
        borderBottom: '1px solid var(--border-primary)',
        textAlign: 'right',
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          {formattedAmount}
        </div>
      </td>
      <td style={{ 
        padding: 'var(--space-3) var(--space-4)', 
        borderBottom: '1px solid var(--border-primary)',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
          {!isEditing ? (
            <>
              <ActionButton 
                icon={Edit2} 
                onClick={() => onEdit?.(item)} 
                tooltip="Edit transaction" 
              />
              <ActionButton 
                icon={Copy} 
                onClick={() => onDuplicate?.(item)} 
                tooltip="Duplicate" 
              />
              <ActionButton 
                icon={Trash2} 
                onClick={() => onDelete?.(item.id)} 
                tooltip="Delete" 
                variant="danger"
                disabled={isDeleting}
              />
            </>
          ) : (
            <>
              <select
                value={editCategory}
                onChange={(e) => onEditCategoryChange(e.target.value)}
                className="input"
                style={{ 
                  width: 'auto', 
                  minWidth: 160, 
                  padding: 'var(--space-1) var(--space-2)',
                  fontSize: '0.8125rem',
                }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ActionButton 
                icon={FileText} 
                onClick={() => onCategoryChange?.(item.id, editCategory)} 
                tooltip="Save category" 
                variant="primary"
              />
              <ActionButton 
                icon={X} 
                onClick={() => onEdit?.(null)} 
                tooltip="Cancel" 
              />
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

function ExpandedRow({ item, onClose }) {
  const date = item.transaction_date ? new Date(item.transaction_date) : null;
  
  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <td colSpan={3} style={{ padding: 0, borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--border-primary)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 'var(--space-1)' }}>Raw Info</label>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                {item.raw_info || '—'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 'var(--space-1)' }}>Transaction ID</label>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {item.id}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 'var(--space-1)' }}>Created</label>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {item.created_at ? format(parseISO(item.created_at), 'dd MMM yyyy, HH:mm') : '—'}
              </p>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 'var(--space-1)' }}>Parser Used</label>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {item.parser_used || '—'}
              </p>
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function FilterToolbar({ 
  selectedMonth, 
  selectedYear, 
  selectedCategory, 
  searchQuery,
  onMonthChange, 
  onYearChange, 
  onCategoryChange, 
  onSearchChange,
  onClearFilters,
  yearOptions,
  hasActiveFilters,
  monthNames,
}) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-4)',
      padding: 'var(--space-4)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-xl)',
    }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
        <Search size={18} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
        <input
          type="search"
          placeholder="Search merchant, category, amount..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input"
          style={{ paddingLeft: 'var(--space-10)', fontSize: '0.875rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: 140 }}>
          <Calendar size={18} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="input"
            style={{ paddingLeft: 'var(--space-10)', fontSize: '0.875rem' }}
          >
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx}>{name}</option>
            ))}
          </select>
        </div>

        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="input"
          style={{ minWidth: 100, fontSize: '0.875rem' }}
        >
          {yearOptions.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="input"
          style={{ minWidth: 180, fontSize: '0.875rem' }}
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: 'auto' }}
        >
          <X size={16} /> Clear filters
        </button>
      )}
    </div>
  );
}

export default function TransactionList({ 
  expenses, 
  onUpdateCategory, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onExport,
  selectedMonth,
  selectedYear,
  monthNames,
  yearOptions,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'transaction_date', direction: 'desc' });
  const parentRef = useRef(null);

  const filteredExpenses = useMemo(() => {
    let result = expenses;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.merchant || '').toLowerCase().includes(query) ||
        (item.category || '').toLowerCase().includes(query) ||
        (item.raw_info || '').toLowerCase().includes(query) ||
        (item.amount || '').toString().includes(query)
      );
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter(item => item.category === selectedCategory);
    }

    if (selectedMonth !== null && selectedYear !== null) {
      result = result.filter(item => {
        if (!item.transaction_date) return false;
        const date = new Date(item.transaction_date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    }

    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [expenses, searchQuery, selectedCategory, selectedMonth, selectedYear, sortConfig]);

  const hasActiveFilters = searchQuery || selectedCategory !== 'ALL';

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleToggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEdit = (item) => {
    if (item) {
      setEditingId(item.id);
      setEditCategory(item.category || 'Other');
    } else {
      setEditingId(null);
      setEditCategory('');
    }
  };

  const handleCategorySave = (id, category) => {
    onUpdateCategory?.(id, category);
    setEditingId(null);
    setEditCategory('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this transaction?')) {
      setDeletingId(id);
      onDelete?.(id);
      setTimeout(() => setDeletingId(null), 500);
    }
  };

  const handleDuplicate = (item) => {
    onDuplicate?.({ ...item, id: undefined, created_at: new Date().toISOString() });
  };

  const virtualizer = useVirtualizer({
    count: filteredExpenses.length + expandedRows.size,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  if (filteredExpenses.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <FileText size={64} style={{ color: 'var(--text-subtle)', marginBottom: 'var(--space-4)' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          No transactions found
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
          {hasActiveFilters ? 'Try adjusting your filters' : 'Add your first expense to get started'}
        </p>
        {!hasActiveFilters && (
          <button className="btn btn-primary" onClick={() => onEdit?.({ isNew: true })}>
            <FileText size={18} /> Add Expense
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <FilterToolbar
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onCategoryChange={setSelectedCategory}
        onSearchChange={setSearchQuery}
        onClearFilters={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
        yearOptions={yearOptions}
        hasActiveFilters={hasActiveFilters}
        monthNames={monthNames}
      />

      <div 
        ref={parentRef}
        style={{ 
          height: Math.min(filteredExpenses.length * 80 + 100, 600),
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th 
                style={{ 
                  padding: 'var(--space-3) var(--space-4)', 
                  textAlign: 'left',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border-primary)',
                  cursor: sortConfig.key === 'merchant' ? 'pointer' : 'default',
                }}
                onClick={() => handleSort('merchant')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  Merchant / Info
                  {sortConfig.key === 'merchant' && (
                    sortConfig.direction === 'asc' ? <ChevronDown size={12} /> : <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
                  )}
                </div>
              </th>
              <th 
                style={{ 
                  padding: 'var(--space-3) var(--space-4)', 
                  textAlign: 'right',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border-primary)',
                  cursor: sortConfig.key === 'amount' ? 'pointer' : 'default',
                }}
                onClick={() => handleSort('amount')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  Amount
                  {sortConfig.key === 'amount' && (
                    sortConfig.direction === 'asc' ? <ChevronDown size={12} /> : <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
                  )}
                </div>
              </th>
              <th style={{ 
                padding: 'var(--space-3) var(--space-4)', 
                textAlign: 'right',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border-primary)',
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const index = virtualRow.index;
              if (index >= filteredExpenses.length) return null;
              
              const item = filteredExpenses[index];
              const isExpanded = expandedRows.has(item.id);
              
              return (
                <React.Fragment key={item.id}>
                  <TransactionRow
                    item={item}
                    index={index}
                    isExpanded={isExpanded}
                    onToggleExpand={() => handleToggleExpand(item.id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onCategoryChange={handleCategorySave}
                    isEditing={editingId === item.id}
                    editCategory={editCategory}
                    onEditCategoryChange={setEditCategory}
                    isDeleting={deletingId === item.id}
                  />
                  {isExpanded && <ExpandedRow item={item} onClose={() => handleToggleExpand(item.id)} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        
        {filteredExpenses.length > 50 && (
          <div style={{ 
            padding: 'var(--space-4)', 
            textAlign: 'center', 
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
            borderTop: '1px solid var(--border-primary)',
          }}>
            Showing {filteredExpenses.length} transactions (virtualized)
          </div>
        )}
      </div>
    </div>
  );
}