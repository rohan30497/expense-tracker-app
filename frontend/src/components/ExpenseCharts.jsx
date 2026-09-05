import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function ExpenseCharts({ expenses }) {
  // 1. Prepare Category Totals
  const categoryTotals = {};
  expenses.forEach(item => {
    const cat = item.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.amount) || 0);
  });

  const categoryLabels = Object.keys(categoryTotals);
  const categoryValues = Object.values(categoryTotals);

  const doughnutColors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#64748b'  // Slate
  ];

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: doughnutColors.slice(0, categoryLabels.length),
        borderColor: '#1e293b',
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Inter', size: 12 },
          padding: 12
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ₹${context.raw.toLocaleString('en-IN')}`
        }
      }
    }
  };

  // 2. Prepare Merchant Bar Chart
  const merchantTotals = {};
  expenses.forEach(item => {
    const merch = item.merchant || 'Unknown';
    merchantTotals[merch] = (merchantTotals[merch] || 0) + (Number(item.amount) || 0);
  });

  // Sort top 6 merchants
  const sortedMerchants = Object.entries(merchantTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const barData = {
    labels: sortedMerchants.map(m => m[0]),
    datasets: [
      {
        label: 'Spent (₹)',
        data: sortedMerchants.map(m => m[1]),
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 8
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ₹${context.raw.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
        grid: { display: false }
      },
      y: {
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  return (
    <div className="charts-grid">
      <div className="glass-card">
        <div className="chart-title">
          <span>Category Breakdown</span>
        </div>
        <div className="chart-container">
          {categoryLabels.length > 0 ? (
            <Doughnut data={doughnutData} options={doughnutOptions} />
          ) : (
            <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#94a3b8' }}>
              No expenses recorded yet
            </div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <div className="chart-title">
          <span>Top Merchants</span>
        </div>
        <div className="chart-container">
          {sortedMerchants.length > 0 ? (
            <Bar data={barData} options={barOptions} />
          ) : (
            <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#94a3b8' }}>
              No expenses recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
