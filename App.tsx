import React, { useState, useEffect } from 'react';
import { MOCK_BRANCHES, MOCK_COMPANY, MOCK_CUSTOMERS, MOCK_INVENTORY, MOCK_PRODUCTS, MOCK_USERS, MOCK_TABLES, MOCK_REGISTERS, MOCK_SUPPLIERS, MOCK_EXPENSES, MOCK_CATEGORIES } from './constants';
import { CartItem, Customer, Order, OrderStatus, OrderType, PaymentMethod, Role, User, Table, TableStatus, Product, LoyaltyConfig, CashRegister, RegisterSession, InventoryItem, ProductionArea, ItemStatus, Supplier, Expense, Branch, Category } from './types';
import { Sidebar } from './components/Sidebar';
import { POSView } from './components/POSView';
import { InventoryView } from './components/InventoryView';
import { Dashboard } from './components/Dashboard';
import { TablesView } from './components/TablesView';
import { CustomersView } from './components/CustomersView';
import { SettingsView } from './components/SettingsView';
import { KDSView } from './components/KDSView';
import { OrdersHistoryView } from './components/OrdersHistoryView';
import { ReportsView } from './components/ReportsView';
import { ExpensesView } from './components/ExpensesView';
import { QrMenuView } from './components/QrMenuView';
import { PublicMenu } from './components/PublicMenu';
import { Delete, Eraser, User as UserIcon, ChefHat, ChevronDown } from 'lucide-react';
import { useNotification } from './components/NotificationContext';

// --- PIN LOGIN COMPONENT ---
const Login: React.FC<{ onLogin: (user: User) => void; users: User[] }> = ({ onLogin, users }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleDigit = (digit: string) => {
      if (pin.length < 4) {
          setPin(prev => prev + digit);
          setError('');
      }
  };

  const handleClear = () => {
      setPin('');
      setError('');
  };

  const handleDelete = () => {
      setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
      const user = users.find(u => u.pin === pin);
      if (user) {
          if (!user.isActive) {
              setError('Usuario desactivado');
              setPin('');
              return;
          }
          onLogin(user);
      } else {
          setError('PIN Incorrecto');
          setPin('');
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent mb-2">GastroOS</h1>
          <p className="text-slate-500 text-sm">Ingresa tu PIN de acceso</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center space-x-4 mb-8">
            {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 ${pin.length > i ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-300'}`}></div>
            ))}
        </div>
        
        {error && <div className="text-red-500 font-bold mb-4 animate-pulse text-sm">{error}</div>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                    key={num} 
                    onClick={() => handleDigit(num.toString())}
                    className="h-16 w-full bg-slate-100 rounded-2xl text-2xl font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all shadow-sm"
                >
                    {num}
                </button>
            ))}
            <button onClick={handleClear} className="h-16 w-full bg-red-50 rounded-2xl text-red-600 hover:bg-red-100 flex items-center justify-center">
                <Eraser size={24} />
            </button>
            <button onClick={() => handleDigit('0')} className="h-16 w-full bg-slate-100 rounded-2xl text-2xl font-bold text-slate-700 hover:bg-slate-200">
                0
            </button>
            <button onClick={handleDelete} className="h-16 w-full bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 flex items-center justify-center">
                <Delete size={24} />
            </button>
        </div>

        <button 
            onClick={handleSubmit} 
            disabled={pin.length !== 4}
            className="w-full bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-brand-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg flex justify-center items-center gap-2"
        >
            <UserIcon size={20} /> INICIAR SESIÓN
        </button>

        <div className="mt-6 text-[10px] text-slate-400 text-center w-full bg-slate-50 p-2 rounded">
            <p>Admin: 1111 | Cajero: 2222</p>
            <p>Chef: 3333 | Asador: 4444 | Mesero: 5555</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isPublicMenu, setIsPublicMenu] = useState(false);
  const [publicMenuBranchId, setPublicMenuBranchId] = useState<string>('');
  
  const { notify, confirm: confirmAction } = useNotification();
  
  // App State
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS); 
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  
  // Branch Specific Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [tables, setTables] = useState<Table[]>(MOCK_TABLES);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [registers, setRegisters] = useState<CashRegister[]>(MOCK_REGISTERS);
  
  const [activeSession, setActiveSession] = useState<RegisterSession | null>(null);
  const [taxRate, setTaxRate] = useState<number>(MOCK_COMPANY.taxRate);
  const [currentBranchId, setCurrentBranchId] = useState<string>(MOCK_BRANCHES[0].id);

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({
      enabled: true,
      pointsPerCurrency: 1, 
      minRedemptionPoints: 50,
      birthdayDiscountPercentage: 50 
  });

  const [selectedTable, setSelectedTable] = useState<Table | undefined>(undefined);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/menu/')) {
        const branchId = path.split('/')[2];
        setIsPublicMenu(true);
        setPublicMenuBranchId(branchId);
    }
  }, []);

  const branchOrders = orders.filter(o => o.branchId === currentBranchId);
  const branchInventory = inventory.filter(i => i.branchId === currentBranchId);
  const branchTables = tables.filter(t => t.branchId === currentBranchId);
  const branchRegisters = registers.filter(r => r.branchId === currentBranchId);
  const branchExpenses = expenses.filter(e => e.branchId === currentBranchId);
  
  const playNotificationSound = () => {
     try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        }
     } catch (e) {
         console.error("Audio error", e);
     }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    notify(`Bienvenido, ${loggedInUser.name}`, 'success');
    if (loggedInUser.branchId) setCurrentBranchId(loggedInUser.branchId);
    
    // Reglas de redirección por rol
    switch (loggedInUser.role) {
        case Role.CASHIER: 
            setCurrentView('tables'); 
            break;
        case Role.CHEF:
        case Role.GRILL_MASTER: 
        case Role.WAITER: // Mesero ahora también solo carga el KDS según requerimiento
            setCurrentView('kds'); 
            break;
        default: 
            setCurrentView('dashboard'); 
            break;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    setSelectedTable(undefined);
    notify('Sesión cerrada correctamente', 'info');
  };

  const handleAddBranch = (newBranch: Branch) => {
      setBranches(prev => [...prev, newBranch]);
      notify('Sucursal creada exitosamente.', 'success');
  };

  const handleUpdateBranch = (updatedBranch: Branch) => {
      setBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
      notify('Datos de sucursal actualizados.', 'success');
  };

  const handleChangeBranch = (branchId: string) => {
      setCurrentBranchId(branchId);
      setSelectedTable(undefined);
      const bName = branches.find(b => b.id === branchId)?.name;
      notify(`Cambiado a sucursal: ${bName}`, 'info');
  };

  const handleOpenRegister = (registerId: string, amount: number) => {
      const newSession: RegisterSession = {
          id: `sess-${Date.now()}`,
          registerId: registerId,
          userId: user!.id,
          userName: user!.name,
          openingAmount: amount,
          startTime: new Date(),
          totalSales: 0
      };
      
      setRegisters(prev => prev.map(r => 
        r.id === registerId 
        ? { ...r, isOpen: true, currentUser: user!.name, currentUserId: user!.id } 
        : r
      ));
      setActiveSession(newSession);
      notify(`Caja abierta con éxito. Monto: $${amount.toFixed(2)}`, 'success');
  };

  const handleCloseRegister = (closingAmount: number) => {
      if (!activeSession) return;
      const expectedAmount = activeSession.openingAmount + activeSession.totalSales;
      const difference = closingAmount - expectedAmount;
      
      let type: 'success' | 'warning' | 'error' = 'success';
      let message = `Caja cerrada. `;
      
      if (Math.abs(difference) < 0.01) {
          message += `Cuadre perfecto.`;
      } else if (difference > 0) {
          message += `Sobrante: $${difference.toFixed(2)}`;
          type = 'warning';
      } else {
          message += `Faltante: $${Math.abs(difference).toFixed(2)}`;
          type = 'error';
      }

      notify(message, type);

      setRegisters(prev => prev.map(r => 
        r.id === activeSession.registerId 
        ? { ...r, isOpen: false, currentUser: undefined, currentUserId: undefined } 
        : r
      ));
      setActiveSession(null);
      setCurrentView('dashboard');
  };

  const handleAddRegister = (newReg: CashRegister) => {
      setRegisters(prev => [...prev, { ...newReg, isActive: true }]);
      notify('Caja creada exitosamente.', 'success');
  };
  
  const handleUpdateRegister = (updatedRegister: CashRegister) => {
      setRegisters(prev => prev.map(r => r.id === updatedRegister.id ? updatedRegister : r));
      notify('Caja actualizada exitosamente.', 'success');
  };

  const handleDeleteRegister = (registerId: string) => {
      // Soft Delete (Logical)
      setRegisters(prev => prev.map(r => r.id === registerId ? { ...r, isActive: false } : r));
      notify('Caja movida a la papelera.', 'info');
  };

  const handleAddCategory = (newCat: Category) => {
      setCategories(prev => [...prev, newCat]);
      notify('Categoría creada exitosamente.', 'success');
  };
  
  const handleUpdateCategory = (updatedCat: Category) => {
      setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
      notify('Categoría actualizada exitosamente.', 'success');
  };

  const handleDeleteCategory = (catId: string) => {
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, isActive: false } : c));
      notify('Categoría movida a la papelera.', 'info');
  };


  const handleSelectTable = (table: Table | undefined) => {
      if (!table) {
          setSelectedTable(undefined);
          return;
      }
      setSelectedTable(table);
      setCurrentView('pos');
  };

  const handleAddTable = (newTable: Table) => {
      setTables(prev => [...prev, { ...newTable, branchId: currentBranchId }]);
      notify('Mesa registrada exitosamente.', 'success');
  };

  const handleUpdateTable = (updatedTable: Table) => {
      setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
      notify('Mesa actualizada correctamente.', 'success');
  };

  const handleChangeTable = (orderId: string, newTableId: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tableId: newTableId } : o));
      
      const oldTableId = selectedTable?.id;
      
      setTables(prev => prev.map(t => {
          if (t.id === oldTableId) return { ...t, status: TableStatus.AVAILABLE, currentOrderId: undefined };
          if (t.id === newTableId) return { ...t, status: TableStatus.OCCUPIED, currentOrderId: orderId };
          return t;
      }));

      const newTable = tables.find(t => t.id === newTableId);
      if (newTable) {
          setSelectedTable({ ...newTable, status: TableStatus.OCCUPIED, currentOrderId: orderId });
      }
      notify('Mesa cambiada exitosamente.', 'success');
  };

  const handleAddProduct = (newProduct: Product) => {
      setProducts(prev => [...prev, newProduct]);
      notify('Producto agregado exitosamente.', 'success');
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    notify('Producto actualizado.', 'success');
  };

  const handleAddCustomer = (newCustomer: Customer) => {
      setCustomers(prev => [...prev, newCustomer]);
      notify('Cliente registrado exitosamente.', 'success');
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      notify('Datos de cliente actualizados.', 'success');
  };

  const handleAddUser = (newUser: User) => {
      setUsers(prev => [...prev, newUser]);
      notify('Empleado registrado exitosamente.', 'success');
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      notify('Usuario actualizado.', 'success');
  };

  const handleAddExpense = (newExpense: Expense) => {
      setExpenses(prev => [...prev, { ...newExpense, branchId: currentBranchId, isActive: true }]);
      notify('Gasto registrado.', 'success');
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
      setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
      notify('Gasto actualizado.', 'success');
  };

  const handleDeleteExpense = async (id: string) => {
      const confirmed = await confirmAction({
          title: 'Mover a Papelera',
          message: '¿Estás seguro de mover este gasto a la papelera?',
          type: 'warning'
      });
      if (confirmed) {
          setExpenses(prev => prev.map(e => e.id === id ? { ...e, isActive: false } : e));
          notify('Gasto movido a la papelera.', 'info');
      }
  };

  const handleAddInventory = (newItem: InventoryItem) => {
      setInventory(prev => [...prev, newItem]);
      notify('Insumo registrado exitosamente.', 'success');
  };

  const handleUpdateInventory = (item: InventoryItem) => {
      setInventory(prev => prev.map(i => i.id === item.id ? item : i));
      notify('Inventario actualizado.', 'success');
  };

  const handleAddSupplier = (supplier: Supplier) => {
      setSuppliers(prev => [...prev, supplier]);
      notify('Proveedor registrado.', 'success');
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
      setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
      notify('Proveedor actualizado.', 'success');
  };

  // Logic to deduct inventory recursively (Combos support)
  const deductInventory = (items: CartItem[]) => {
      const newInventory = [...inventory]; 
      let lowStockAlerts: string[] = [];

      const processProductDeduction = (product: Product, quantity: number) => {
          if (product.isCombo && product.comboItems) {
              // Si es combo, procesar recursivamente los items del combo
              product.comboItems.forEach(comboItem => {
                  const subProduct = products.find(p => p.id === comboItem.productId);
                  if (subProduct) {
                      processProductDeduction(subProduct, quantity * comboItem.quantity);
                  }
              });
          } else if (product.ingredients && product.ingredients.length > 0) {
              // Si es producto simple con receta, descontar insumos
              product.ingredients.forEach(ing => {
                  const invItemIndex = newInventory.findIndex(i => i.id === ing.inventoryItemId && i.branchId === currentBranchId);
                  if (invItemIndex !== -1) {
                      const amountToDeduct = ing.quantity * quantity;
                      newInventory[invItemIndex].stock -= amountToDeduct;
                      
                      if (newInventory[invItemIndex].stock <= newInventory[invItemIndex].minStock) {
                          lowStockAlerts.push(newInventory[invItemIndex].name);
                      }
                  }
              });
          }
      };

      items.forEach(cartItem => {
          processProductDeduction(cartItem.product, cartItem.quantity);
      });

      setInventory(newInventory);
      if (lowStockAlerts.length > 0) {
          const uniqueAlerts = [...new Set(lowStockAlerts)];
          notify(`⚠️ STOCK BAJO: ${uniqueAlerts.join(', ')}`, 'warning');
      }
  };

  const restoreInventory = (items: CartItem[]) => {
      const newInventory = [...inventory];

      const processProductRestoration = (product: Product, quantity: number) => {
          if (product.isCombo && product.comboItems) {
              product.comboItems.forEach(comboItem => {
                  const subProduct = products.find(p => p.id === comboItem.productId);
                  if (subProduct) {
                      processProductRestoration(subProduct, quantity * comboItem.quantity);
                  }
              });
          } else if (product.ingredients && product.ingredients.length > 0) {
              product.ingredients.forEach(ing => {
                  const invItemIndex = newInventory.findIndex(i => i.id === ing.inventoryItemId && i.branchId === currentBranchId);
                  if (invItemIndex !== -1) {
                      const amountToRestore = ing.quantity * quantity;
                      newInventory[invItemIndex].stock += amountToRestore;
                  }
              });
          }
      };

      items.forEach(cartItem => {
          processProductRestoration(cartItem.product, cartItem.quantity);
      });
      setInventory(newInventory);
  };

  const handleSendOrder = (items: CartItem[], type: OrderType, customer?: Customer) => {
    const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalCost = items.reduce((sum, item) => sum + (item.product.cost * item.quantity), 0);
    const tax = total * taxRate;
    const finalTotal = total + tax;

    const itemsWithStatus = items.map(item => ({...item, status: ItemStatus.PENDING}));
    const newOrderId = Math.random().toString(36).substr(2, 9);

    const newOrder: Order = {
        id: newOrderId,
        branchId: currentBranchId, 
        tableId: selectedTable?.id,
        type,
        status: OrderStatus.PREPARING,
        items: itemsWithStatus,
        subtotal: total,
        tax: tax,
        discount: 0,
        total: finalTotal,
        totalCost: totalCost,
        paymentMethod: undefined,
        customerId: customer?.id,
        createdAt: new Date()
    };

    deductInventory(items);
    setOrders(prev => [newOrder, ...prev]);

    if (selectedTable) {
        setTables(prev => prev.map(t => 
            t.id === selectedTable.id 
            ? { ...t, status: TableStatus.OCCUPIED, currentOrderId: newOrderId } 
            : t
        ));
        setSelectedTable(prev => prev ? { ...prev, status: TableStatus.OCCUPIED, currentOrderId: newOrderId } : undefined);
    }
    notify('Pedido enviado a cocina.', 'success');
  };

  const handleProcessPayment = (items: CartItem[], total: number, type: OrderType, method: PaymentMethod, customer?: Customer) => {
    if (items.length > 0) {
        const subtotal = total / (1 + taxRate);
        const tax = total - subtotal;
        
        const itemsWithStatus = items.map(item => ({...item, status: ItemStatus.READY}));
        const totalCost = items.reduce((sum, item) => sum + (item.product.cost * item.quantity), 0);

        const newOrder: Order = {
            id: Math.random().toString(36).substr(2, 9),
            branchId: currentBranchId,
            tableId: selectedTable?.id,
            type,
            status: OrderStatus.COMPLETED,
            items: itemsWithStatus,
            subtotal: subtotal,
            tax: tax,
            discount: 0,
            total: 0, 
            totalCost: totalCost,
            paymentMethod: method,
            customerId: customer?.id,
            createdAt: new Date(),
            readyAt: new Date()
        };
        
        const newItemsTotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * (1 + taxRate);
        newOrder.total = newItemsTotal;
        
        deductInventory(items);
        setOrders(prev => [newOrder, ...prev]);
    }

    if (activeSession) {
        setActiveSession(prev => prev ? { ...prev, totalSales: prev.totalSales + total } : null);
    }

    if (selectedTable) {
        setOrders(prev => prev.map(o => {
            if (o.tableId === selectedTable.id && (o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING || o.status === OrderStatus.READY)) {
                return { ...o, status: OrderStatus.COMPLETED, paymentMethod: method };
            }
            return o;
        }));
    }

    if (customer && loyaltyConfig.enabled) {
      const pointsEarned = Math.floor(total * loyaltyConfig.pointsPerCurrency);
      setCustomers(prev => prev.map(c => {
        if (c.id === customer.id) {
          return { ...c, points: c.points + pointsEarned };
        }
        return c;
      }));
    }

    if (selectedTable) {
        setTables(prev => prev.map(t => 
            t.id === selectedTable.id ? { ...t, status: TableStatus.AVAILABLE, currentOrderId: undefined } : t
        ));
        setSelectedTable(undefined);
    }
    notify(`Cobro exitoso: $${total.toFixed(2)} (${method})`, 'success');
  };

  const handleCancelOrder = async (order: Order) => {
      const confirmed = await confirmAction({
          title: 'Anular Pedido',
          message: '¿Estás seguro de anular este pedido? Se restaurará el inventario.',
          type: 'warning',
          confirmText: 'Sí, Anular'
      });

      if (confirmed) {
          restoreInventory(order.items);
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: OrderStatus.CANCELLED } : o));
          
          if (order.tableId) {
             const hasOtherOrders = orders.some(o => o.tableId === order.tableId && o.id !== order.id && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED);
             if (!hasOtherOrders) {
                 setTables(prev => prev.map(t => t.id === order.tableId ? { ...t, status: TableStatus.AVAILABLE, currentOrderId: undefined } : t));
                 if (selectedTable?.id === order.tableId) {
                     setSelectedTable(prev => prev ? { ...prev, status: TableStatus.AVAILABLE } : undefined);
                 }
             }
          }
          notify('Pedido anulado correctamente.', 'info');
      }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
      setOrders(prev => prev.map(o => {
          if (o.id === orderId) {
             const updates: any = { status };
             if (status === OrderStatus.READY && !o.readyAt) {
                 updates.readyAt = new Date();
                 playNotificationSound();
             }
             return { ...o, ...updates };
          }
          return o;
      }));
  };

  const handleUpdateOrderItems = (orderId: string, area: ProductionArea | 'ALL') => {
      setOrders(prev => prev.map(o => {
          if (o.id === orderId) {
             const newItems = o.items.map(item => {
                 if (area === 'ALL' || item.product.productionArea === area) {
                     return { ...item, status: ItemStatus.READY };
                 }
                 return item;
             });

             const allReady = newItems.every(item => item.status === ItemStatus.READY);
             const updates: any = { items: newItems };
             if (allReady) {
                 updates.status = OrderStatus.READY;
                 updates.readyAt = new Date();
                 playNotificationSound();
             }

             return { ...o, ...updates };
          }
          return o;
      }));
  };

  if (isPublicMenu) {
      const branch = branches.find(b => b.id === publicMenuBranchId);
      const displayBranch = branch || branches[0];
      return <PublicMenu products={products} branch={displayBranch} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard orders={branchOrders} activeSession={activeSession} registers={branchRegisters} onOpenRegister={handleOpenRegister} onCloseRegister={handleCloseRegister} currentUser={user!} />;
      case 'pos':
        return <POSView products={products} onProcessPayment={handleProcessPayment} onSendOrder={handleSendOrder} onCancelOrder={handleCancelOrder} customers={customers} selectedTable={selectedTable} onSelectTable={handleSelectTable} onChangeTable={handleChangeTable} tables={branchTables} isRegisterOpen={!!activeSession} activeRegisterName={registers.find(r => r.id === activeSession?.registerId)?.name} orders={branchOrders} taxRate={taxRate} userRole={user!.role} loyaltyConfig={loyaltyConfig} onAddCustomer={handleAddCustomer} />;
      case 'tables':
        return <TablesView tables={branchTables} onSelectTable={handleSelectTable} onAddTable={handleAddTable} onUpdateTable={handleUpdateTable} isRegisterOpen={!!activeSession} />;
      case 'kds':
        return <KDSView orders={branchOrders} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateOrderItems={handleUpdateOrderItems} />;
      case 'inventory':
        return <InventoryView products={products} inventory={branchInventory} suppliers={suppliers} categories={categories} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onAddInventory={handleAddInventory} onUpdateInventory={handleUpdateInventory} onAddSupplier={handleAddSupplier} onUpdateSupplier={handleUpdateSupplier} />;
      case 'customers':
        return <CustomersView customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} />;
      case 'expenses':
        return <ExpensesView expenses={branchExpenses} onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'orders':
        return <OrdersHistoryView orders={branchOrders} />;
      case 'reports':
        return <ReportsView orders={branchOrders} expenses={branchExpenses} />;
      case 'qr-menu':
        return <QrMenuView products={products} currentBranch={branches.find(b => b.id === currentBranchId)} />;
      case 'settings':
        return <SettingsView loyaltyConfig={loyaltyConfig} onUpdateLoyalty={setLoyaltyConfig} users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} registers={registers} onAddRegister={handleAddRegister} onUpdateRegister={handleUpdateRegister} onDeleteRegister={handleDeleteRegister} taxRate={taxRate} onUpdateTax={setTaxRate} branches={branches} currentBranchId={currentBranchId} onAddBranch={handleAddBranch} onUpdateBranch={handleUpdateBranch} onChangeBranch={handleChangeBranch} userRole={user!.role} categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />;
      default:
        return <div>En Construcción</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => { setCurrentView(view); if (view !== 'pos') setSelectedTable(undefined); }} 
        onLogout={handleLogout} userRole={user.role} branches={branches} currentBranchId={currentBranchId} onBranchChange={handleChangeBranch}
      />
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden pb-16 md:pb-0 relative">
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-20 shrink-0 print:hidden">
             <div className="flex items-center gap-3">
                <div className="bg-brand-600 p-2 rounded-lg">
                    <ChefHat size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight leading-none">GastroOS</h1>
                    <div className="relative inline-block mt-1">
                        <select 
                            value={currentBranchId}
                            onChange={(e) => handleChangeBranch(e.target.value)}
                            className="bg-transparent text-[10px] uppercase font-bold text-slate-400 appearance-none pr-4 outline-none"
                        >
                            {branches.map(b => (
                                <option key={b.id} value={b.id} className="text-slate-900">{b.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-0 top-0.5 text-slate-400 pointer-events-none" />
                    </div>
                </div>
             </div>
        </div>
        <div className="flex-1 overflow-hidden relative w-full">
            {((user.role === Role.CASHIER || user.role === Role.WAITER) && currentView === 'pos') ? (
                 <div className="h-full relative w-full">
                    {selectedTable && (
                         <button 
                            onClick={() => { setSelectedTable(undefined); setCurrentView('tables'); }} 
                            className="hidden md:flex absolute bottom-16 left-4 z-50 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-brand-600 transition-colors"
                            title="Volver a Mesas"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                    )}
                   {renderView()}
                 </div>
            ) : renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;