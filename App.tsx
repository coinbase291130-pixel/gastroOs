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
import { Delete, Eraser, User as UserIcon, ChefHat, ChevronDown, LogOut } from 'lucide-react';
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
    <div className="h-[100dvh] w-full bg-slate-950 flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-800 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 md:p-10 w-full max-w-[380px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="mb-6 text-center">
          <div className="bg-brand-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-900/20">
             <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1 uppercase">GastroOS</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ingresa tu PIN</p>
        </div>

        <div className="flex justify-center space-x-5 mb-8">
            {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > i 
                    ? 'bg-brand-600 border-brand-600 scale-125 shadow-lg shadow-brand-200' 
                    : 'bg-white border-slate-200'
                  }`}
                ></div>
            ))}
        </div>
        
        <div className="h-6 mb-2">
          {error && <div className="text-red-500 font-black text-[10px] uppercase tracking-tighter animate-bounce">{error}</div>}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                    key={num} 
                    onClick={() => handleDigit(num.toString())}
                    className="h-14 md:h-16 w-full bg-slate-50 rounded-2xl text-xl font-black text-slate-800 hover:bg-slate-100 active:scale-90 transition-all border border-slate-100"
                >
                    {num}
                </button>
            ))}
            <button onClick={handleClear} className="h-14 md:h-16 w-full bg-slate-50 rounded-2xl text-red-500 hover:bg-red-50 flex items-center justify-center border border-slate-100 active:scale-90 transition-all">
                <Eraser size={22} />
            </button>
            <button onClick={() => handleDigit('0')} className="h-14 md:h-16 w-full bg-slate-50 rounded-2xl text-xl font-black text-slate-800 hover:bg-slate-100 border border-slate-100 active:scale-90 transition-all">
                0
            </button>
            <button onClick={handleDelete} className="h-14 md:h-16 w-full bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 flex items-center justify-center border border-slate-100 active:scale-90 transition-all">
                <Delete size={22} />
            </button>
        </div>

        <button 
            onClick={handleSubmit} 
            disabled={pin.length !== 4}
            className="w-full bg-brand-600 disabled:bg-slate-100 disabled:text-slate-300 hover:bg-brand-700 text-white font-black py-4 rounded-[1.25rem] transition-all shadow-xl shadow-brand-600/20 flex justify-center items-center gap-3 uppercase text-xs tracking-widest active:scale-95"
        >
            <UserIcon size={18} /> Acceder al Sistema
        </button>
      </div>

      <p className="mt-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">GastroOS Cloud v1.0</p>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isPublicMenu, setIsPublicMenu] = useState(false);
  const [publicMenuBranchId, setPublicMenuBranchId] = useState<string>('');
  
  const { notify, confirm: confirmAction } = useNotification();
  
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS); 
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  
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
    setCurrentView(loggedInUser.role === Role.CHEF || loggedInUser.role === Role.GRILL_MASTER ? 'kds' : 'tables');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    setSelectedTable(undefined);
    notify('Sesión cerrada correctamente', 'info');
  };

  // --- CRUD HANDLERS ---

  // Register Handlers
  const handleOpenRegister = (registerId: string, amount: number) => {
    const session: RegisterSession = {
      id: Math.random().toString(36).substr(2, 9),
      registerId,
      userId: user?.id || '',
      userName: user?.name || '',
      openingAmount: amount,
      startTime: new Date(),
      totalSales: 0
    };
    setActiveSession(session);
    setRegisters(prev => prev.map(r => r.id === registerId ? { ...r, isOpen: true, currentUserId: user?.id, currentUser: user?.name } : r));
    notify('Caja abierta correctamente', 'success');
  };

  const handleCloseRegister = (closingAmount: number) => {
    if (!activeSession) return;
    setActiveSession(null);
    setRegisters(prev => prev.map(r => r.id === activeSession.registerId ? { ...r, isOpen: false, currentUserId: undefined, currentUser: undefined } : r));
    notify('Turno cerrado correctamente', 'info');
  };

  const handleAddRegister = (register: CashRegister) => setRegisters(prev => [...prev, register]);
  const handleUpdateRegister = (register: CashRegister) => setRegisters(prev => prev.map(r => r.id === register.id ? register : r));
  const handleDeleteRegister = (id: string) => setRegisters(prev => prev.map(r => r.id === id ? { ...r, isActive: false } : r));

  // Customer Handlers
  const handleAddCustomer = (customer: Customer) => setCustomers(prev => [...prev, customer]);
  const handleUpdateCustomer = (customer: Customer) => setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));

  // Table Handlers
  const handleAddTable = (table: Table) => setTables(prev => [...prev, table]);
  const handleUpdateTable = (table: Table) => setTables(prev => prev.map(t => t.id === table.id ? table : t));

  // Product Handlers
  const handleAddProduct = (product: Product) => setProducts(prev => [...prev, product]);
  const handleUpdateProduct = (product: Product) => setProducts(prev => prev.map(p => p.id === product.id ? product : p));

  // Inventory Handlers
  const handleAddInventory = (item: InventoryItem) => setInventory(prev => [...prev, item]);
  const handleUpdateInventory = (item: InventoryItem) => setInventory(prev => prev.map(i => i.id === item.id ? item : i));

  // Supplier Handlers
  const handleAddSupplier = (supplier: Supplier) => setSuppliers(prev => [...prev, supplier]);
  const handleUpdateSupplier = (supplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));

  // Expense Handlers
  const handleAddExpense = (expense: Expense) => setExpenses(prev => [...prev, expense]);
  const handleUpdateExpense = (expense: Expense) => setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));

  // User Handlers
  const handleAddUser = (u: User) => setUsers(prev => [...prev, u]);
  const handleUpdateUser = (u: User) => setUsers(prev => prev.map(curr => curr.id === u.id ? u : curr));

  // Branch Handlers
  const handleAddBranch = (branch: Branch) => setBranches(prev => [...prev, branch]);
  const handleUpdateBranch = (branch: Branch) => setBranches(prev => prev.map(b => b.id === branch.id ? branch : b));

  // Category Handlers
  const handleAddCategory = (category: Category) => setCategories(prev => [...prev, category]);
  const handleUpdateCategory = (category: Category) => setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  const handleDeleteCategory = (id: string) => setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: false } : c));

  const deductInventory = (items: CartItem[]) => {
      const newInventory = [...inventory]; 
      let lowStockAlerts: string[] = [];
      const processProductDeduction = (product: Product, quantity: number) => {
          if (product.isCombo && product.comboItems) {
              product.comboItems.forEach(comboItem => {
                  const subProduct = products.find(p => p.id === comboItem.productId);
                  if (subProduct) processProductDeduction(subProduct, quantity * comboItem.quantity);
              });
          } else if (product.ingredients && product.ingredients.length > 0) {
              product.ingredients.forEach(ing => {
                  const invItemIndex = newInventory.findIndex(i => i.id === ing.inventoryItemId && i.branchId === currentBranchId);
                  if (invItemIndex !== -1) {
                      const amountToDeduct = ing.quantity * quantity;
                      newInventory[invItemIndex].stock -= amountToDeduct;
                      if (newInventory[invItemIndex].stock <= newInventory[invItemIndex].minStock) lowStockAlerts.push(newInventory[invItemIndex].name);
                  }
              });
          }
      };
      items.forEach(cartItem => processProductDeduction(cartItem.product, cartItem.quantity));
      setInventory(newInventory);
      if (lowStockAlerts.length > 0) notify(`⚠️ STOCK BAJO: ${[...new Set(lowStockAlerts)].join(', ')}`, 'warning');
  };

  const handleSendOrder = (items: CartItem[], type: OrderType, customer?: Customer) => {
    const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = total * taxRate;
    const itemsWithStatus = items.map(item => ({...item, status: ItemStatus.PENDING}));
    const newOrderId = Math.random().toString(36).substr(2, 9);
    const newOrder: Order = { id: newOrderId, branchId: currentBranchId, tableId: selectedTable?.id, type, status: OrderStatus.PREPARING, items: itemsWithStatus, subtotal: total, tax: tax, discount: 0, total: total + tax, totalCost: items.reduce((sum, i) => sum + (i.product.cost * i.quantity), 0), customerId: customer?.id, createdAt: new Date() };
    deductInventory(items);
    setOrders(prev => [newOrder, ...prev]);
    if (selectedTable) {
        setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: TableStatus.OCCUPIED, currentOrderId: newOrderId } : t));
        setSelectedTable(prev => prev ? { ...prev, status: TableStatus.OCCUPIED, currentOrderId: newOrderId } : undefined);
    }
    notify('Pedido enviado a cocina.', 'success');
  };

  const handleProcessPayment = (items: CartItem[], total: number, type: OrderType, method: PaymentMethod, customer?: Customer) => {
    if (items.length > 0) {
        const subtotal = total / (1 + taxRate);
        const tax = total - subtotal;
        const targetStatus = (type === OrderType.DINE_IN) ? OrderStatus.COMPLETED : OrderStatus.PREPARING;
        
        const newOrder: Order = { 
            id: Math.random().toString(36).substr(2, 9), 
            branchId: currentBranchId, 
            tableId: selectedTable?.id, 
            type, 
            status: targetStatus, 
            items: items.map(item => ({...item, status: ItemStatus.PENDING})), 
            subtotal, tax, discount: 0, total, 
            totalCost: items.reduce((sum, item) => sum + (item.product.cost * item.quantity), 0), 
            paymentMethod: method, 
            customerId: customer?.id, 
            createdAt: new Date() 
        };
        
        deductInventory(items);
        setOrders(prev => [newOrder, ...prev]);
    } else if (selectedTable) {
        setOrders(prev => prev.map(o => (o.tableId === selectedTable.id && o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED) ? { ...o, status: OrderStatus.COMPLETED, paymentMethod: method } : o));
        setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: TableStatus.AVAILABLE, currentOrderId: undefined } : t));
        setSelectedTable(undefined);
    }
    
    if (activeSession) setActiveSession(prev => prev ? { ...prev, totalSales: prev.totalSales + total } : null);
    notify(`Cobro registrado: $${total.toFixed(2)}`, 'success');
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => { setOrders(prev => prev.map(o => { if (o.id === orderId) { const updates: any = { status }; if (status === OrderStatus.READY && !o.readyAt) { updates.readyAt = new Date(); playNotificationSound(); } return { ...o, ...updates }; } return o; })); };
  const handleUpdateOrderItems = (orderId: string, area: ProductionArea | 'ALL') => { setOrders(prev => prev.map(o => { if (o.id === orderId) { const newItems = o.items.map(item => (area === 'ALL' || item.product.productionArea === area) ? { ...item, status: ItemStatus.READY } : item); const allReady = newItems.every(item => item.status === ItemStatus.READY); const updates: any = { items: newItems }; if (allReady) { updates.status = OrderStatus.READY; updates.readyAt = new Date(); playNotificationSound(); } return { ...o, ...updates }; } return o; })); };

  if (isPublicMenu) return <PublicMenu products={products} branch={branches.find(b => b.id === publicMenuBranchId) || branches[0]} />;
  if (!user) return <Login onLogin={handleLogin} users={users} />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={(view) => { setCurrentView(view); if (view !== 'pos') setSelectedTable(undefined); }} onLogout={handleLogout} userRole={user.role} branches={branches} currentBranchId={currentBranchId} onBranchChange={setCurrentBranchId} />
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden pb-16 md:pb-0 relative">
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-20 shrink-0">
             <div className="flex items-center gap-3">
                <div className="bg-brand-600 p-2 rounded-lg"><ChefHat size={20} className="text-white" /></div>
                <div><h1 className="text-lg font-bold tracking-tight leading-none">GastroOS</h1><p className="text-[9px] uppercase font-bold text-slate-400 mt-1">{branches.find(b => b.id === currentBranchId)?.name}</p></div>
             </div>
             <button onClick={handleLogout} className="bg-red-500/20 text-red-400 p-2.5 rounded-xl"><LogOut size={18} /></button>
        </div>
        <div className="flex-1 overflow-hidden relative w-full">
            {currentView === 'dashboard' && <Dashboard orders={branchOrders} activeSession={activeSession} registers={branchRegisters} onOpenRegister={handleOpenRegister} onCloseRegister={handleCloseRegister} currentUser={user!} />}
            {currentView === 'pos' && <POSView products={products} inventory={branchInventory} onProcessPayment={handleProcessPayment} onSendOrder={handleSendOrder} onCancelOrder={confirmAction} customers={customers} selectedTable={selectedTable} onSelectTable={setSelectedTable} onChangeTable={() => {}} tables={branchTables} isRegisterOpen={!!activeSession} activeRegisterName={registers.find(r => r.id === activeSession?.registerId)?.name} orders={branchOrders} taxRate={taxRate} userRole={user!.role} loyaltyConfig={loyaltyConfig} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} />}
            {currentView === 'tables' && <TablesView tables={branchTables} onSelectTable={(t) => { setSelectedTable(t); setCurrentView('pos'); }} onAddTable={handleAddTable} onUpdateTable={handleUpdateTable} isRegisterOpen={!!activeSession} />}
            {currentView === 'kds' && <KDSView orders={branchOrders} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateOrderItems={handleUpdateOrderItems} userRole={user!.role} />}
            {currentView === 'inventory' && <InventoryView products={products} inventory={branchInventory} suppliers={suppliers} categories={categories} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onAddInventory={handleAddInventory} onUpdateInventory={handleUpdateInventory} onAddSupplier={handleAddSupplier} onUpdateSupplier={handleUpdateSupplier} />}
            {currentView === 'customers' && <CustomersView customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} />}
            {currentView === 'expenses' && <ExpensesView expenses={branchExpenses} onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={confirmAction} />}
            {currentView === 'orders' && <OrdersHistoryView orders={branchOrders} />}
            {currentView === 'reports' && <ReportsView orders={branchOrders} expenses={branchExpenses} />}
            {currentView === 'qr-menu' && <QrMenuView products={products} currentBranch={branches.find(b => b.id === currentBranchId)} />}
            {currentView === 'settings' && <SettingsView loyaltyConfig={loyaltyConfig} onUpdateLoyalty={setLoyaltyConfig} users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} registers={registers} onAddRegister={handleAddRegister} onUpdateRegister={handleUpdateRegister} onDeleteRegister={handleDeleteRegister} taxRate={taxRate} onUpdateTax={setTaxRate} branches={branches} currentBranchId={currentBranchId} onAddBranch={handleAddBranch} onUpdateBranch={handleUpdateBranch} onChangeBranch={setCurrentBranchId} userRole={user!.role} categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />}
        </div>
      </main>
    </div>
  );
};

export default App;