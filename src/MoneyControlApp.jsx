// 1. ASEGURATE DE TENER LA LIBRERÍA RECHARTS
// En Visual Studio Code, abrí la terminal (Ctrl + `) y ejecutá:
// npm install recharts

import React, { useState, useEffect } from 'react';
import {
  Plus, Minus, Calendar, ArrowLeft, Filter, X
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MoneyControlApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', category: '', text: '', type: '' });

  const [formData, setFormData] = useState({
    type: '', amount: '', category: '', customCategory: '', date: getCurrentDate(), recipient: ''
  });

  const incomeCategories = ['Transferencia', 'Depósito', 'Otros'];
  const expenseCategories = ['Transferencia', 'Giros', 'Extracción', 'Otros'];

  function getCurrentDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  const formatDate = (dateString) => new Date(dateString + 'T00:00:00').toLocaleDateString('es-PY');

  const formatCurrency = (amount) => new Intl.NumberFormat('es-PY', {
    style: 'currency', currency: 'PYG'
  }).format(amount);

  useEffect(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed);
      const bal = parsed.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
      setBalance(bal);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const resetForm = () => setFormData({ type: '', amount: '', category: '', customCategory: '', date: getCurrentDate(), recipient: '' });
  const resetFilters = () => setFilters({ dateFrom: '', dateTo: '', category: '', text: '', type: '' });

  const isFormValid = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) return false;
    if (!formData.category) return false;
    if (formData.category === 'Otros' && !formData.customCategory.trim()) return false;
    if (formData.type === 'expense' && !formData.recipient.trim()) return false;
    if (!formData.date) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    const amount = parseFloat(formData.amount);
    const finalCategory = formData.category === 'Otros' ? formData.customCategory : formData.category;

    let updatedTransactions;
    if (editingId) {
      updatedTransactions = transactions.map(t => t.id === editingId ? { ...t, amount, category: finalCategory, date: formData.date, recipient: formData.recipient || null } : t);
      setEditingId(null);
    } else {
      updatedTransactions = [...transactions, { id: Date.now(), type: formData.type, amount, category: finalCategory, date: formData.date, recipient: formData.recipient || null }];
    }

    setTransactions(updatedTransactions);
    const newBalance = updatedTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
    setBalance(newBalance);
    resetForm();
    setCurrentView('home');
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: incomeCategories.includes(transaction.category) || expenseCategories.includes(transaction.category) ? transaction.category : 'Otros',
      customCategory: incomeCategories.includes(transaction.category) || expenseCategories.includes(transaction.category) ? '' : transaction.category,
      date: transaction.date,
      recipient: transaction.recipient || ''
    });
    setCurrentView('form');
  };

  const getFilteredTransactions = () => transactions.filter(t => {
    if (filters.dateFrom && t.date < filters.dateFrom) return false;
    if (filters.dateTo && t.date > filters.dateTo) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.text) {
      const txt = filters.text.toLowerCase();
      if (!t.category.toLowerCase().includes(txt) && !(t.recipient || '').toLowerCase().includes(txt)) return false;
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Tipo', 'Categoría', 'Fecha', 'Monto', 'Destinatario'];
    const rows = getFilteredTransactions().map(t => [t.type, t.category, t.date, t.amount, t.recipient || '']);
    const csvContent = [headers, ...rows].map(row => row.map(val => `"${val}"`).join(',')).join('
');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'movimientos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = [
    {
      name: 'Entradas',
      value: getFilteredTransactions().filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    },
    {
      name: 'Salidas',
      value: getFilteredTransactions().filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    }
  ];

  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-blue-600 text-white p-6 rounded-lg mb-6 text-center">
          <h1 className="text-xl font-bold mb-2">Control de Dinero</h1>
          <div className="text-3xl font-bold break-words overflow-hidden">
            {formatCurrency(balance)}
          </div>
          <p className="text-blue-100">Saldo Total</p>
        </div>

        <button
          onClick={exportToCSV}
          className="w-full bg-emerald-500 text-white p-3 rounded-lg font-semibold mb-4"
        >
          Descargar CSV
        </button>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-center font-semibold mb-4">Resumen Gráfico</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Aquí continuaría el resto del contenido como la lista de transacciones, formulario, etc. */}
      </div>
    </div>
  );
};

export default MoneyControlApp;
