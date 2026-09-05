import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Mouse, Maximize2 } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
);

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
  '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', 
  '#84cc16', '#6366f1'
];

function ChartCard({ 
  title, 
  subtitle, 
  children, 
  action, 
  actionLabel,
  className = '',
  height = 300 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
      style={{ height, ...className }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-1)',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <button
            onClick={action}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
          >
            <Maximize2 size={16} />
            {actionLabel}
          </button>
        )}
      </div>
      <div style={{ height: `calc(100% - 60px)`, position: 'relative' }}>
        {children}
      </div>
    </motion.div>
  );
}

function CategoryDoughnut({ data, onSegmentClick, selectedCategory, onCategorySelect }) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  if (labels.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        textAlign: 'center',
        padding: 'var(--space-8)',
      }}>
        <Mouse size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
        <p style={{ fontSize: '1rem', marginBottom: 'var(--space-2)' }}>No expenses yet</p>
        <p style={{ fontSize: '0.875rem' }}>Add transactions to see breakdown</p>
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderColor: 'var(--bg-card)',
      borderWidth: 3,
      borderRadius: 8,
      hoverOffset: 8,
      spacing: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'var(--text-secondary)',
          font: { family: 'var(--font-sans)', size: 12 },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'var(--bg-card)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-primary)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return ` ${context.label}: ₹${context.raw.toLocaleString('en-IN')} (${percentage}%)`;
          },
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onSegmentClick) {
        const index = elements[0].index;
        const label = labels[index];
        onCategorySelect?.(label);
        onSegmentClick?.(label);
      }
    },
  };

  return (
    <Doughnut 
      data={chartData} 
      options={options} 
      style={{ height: '100%' }}
    />
  );
}

function MerchantBarChart({ data, onBarClick }) {
  const labels = data.map(d => d.merchant);
  const values = data.map(d => d.amount);

  if (labels.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        textAlign: 'center',
        padding: 'var(--space-8)',
      }}>
        <Mouse size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
        <p style={{ fontSize: '1rem', marginBottom: 'var(--space-2)' }}>No merchant data</p>
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [{
      label: 'Spent (₹)',
      data: values,
      backgroundColor: 'var(--accent-primary-muted)',
      borderColor: 'var(--accent-primary)',
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 40,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--bg-card)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-primary)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ₹${context.raw.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'var(--border-primary)', drawBorder: false },
        ticks: { color: 'var(--text-muted)', font: { family: 'var(--font-sans)', size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: 'var(--text-secondary)', font: { family: 'var(--font-sans)', size: 11 } },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onBarClick) {
        const index = elements[0].index;
        onBarClick(labels[index]);
      }
    },
  };

  return (
    <Bar 
      data={chartData} 
      options={options} 
      style={{ height: '100%' }}
    />
  );
}

function MonthlyTrendChart({ data }) {
  const labels = data.map(d => d.month);
  const values = data.map(d => d.amount);

  if (labels.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        textAlign: 'center',
        padding: 'var(--space-8)',
      }}>
        <p style={{ fontSize: '1rem', marginBottom: 'var(--space-2)' }}>No trend data</p>
        <p style={{ fontSize: '0.875rem' }}>Add more months of data</p>
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [{
      label: 'Monthly Spending',
      data: values,
      borderColor: 'var(--accent-primary)',
      backgroundColor: 'var(--accent-primary-muted)',
      fill: true,
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: 'var(--accent-primary)',
      pointBorderColor: 'var(--bg-card)',
      pointBorderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--bg-card)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-primary)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ₹${context.raw.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)', font: { family: 'var(--font-sans)', size: 11 } },
      },
      y: {
        grid: { color: 'var(--border-primary)', drawBorder: false },
        ticks: { 
          color: 'var(--text-muted)', 
          font: { family: 'var(--font-sans)', size: 11 },
          callback: (value) => `₹${(value/1000).toFixed(0)}k`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <Line 
      data={chartData} 
      options={options} 
      style={{ height: '100%' }}
    />
  );
}

export default function ExpenseCharts({ expenses, onCategoryFilter, onMerchantFilter }) {
  const categoryTotals = useMemo(() => {
    const totals = {};
    expenses.forEach(item => {
      const cat = item.category || 'Other';
      totals[cat] = (totals[cat] || 0) + (Number(item.amount) || 0);
    });
    return totals;
  }, [expenses]);

  const merchantTotals = useMemo(() => {
    const totals = {};
    expenses.forEach(item => {
      const merch = item.merchant || 'Unknown';
      totals[merch] = (totals[merch] || 0) + (Number(item.amount) || 0);
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([merchant, amount]) => ({ merchant, amount }));
  }, [expenses]);

  const monthlyTrend = useMemo(() => {
    const monthly = {};
    expenses.forEach(item => {
      if (!item.transaction_date) return;
      const date = new Date(item.transaction_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthly[key]) monthly[key] = { key, label, amount: 0 };
      monthly[key].amount += Number(item.amount) || 0;
    });
    return Object.values(monthly)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
      .map(d => ({ month: d.label, amount: d.amount }));
  }, [expenses]);

  return (
    <div className="charts-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
      gap: 'var(--space-5)',
      marginBottom: 'var(--space-6)',
    }}>
      <ChartCard
        title="Category Breakdown"
        subtitle={`${Object.keys(categoryTotals).length} categories`}
        action={onCategoryFilter}
        actionLabel="Filter"
      >
        <CategoryDoughnut 
          data={categoryTotals} 
          onCategorySelect={onCategoryFilter}
        />
      </ChartCard>

      <ChartCard
        title="Top Merchants"
        subtitle={`${merchantTotals.length} merchants`}
        action={onMerchantFilter}
        actionLabel="Filter"
      >
        <MerchantBarChart 
          data={merchantTotals} 
          onBarClick={onMerchantFilter}
        />
      </ChartCard>

      <ChartCard
        title="Monthly Trend"
        subtitle="Last 6 months"
        height={300}
      >
        <MonthlyTrendChart data={monthlyTrend} />
      </ChartCard>
    </div>
  );
}