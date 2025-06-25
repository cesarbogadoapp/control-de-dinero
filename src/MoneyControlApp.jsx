import React, { useState } from 'react';
import { Plus, Minus, DollarSign, Moon, Sun, Lock, Key, LogOut, Shield, Settings } from 'lucide-react';

const MoneyControlApp = () => {
  // Agregar manifest PWA cuando se monte el componente
  React.useEffect(() => {
    // Crear el manifest para PWA
    const manifest = {
      name: "Control de Dinero",
      short_name: "Guaraní",
      description: "Aplicación para gestionar tus finanzas personales",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#10b981",
      orientation: "portrait",
      icons: [
        {
          src: "data:image/svg+xml;base64," + btoa(`
            <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
              <rect width="192" height="192" rx="32" fill="#10b981"/>
              <text x="96" y="130" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="120">G</text>
            </svg>
          `),
          sizes: "192x192",
          type: "image/svg+xml"
        },
        {
          src: "data:image/svg+xml;base64," + btoa(`
            <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <rect width="512" height="512" rx="85" fill="#10b981"/>
              <text x="256" y="340" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="320">G</text>
            </svg>
          `),
          sizes: "512x512",
          type: "image/svg+xml"
        }
      ]
    };

    // Crear y agregar el manifest al DOM
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestURL;

    // Agregar meta tags para PWA
    const addMetaTag = (name, content, property = false) => {
      let meta = document.querySelector(`meta[${property ? 'property' : 'name'}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(property ? 'property' : 'name', name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    addMetaTag('theme-color', '#10b981');
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    addMetaTag('apple-mobile-web-app-title', 'Guaraní');
    addMetaTag('mobile-web-app-capable', 'yes');
    addMetaTag('application-name', 'Control de Dinero');

    // Agregar apple-touch-icon
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = "data:image/svg+xml;base64," + btoa(`
      <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" rx="30" fill="#10b981"/>
        <text x="90" y="125" text-anchor="middle" fill="white" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600" font-size="110">G</text>
      </svg>
    `);

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  // Effect para detectar evento de instalación PWA
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    
    setDeferredPrompt(null);
  };

  // Funciones utilitarias
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-PY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return '₲ ' + amount.toLocaleString();
  };

  // Funciones para localStorage
  const saveToStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  };

  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error('Error cargando de localStorage:', error);
      return defaultValue;
    }
  };

  // Estados principales
  const [isDark, setIsDark] = useState(() => loadFromStorage('isDark', false));
  const [currentView, setCurrentView] = useState('home');
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para splash screen y autenticación
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [lastActivity, setLastActivity] = useState(() => loadFromStorage('lastActivity', Date.now()));
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [storedPin, setStoredPin] = useState(() => loadFromStorage('userPin', ''));
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: ''
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Forzar junio 2025 como mes actual hasta que sea julio
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 0-11 -> 1-12
    
    // Si estamos en 2025 y es antes de julio, usar junio
    if (currentYear === 2025 && currentMonth <= 6) {
      console.log('Forzando junio 2025 como mes actual');
      return '2025-06';
    }
    
    // Para otros casos, usar mes actual
    const monthStr = String(currentMonth).padStart(2, '0');
    const result = `${currentYear}-${monthStr}`;
    console.log('Mes inicial calculado:', result);
    return result;
  });

  // Categorías personalizables
  const [customCategories, setCustomCategories] = useState(() => 
    loadFromStorage('customCategories', {
      income: ['Salario', 'Venta', 'Freelance', 'Inversión', 'Regalo'],
      expense: ['Comida', 'Transporte', 'Giros', 'Entretenimiento', 'Salud'],
      loan: ['Prestado', 'Abono', 'Devolución']
    })
  );

  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryTypeToEdit, setCategoryTypeToEdit] = useState('income');

  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    category: '',
    date: getTodayDate(),
    observations: ''
  });

  const [transactions, setTransactions] = useState(() => 
    loadFromStorage('transactions', [
      {
        id: 1,
        type: 'income',
        amount: 5000000,
        category: 'Salario',
        date: '2025-06-15',
        observations: 'Salario mensual'
      },
      {
        id: 2,
        type: 'expense',
        amount: 150000,
        category: 'Comida',
        date: '2025-06-20',
        observations: 'Supermercado'
      },
      {
        id: 3,
        type: 'expense',
        amount: 500000,
        category: 'Transporte',
        date: '2025-06-18',
        observations: 'Combustible'
      },
      {
        id: 4,
        type: 'loan',
        amount: 200000,
        category: 'Prestado',
        date: '2025-06-10',
        observations: 'Préstamo a Juan'
      },
      {
        id: 5,
        type: 'loan',
        amount: 50000,
        category: 'Abono',
        date: '2025-06-21',
        observations: 'Abono de Juan'
      }
    ])
  );

  const [balance, setBalance] = useState(() => {
    const savedBalance = loadFromStorage('balance', null);
    if (savedBalance !== null) return savedBalance;
    
    // Calcular balance inicial desde transacciones
    const initialTransactions = [
      { id: 1, type: 'income', amount: 5000000, category: 'Salario', date: '2025-06-15', observations: 'Salario mensual' },
      { id: 2, type: 'expense', amount: 150000, category: 'Comida', date: '2025-06-20', observations: 'Supermercado' },
      { id: 3, type: 'expense', amount: 500000, category: 'Transporte', date: '2025-06-18', observations: 'Combustible' },
      { id: 4, type: 'loan', amount: 200000, category: 'Prestado', date: '2025-06-10', observations: 'Préstamo a Juan' },
      { id: 5, type: 'loan', amount: 50000, category: 'Abono', date: '2025-06-21', observations: 'Abono de Juan' }
    ];
    
    return initialTransactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      if (t.type === 'loan') {
        if (t.category === 'Prestado') return acc - t.amount;
        if (t.category === 'Abono' || t.category === 'Devolución') return acc + t.amount;
      }
      return acc;
    }, 0);
  });

  // Funciones principales
  const recalculateBalance = () => {
    const calculatedBalance = transactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      if (t.type === 'loan') {
        if (t.category === 'Prestado') return acc - t.amount;
        if (t.category === 'Abono' || t.category === 'Devolución') return acc + t.amount;
      }
      return acc;
    }, 0);
    
    if (calculatedBalance !== balance) {
      setBalance(calculatedBalance);
      saveToStorage('balance', calculatedBalance);
      console.log('Balance recalculado:', calculatedBalance);
    }
    
    return calculatedBalance;
  };

  // Funciones para autenticación y seguridad
  const updateActivity = () => {
    const now = Date.now();
    setLastActivity(now);
    saveToStorage('lastActivity', now);
  };

  const checkSessionValidity = () => {
    const savedActivity = loadFromStorage('lastActivity', 0);
    const now = Date.now();
    const inactiveTime = now - savedActivity;
    const tenMinutes = 10 * 60 * 1000; // 10 minutos
    
    return inactiveTime < tenMinutes;
  };

  const requestBiometricAuth = async () => {
    try {
      // Verificar si hay API de autenticación disponible
      if ('navigator' in window && 'credentials' in navigator && 'create' in navigator.credentials) {
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: "Control de Dinero" },
            user: {
              id: new Uint8Array(16),
              name: "usuario",
              displayName: "Usuario"
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            },
            timeout: 30000
          }
        });
        
        if (credential) {
          setIsAuthenticated(true);
          setAuthError('');
          updateActivity();
          return true;
        }
      }
    } catch (error) {
      console.log('Biometric auth not available:', error);
    }
    
    // Si no hay biometría disponible, mostrar PIN
    setShowPinInput(true);
    return false;
  };

  const handlePinSubmit = () => {
    if (!storedPin) {
      // Primera vez - configurar PIN
      if (pinInput.length >= 4) {
        setStoredPin(pinInput);
        saveToStorage('userPin', pinInput);
        setIsAuthenticated(true);
        setShowPinInput(false);
        setPinInput('');
        setIsSettingNewPin(false);
        setAuthError('');
        updateActivity();
      } else {
        setAuthError('El PIN debe tener al menos 4 dígitos');
      }
    } else {
      // Verificar PIN existente
      if (pinInput === storedPin) {
        setIsAuthenticated(true);
        setShowPinInput(false);
        setPinInput('');
        setAuthError('');
        updateActivity();
      } else {
        setAuthError('PIN incorrecto');
        setPinInput('');
      }
    }
  };

  const lockApp = () => {
    setIsAuthenticated(false);
    setShowPinInput(false);
    setPinInput('');
    setAuthError('');
    setSessionExpired(true);
    setSessionClosed(false);
    // No limpiar lastActivity aquí para distinguir entre bloqueo manual y automático
  };

  const logoutApp = () => {
    setIsAuthenticated(false);
    setShowPinInput(false);
    setPinInput('');
    setAuthError('');
    setSessionExpired(false);
    setSessionClosed(true);
    setShowLogoutConfirm(false);
    // Limpiar completamente la sesión
    saveToStorage('lastActivity', 0);
  };

  // Effect para el splash screen
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Verificar si la sesión sigue válida después del splash
      setTimeout(() => {
        if (!storedPin) {
          // Primera vez - configurar PIN
          setIsSettingNewPin(true);
          setShowPinInput(true);
        } else if (checkSessionValidity() && !sessionExpired && !sessionClosed) {
          // Sesión válida - entrar directamente
          setIsAuthenticated(true);
          updateActivity();
        } else {
          // Sesión expirada o cerrada - pedir autenticación
          requestBiometricAuth();
        }
      }, 100);
    }, 2000); // Cambiado a 2 segundos

    return () => clearTimeout(timer);
  }, []);

  // Effect para auto-bloqueo por inactividad
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      const tenMinutes = 10 * 60 * 1000; // 10 minutos en millisegundos

      if (inactiveTime > tenMinutes) {
        lockApp();
      }
    };

    const interval = setInterval(checkInactivity, 30000); // Verificar cada 30 segundos

    // Agregar event listeners para detectar actividad
    const events = ['click', 'touch', 'keydown', 'scroll', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [isAuthenticated, lastActivity]);

  // Recalcular balance cuando cambien las transacciones
  React.useEffect(() => {
    if (isAuthenticated) {
      recalculateBalance();
    }
  }, [transactions, isAuthenticated]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    saveToStorage('isDark', newDarkMode);
  };

  // Funciones para manejar categorías personalizadas
  const addCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const updatedCategories = {
      ...customCategories,
      [categoryTypeToEdit]: [...customCategories[categoryTypeToEdit], newCategoryName.trim()]
    };
    
    setCustomCategories(updatedCategories);
    saveToStorage('customCategories', updatedCategories);
    setNewCategoryName('');
  };

  const removeCustomCategory = (type, categoryToRemove) => {
    const updatedCategories = {
      ...customCategories,
      [type]: customCategories[type].filter(cat => cat !== categoryToRemove)
    };
    
    setCustomCategories(updatedCategories);
    saveToStorage('customCategories', updatedCategories);
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.category || !formData.observations.trim()) return;
    
    const amount = parseFloat(formData.amount);
    
    if (editingId) {
      // Editar transacción existente
      const oldTransaction = transactions.find(t => t.id === editingId);
      const updatedTransactions = transactions.map(t => 
        t.id === editingId ? {...formData, id: editingId, amount: amount} : t
      );
      setTransactions(updatedTransactions);
      saveToStorage('transactions', updatedTransactions);
      
      // Calcular nuevo balance
      let newBalance = balance;
      
      // Revertir el efecto de la transacción anterior
      if (oldTransaction.type === 'income') {
        newBalance -= oldTransaction.amount;
      } else if (oldTransaction.type === 'expense') {
        newBalance += oldTransaction.amount;
      } else if (oldTransaction.type === 'loan') {
        if (oldTransaction.category === 'Prestado') {
          newBalance += oldTransaction.amount;
        } else if (oldTransaction.category === 'Abono' || oldTransaction.category === 'Devolución') {
          newBalance -= oldTransaction.amount;
        }
      }

      // Aplicar el efecto de la nueva transacción
      if (formData.type === 'income') {
        newBalance += amount;
      } else if (formData.type === 'expense') {
        newBalance -= amount;
      } else if (formData.type === 'loan') {
        if (formData.category === 'Prestado') {
          newBalance -= amount;
        } else if (formData.category === 'Abono' || formData.category === 'Devolución') {
          newBalance += amount;
        }
      }

      setBalance(newBalance);
      saveToStorage('balance', newBalance);
      setEditingId(null);
    } else {
      // Crear nueva transacción
      const newTransaction = {
        id: Date.now(),
        type: formData.type,
        amount: amount,
        category: formData.category,
        date: formData.date,
        observations: formData.observations
      };

      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      saveToStorage('transactions', updatedTransactions);
      
      let newBalance = balance;
      if (newTransaction.type === 'income') {
        newBalance = balance + amount;
      } else if (newTransaction.type === 'expense') {
        newBalance = balance - amount;
      } else if (newTransaction.type === 'loan') {
        if (newTransaction.category === 'Prestado') {
          newBalance = balance - amount;
        } else if (newTransaction.category === 'Abono' || newTransaction.category === 'Devolución') {
          newBalance = balance + amount;
        }
      }

      setBalance(newBalance);
      saveToStorage('balance', newBalance);
    }

    // Limpiar formulario y regresar al home
    setFormData({
      type: 'income',
      amount: '',
      category: '',
      date: getTodayDate(),
      observations: ''
    });
    
    setCurrentView('home');
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: transaction.date,
      observations: transaction.observations || ''
    });
    setCurrentView('form');
  };

  const handleDelete = () => {
    const transactionToDelete = transactions.find(t => t.id === editingId);
    if (!transactionToDelete) return;

    let newBalance = balance;
    if (transactionToDelete.type === 'income') {
      newBalance = balance - transactionToDelete.amount;
    } else if (transactionToDelete.type === 'expense') {
      newBalance = balance + transactionToDelete.amount;
    } else if (transactionToDelete.type === 'loan') {
      if (transactionToDelete.category === 'Prestado') {
        newBalance = balance + transactionToDelete.amount;
      } else if (transactionToDelete.category === 'Abono' || transactionToDelete.category === 'Devolución') {
        newBalance = balance - transactionToDelete.amount;
      }
    }

    const updatedTransactions = transactions.filter(t => t.id !== editingId);
    setTransactions(updatedTransactions);
    setBalance(newBalance);
    
    saveToStorage('transactions', updatedTransactions);
    saveToStorage('balance', newBalance);
    
    setEditingId(null);
    setShowDeleteConfirm(false);
    setCurrentView('home');
  };

  const getMonthlyData = (monthYear) => {
    console.log('Analizando mes:', monthYear);
    console.log('Transacciones disponibles:', transactions.map(t => ({date: t.date, category: t.category, amount: t.amount})));
    
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthYear));
    console.log('Transacciones del mes:', monthTransactions);
    
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const loans = monthTransactions.filter(t => t.type === 'loan').reduce((sum, t) => sum + t.amount, 0);
    
    const result = {
      transactions: monthTransactions,
      income,
      expense,
      loans,
      net: income - expense - loans,
      total: monthTransactions.length
    };
    
    console.log('Datos del mes calculados:', result);
    return result;
  };

  const getExpensesByCategory = (monthYear = null) => {
    let expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    // Si se proporciona un mes, filtrar solo por ese mes
    if (monthYear) {
      expenseTransactions = expenseTransactions.filter(t => t.date.startsWith(monthYear));
      console.log('Gastos filtrados para', monthYear, ':', expenseTransactions);
    }
    
    const categoryTotals = {};
    
    expenseTransactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0
    }));
  };

  const getLoanBalance = () => {
    const loanTransactions = transactions.filter(t => t.type === 'loan');
    const categoryTotals = {};
    
    loanTransactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const prestado = categoryTotals['Prestado'] || 0;
    const devuelto = (categoryTotals['Abono'] || 0) + (categoryTotals['Devolución'] || 0);
    const pendiente = prestado - devuelto;
    
    return {
      prestado,
      devuelto,
      pendiente
    };
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      const matchesDate = (!filters.startDate || transaction.date >= filters.startDate) &&
                         (!filters.endDate || transaction.date <= filters.endDate);
      const matchesType = !filters.type || transaction.type === filters.type;
      const matchesCategory = !filters.category || transaction.category === filters.category;
      
      return matchesDate && matchesType && matchesCategory;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
      category: ''
    });
  };

  const exportCSV = () => {
    const filteredData = getFilteredTransactions();
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Observaciones'];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(t => {
        const observations = (t.observations || '').replace(/"/g, '""');
        return [
          t.date,
          t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Salida' : 'Préstamo',
          t.category,
          t.amount,
          `"${observations}"`
        ].join(',');
      })
    ].join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert(`✅ Se exportaron ${filteredData.length} transacciones a CSV`);
  };

  // Categorías dinámicas
  const incomeCategories = customCategories.income;
  const expenseCategories = customCategories.expense;
  const loanCategories = customCategories.loan;

  // Clases CSS dinámicas
  const bgClass = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderClass = isDark ? 'border-gray-600' : 'border-gray-300';
  const inputClass = isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';

  // SPLASH SCREEN
  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-green-600 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-16 w-12 h-12 bg-white bg-opacity-20 rounded-full animate-bounce delay-500"></div>
          <div className="absolute bottom-40 left-20 w-16 h-16 bg-white bg-opacity-15 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 right-10 w-8 h-8 bg-white bg-opacity-25 rounded-full animate-bounce delay-700"></div>
        </div>
        
        <div className="text-center z-10">
          {/* Logo/Icono grande con animaciones múltiples */}
          <div className="relative mb-8">
            {/* Anillo exterior que rota */}
            <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-white border-opacity-30 rounded-2xl animate-spin" 
                 style={{animationDuration: '8s'}}></div>
            
            {/* Anillo medio que pulsa */}
            <div className="absolute inset-2 w-28 h-28 mx-auto bg-white bg-opacity-20 rounded-xl animate-pulse"></div>
            
            {/* Logo principal con efecto de escala */}
            <div className="relative w-32 h-32 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-2xl transform animate-bounce">
              <span className="text-green-500 text-5xl font-bold animate-pulse">G</span>
            </div>
            
            {/* Partículas flotantes alrededor del logo */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full animate-ping"></div>
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-white bg-opacity-70 rounded-full animate-ping delay-300"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white bg-opacity-70 rounded-full animate-ping delay-500"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full animate-ping delay-700"></div>
          </div>
          
          {/* Nombre de la app con animación de aparición */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl font-bold text-white mb-2 animate-pulse">Control de Dinero</h1>
            <p className="text-white text-opacity-90 text-lg mb-8">Gestiona tus finanzas</p>
          </div>
          
          {/* Barra de progreso animada */}
          <div className="w-64 mx-auto bg-white bg-opacity-30 rounded-full h-2 mb-4 overflow-hidden">
            <div className="h-full bg-white rounded-full animate-progress"></div>
          </div>
          
          <p className="text-white text-opacity-80 text-sm animate-pulse">Cargando...</p>
        </div>

        {/* Estilos CSS para animaciones personalizadas */}
        <style jsx>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes progress {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 1s ease-out;
          }
          
          .animate-progress {
            animation: progress 2s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  // PANTALLA DE AUTENTICACIÓN
  if (!isAuthenticated) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + bgClass + ' p-4'}>
        <div className="max-w-sm w-full">
          <div className={cardClass + ' rounded-2xl shadow-xl p-8'}>
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">G</span>
              </div>
              <h2 className={'text-xl font-bold ' + textClass}>
                {isSettingNewPin ? 'Configurar PIN' : 
                 sessionExpired ? 'Sesión Expirada' : 
                 sessionClosed ? 'Sesión Cerrada' : 'Desbloquear App'}
              </h2>
              <p className={textSecondaryClass + ' text-sm mt-2'}>
                {isSettingNewPin ? 
                  'Crea un PIN de seguridad para proteger tu información' : 
                  sessionExpired ?
                  'Tu sesión ha expirado por inactividad. Ingresa tu PIN para continuar.' :
                  sessionClosed ?
                  'Sesión cerrada voluntariamente. Ingresa tus credenciales para acceder.' :
                  'Ingresa tu PIN para acceder a la aplicación'
                }
              </p>
            </div>

            {showPinInput && (
              <div className="space-y-4">
                {/* Entrada del PIN */}
                <div>
                  <label className={'block text-sm font-medium ' + textClass + ' mb-2'}>
                    {isSettingNewPin ? 'Nuevo PIN (mínimo 4 dígitos)' : 'PIN de seguridad'}
                  </label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setAuthError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                    className={'w-full p-3 border ' + inputClass + ' rounded-lg text-center text-lg tracking-widest'}
                    placeholder="••••"
                    maxLength="6"
                    autoFocus
                  />
                </div>

                {/* Error message */}
                {authError && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                    {authError}
                  </div>
                )}

                {/* Botones */}
                <div className="space-y-3">
                  <button
                    onClick={handlePinSubmit}
                    disabled={pinInput.length < 4}
                    className={'w-full p-3 rounded-lg font-medium ' + 
                      (pinInput.length >= 4 ? 
                        'bg-blue-500 hover:bg-blue-600 text-white' : 
                        'bg-gray-300 text-gray-500 cursor-not-allowed')
                    }
                  >
                    {isSettingNewPin ? 'Configurar PIN' : 'Desbloquear'}
                  </button>

                  {!isSettingNewPin && !sessionExpired && !sessionClosed && (
                    <button
                      onClick={requestBiometricAuth}
                      className={'w-full p-3 border-2 border-blue-500 text-blue-500 rounded-lg font-medium hover:bg-blue-50 ' + 
                        (isDark ? 'hover:bg-blue-900 hover:bg-opacity-20' : '')
                      }
                    >
                      🔐 Usar Biometría
                    </button>
                  )}
                </div>

                {/* Teclado numérico visual */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((num, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (num === '⌫') {
                          setPinInput(prev => prev.slice(0, -1));
                        } else if (num !== '' && pinInput.length < 6) {
                          setPinInput(prev => prev + num);
                        }
                      }}
                      disabled={num === ''}
                      className={'p-4 rounded-lg font-bold text-lg ' + 
                        (num === '' ? 
                          'invisible' : 
                          (isDark ? 
                            'bg-gray-700 hover:bg-gray-600 text-white' : 
                            'bg-gray-100 hover:bg-gray-200 text-gray-800'
                          )
                        )
                      }
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showPinInput && (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className={textSecondaryClass + ' text-sm'}>Verificando autenticación...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA DEL GESTOR DE CATEGORÍAS
  if (currentView === 'categories') {
    return (
      <div className={'min-h-screen ' + bgClass + ' p-4'}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className={cardClass + ' p-2 rounded-lg shadow-sm'}
            >
              ← Atrás
            </button>
            <h1 className={'text-xl font-bold ' + textClass}>Gestionar Categorías</h1>
          </div>

          {/* Selector de tipo de categoría */}
          <div className={cardClass + ' rounded-lg shadow-sm p-4 mb-4'}>
            <h3 className={'font-semibold ' + textClass + ' mb-3'}>Tipo de Categoría</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setCategoryTypeToEdit('income')}
                className={'p-2 rounded-lg text-center font-medium transition-colors ' + 
                  (categoryTypeToEdit === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }
              >
                Ingresos
              </button>
              <button
                onClick={() => setCategoryTypeToEdit('expense')}
                className={'p-2 rounded-lg text-center font-medium transition-colors ' + 
                  (categoryTypeToEdit === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }
              >
                Gastos
              </button>
              <button
                onClick={() => setCategoryTypeToEdit('loan')}
                className={'p-2 rounded-lg text-center font-medium transition-colors ' + 
                  (categoryTypeToEdit === 'loan' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }
              >
                Préstamos
              </button>
            </div>
          </div>

          {/* Agregar nueva categoría */}
          <div className={cardClass + ' rounded-lg shadow-sm p-4 mb-4'}>
            <h3 className={'font-semibold ' + textClass + ' mb-3'}>Agregar Nueva Categoría</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={'flex-1 p-3 border ' + inputClass + ' rounded-lg'}
                placeholder="Nombre de la categoría"
                onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
              />
              <button
                onClick={addCustomCategory}
                disabled={!newCategoryName.trim()}
                className={'p-3 rounded-lg text-white font-medium ' + 
                  (newCategoryName.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed')
                }
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Lista de categorías actuales */}
          <div className={cardClass + ' rounded-lg shadow-sm p-4'}>
            <h3 className={'font-semibold ' + textClass + ' mb-3'}>
              Categorías de {categoryTypeToEdit === 'income' ? 'Ingresos' : 
                            categoryTypeToEdit === 'expense' ? 'Gastos' : 'Préstamos'}
            </h3>
            <div className="space-y-2">
              {customCategories[categoryTypeToEdit].map((category, index) => (
                <div key={index} className={'flex items-center justify-between p-3 border ' + borderClass + ' rounded-lg'}>
                  <span className={textClass + ' font-medium'}>{category}</span>
                  <button
                    onClick={() => removeCustomCategory(categoryTypeToEdit, category)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {customCategories[categoryTypeToEdit].length === 0 && (
                <p className={textSecondaryClass + ' text-center py-4'}>
                  No hay categorías para este tipo
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA DE FORMULARIO
  if (currentView === 'form') {
    const categories = formData.type === 'income' ? incomeCategories : 
                     formData.type === 'expense' ? expenseCategories : loanCategories;

    return (
      <div className={'min-h-screen ' + bgClass + ' p-4'}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => {
                setCurrentView('home');
                setEditingId(null);
              }}
              className={cardClass + ' p-2 rounded-lg shadow-sm'}
            >
              ← Atrás
            </button>
            <h1 className={'text-xl font-bold ' + textClass}>
              {editingId ? 'Editar' : 'Nueva'} {formData.type === 'income' ? 'Entrada' : formData.type === 'expense' ? 'Salida' : 'Préstamo'}
            </h1>
          </div>

          <div className={cardClass + ' rounded-lg shadow-sm p-6'}>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setFormData({...formData, type: 'income', category: ''})}
                className={'p-3 rounded-lg text-center font-medium transition-colors ' + 
                  (formData.type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }
              >
                <Plus size={20} className="mx-auto mb-1" />
                <div className="text-xs">Entrada</div>
              </button>
              <button
                onClick={() => setFormData({...formData, type: 'expense', category: ''})}
                className={'p-3 rounded-lg text-center font-medium transition-colors ' + 
                  (formData.type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }
              >
                <Minus size={20} className="mx-auto mb-1" />
                <div className="text-xs">Salida</div>
              </button>
              <button
                onClick={() => setFormData({...formData, type: 'loan', category: ''})}
                className={'p-3 rounded-lg text-center font-medium transition-colors ' + 
                  (formData.type === 'loan' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }
              >
                <DollarSign size={20} className="mx-auto mb-1" />
                <div className="text-xs">Préstamo</div>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={'block text-sm font-medium ' + textClass + ' mb-1'}>
                  Monto *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className={'w-full p-3 border ' + inputClass + ' rounded-lg'}
                  placeholder="Ingrese el monto"
                />
              </div>

              <div>
                <label className={'block text-sm font-medium ' + textClass + ' mb-1'}>
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={'w-full p-3 border ' + inputClass + ' rounded-lg'}
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={'block text-sm font-medium ' + textClass + ' mb-1'}>
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className={'w-full p-3 border ' + inputClass + ' rounded-lg'}
                />
              </div>

              <div>
                <label className={'block text-sm font-medium ' + textClass + ' mb-1'}>
                  Observaciones *
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  className={'w-full p-3 border ' + inputClass + ' rounded-lg'}
                  placeholder="Observaciones obligatorias..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setCurrentView('home');
                  setEditingId(null);
                }}
                className={'flex-1 p-3 border ' + borderClass + ' rounded-lg ' + textClass + ' font-medium'}
              >
                Cancelar
              </button>
              
              {editingId && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Eliminar
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={!formData.amount || !formData.category || !formData.observations.trim()}
                className={'flex-1 p-3 rounded-lg text-white font-medium ' + 
                  (formData.amount && formData.category && formData.observations.trim() ? 
                    (formData.type === 'income' ? 'bg-green-500' : 
                     formData.type === 'expense' ? 'bg-red-500' : 'bg-orange-500')
                    : 'bg-gray-400 cursor-not-allowed')
                }
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>

            {/* Modal de confirmación de eliminación */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={cardClass + ' rounded-lg p-6 max-w-sm w-full'}>
                  <h3 className={'text-lg font-bold ' + textClass + ' mb-2'}>Confirmar Eliminación</h3>
                  <p className={textSecondaryClass + ' mb-4'}>
                    ¿Estás seguro que quieres eliminar esta transacción? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={'flex-1 p-3 border ' + borderClass + ' rounded-lg ' + textClass + ' font-medium'}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA DE REPORTES
  if (currentView === 'reports') {
    console.log('Vista reportes - selectedMonth:', selectedMonth);
    
    const currentMonthData = getMonthlyData(selectedMonth);
    const expensesByCategory = getExpensesByCategory(selectedMonth); // Filtrar por mes
    
    // Corregir el cálculo del nombre del mes
    const [year, month] = selectedMonth.split('-');
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const monthName = `${monthNames[parseInt(month) - 1]} de ${year}`;
    
    console.log('Mes seleccionado:', selectedMonth);
    console.log('Nombre del mes corregido:', monthName);
    console.log('Datos del mes actual:', currentMonthData);
    console.log('Gastos por categoría del mes:', expensesByCategory);

    return (
      <div className={'min-h-screen ' + bgClass + ' p-4'}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className={cardClass + ' p-2 rounded-lg shadow-sm'}
            >
              ← Atrás
            </button>
            <h1 className={'text-lg font-bold flex-1 ' + textClass}>Reportes</h1>
          </div>

          {/* Selector de Mes */}
          <div className={cardClass + ' rounded-lg shadow-sm p-4 mb-4'}>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  const [year, month] = selectedMonth.split('-');
                  const date = new Date(year, month - 2, 1);
                  setSelectedMonth(date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'));
                }}
                className={'p-2 rounded-lg bg-gray-100 hover:bg-gray-200 ' + (isDark ? 'bg-gray-700 hover:bg-gray-600' : '')}
              >
                ←
              </button>
              <h2 className={'text-lg font-semibold capitalize ' + textClass}>{monthName}</h2>
              <button 
                onClick={() => {
                  const [year, month] = selectedMonth.split('-');
                  const date = new Date(year, month, 1);
                  setSelectedMonth(date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'));
                }}
                className={'p-2 rounded-lg bg-gray-100 hover:bg-gray-200 ' + (isDark ? 'bg-gray-700 hover:bg-gray-600' : '')}
              >
                →
              </button>
            </div>
          </div>

          {/* Resumen del Mes */}
          <div className={cardClass + ' rounded-lg shadow-sm p-4 mb-4'}>
            <h3 className={'font-semibold ' + textClass + ' mb-3'}>Resumen de {monthName}</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center">
                <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Balance Neto</div>
                <div className={'font-bold text-lg ' + (currentMonthData.net >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(currentMonthData.net)}
                </div>
              </div>
              <div className="text-center">
                <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Transacciones</div>
                <div className="font-bold text-lg text-blue-600">
                  {currentMonthData.total}
                </div>
              </div>
            </div>

            {/* Gráfico de barras para Entradas vs Salidas */}
            <div className="mb-4">
              <h4 className={'font-medium ' + textClass + ' mb-3'}>Entradas vs Salidas</h4>
              <div className="space-y-3">
                {/* Barra de Entradas */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-600 font-medium text-sm">Entradas</span>
                    <span className="text-green-600 font-bold text-sm">{formatCurrency(currentMonthData.income)}</span>
                  </div>
                  <div className={'w-full bg-gray-200 rounded-full h-3 ' + (isDark ? 'bg-gray-700' : '')}>
                    <div 
                      className="h-3 bg-green-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: currentMonthData.income > 0 ? 
                          Math.min(100, (currentMonthData.income / Math.max(currentMonthData.income, currentMonthData.expense, 1)) * 100) + '%' : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Barra de Salidas */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-red-600 font-medium text-sm">Salidas</span>
                    <span className="text-red-600 font-bold text-sm">{formatCurrency(currentMonthData.expense)}</span>
                  </div>
                  <div className={'w-full bg-gray-200 rounded-full h-3 ' + (isDark ? 'bg-gray-700' : '')}>
                    <div 
                      className="h-3 bg-red-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: currentMonthData.expense > 0 ? 
                          Math.min(100, (currentMonthData.expense / Math.max(currentMonthData.income, currentMonthData.expense, 1)) * 100) + '%' : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Barra de Préstamos si hay */}
                {currentMonthData.loans > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-orange-600 font-medium text-sm">Préstamos</span>
                      <span className="text-orange-600 font-bold text-sm">{formatCurrency(currentMonthData.loans)}</span>
                    </div>
                    <div className={'w-full bg-gray-200 rounded-full h-3 ' + (isDark ? 'bg-gray-700' : '')}>
                      <div 
                        className="h-3 bg-orange-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: Math.min(100, (Math.abs(currentMonthData.loans) / Math.max(currentMonthData.income, currentMonthData.expense, Math.abs(currentMonthData.loans), 1)) * 100) + '%'
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen en números */}
            <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
              <div className="min-w-0">
                <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Entradas</div>
                <div className="font-bold text-green-600 text-xs leading-tight">
                  {formatCurrency(currentMonthData.income)}
                </div>
              </div>
              <div className="min-w-0">
                <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Salidas</div>
                <div className="font-bold text-red-600 text-xs leading-tight">
                  {formatCurrency(currentMonthData.expense)}
                </div>
              </div>
              <div className="min-w-0">
                <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Préstamos</div>
                <div className="font-bold text-orange-600 text-xs leading-tight">
                  {formatCurrency(Math.abs(currentMonthData.loans))}
                </div>
              </div>
            </div>
          </div>

          {/* Análisis por Categorías con gráficos mejorados */}
          {expensesByCategory.length > 0 && (
            <div className={cardClass + ' rounded-lg shadow-sm p-4 mb-4'}>
              <h3 className={'font-semibold ' + textClass + ' mb-4'}>Gastos por Categoría</h3>
              <div className="space-y-4">
                {expensesByCategory.map((item, index) => {
                  const colors = [
                    { bg: 'bg-red-500', ring: 'ring-red-200' },
                    { bg: 'bg-orange-500', ring: 'ring-orange-200' },
                    { bg: 'bg-yellow-500', ring: 'ring-yellow-200' },
                    { bg: 'bg-green-500', ring: 'ring-green-200' },
                    { bg: 'bg-blue-500', ring: 'ring-blue-200' },
                    { bg: 'bg-purple-500', ring: 'ring-purple-200' },
                    { bg: 'bg-pink-500', ring: 'ring-pink-200' }
                  ];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <div key={item.category} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={'w-4 h-4 rounded-full flex-shrink-0 ring-2 ' + colorClass.bg + ' ' + colorClass.ring}></div>
                          <span className={'font-medium ' + textClass}>{item.category}</span>
                        </div>
                        <div className="text-right">
                          <div className={'text-sm font-bold ' + textClass}>{item.percentage}%</div>
                          <div className={'text-xs ' + textSecondaryClass}>{formatCurrency(item.amount)}</div>
                        </div>
                      </div>
                      
                      <div className={'w-full bg-gray-200 rounded-full h-3 overflow-hidden ' + (isDark ? 'bg-gray-700' : '')}>
                        <div 
                          className={'h-3 rounded-full transition-all duration-1000 ease-out shadow-sm ' + colorClass.bg}
                          style={{ 
                            width: '0%',
                            animation: `fillBar${index} 1s ease-out forwards`
                          }}
                        ></div>
                      </div>
                      
                      <style jsx>{`
                        @keyframes fillBar${index} {
                          from { width: 0%; }
                          to { width: ${item.percentage}%; }
                        }
                      `}</style>
                    </div>
                  );
                })}
              </div>
              
              {/* Círculo de progreso del gasto total */}
              <div className="mt-6 pt-4 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={isDark ? '#374151' : '#e5e7eb'}
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#ef4444"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(expensesByCategory.reduce((sum, item) => sum + parseFloat(item.percentage), 0) / 100, 1))}`}
                        className="transition-all duration-2000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={'text-xs font-bold text-red-600'}>
                          {Math.round(expensesByCategory.reduce((sum, item) => sum + parseFloat(item.percentage), 0))}%
                        </div>
                        <div className={'text-xs ' + textSecondaryClass}>Gastos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resumen del Mes con gráficos circulares */}
          <div className={cardClass + ' rounded-lg shadow-sm p-4'}>
            <h3 className={'font-semibold ' + textClass + ' mb-4'}>Resumen del Mes</h3>
            
            {/* Indicador visual del balance del mes */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke={isDark ? '#374151' : '#e5e7eb'}
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke={currentMonthData.net >= 0 ? '#10b981' : '#ef4444'}
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * 0.25}`}
                      className="transition-all duration-2000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={'text-lg font-bold ' + (currentMonthData.net >= 0 ? 'text-green-600' : 'text-red-600')}>
                        ₲
                      </div>
                      <div className={'text-xs ' + textSecondaryClass}>Mes</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Balance del Mes</div>
                <div className={'font-bold text-xl ' + (currentMonthData.net >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(currentMonthData.net)}
                </div>
              </div>
            </div>

            {/* Métricas del mes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50" style={{backgroundColor: isDark ? '#1e3a8a20' : '#dbeafe'}}>
                <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Movimientos</div>
                <div className="font-bold text-2xl text-blue-600">
                  {currentMonthData.total}
                </div>
                <div className={'text-xs ' + textSecondaryClass}>este mes</div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-purple-50" style={{backgroundColor: isDark ? '#581c8720' : '#f3e8ff'}}>
                <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Promedio Diario</div>
                <div className="font-bold text-2xl text-purple-600">
                  {currentMonthData.total > 0 ? Math.round(currentMonthData.total / 30) : 0}
                </div>
                <div className={'text-xs ' + textSecondaryClass}>por día</div>
              </div>
            </div>

            {/* Desglose de actividad del mes */}
            {currentMonthData.total > 0 && (
              <div className="mt-4 pt-4 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>+ Entradas</div>
                    <div className="font-bold text-sm text-green-600">
                      {currentMonthData.transactions.filter(t => t.type === 'income').length}
                    </div>
                  </div>
                  <div>
                    <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>- Salidas</div>
                    <div className="font-bold text-sm text-red-600">
                      {currentMonthData.transactions.filter(t => t.type === 'expense').length}
                    </div>
                  </div>
                  <div>
                    <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>💰 Préstamos</div>
                    <div className="font-bold text-sm text-orange-600">
                      {currentMonthData.transactions.filter(t => t.type === 'loan').length}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mensaje si no hay datos del mes */}
            {currentMonthData.total === 0 && (
              <div className="mt-4 pt-4 border-t text-center" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
                <p className={textSecondaryClass + ' text-sm'}>
                  No hay transacciones registradas en {monthName.toLowerCase()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA DE MOVIMIENTOS
  if (currentView === 'details') {
    const filteredTransactions = getFilteredTransactions();
    const availableCategories = [...new Set(transactions.map(t => t.category))];

    return (
      <div className={'min-h-screen ' + bgClass + ' p-4'}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setCurrentView('home')}
              className={cardClass + ' p-2 rounded-lg shadow-sm'}
            >
              ← Atrás
            </button>
            <h1 className={'text-lg font-bold flex-1 ' + textClass}>Todos los Movimientos</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cardClass + ' p-2 rounded-lg shadow-sm'}
            >
              🔍 Filtros
            </button>
          </div>

          {/* Panel de Filtros */}
          {showFilters && (
            <div className={cardClass + ' rounded-lg shadow-sm p-4 mb-4'}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={'font-semibold ' + textClass}>Filtros</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className={'p-1 rounded-lg hover:bg-gray-100 ' + (isDark ? 'hover:bg-gray-700' : '')}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={'block text-xs font-medium ' + textClass + ' mb-1'}>Desde</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      className={'w-full p-2 border ' + inputClass + ' rounded text-sm'}
                    />
                  </div>
                  <div>
                    <label className={'block text-xs font-medium ' + textClass + ' mb-1'}>Hasta</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      className={'w-full p-2 border ' + inputClass + ' rounded text-sm'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={'block text-xs font-medium ' + textClass + ' mb-1'}>Tipo</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value, category: ''})}
                    className={'w-full p-2 border ' + inputClass + ' rounded text-sm'}
                  >
                    <option value="">Todos</option>
                    <option value="income">Entradas</option>
                    <option value="expense">Salidas</option>
                    <option value="loan">Préstamos</option>
                  </select>
                </div>
                
                <div>
                  <label className={'block text-xs font-medium ' + textClass + ' mb-1'}>Categoría</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className={'w-full p-2 border ' + inputClass + ' rounded text-sm'}
                  >
                    <option value="">Todas</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={clearAllFilters}
                    className={'flex-1 p-2 border ' + borderClass + ' rounded-lg text-sm font-medium ' + textClass}
                  >
                    Limpiar Filtros
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex-1 p-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                  >
                    📄 Exportar CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contador de resultados */}
          {(filters.startDate || filters.endDate || filters.type || filters.category) && (
            <div className={cardClass + ' rounded-lg shadow-sm p-3 mb-4 text-center'}>
              <span className={textSecondaryClass + ' text-sm'}>
                Mostrando {filteredTransactions.length} de {transactions.length} transacciones
              </span>
            </div>
          )}

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className={cardClass + ' rounded-lg shadow-sm p-8 text-center'}>
                <p className={textSecondaryClass}>
                  {(filters.startDate || filters.endDate || filters.type || filters.category) ? 
                    'No hay transacciones que coincidan con los filtros.' : 
                    'No hay transacciones que mostrar.'}
                </p>
                {(!filters.startDate && !filters.endDate && !filters.type && !filters.category) && (
                  <button
                    onClick={() => setCurrentView('form')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    Agregar Primera Transacción
                  </button>
                )}
              </div>
            ) : (
              (() => {
                // Agrupar transacciones por fecha
                const groupedByDate = filteredTransactions
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .reduce((groups, transaction) => {
                    const date = transaction.date;
                    if (!groups[date]) {
                      groups[date] = [];
                    }
                    groups[date].push(transaction);
                    return groups;
                  }, {});

                return Object.entries(groupedByDate).map(([date, transactionsOfDay]) => (
                  <div key={date} className="space-y-2">
                    {/* Encabezado de fecha */}
                    <div className={'flex items-center gap-2 px-3 py-2 rounded-lg ' + (isDark ? 'bg-gray-700' : 'bg-gray-100')}>
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className={'font-semibold text-sm ' + textClass}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('es-PY', { 
                          weekday: 'long',
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span className={'text-xs ' + textSecondaryClass}>
                        ({transactionsOfDay.length} {transactionsOfDay.length === 1 ? 'movimiento' : 'movimientos'})
                      </span>
                    </div>

                    {/* Transacciones del día */}
                    <div className="space-y-2 ml-4">
                      {transactionsOfDay.map(transaction => (
                        <div key={transaction.id} className={cardClass + ' rounded-lg shadow-sm p-4 border-l-4 ' + 
                          (transaction.type === 'income' ? 'border-green-500' : 
                           transaction.type === 'expense' ? 'border-red-500' : 'border-orange-500')
                        }>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={'w-3 h-3 rounded-full ' + 
                                  (transaction.type === 'income' ? 'bg-green-500' : 
                                   transaction.type === 'expense' ? 'bg-red-500' : 'bg-orange-500')
                                }></div>
                                <span className={'font-semibold text-sm ' + textClass}>
                                  {transaction.category}
                                </span>
                              </div>
                              
                              <div className={'text-lg font-bold mb-1 ' + 
                                (transaction.type === 'income' ? 'text-green-600' : 
                                 transaction.type === 'expense' ? 'text-red-600' : 
                                 (transaction.category === 'Abono' || transaction.category === 'Devolución' ? 'text-green-600' : 'text-orange-600'))
                              }>
                                {transaction.type === 'income' ? '+' : 
                                 transaction.type === 'expense' ? '-' : 
                                 (transaction.category === 'Abono' || transaction.category === 'Devolución' ? '+' : '-')
                                }{formatCurrency(transaction.amount)}
                              </div>
                              
                              {transaction.observations && (
                                <p className={'text-sm ' + textSecondaryClass}>{transaction.observations}</p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="text-blue-500 text-sm font-medium hover:text-blue-700 ml-3"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL (HOME)
  return (
    <div className={'min-h-screen ' + bgClass + ' p-4'}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-2">
            {/* Botón de bloqueo manual */}
            <button
              onClick={lockApp}
              className={cardClass + ' p-2 rounded-lg shadow-sm transition-all duration-200 hover:scale-105'}
              title="Bloquear aplicación"
            >
              🔒
            </button>
            <h1 className={'text-2xl font-bold ' + textClass}>Control de Dinero</h1>
            <button
              onClick={toggleDarkMode}
              className={cardClass + ' p-2 rounded-lg shadow-sm transition-all duration-200 hover:scale-105'}
            >
              {isDark ? (
                <Sun size={20} className="text-yellow-500" />
              ) : (
                <Moon size={20} className="text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Balance Card con botón de recálculo */}
          <div className={cardClass + ' border border-gray-200 rounded-lg shadow-sm p-4 mb-4'}>
            <div className="flex items-center justify-between mb-2">
              <div className={'text-sm ' + textSecondaryClass}>Balance Total</div>
              <button
                onClick={recalculateBalance}
                className={'text-xs px-2 py-1 rounded ' + (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                title="Recalcular balance"
              >
                🔄
              </button>
            </div>
            <div className={'text-2xl font-bold ' + (balance >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(balance)}
            </div>
          </div>

          {/* Estado de Préstamos */}
          {(() => {
            const loanBalance = getLoanBalance();
            const hasLoans = loanBalance.prestado > 0 || loanBalance.devuelto > 0;
            
            return hasLoans ? (
              <div className={cardClass + ' border border-orange-200 rounded-lg shadow-sm p-4 bg-orange-50' + (isDark ? ' bg-orange-900 bg-opacity-20' : '')}>
                <div className={'text-sm font-medium text-orange-600 mb-2'}>Estado de Préstamos</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Prestado</div>
                    <div className="font-bold text-orange-600 text-sm">
                      {formatCurrency(loanBalance.prestado)}
                    </div>
                  </div>
                  <div>
                    <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Devuelto</div>
                    <div className="font-bold text-green-600 text-sm">
                      {formatCurrency(loanBalance.devuelto)}
                    </div>
                  </div>
                  <div>
                    <div className={'text-xs ' + textSecondaryClass + ' mb-1'}>Pendiente</div>
                    <div className={'font-bold text-sm ' + (loanBalance.pendiente > 0 ? 'text-red-600' : 'text-green-600')}>
                      {formatCurrency(loanBalance.pendiente)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* Install App Banner */}
        {showInstallBanner && (
          <div className={cardClass + ' rounded-lg shadow-sm p-4 mb-4 border-l-4 border-green-500'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">G</span>
                </div>
                <div>
                  <div className={'font-semibold ' + textClass + ' text-sm'}>Instalar Control de Dinero</div>
                  <div className={'text-xs ' + textSecondaryClass}>Úsala como una app nativa</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className={'text-xs px-2 py-1 rounded ' + textSecondaryClass}
                >
                  ✕
                </button>
                <button
                  onClick={handleInstallApp}
                  className="text-xs px-3 py-1 bg-green-500 text-white rounded font-medium"
                >
                  Instalar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => {
              setFormData({...formData, type: 'income'});
              setCurrentView('form');
            }}
            className="bg-green-500 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 font-semibold text-sm"
          >
            <Plus size={18} />
            <span>Entrada</span>
          </button>
          
          <button
            onClick={() => {
              setFormData({...formData, type: 'expense'});
              setCurrentView('form');
            }}
            className="bg-red-500 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 font-semibold text-sm"
          >
            <Minus size={18} />
            <span>Salida</span>
          </button>
          
          <button
            onClick={() => {
              setFormData({...formData, type: 'loan'});
              setCurrentView('form');
            }}
            className="bg-orange-500 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 font-semibold text-sm"
          >
            <DollarSign size={18} />
            <span>Préstamo</span>
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setCurrentView('details')}
            className="bg-blue-500 text-white p-3 rounded-lg font-semibold text-sm"
          >
            Ver Movimientos
          </button>
          <button
            onClick={() => setCurrentView('reports')}
            className="bg-purple-500 text-white p-3 rounded-lg font-semibold text-sm"
          >
            Reportes
          </button>
        </div>

        {/* Settings Button */}
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('categories')}
            className="w-full bg-gray-600 text-white p-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            🏷️ Gestionar Categorías
          </button>
        </div>

        {/* Security Settings */}
        <div className="mb-6">
          <div className={cardClass + ' rounded-lg shadow-sm p-4'}>
            <div className="flex items-center gap-3 mb-4">
              <div className={'w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'}>
                <Shield size={16} className="text-white" />
              </div>
              <h3 className={'font-semibold ' + textClass}>Configuración de Seguridad</h3>
            </div>
            
            <div className="space-y-1">
              <button
                onClick={() => {
                  setIsSettingNewPin(true);
                  setShowPinInput(true);
                  setIsAuthenticated(false);
                }}
                className={'w-full p-3 rounded-lg text-left flex items-center gap-3 ' + 
                  (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50') + ' transition-colors group'
                }
              >
                <div className={'w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-105 transition-transform'}>
                  <Key size={14} className="text-white" />
                </div>
                <div>
                  <div className={'font-medium ' + textClass}>Cambiar PIN</div>
                  <div className={'text-xs ' + textSecondaryClass}>Actualizar código de seguridad</div>
                </div>
              </button>

              <button
                onClick={lockApp}
                className={'w-full p-3 rounded-lg text-left flex items-center gap-3 ' + 
                  (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50') + ' transition-colors group'
                }
              >
                <div className={'w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform'}>
                  <Lock size={14} className="text-white" />
                </div>
                <div>
                  <div className={'font-medium ' + textClass}>Bloquear Ahora</div>
                  <div className={'text-xs ' + textSecondaryClass}>Bloqueo temporal de la app</div>
                </div>
              </button>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className={'w-full p-3 rounded-lg text-left flex items-center gap-3 ' + 
                  (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50') + ' transition-colors group'
                }
              >
                <div className={'w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:scale-105 transition-transform'}>
                  <LogOut size={14} className="text-white" />
                </div>
                <div>
                  <div className={'font-medium ' + textClass}>Cerrar Sesión</div>
                  <div className={'text-xs ' + textSecondaryClass}>Cierre completo y seguro</div>
                </div>
              </button>
            </div>

            <div className={'text-xs ' + textSecondaryClass + ' pt-3 mt-3 border-t ' + borderClass + ' flex items-center gap-2'}>
              <Settings size={12} />
              <span>Auto-bloqueo: 10 minutos de inactividad</span>
            </div>
          </div>
        </div>

        {/* Modal de confirmación de cierre de sesión */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={cardClass + ' rounded-xl p-6 max-w-sm w-full shadow-2xl'}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <LogOut size={24} className="text-red-600" />
                </div>
                <h3 className={'text-lg font-bold ' + textClass + ' mb-2'}>Cerrar Sesión</h3>
                <p className={textSecondaryClass + ' text-sm'}>
                  ¿Estás seguro que quieres cerrar la sesión? Tendrás que ingresar tu PIN o usar biometría para volver a acceder.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={'flex-1 p-3 border ' + borderClass + ' rounded-lg ' + textClass + ' font-medium hover:bg-gray-50 transition-colors'}
                >
                  Cancelar
                </button>
                <button
                  onClick={logoutApp}
                  className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className={cardClass + ' rounded-lg shadow-sm p-4'}>
          <h2 className={'text-lg font-semibold mb-4 ' + textClass}>Últimos Movimientos</h2>
          
          <div className="space-y-3">
            {transactions.slice(-5).reverse().map(transaction => (
              <div key={transaction.id} className={'flex justify-between items-center p-3 border border-gray-200 rounded-lg'}>
                <div className="flex items-center gap-3">
                  <div className={'w-3 h-3 rounded-full ' + 
                    (transaction.type === 'income' ? 'bg-green-500' : 
                     transaction.type === 'expense' ? 'bg-red-500' : 'bg-orange-500')
                  }></div>
                  <div>
                    <div className={'font-medium ' + textClass + ' text-sm'}>{transaction.category}</div>
                    <div className={'text-xs ' + textSecondaryClass}>
                      {formatDisplayDate(transaction.date)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={'font-bold text-sm ' + 
                    (transaction.type === 'income' ? 'text-green-600' : 
                     transaction.type === 'expense' ? 'text-red-600' : 
                     (transaction.category === 'Abono' || transaction.category === 'Devolución' ? 'text-green-600' : 'text-orange-600'))
                  }>
                    {transaction.type === 'income' ? '+' : 
                     transaction.type === 'expense' ? '-' : 
                     (transaction.category === 'Abono' || transaction.category === 'Devolución' ? '+' : '-')
                    }{formatCurrency(transaction.amount)}
                  </div>
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="text-blue-500 text-xs hover:text-blue-700"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyControlApp;