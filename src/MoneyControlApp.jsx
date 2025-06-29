import React, { useState } from 'react';
import { Plus, Minus, DollarSign, Moon, Sun, Lock, Key, LogOut, Shield, Settings, Fingerprint, Home, CreditCard, BarChart3, User } from 'lucide-react';

const MoneyControlApp = () => {
  // Funciones utilitarias
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  const formatDisplayDate = (dateString) => {
    const parts = dateString.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
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

  // Funciones para localStorage (con fallback a memoria para Claude)
  const saveToStorage = (key, data) => {
    try {
      // Intentar usar localStorage real primero
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      } else {
        // Fallback para entorno de Claude
        window.claudeStorage = window.claudeStorage || {};
        window.claudeStorage[key] = JSON.stringify(data);
      }
    } catch (error) {
      console.error('Error guardando en storage:', error);
      // Fallback en caso de error
      window.claudeStorage = window.claudeStorage || {};
      window.claudeStorage[key] = JSON.stringify(data);
    }
  };

  const loadFromStorage = (key, defaultValue) => {
    try {
      // Intentar usar localStorage real primero
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
      } else {
        // Fallback para entorno de Claude
        window.claudeStorage = window.claudeStorage || {};
        const saved = window.claudeStorage[key];
        return saved ? JSON.parse(saved) : defaultValue;
      }
    } catch (error) {
      console.error('Error cargando de storage:', error);
      return defaultValue;
    }
  };

  // Estados principales
  const [isDark, setIsDark] = useState(() => loadFromStorage('isDark', false));
  const [currentView, setCurrentView] = useState('home');
  const [activeTab, setActiveTab] = useState('inicio'); // Nuevo estado para el menú inferior
  const [previousTab, setPreviousTab] = useState('inicio'); // Para recordar de dónde vino el usuario
  
  // Estados para splash screen y autenticación
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [lastActivity, setLastActivity] = useState(() => loadFromStorage('lastActivity', Date.now()));
  const [showNumericKeypad, setShowNumericKeypad] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [storedPin, setStoredPin] = useState(() => loadFromStorage('userPin', ''));
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Estados para datos de la aplicación
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: ''
  });
  
  // Estados para PWA Installation
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  
  // Estados para gestionar categorías
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryTypeToEdit, setCategoryTypeToEdit] = useState('income');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Forzar junio 2025 como mes actual hasta que sea julio
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 0-11 -> 1-12
    
    // Si estamos en 2025 y es antes de julio, usar junio
    if (currentYear === 2025 && currentMonth <= 6) {
      return '2025-06';
    }
    
    // Para otros casos, usar mes actual
    const monthStr = String(currentMonth).padStart(2, '0');
    const result = currentYear + '-' + monthStr;
    return result;
  });
  
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    category: '',
    date: getTodayDate(),
    observations: ''
  });

  // Categorías personalizables
  const [customCategories, setCustomCategories] = useState(() => 
    loadFromStorage('customCategories', {
      income: ['Salario', 'Venta', 'Freelance', 'Inversión', 'Regalo'],
      expense: ['Comida', 'Transporte', 'Giros', 'Entretenimiento', 'Salud'],
      loan: ['Prestado', 'Abono', 'Devolución']
    })
  );

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
    
    const initialBalance = 5000000 - 150000 - 500000 - 200000 + 50000;
    return initialBalance;
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
    }
    
    return calculatedBalance;
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
    
    return { prestado, devuelto, pendiente };
  };

  // Funciones para filtros y exportación
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
          '"' + observations + '"'
        ].join(',');
      })
    ].join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transacciones_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('✅ Se exportaron ' + filteredData.length + ' transacciones a CSV');
  };

  // Funciones para reportes
  const getMonthlyData = (monthYear) => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthYear));
    
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
    
    return result;
  };

  const getExpensesByCategory = (monthYear = null) => {
    let expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    // Si se proporciona un mes, filtrar solo por ese mes
    if (monthYear) {
      expenseTransactions = expenseTransactions.filter(t => t.date.startsWith(monthYear));
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
  // Funciones para manejar transacciones
  const handleSubmit = () => {
    if (!formData.amount || !formData.category || !formData.observations.trim()) return;
    
    const amount = parseFloat(formData.amount);
    
    if (editingId) {
      const oldTransaction = transactions.find(t => t.id === editingId);
      const updatedTransactions = transactions.map(t => 
        t.id === editingId ? {...formData, id: editingId, amount: amount} : t
      );
      setTransactions(updatedTransactions);
      saveToStorage('transactions', updatedTransactions);
      
      let newBalance = balance;
      
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

    setFormData({
      type: 'income',
      amount: '',
      category: '',
      date: getTodayDate(),
      observations: ''
    });
    
    setCurrentView('home');
    setActiveTab(previousTab || 'transacciones'); // Fallback a transacciones
  };

  const handleEdit = (transaction) => {
    // Si no se ha establecido previousTab, usar el tab actual
    if (!previousTab || previousTab === activeTab) {
      setPreviousTab(activeTab);
    }
    
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
    setActiveTab(previousTab || 'transacciones'); // Fallback a transacciones
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
    const tenMinutes = 10 * 60 * 1000;
    
    return inactiveTime < tenMinutes;
  };

  const requestBiometricAuth = async () => {
    // Solo mostrar el modal, NO activar automáticamente
    setShowBiometricModal(true);
    setAuthError('');
  };

  const handleBiometricScan = async () => {
    setBiometricScanning(true);
    setAuthError('');
    
    try {
      // USAR TU WEBAUTHN REAL EXISTENTE
      // Configuración para WebAuthn real del dispositivo
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Control de Dinero" },
          user: {
            id: new TextEncoder().encode("user"),
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
        setShowBiometricModal(false);
        setBiometricScanning(false);
        setSessionExpired(false);
        setSessionClosed(false);
        updateActivity();
      }
      
    } catch (error) {
      setBiometricScanning(false);
      if (error.name === 'NotAllowedError') {
        setAuthError('Autenticación biométrica cancelada');
      } else if (error.name === 'NotSupportedError') {
        setAuthError('Biometría no soportada en este dispositivo');
      } else {
        setAuthError('Error en la autenticación biométrica');
      }
      console.error('Biometric auth error:', error);
    }
  };

  const handlePinSubmit = () => {
    if (!storedPin) {
      if (pinInput.length >= 4) {
        setStoredPin(pinInput);
        saveToStorage('userPin', pinInput);
        setIsAuthenticated(true);
        setShowNumericKeypad(false);
        setPinInput('');
        setIsSettingNewPin(false);
        setAuthError('');
        setSessionExpired(false);
        setSessionClosed(false);
        updateActivity();
      } else {
        setAuthError('El PIN debe tener al menos 4 dígitos');
      }
    } else {
      if (pinInput === storedPin) {
        setIsAuthenticated(true);
        setShowNumericKeypad(false);
        setPinInput('');
        setAuthError('');
        setSessionExpired(false);
        setSessionClosed(false);
        updateActivity();
      } else {
        setAuthError('PIN incorrecto');
        setPinInput('');
      }
    }
  };

  const lockApp = () => {
    setIsAuthenticated(false);
    setShowNumericKeypad(false);
    setShowBiometricModal(false);
    setBiometricScanning(false);
    setPinInput('');
    setAuthError('');
    setSessionExpired(true);
    setSessionClosed(false);
  };

  const logoutApp = () => {
    setIsAuthenticated(false);
    setShowNumericKeypad(false);
    setShowBiometricModal(false);
    setBiometricScanning(false);
    setPinInput('');
    setAuthError('');
    setSessionExpired(false);
    setSessionClosed(true);
    setShowLogoutConfirm(false);
    saveToStorage('lastActivity', 0);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    // La persistencia se maneja en el useEffect
  };

  // Funciones para PWA Installation
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    
    try {
      // Mostrar el prompt nativo del navegador
      deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
      } else {
        console.log('Usuario rechazó instalar la PWA');
      }
      
      // Limpiar el prompt y ocultar banner
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      
    } catch (error) {
      console.error('Error al intentar instalar:', error);
      setShowInstallBanner(false);
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    setInstallDismissed(true);
    setDeferredPrompt(null);
  };

  // Componente del Menú Inferior (movido antes de su uso)
  const BottomNavigation = () => {
    const menuItems = [
      { id: 'inicio', label: 'Inicio', icon: Home },
      { id: 'transacciones', label: 'Transacciones', icon: CreditCard },
      { id: 'reportes', label: 'Reportes', icon: BarChart3 },
      { id: 'ajustes', label: 'Ajustes', icon: User }
    ];

    const handleTabChange = (tabId) => {
      // Siempre limpiar estados y volver a la vista principal
      setCurrentView('home');
      setActiveTab(tabId);
      setEditingId(null);
      setShowDeleteConfirm(false);
      setShowFilters(false);
      setFormData({
        type: 'income',
        amount: '',
        category: '',
        date: getTodayDate(),
        observations: ''
      });
      
      // Resetear scroll al tope de manera suave
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
      <div className={'fixed bottom-0 left-0 right-0 ' + (isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200') + ' border-t shadow-lg'}>
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-4 py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={'flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 ' + 
                    (isActive ? 'text-blue-600' : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'))
                  }
                >
                  <div className={'p-1 rounded-lg transition-all duration-200 ' + 
                    (isActive ? 'bg-blue-100 text-blue-600 scale-110' : '')
                  }>
                    <Icon size={20} />
                  </div>
                  <span className={'text-xs mt-1 font-medium transition-all duration-200 ' + 
                    (isActive ? 'text-blue-600' : '')
                  }>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Effects - Corregir el problema de persistencia
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setTimeout(() => {
        const savedPin = loadFromStorage('userPin', '');
        if (!savedPin) {
          setIsSettingNewPin(true);
        } else {
          setStoredPin(savedPin); // Asegurar que el PIN se cargue correctamente
          if (checkSessionValidity() && !sessionExpired && !sessionClosed) {
            setIsAuthenticated(true);
            updateActivity();
          }
        }
      }, 100);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      const tenMinutes = 10 * 60 * 1000;

      if (inactiveTime > tenMinutes) {
        lockApp();
      }
    };

    const interval = setInterval(checkInactivity, 30000);
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

  React.useEffect(() => {
    if (isAuthenticated) {
      recalculateBalance();
    }
  }, [transactions, isAuthenticated]);

  // Effect para asegurar que el modo oscuro se persista
  React.useEffect(() => {
    saveToStorage('isDark', isDark);
  }, [isDark]);

  // Effect para asegurar que las transacciones se persistan
  React.useEffect(() => {
    if (transactions.length > 0) {
      saveToStorage('transactions', transactions);
    }
  }, [transactions]);

  // Effect para asegurar que las categorías se persistan
  React.useEffect(() => {
    saveToStorage('customCategories', customCategories);
  }, [customCategories]);

  // Effect para manejar PWA Installation
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que el navegador muestre automáticamente el prompt
      e.preventDefault();
      
      // Guardar el evento para usarlo después
      setDeferredPrompt(e);
      
      // Mostrar nuestro banner personalizado (solo si no se ha descartado)
      if (!installDismissed) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      console.log('PWA instalada exitosamente');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    // Agregar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [installDismissed]);

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
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-16 w-12 h-12 bg-white bg-opacity-20 rounded-full animate-bounce delay-500"></div>
          <div className="absolute bottom-40 left-20 w-16 h-16 bg-white bg-opacity-15 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 right-10 w-8 h-8 bg-white bg-opacity-25 rounded-full animate-bounce delay-700"></div>
        </div>
        
        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-white border-opacity-30 rounded-2xl animate-spin" 
                 style={{animationDuration: '8s'}}></div>
            <div className="absolute inset-2 w-28 h-28 mx-auto bg-white bg-opacity-20 rounded-xl animate-pulse"></div>
            <div className="relative w-32 h-32 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-2xl transform animate-bounce">
              <span className="text-green-500 text-5xl font-bold animate-pulse">G</span>
            </div>
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full animate-ping"></div>
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-white bg-opacity-70 rounded-full animate-ping delay-300"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white bg-opacity-70 rounded-full animate-ping delay-500"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full animate-ping delay-700"></div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2 animate-pulse">Control de Dinero</h1>
          <p className="text-white text-opacity-90 text-lg mb-8">Gestiona tus finanzas</p>
          
          <div className="w-64 mx-auto bg-white bg-opacity-30 rounded-full h-2 mb-4 overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-white text-opacity-80 text-sm animate-pulse">Cargando...</p>
        </div>
      </div>
    );
  }

  // VISTA DE REPORTES
  if (currentView === 'reports') {
    const currentMonthData = getMonthlyData(selectedMonth);
    const expensesByCategory = getExpensesByCategory(selectedMonth); // Filtrar por mes
    
    // Corregir el cálculo del nombre del mes
    const parts = selectedMonth.split('-');
    const year = parts[0];
    const month = parts[1];
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const monthName = monthNames[parseInt(month) - 1] + ' de ' + year;

    return (
      <div className={'min-h-screen ' + bgClass + ' p-4 pb-20'}> {/* Agregar padding bottom */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => {
                setCurrentView('home');
                setActiveTab('reportes');
                setEditingId(null);
              }}
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
                  const parts = selectedMonth.split('-');
                  const year = parts[0];
                  const month = parts[1];
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
                  const parts = selectedMonth.split('-');
                  const year = parts[0];
                  const month = parts[1];
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
                            width: item.percentage + '%'
                          }}
                        ></div>
                      </div>
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
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - Math.min(expensesByCategory.reduce((sum, item) => sum + parseFloat(item.percentage), 0) / 100, 1))}
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
                      strokeDasharray={2 * Math.PI * 45}
                      strokeDashoffset={2 * Math.PI * 45 * 0.25}
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
        
        {/* Menú Inferior también en Reportes */}
        <BottomNavigation />
        
        {/* Banner de Instalación PWA */}
        {showInstallBanner && deferredPrompt && (
          <div className="fixed bottom-20 left-4 right-4 z-50">
            <div className="max-w-md mx-auto">
              <div className={cardClass + ' rounded-xl shadow-2xl border border-blue-200 p-4'}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">📱</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={'text-sm font-semibold ' + textClass + ' mb-1'}>
                      ¿Instalar Control de Dinero?
                    </h3>
                    <p className={'text-xs ' + textSecondaryClass + ' mb-3'}>
                      Obtén acceso más rápido y una mejor experiencia instalando la app en tu dispositivo.
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleInstallApp}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Instalar
                      </button>
                      <button
                        onClick={dismissInstallBanner}
                        className={'flex-1 border ' + borderClass + ' ' + textClass + ' text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors'}
                      >
                        Ahora no
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={dismissInstallBanner}
                    className={'text-gray-400 hover:text-gray-600 flex-shrink-0 p-1'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VISTA DEL GESTOR DE CATEGORÍAS
  if (currentView === 'categories') {
    return (
      <div className={'min-h-screen ' + bgClass + ' p-4 pb-20'}> {/* Agregar padding bottom */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => {
                setCurrentView('home');
                setActiveTab(previousTab || 'reportes'); // Fallback a reportes si no hay previousTab
              }}
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
        
        {/* Menú Inferior también en Categorías */}
        <BottomNavigation />
        
        {/* Banner de Instalación PWA */}
        {showInstallBanner && deferredPrompt && (
          <div className="fixed bottom-20 left-4 right-4 z-50">
            <div className="max-w-md mx-auto">
              <div className={cardClass + ' rounded-xl shadow-2xl border border-blue-200 p-4'}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">📱</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={'text-sm font-semibold ' + textClass + ' mb-1'}>
                      ¿Instalar Control de Dinero?
                    </h3>
                    <p className={'text-xs ' + textSecondaryClass + ' mb-3'}>
                      Obtén acceso más rápido y una mejor experiencia instalando la app en tu dispositivo.
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleInstallApp}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Instalar
                      </button>
                      <button
                        onClick={dismissInstallBanner}
                        className={'flex-1 border ' + borderClass + ' ' + textClass + ' text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors'}
                      >
                        Ahora no
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={dismissInstallBanner}
                    className={'text-gray-400 hover:text-gray-600 flex-shrink-0 p-1'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VISTA DE MOVIMIENTOS (Ver Movimientos)
  if (currentView === 'details') {
    const filteredTransactions = getFilteredTransactions();
    const availableCategories = [...new Set(transactions.map(t => t.category))];

    return (
      <div className={'min-h-screen ' + bgClass + ' p-4 pb-20'}> {/* Agregar padding bottom */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => {
                setCurrentView('home');
                setActiveTab(previousTab || 'reportes'); // Fallback a reportes si no hay previousTab
              }}
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
                    onClick={() => {
                      setPreviousTab('transacciones');
                      setFormData({
                        type: 'income',
                        amount: '',
                        category: '',
                        date: getTodayDate(),
                        observations: ''
                      });
                      setEditingId(null);
                      setCurrentView('form');
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    Agregar Primera Transacción
                  </button>
                )}
              </div>
            ) : (
              filteredTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .reduce((groups, transaction) => {
                  const date = transaction.date;
                  const existingGroup = groups.find(g => g.date === date);
                  if (existingGroup) {
                    existingGroup.transactions.push(transaction);
                  } else {
                    groups.push({ date, transactions: [transaction] });
                  }
                  return groups;
                }, [])
                .map(({ date, transactions: transactionsOfDay }) => (
                  <div key={date} className="space-y-2">
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
                              onClick={() => {
                                setPreviousTab('transacciones');
                                handleEdit(transaction);
                              }}
                              className="text-blue-500 text-sm font-medium hover:text-blue-700 ml-3"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
        
        {/* Menú Inferior también en Movimientos */}
        <BottomNavigation />
        
        {/* Banner de Instalación PWA */}
        {showInstallBanner && deferredPrompt && (
          <div className="fixed bottom-20 left-4 right-4 z-50">
            <div className="max-w-md mx-auto">
              <div className={cardClass + ' rounded-xl shadow-2xl border border-blue-200 p-4'}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">📱</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={'text-sm font-semibold ' + textClass + ' mb-1'}>
                      ¿Instalar Control de Dinero?
                    </h3>
                    <p className={'text-xs ' + textSecondaryClass + ' mb-3'}>
                      Obtén acceso más rápido y una mejor experiencia instalando la app en tu dispositivo.
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleInstallApp}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Instalar
                      </button>
                      <button
                        onClick={dismissInstallBanner}
                        className={'flex-1 border ' + borderClass + ' ' + textClass + ' text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors'}
                      >
                        Ahora no
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={dismissInstallBanner}
                    className={'text-gray-400 hover:text-gray-600 flex-shrink-0 p-1'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VISTA DE FORMULARIO
  if (currentView === 'form') {
    const categories = formData.type === 'income' ? customCategories.income : 
                     formData.type === 'expense' ? customCategories.expense : customCategories.loan;

    return (
      <div className={'min-h-screen ' + bgClass + ' p-4 pb-20'}> {/* Agregar padding bottom */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => {
                setCurrentView('home');
                setActiveTab(previousTab || 'transacciones'); // Fallback a transacciones
                setEditingId(null);
                setFormData({
                  type: 'income',
                  amount: '',
                  category: '',
                  date: getTodayDate(),
                  observations: ''
                });
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
                  setActiveTab(previousTab || 'transacciones'); // Fallback a transacciones
                  setEditingId(null);
                  setFormData({
                    type: 'income',
                    amount: '',
                    category: '',
                    date: getTodayDate(),
                    observations: ''
                  });
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
        
        {/* Menú Inferior también en Formulario */}
        <BottomNavigation />
        
        {/* Banner de Instalación PWA */}
        {showInstallBanner && deferredPrompt && (
          <div className="fixed bottom-20 left-4 right-4 z-50">
            <div className="max-w-md mx-auto">
              <div className={cardClass + ' rounded-xl shadow-2xl border border-blue-200 p-4'}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">📱</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={'text-sm font-semibold ' + textClass + ' mb-1'}>
                      ¿Instalar Control de Dinero?
                    </h3>
                    <p className={'text-xs ' + textSecondaryClass + ' mb-3'}>
                      Obtén acceso más rápido y una mejor experiencia instalando la app en tu dispositivo.
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleInstallApp}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Instalar
                      </button>
                      <button
                        onClick={dismissInstallBanner}
                        className={'flex-1 border ' + borderClass + ' ' + textClass + ' text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors'}
                      >
                        Ahora no
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={dismissInstallBanner}
                    className={'text-gray-400 hover:text-gray-600 flex-shrink-0 p-1'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PANTALLA DE AUTENTICACIÓN
  if (!isAuthenticated) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + bgClass + ' p-4'}>
        <div className="max-w-sm w-full">
          <div className={cardClass + ' rounded-2xl shadow-xl p-8'}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">G</span>
              </div>
              <h2 className={'text-xl font-bold ' + textClass}>
                {isSettingNewPin ? 'Configurar PIN de Seguridad' : 
                 sessionExpired ? 'Sesión Expirada' : 
                 sessionClosed ? 'Sesión Cerrada' : 'Desbloquear Aplicación'}
              </h2>
              <p className={textSecondaryClass + ' text-sm mt-2'}>
                {isSettingNewPin ? 
                  'Elige cómo deseas proteger tu información financiera' : 
                  'Elige tu método de autenticación para continuar'}
              </p>
            </div>

            <div className="mb-6">
              <label className={'block text-sm font-medium ' + textClass + ' mb-3'}>
                {isSettingNewPin ? 'Crear PIN (mínimo 4 dígitos)' : 'Ingresar PIN'}
              </label>
              <div
                onClick={() => setShowNumericKeypad(true)}
                className={'w-full p-4 border-2 ' + inputClass + ' rounded-xl cursor-pointer transition-all hover:border-blue-400 focus-within:border-blue-500'}
              >
                <div className="flex justify-center items-center gap-2">
                  {[...Array(Math.max(4, pinInput.length || 4))].map((_, index) => (
                    <div
                      key={index}
                      className={'w-4 h-4 rounded-full border-2 transition-all ' + 
                        (index < pinInput.length 
                          ? 'bg-blue-500 border-blue-500' 
                          : (isDark ? 'border-gray-500' : 'border-gray-300')
                        )
                      }
                    ></div>
                  ))}
                </div>
                <div className={'text-center text-sm ' + textSecondaryClass + ' mt-2'}>
                  {pinInput.length > 0 ? pinInput.length + ' dígitos ingresados' : 'Toca para ingresar PIN'}
                </div>
              </div>
            </div>

            <div className="relative mb-6">
              <div className={'border-t ' + borderClass}></div>
              <div className={'absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 ' + cardClass}>
                <span className={textSecondaryClass + ' text-sm'}>o</span>
              </div>
            </div>

            <button
              onClick={requestBiometricAuth}
              disabled={isSettingNewPin}
              className={'w-full p-4 rounded-xl border-2 transition-all duration-200 ' + 
                (isSettingNewPin 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                  : 'border-blue-500 bg-blue-50 hover:bg-blue-100 hover:border-blue-600 active:scale-95'
                ) + (isDark && !isSettingNewPin ? ' border-blue-400 bg-blue-900 bg-opacity-30 hover:bg-blue-800 hover:bg-opacity-40' : '')
              }
            >
              <div className="flex flex-col items-center gap-3">
                <div className={'w-16 h-16 rounded-full flex items-center justify-center ' + 
                  (isSettingNewPin 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                  )
                }>
                  <Fingerprint size={32} />
                </div>
                <div>
                  <div className={'font-semibold ' + (isSettingNewPin ? 'text-gray-400' : 'text-blue-600')}>
                    {isSettingNewPin ? 'Huella Dactilar' : 'Usar Huella Dactilar'}
                  </div>
                  <div className={'text-sm ' + textSecondaryClass}>
                    {isSettingNewPin ? 'Disponible después de configurar PIN' : 'Autenticación biométrica del sistema'}
                  </div>
                </div>
              </div>
            </button>

            {authError && (
              <div className="mt-4 text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {authError}
              </div>
            )}

            {showNumericKeypad && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={cardClass + ' rounded-2xl p-6 max-w-sm w-full shadow-2xl'}>
                  <div className="text-center mb-6">
                    <h3 className={'text-lg font-bold ' + textClass + ' mb-2'}>
                      {isSettingNewPin ? 'Crear PIN' : 'Ingresar PIN'}
                    </h3>
                    <div className="flex justify-center items-center gap-2 mb-4">
                      {[...Array(Math.max(4, pinInput.length || 4))].map((_, index) => (
                        <div
                          key={index}
                          className={'w-4 h-4 rounded-full border-2 transition-all ' + 
                            (index < pinInput.length 
                              ? 'bg-green-500 border-green-500' 
                              : (isDark ? 'border-gray-500' : 'border-gray-300')
                            )
                          }
                        ></div>
                      ))}
                    </div>
                    <p className={'text-sm ' + textSecondaryClass}>
                      {isSettingNewPin ? 'Mínimo 4 dígitos' : 'Ingresa tu PIN de seguridad'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((num, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (num === '⌫') {
                            setPinInput(prev => prev.slice(0, -1));
                            setAuthError('');
                          } else if (num !== '' && pinInput.length < 6) {
                            setPinInput(prev => prev + num);
                            setAuthError('');
                          }
                        }}
                        disabled={num === ''}
                        className={'p-4 rounded-xl font-bold text-lg transition-all ' + 
                          (num === '' ? 
                            'invisible' : 
                            (isDark ? 
                              'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white' : 
                              'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800'
                            )
                          )
                        }
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowNumericKeypad(false);
                        setPinInput('');
                        setAuthError('');
                      }}
                      className={'flex-1 p-3 border-2 ' + borderClass + ' rounded-xl ' + textClass + ' font-medium hover:bg-gray-50 transition-colors'}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handlePinSubmit}
                      disabled={pinInput.length < 4}
                      className={'flex-1 p-3 rounded-xl font-medium transition-all ' + 
                        (pinInput.length >= 4 ? 
                          'bg-green-500 hover:bg-green-600 text-white shadow-lg' : 
                          'bg-gray-300 text-gray-500 cursor-not-allowed')
                      }
                    >
                      {isSettingNewPin ? 'Crear PIN' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showBiometricModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={cardClass + ' rounded-2xl p-8 max-w-sm w-full shadow-2xl'}>
                  <div className="text-center">
                    <h3 className={'text-xl font-bold ' + textClass + ' mb-2'}>
                      Autenticación Biométrica
                    </h3>
                    <p className={textSecondaryClass + ' text-sm mb-8'}>
                      Coloca tu dedo en el sensor para continuar
                    </p>

                    <div className="relative mb-8">
                      <div className={'w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ' + 
                        (biometricScanning 
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg animate-pulse' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl hover:shadow-2xl cursor-pointer'
                        )
                      }>
                        <Fingerprint 
                          size={64} 
                          className={'text-white transition-all duration-300 ' + 
                            (biometricScanning ? 'animate-pulse' : '')
                          } 
                        />
                      </div>
                      
                      {biometricScanning && (
                        <>
                          <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-blue-400 border-opacity-30 rounded-full animate-ping"></div>
                          <div className="absolute inset-2 w-28 h-28 mx-auto border-2 border-blue-300 border-opacity-50 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                          <div className="absolute inset-4 w-24 h-24 mx-auto border-2 border-blue-200 border-opacity-70 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                        </>
                      )}
                    </div>

                    <div className={'text-sm font-medium ' + textClass + ' mb-6'}>
                      {biometricScanning ? (
                        <div className="space-y-2">
                          <div className="text-blue-600">🔍 Escaneando huella...</div>
                          <div className={textSecondaryClass}>Mantén el dedo en posición</div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>👆 Toca el sensor para escanear</div>
                          <div className={textSecondaryClass}>Usa tu huella registrada</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowBiometricModal(false);
                          setBiometricScanning(false);
                          setAuthError('');
                        }}
                        disabled={biometricScanning}
                        className={'flex-1 p-3 border-2 ' + borderClass + ' rounded-xl ' + textClass + ' font-medium transition-colors ' + 
                          (biometricScanning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50')
                        }
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleBiometricScan}
                        disabled={biometricScanning}
                        className={'flex-1 p-3 rounded-xl font-medium transition-all ' + 
                          (biometricScanning 
                            ? 'bg-blue-400 text-white cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg active:scale-95'
                          )
                        }
                      >
                        {biometricScanning ? 'Escaneando...' : 'Escanear'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL (HOME)
  return (
    <div className={'min-h-screen ' + bgClass + ' pb-20'}> {/* Agregar padding bottom para el menú */}
      <div className="max-w-md mx-auto">
        
        {/* Header con título y controles */}
        <div className="text-center mb-6 p-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={cardClass + ' p-2 rounded-lg shadow-sm transition-all duration-200 hover:scale-105'}
              title="Cerrar sesión"
            >
              <LogOut size={20} className="text-red-500" />
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
        </div>

        {/* Contenido según tab activo */}
        {activeTab === 'inicio' && (
          <div className="p-4 space-y-6">
            {/* Balance Total */}
            <div className={cardClass + ' border border-gray-200 rounded-lg shadow-sm p-4'}>
              <div className="flex items-center justify-between mb-2">
                <div className={'text-sm ' + textSecondaryClass + ' flex-1 text-center'}>Balance Total</div>
                <button
                  onClick={recalculateBalance}
                  className={'text-xs px-2 py-1 rounded ' + (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                  title="Recalcular balance"
                >
                  🔄
                </button>
              </div>
              <div className={'text-2xl font-bold text-center ' + (balance >= 0 ? 'text-green-600' : 'text-red-600')}>
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

            {/* Últimos Movimientos */}
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
                        onClick={() => {
                          setPreviousTab('inicio');
                          handleEdit(transaction);
                        }}
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
        )}

        {/* Tab Transacciones */}
        {activeTab === 'transacciones' && (
          <div className="p-4 space-y-6">
            <h2 className={'text-xl font-bold ' + textClass + ' mb-4'}>Transacciones</h2>
            
            {/* Botones de acción rápida */}
            <div className="grid grid-cols-3 gap-3">
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

            {/* Ver Movimientos */}
            <button
              onClick={() => {
                setPreviousTab('transacciones'); // Establecer explícitamente que venimos de transacciones
                setCurrentView('details');
              }}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold text-sm"
            >
              Ver Todos los Movimientos
            </button>

            {/* Últimos 5 Movimientos */}
            <div className={cardClass + ' rounded-lg shadow-sm p-4'}>
              <h3 className={'text-lg font-semibold mb-4 ' + textClass}>Últimos Movimientos</h3>
              
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
                        onClick={() => {
                          setPreviousTab('transacciones');
                          handleEdit(transaction);
                        }}
                        className="text-blue-500 text-xs hover:text-blue-700"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
                
                {transactions.length === 0 && (
                  <div className="text-center py-8">
                    <p className={textSecondaryClass + ' mb-4'}>No hay transacciones registradas</p>
                    <button
                      onClick={() => {
                        setPreviousTab('transacciones');
                        setFormData({
                          type: 'income',
                          amount: '',
                          category: '',
                          date: getTodayDate(),
                          observations: ''
                        });
                        setEditingId(null);
                        setCurrentView('form');
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                    >
                      Crear Primera Transacción
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Reportes */}
        {activeTab === 'reportes' && (
          <div className="p-4 space-y-6">
            <h2 className={'text-xl font-bold ' + textClass + ' mb-4'}>Reportes y Análisis</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPreviousTab('reportes'); // Establecer que venimos de reportes
                  setCurrentView('reports');
                }}
                className="bg-purple-500 text-white p-3 rounded-lg font-semibold text-sm"
              >
                Ver Reportes
              </button>
              <button
                onClick={() => {
                  setPreviousTab('reportes'); // Establecer que venimos de reportes
                  setCurrentView('categories');
                }}
                className="bg-gray-600 text-white p-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              >
                🏷️ Categorías
              </button>
            </div>
          </div>
        )}

        {/* Tab Ajustes */}
        {activeTab === 'ajustes' && (
          <div className="p-4 space-y-6">
            <h2 className={'text-xl font-bold ' + textClass + ' mb-4'}>Configuración</h2>
            
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
                    setStoredPin(''); // Limpiar PIN actual
                    saveToStorage('userPin', ''); // Limpiar PIN guardado
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
        )}

        {/* Menú Inferior */}
        <BottomNavigation />

        {/* Banner de Instalación PWA */}
        {showInstallBanner && deferredPrompt && (
          <div className="fixed bottom-20 left-4 right-4 z-50">
            <div className="max-w-md mx-auto">
              <div className={cardClass + ' rounded-xl shadow-2xl border border-blue-200 p-4'}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">📱</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={'text-sm font-semibold ' + textClass + ' mb-1'}>
                      ¿Instalar Control de Dinero?
                    </h3>
                    <p className={'text-xs ' + textSecondaryClass + ' mb-3'}>
                      Obtén acceso más rápido y una mejor experiencia instalando la app en tu dispositivo.
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleInstallApp}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Instalar
                      </button>
                      <button
                        onClick={dismissInstallBanner}
                        className={'flex-1 border ' + borderClass + ' ' + textClass + ' text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors'}
                      >
                        Ahora no
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={dismissInstallBanner}
                    className={'text-gray-400 hover:text-gray-600 flex-shrink-0 p-1'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de logout */}
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
      </div>
    </div>
  );
};

export default MoneyControlApp;