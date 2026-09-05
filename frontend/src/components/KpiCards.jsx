import React from 'react';
import { DollarSign, ShoppingBag, ArrowUpRight, Award } from 'lucide-react';

export default function KpiCards({ expenses }) {
  const totalSpent = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const txCount = expenses.length;
  
  // Calculate top category
  const categoryTotals = {};
  expenses.forEach(item => {
    const cat = item.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.amount) || 0);
  });

  let topCategory = 'None';
  let maxCatAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amount]) => {
    if (amount > maxCatAmount) {
      maxCatAmount = amount;
      topCategory = cat;
    }
  });

  const avgExpense = txCount > 0 ? (totalSpent / txCount).toFixed(2) : '0.00';

  return (
    <div className="kpi-grid">
      <div className="glass-card">
        <div className="kpi-title">Total Expenses</div>
        <div className="kpi-value">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div className="kpi-sub">
          <ArrowUpRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Automated Tracking
        </div>
      </div>

      <div className="glass-card">
        <div className="kpi-title">Total Transactions</div>
        <div className="kpi-value">{txCount}</div>
        <div className="kpi-sub" style={{ color: '#60a5fa' }}>
          <ShoppingBag size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Bank Alerts Processed
        </div>
      </div>

      <div className="glass-card">
        <div className="kpi-title">Top Expense Category</div>
        <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{topCategory}</div>
        <div className="kpi-sub" style={{ color: '#fbbf24' }}>
          ₹{maxCatAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="glass-card">
        <div className="kpi-title">Average per Transaction</div>
        <div className="kpi-value">₹{Number(avgExpense).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div className="kpi-sub" style={{ color: '#c084fc' }}>
          <Award size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Smart Calculated
        </div>
      </div>
    </div>
  );
}
