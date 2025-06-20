import { useEffect } from 'react';
import React, { useState } from 'react';
import { Plus, Minus, Calendar, ArrowLeft, Filter, X, Download, PieChart, DollarSign } from 'lucide-react';

const MoneyControlApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para filtros
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    text: '',
    type: ''
  });

  
  useEffect(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed);
      const balance = parsed.reduce((acc, t) => {
        if (t.type === 'income') {
          return acc + t.amount;
        } else if (t.type === 'expense') {
          return acc - t.amount;
        } else if (t.type === 'loan') {
          // Los préstamos prestados reducen el balance, los abonos lo aumentan
          return t.category === 'Prestado' ? acc - t.amount : acc + t.amount;
        }
        return acc;
      }, 0);
      setBalance(balance);
    }
  }, []);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    category: '',
    customCategory: '',
    date: getCurrentDate(),
    recipient: '',
    observations: ''
  });

  // Función para obtener la fecha actual en formato correcto
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Función mejorada para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para formatear moneda completa (sin abreviaciones)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para formatear moneda compacta para móviles (números completos)
  const formatCurrencyMobile = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para descargar CSV
  const downloadCSV = () => {
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
      alert('No hay transacciones para exportar');
      return;
    }

    const headers = ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Destinatario', 'Observaciones'];
    const csvData = [headers];

    filteredTransactions.forEach(transaction => {
      let typeText = '';
      if (transaction.type === 'income') typeText = 'Entrada';
      else if (transaction.type === 'expense') typeText = 'Salida';
      else if (transaction.type === 'loan') typeText = `Préstamo - ${transaction.category}`;

      csvData.push([
        formatDate(transaction.date),
        typeText,
        transaction.category,
        formatCurrency(transaction.amount),
        transaction.recipient || '',
        transaction.observations || ''
      ]);
    });

    // Agregar resumen al final
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalLoaned = filteredTransactions.filter(t => t.type === 'loan' && t.category === 'Prestado').reduce((sum, t) => sum + t.amount, 0);
    const totalReturned = filteredTransactions.filter(t => t.type === 'loan' && t.category === 'Abono').reduce((sum, t) => sum + t.amount, 0);
    const netTotal = totalIncome - totalExpense - totalLoaned + totalReturned;

    csvData.push([]);
    csvData.push(['RESUMEN']);
    csvData.push(['Total Entradas', '', '', formatCurrency(totalIncome), '', '']);
    csvData.push(['Total Salidas', '', '', formatCurrency(totalExpense), '', '']);
    csvData.push(['Total Prestado', '', '', formatCurrency(totalLoaned), '', '']);
    csvData.push(['Total Devuelto', '', '', formatCurrency(totalReturned), '', '']);
    csvData.push(['Balance Neto', '', '', formatCurrency(netTotal), '', '']);

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `movimientos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para obtener datos del gráfico de torta (incluye préstamos)
  const getChartData = () => {
    const filteredTransactions = getFilteredTransactions();
    const categoryTotals = {};

    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'expense' || (transaction.type === 'loan' && transaction.category === 'Prestado')) {
        const categoryName = transaction.type === 'loan' ? `Préstamo - ${transaction.category}` : transaction.category;
        if (categoryTotals[categoryName]) {
          categoryTotals[categoryName] += transaction.amount;
        } else {
          categoryTotals[categoryName] = transaction.amount;
        }
      }
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: ((amount / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    }));
  };

  // Componente simple para el gráfico de torta
  const SimpleChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

    const createPath = (centerX, centerY, radius, startAngle, endAngle) => {
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
    };

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    return (
      <div className="space-y-4">
        <svg width="300" height="300" className="mx-auto">
          {data.map((item, index) => {
            const angle = (item.value / total) * 360;
            const path = createPath(150, 150, 120, currentAngle, currentAngle + angle);
            currentAngle += angle;
            
            return (
              <path
                key={index}
                d={path}
                fill={COLORS[index % COLORS.length]}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        {/* Leyenda */}
        <div className="space-y-2">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm">{entry.name}</span>
              </div>
              <div className="text-sm font-medium">
                {entry.percentage}% ({formatCurrency(entry.value)})
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const incomeCategories = ['Transferencia', 'Depósito', 'Otros'];
  const expenseCategories = ['Transferencia', 'Giros', 'Extracción', 'Otros'];
  const loanCategories = ['Prestado', 'Abono'];

  const resetForm = () => {
    setFormData({
      type: '',
      amount: '',
      category: '',
      customCategory: '',
      date: getCurrentDate(),
      recipient: '',
      observations: ''
    });
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      text: '',
      type: ''
    });
  };

  const isFormValid = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) return false;
    if (!formData.category) return false;
    if (formData.category === 'Otros' && !formData.customCategory.trim()) return false;
    if (formData.type === 'expense' && !formData.recipient.trim()) return false;
    if (formData.type === 'loan' && !formData.observations.trim()) return false;
    if (!formData.date) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    const amount = parseFloat(formData.amount);
    const finalCategory = formData.category === 'Otros' ? formData.customCategory : formData.category;
    
    if (editingId) {
      // Editando transacción existente
      const updatedTransactions = transactions.map(t => 
        t.id === editingId 
          ? {
              ...t,
              amount: amount,
              category: finalCategory,
              date: formData.date,
              recipient: formData.recipient || null,
              observations: formData.observations || null
            }
          : t
      );
      
      setTransactions(updatedTransactions);
      
      // Recalcular balance
      let newBalance = 0;
      updatedTransactions.forEach(t => {
        if (t.type === 'income') {
          newBalance += t.amount;
        } else if (t.type === 'expense') {
          newBalance -= t.amount;
        } else if (t.type === 'loan') {
          newBalance += t.category === 'Prestado' ? -t.amount : t.amount;
        }
      });
      setBalance(newBalance);
      
      setEditingId(null);
    } else {
      // Nueva transacción
      const newTransaction = {
        id: Date.now(),
        type: formData.type,
        amount: amount,
        category: finalCategory,
        date: formData.date,
        recipient: formData.recipient || null,
        observations: formData.observations || null
      };

      setTransactions([...transactions, newTransaction]);
      
      // Actualizar balance
      if (formData.type === 'income') {
        setBalance(balance + amount);
      } else if (formData.type === 'expense') {
        setBalance(balance - amount);
      } else if (formData.type === 'loan') {
        // Prestado reduce el balance, Abono lo aumenta
        setBalance(balance + (finalCategory === 'Prestado' ? -amount : amount));
      }
    }

    resetForm();
    setCurrentView('home');
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.type === 'loan' ? transaction.category :
        (incomeCategories.includes(transaction.category) || expenseCategories.includes(transaction.category) 
        ? transaction.category 
        : 'Otros'),
      customCategory: transaction.type !== 'loan' && 
        !incomeCategories.includes(transaction.category) && 
        !expenseCategories.includes(transaction.category) 
        ? transaction.category : '',
      date: transaction.date,
      recipient: transaction.recipient || '',
      observations: transaction.observations || ''
    });
    setCurrentView('form');
  };

  
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Función para filtrar transacciones
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Filtro por fecha desde
      if (filters.dateFrom && transaction.date < filters.dateFrom) {
        return false;
      }

      // Filtro por fecha hasta
      if (filters.dateTo && transaction.date > filters.dateTo) {
        return false;
      }

      // Filtro por categoría
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Filtro por tipo
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      // Filtro por texto (busca en categoría, destinatario y observaciones)
      if (filters.text) {
        const searchText = filters.text.toLowerCase();
        const categoryMatch = transaction.category.toLowerCase().includes(searchText);
        const recipientMatch = transaction.recipient && transaction.recipient.toLowerCase().includes(searchText);
        const observationsMatch = transaction.observations && transaction.observations.toLowerCase().includes(searchText);
        if (!categoryMatch && !recipientMatch && !observationsMatch) {
          return false;
        }
      }

      return true;
    });
  };

  // Obtener todas las categorías únicas para el filtro
  const getAllCategories = () => {
    const categories = [...new Set(transactions.map(t => t.category))];
    return categories.sort();
  };

  // Vista del gráfico
  if (currentView === 'chart') {
    const chartData = getChartData();
    const hasExpenseData = chartData.length > 0;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setCurrentView('details')}
              className="p-2 rounded-lg bg-white shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold flex-1">Gráfico de Gastos</h1>
          </div>

          {/* Gráfico */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            {hasExpenseData ? (
              <SimpleChart data={chartData} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PieChart size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay datos de gastos para mostrar</p>
                <p className="text-sm">Los gráficos muestran salidas de dinero y préstamos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista principal
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header con saldo */}
          <div className="bg-blue-600 text-white p-6 rounded-lg mb-6 text-center">
            <h1 className="text-xl font-bold mb-2">Control de Dinero</h1>
            <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
            <p className="text-blue-100">Saldo Total</p>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => {
                resetForm();
                setFormData(prev => ({...prev, type: 'income'}));
                setCurrentView('form');
              }}
              className="bg-green-500 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 font-semibold text-sm"
            >
              <Plus size={18} />
              <span>Entrada</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setFormData(prev => ({...prev, type: 'expense'}));
                setCurrentView('form');
              }}
              className="bg-red-500 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 font-semibold text-sm"
            >
              <Minus size={18} />
              <span>Salida</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setFormData(prev => ({...prev, type: 'loan'}));
                setCurrentView('form');
              }}
              className="bg-orange-500 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 font-semibold text-sm"
            >
              <DollarSign size={18} />
              <span>Préstamo</span>
            </button>
          </div>

          {/* Botón Ver Detalles */}
          <div className="mb-6">
            <button
              onClick={() => setCurrentView('details')}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold"
            >
              Ver Movimientos Detallados
            </button>
          </div>

          {/* Historial de transacciones */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Movimientos Recientes</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No hay movimientos registrados
                </div>
              ) : (
                transactions.slice().reverse().slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            transaction.type === 'income' ? 'bg-green-500' : 
                            transaction.type === 'expense' ? 'bg-red-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="font-medium text-sm truncate">{transaction.category}</span>
                          {transaction.type === 'loan' && (
                            <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                              transaction.category === 'Prestado' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {transaction.category}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(transaction.date)}
                        </div>
                        {transaction.recipient && (
                          <div className="text-xs text-gray-600 truncate">
                            Para: {transaction.recipient}
                          </div>
                        )}
                        {transaction.observations && (
                          <div className="text-xs text-gray-600 truncate">
                            {transaction.observations}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 min-w-0">
                        <div className={`font-bold text-xs leading-tight break-all ${
                          transaction.type === 'income' ? 'text-green-600' : 
                          transaction.type === 'expense' ? 'text-red-600' :
                          transaction.category === 'Prestado' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrencyMobile(transaction.amount)}
                        </div>
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de detalles con filtros
  if (currentView === 'details') {
    const filteredTransactions = getFilteredTransactions();
    const hasActiveFilters = Object.values(filters).some(value => value !== '');
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalLoaned = filteredTransactions.filter(t => t.type === 'loan' && t.category === 'Prestado').reduce((sum, t) => sum + t.amount, 0);
    const totalReturned = filteredTransactions.filter(t => t.type === 'loan' && t.category === 'Abono').reduce((sum, t) => sum + t.amount, 0);
    const netTotal = totalIncome - totalExpense - totalLoaned + totalReturned;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className="p-2 rounded-lg bg-white shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold flex-1">Movimientos Detallados</h1>
            <button
              onClick={() => setCurrentView('chart')}
              className="p-2 rounded-lg bg-white shadow-sm"
              title="Ver Gráfico"
            >
              <PieChart size={20} />
            </button>
            <button
              onClick={downloadCSV}
              className="p-2 rounded-lg bg-green-500 text-white shadow-sm"
              title="Descargar CSV"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg shadow-sm ${hasActiveFilters ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              <Filter size={20} />
            </button>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Filtros</h3>
                <button
                  onClick={() => {
                    resetFilters();
                    setShowFilters(false);
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Limpiar
                </button>
              </div>

              <div className="space-y-3">
                {/* Filtro de fecha */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Desde</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Filtro por tipo */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="income">Entradas</option>
                    <option value="expense">Salidas</option>
                    <option value="loan">Préstamos</option>
                  </select>
                </div>

                {/* Filtro por categoría */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Categoría</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Todas</option>
                    {getAllCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por texto */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Buscar texto</label>
                  <input
                    type="text"
                    value={filters.text}
                    onChange={(e) => setFilters({...filters, text: e.target.value})}
                    placeholder="Buscar en categorías, destinatarios y observaciones..."
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumen mejorado con préstamos */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-600 mb-1">Total</div>
                <div className="font-bold text-blue-600 text-xs leading-tight break-all">
                  {formatCurrencyMobile(netTotal)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-600 mb-1">Entradas</div>
                <div className="font-bold text-green-600 text-xs leading-tight break-all">
                  {formatCurrencyMobile(totalIncome)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="min-w-0">
                <div className="text-xs text-gray-600 mb-1">Salidas</div>
                <div className="font-bold text-red-600 text-xs leading-tight break-all">
                  {formatCurrencyMobile(totalExpense)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-600 mb-1">Pendiente</div>
                <div className="font-bold text-orange-600 text-xs leading-tight break-all">
                  {formatCurrencyMobile(totalLoaned - totalReturned)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-600 mb-1">Devuelto</div>
                <div className="font-bold text-green-600 text-xs leading-tight break-all">
                  {formatCurrencyMobile(totalReturned)}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de transacciones filtradas */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">
                {hasActiveFilters ? 'Resultados Filtrados' : 'Todos los Movimientos'} ({filteredTransactions.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {hasActiveFilters ? 'No se encontraron movimientos con los filtros aplicados' : 'No hay movimientos registrados'}
                </div>
              ) : (
                filteredTransactions.slice().reverse().map((transaction) => (
                  <div key={transaction.id} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            transaction.type === 'income' ? 'bg-green-500' : 
                            transaction.type === 'expense' ? 'bg-red-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="font-medium text-sm">{transaction.category}</span>
                          <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.type === 'expense'
                              ? 'bg-red-100 text-red-800'
                              : transaction.category === 'Prestado'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type === 'income' ? 'Entrada' : 
                             transaction.type === 'expense' ? 'Salida' : 
                             transaction.category}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>📅 {formatDate(transaction.date)}</div>
                          {transaction.recipient && (
                            <div className="break-words">👤 Para: {transaction.recipient}</div>
                          )}
                          {transaction.observations && (
                            <div className="break-words">💭 {transaction.observations}</div>
                          )}
                          <div className="flex items-center gap-2">
                            <span>💰 Monto:</span>
                            <span className={`font-semibold text-xs break-all ${
                              transaction.type === 'income' ? 'text-green-600' : 
                              transaction.type === 'expense' ? 'text-red-600' :
                              transaction.category === 'Prestado' ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {(transaction.type === 'expense' || (transaction.type === 'loan' && transaction.category === 'Prestado')) ? '-' : '+'}{formatCurrencyMobile(transaction.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex-shrink-0"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista del formulario
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              setCurrentView('home');
              if (editingId) {
                setEditingId(null);
                resetForm();
              }
            }}
            className="p-2 rounded-lg bg-white shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">
            {editingId ? 'Editar' : 'Nueva'} {
              formData.type === 'income' ? 'Entrada' : 
              formData.type === 'expense' ? 'Salida' : 'Préstamo'
            }
          </h1>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'loan' ? 'Motivo *' : 'Categoría *'}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value, customCategory: ''})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{formData.type === 'loan' ? 'Seleccionar motivo' : 'Seleccionar categoría'}</option>
              {(formData.type === 'income' ? incomeCategories : 
                formData.type === 'expense' ? expenseCategories : 
                loanCategories).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Campo personalizado para "Otros" */}
          {formData.category === 'Otros' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especificar categoría *
              </label>
              <input
                type="text"
                value={formData.customCategory}
                onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                placeholder="Escribir categoría personalizada"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Destinatario (solo para salidas) */}
          {formData.type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinatario *
              </label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                placeholder="Nombre del destinatario"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Observaciones para préstamos */}
          {formData.type === 'loan' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.category === 'Prestado' ? 'Observaciones del préstamo *' : 
                 formData.category === 'Abono' ? 'Observaciones del abono *' : 'Observaciones *'}
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
                placeholder={
                  formData.category === 'Prestado' ? 'Especificar a quién se le prestó y motivo...' :
                  formData.category === 'Abono' ? 'Especificar de quién viene la devolución...' :
                  'Escribir observaciones...'
                }
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Fecha de la operación *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setCurrentView('home');
                if (editingId) {
                  setEditingId(null);
                  resetForm();
                }
              }}
              className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className={`flex-1 p-3 rounded-lg text-white font-medium transition-colors ${
                isFormValid()
                  ? formData.type === 'income' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : formData.type === 'expense'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {editingId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyControlApp;