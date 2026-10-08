import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { 
  Wallet, 
  CreditCard, 
  Tag, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Target,
  DollarSign
} from 'lucide-react';

const KPI_CONFIG = [
  { 
    id: 'total', 
    label: 'Total Spent', 
    icon: Wallet, 
    color: 'primary',
    trendIcon: TrendingUp,
  },
  { 
    id: 'count', 
    label: 'Transactions', 
    icon: CreditCard, 
    color: 'success',
    trendIcon: TrendingUp,
  },
  { 
    id: 'topCategory', 
    label: 'Top Category', 
    icon: Tag, 
    color: 'warning',
    trendIcon: Minus,
  },
  { 
    id: 'avg', 
    label: 'Avg/Transaction', 
    icon: DollarSign, 
    color: 'danger',
    trendIcon: Minus,
  },
];

function AnimatedNumber({ value, format }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: setDisplay,
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return format ? format(display) : Math.round(display);
}

function TrendIndicator({ value, isPositive, icon: Icon }) {
  if (value === null || value === undefined) return null;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)',
    }}>
      <Icon size={12} />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KpiCard({
  title,
  value,
  numericValue,
  formatter,
  subtitle,
  icon: Icon,
  color,
  trendValue,
  trendIcon,
  onClick,
  index = 0
}) {
  const colorMap = {
    primary: { bg: 'var(--accent-primary-muted)', text: 'var(--accent-primary)', iconBg: 'var(--accent-primary)' },
    success: { bg: 'var(--accent-success-muted)', text: 'var(--accent-success)', iconBg: 'var(--accent-success)' },
    warning: { bg: 'var(--accent-warning-muted)', text: 'var(--accent-warning)', iconBg: 'var(--accent-warning)' },
    danger: { bg: 'var(--accent-danger-muted)', text: 'var(--accent-danger)', iconBg: 'var(--accent-danger)' },
  };
  
  const colors = colorMap[color];
  const isPositive = trendValue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      className="card"
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-3)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-lg)',
            background: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={20} color={colors.iconBg} />
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {title}
          </span>
        </div>
        {trendValue !== null && trendValue !== undefined && (
          <TrendIndicator value={trendValue} isPositive={isPositive} icon={trendIcon} />
        )}
      </div>
      <div style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        fontFamily: 'var(--font-heading)',
        color: 'var(--text-primary)',
        lineHeight: 1.2,
        marginBottom: 'var(--space-1)',
      }}>
        {numericValue !== undefined ? <AnimatedNumber value={numericValue} format={formatter} /> : value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
        }}>
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

export default function KpiCards({ expenses, previousExpenses = [] }) {
  const currentMonth = useMemo(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  }, []);

  const prevMonth = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return { month: now.getMonth(), year: now.getFullYear() };
  }, []);

  const filterByMonth = (items, month, year) => 
    items.filter(item => {
      if (!item.transaction_date) return false;
      const date = new Date(item.transaction_date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

  const current = useMemo(() => filterByMonth(expenses, currentMonth.month, currentMonth.year), [expenses, currentMonth]);
  const previous = useMemo(() => filterByMonth(previousExpenses.length ? previousExpenses : expenses, prevMonth.month, prevMonth.year), [previousExpenses, expenses, prevMonth]);

  const totalSpent = current.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const prevTotalSpent = previous.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalTrend = prevTotalSpent > 0 ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 : null;

  const txCount = current.length;
  const prevTxCount = previous.length;
  const countTrend = prevTxCount > 0 ? ((txCount - prevTxCount) / prevTxCount) * 100 : null;

  const categoryTotals = current.reduce((acc, item) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
    return acc;
  }, {});

  let topCategory = 'None';
  let maxCatAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amount]) => {
    if (amount > maxCatAmount) {
      maxCatAmount = amount;
      topCategory = cat;
    }
  });

  const prevCategoryTotals = previous.reduce((acc, item) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
    return acc;
  }, {});

  let prevTopCategory = 'None';
  let prevMaxCatAmount = 0;
  Object.entries(prevCategoryTotals).forEach(([cat, amount]) => {
    if (amount > prevMaxCatAmount) {
      prevMaxCatAmount = amount;
      prevTopCategory = cat;
    }
  });

  const topCategoryTrend = topCategory !== prevTopCategory && prevMaxCatAmount > 0 
    ? ((maxCatAmount - prevMaxCatAmount) / prevMaxCatAmount) * 100 
    : null;

  const avgExpense = txCount > 0 ? totalSpent / txCount : 0;
  const prevAvgExpense = prevTxCount > 0 ? prevTotalSpent / prevTxCount : 0;
  const avgTrend = prevAvgExpense > 0 ? ((avgExpense - prevAvgExpense) / prevAvgExpense) * 100 : null;

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="kpi-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-6)',
    }}>
      <KpiCard
        index={0}
        {...KPI_CONFIG[0]}
        numericValue={totalSpent}
        formatter={formatCurrency}
        subtitle={txCount > 0 ? `${txCount} transactions` : 'No data'}
        trendValue={totalTrend}
      />
      <KpiCard
        index={1}
        {...KPI_CONFIG[1]}
        numericValue={txCount}
        formatter={(v) => Math.round(v).toLocaleString()}
        subtitle={txCount > 0 ? `Avg ${formatCurrency(avgExpense)}` : 'No data'}
        trendValue={countTrend}
      />
      <KpiCard
        index={2}
        {...KPI_CONFIG[2]}
        value={topCategory}
        subtitle={topCategory !== 'None' ? formatCurrency(maxCatAmount) : 'No data'}
        trendValue={topCategoryTrend}
      />
      <KpiCard
        index={3}
        {...KPI_CONFIG[3]}
        numericValue={avgExpense}
        formatter={formatCurrency}
        subtitle={txCount > 0 ? 'Per transaction' : 'No data'}
        trendValue={avgTrend}
      />
    </div>
  );
}