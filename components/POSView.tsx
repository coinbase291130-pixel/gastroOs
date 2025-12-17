import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, User, Truck, UtensilsCrossed, ShoppingBag, X, ChevronRight, Grid3X3, Lock, Send, ReceiptText, Clock, ListChecks, Ban, Monitor, Calculator, Cake, Gift, Check, ChefHat, Save, XCircle, ArrowRightLeft, Split, Coins, Users } from 'lucide-react';
import { Product, CartItem, OrderType, Customer, PaymentMethod, Table, Order, TableStatus, OrderStatus, ItemStatus, Role, LoyaltyConfig } from '../types';
import { useNotification } from './NotificationContext';

interface POSViewProps {
  products: Product[];
  onProcessPayment: (items: CartItem[], total: number, type: OrderType, method: PaymentMethod, customer?: Customer) => void;
  onSendOrder: (items: CartItem[], type: OrderType, customer?: Customer) => void;
  onCancelOrder: (order: Order) => void;
  customers: Customer[];
  selectedTable?: Table;
  onSelectTable: (table: Table | undefined) => void;
  tables: Table[];
  isRegisterOpen: boolean;
  activeRegisterName?: string;
  orders: Order[]; // History of orders to calculate table bill
  taxRate: number;
  userRole: Role;
  loyaltyConfig: LoyaltyConfig;
  onAddCustomer: (customer: Customer) => void; 
  onChangeTable: (orderId: string, newTableId: string) => void; 
}

export const POSView: React.FC<POSViewProps> = ({ 
    products, onProcessPayment, onSendOrder, onCancelOrder, customers, 
    selectedTable, onSelectTable, tables, isRegisterOpen, activeRegisterName,
    orders, taxRate, userRole, loyaltyConfig, onAddCustomer, onChangeTable
}) => {
  const { notify } = useNotification();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [orderType, setOrderType] = useState<OrderType>(selectedTable ? OrderType.DINE_IN : OrderType.TAKEAWAY);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  
  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isChangeTableModalOpen, setIsChangeTableModalOpen] = useState(false); // Modal Cambio Mesa
  
  // New Customer Modal State
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerBirth, setNewCustomerBirth] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [splitType, setSplitType] = useState<'NONE' | 'EQUAL' | 'PRODUCT'>('NONE');
  const [splitCount, setSplitCount] = useState<number>(1);

  // Discount State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isBirthday, setIsBirthday] = useState(false);

  // Tab state for Drawer (Current Cart vs Table Account)
  const [activeTab, setActiveTab] = useState<'cart' | 'bill'>('cart');

  // Filter Active Customers
  const activeCustomers = customers.filter(c => c.isActive);

  // Update OrderType if selectedTable changes
  useEffect(() => {
    if (selectedTable) {
        setOrderType(OrderType.DINE_IN);
    }
  }, [selectedTable]);

  // Check Birthday Logic
  useEffect(() => {
      if (selectedCustomer?.birthDate) {
          const d = new Date();
          const b = new Date(selectedCustomer.birthDate + 'T00:00:00');
          const isBday = d.getMonth() === b.getMonth() && d.getDate() === b.getDate();
          setIsBirthday(isBday);
          
          if (!isBday) {
             setDiscountAmount(0); // Reset discount if changed user
          }
      } else {
          setIsBirthday(false);
          setDiscountAmount(0);
      }
  }, [selectedCustomer]);

  const handleOrderTypeChange = (type: OrderType) => {
      setOrderType(type);
      if (type === OrderType.DINE_IN && !selectedTable) {
          setIsTableModalOpen(true);
      }
  };

  const handleTableSelection = (table: Table) => {
      onSelectTable(table);
      setIsTableModalOpen(false);
      notify(`Mesa ${table.name} seleccionada`, 'info');
  };

  const handleDeselectTable = () => {
      onSelectTable(undefined);
      setOrderType(OrderType.TAKEAWAY); 
  };

  const handleChangeTableSelection = (targetTable: Table) => {
      // Logic to move the current active order to target table
      if (!selectedTable || !selectedTable.currentOrderId) return;
      
      onChangeTable(selectedTable.currentOrderId, targetTable.id);
      setIsChangeTableModalOpen(false);
  };

  // Calculate Table Bill (Existing Sent Orders)
  const tableOrders = useMemo(() => {
    if (!selectedTable) return [];
    return orders.filter(o => 
        o.tableId === selectedTable.id && 
        o.status !== OrderStatus.CANCELLED && 
        o.status !== OrderStatus.COMPLETED
    );
  }, [selectedTable, orders]);

  const tableBillTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);

  // Categories extraction
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.isActive; // Only show Active products
  });

  // Cart logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { cartId: Math.random().toString(36), product, quantity: 1, status: ItemStatus.PENDING }];
    });
    // Auto switch to cart tab if adding items
    if (activeTab !== 'cart') setActiveTab('cart');
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Totals
  const currentCartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const currentCartTax = currentCartSubtotal * taxRate; 
  const currentCartTotal = currentCartSubtotal + currentCartTax;
  
  const rawGrandTotal = tableBillTotal + currentCartTotal;
  const grandTotal = Math.max(0, rawGrandTotal - discountAmount);
  const totalWithTip = grandTotal + tipAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Apply Birthday Discount
  const applyBirthdayDiscount = () => {
      const discountPercentage = loyaltyConfig.birthdayDiscountPercentage || 50;
      const discountValue = rawGrandTotal * (discountPercentage / 100);
      setDiscountAmount(discountValue);
      notify('Descuento de cumpleaños aplicado', 'success');
  };

  const removeDiscount = () => {
      setDiscountAmount(0);
      notify('Descuento removido', 'info');
  };

  const openPaymentModal = () => {
    if (orderType === OrderType.DINE_IN && !selectedTable) {
        setIsTableModalOpen(true);
        return;
    }

    if (cart.length > 0 && selectedTable) {
         if(confirm("Tienes items en el carrito no enviados. ¿Deseas cobrarlos directamente junto con la cuenta?")) {
             setIsPaymentModalOpen(true);
             setPaymentMethod(null);
             setCashTendered('');
             setTipAmount(0);
             setSplitType('NONE');
         }
    } else {
        setIsPaymentModalOpen(true);
        setPaymentMethod(null);
        setCashTendered('');
        setTipAmount(0);
        setSplitType('NONE');
    }
  };

  const confirmPayment = () => {
      if (!paymentMethod) return;

      onProcessPayment(cart, grandTotal, orderType, paymentMethod, selectedCustomer);
      
      // Cleanup Logic
      setCart([]);
      setIsPaymentModalOpen(false);
      setIsMobileCartOpen(false);
      setSelectedCustomer(undefined);
      setDiscountAmount(0);
      setCashTendered('');
      setPaymentMethod(null);
      setTipAmount(0);
  };

  const handleSendOrder = () => {
      if (orderType === OrderType.DINE_IN && !selectedTable) {
          setIsTableModalOpen(true);
          return;
      }
      onSendOrder(cart, orderType, selectedCustomer);
      setCart([]); 
      setIsMobileCartOpen(false);
      setActiveTab('bill');
  };

  const handleSaveNewCustomer = (e: React.FormEvent) => {
      e.preventDefault();
      const newCustomer: Customer = {
          id: Math.random().toString(36).substr(2, 9),
          name: newCustomerName,
          phone: newCustomerPhone,
          birthDate: newCustomerBirth,
          points: 0,
          isActive: true
      };
      onAddCustomer(newCustomer);
      setSelectedCustomer(newCustomer);
      setIsNewCustomerModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerBirth('');
  };

  if (!isRegisterOpen) {
      return (
          <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-500">
              <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                      <Lock size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Caja Cerrada</h2>
                  <p className="max-w-xs mx-auto">No se pueden procesar ventas ni pedidos mientras la caja esté cerrada. Contacte a un administrador.</p>
              </div>
          </div>
      )
  }

  // Calculate Change (Only relevant for Cash)
  const tendered = parseFloat(cashTendered) || 0;
  const change = tendered - totalWithTip;

  // Render Order Type buttons filtered by Role
  const renderOrderTypes = () => {
      const options = [
        { type: OrderType.DINE_IN, icon: <UtensilsCrossed size={16} />, label: 'Comer Aquí' },
        { type: OrderType.TAKEAWAY, icon: <ShoppingBag size={16} />, label: 'Llevar', hidden: userRole === Role.WAITER },
        { type: OrderType.DELIVERY, icon: <Truck size={16} />, label: 'Domicilio', hidden: userRole === Role.WAITER }
      ];

      return options.filter(o => !o.hidden).map(opt => (
        <button
            key={opt.type}
            onClick={() => handleOrderTypeChange(opt.type)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-bold rounded-lg transition-all ${
            orderType === opt.type ? 'bg-white text-brand-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
        >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ));
  };

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
      {/* LEFT SIDE: Products */}
      <div className={`flex-1 flex flex-col p-2 md:p-6 h-full transition-all duration-300 ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header with Active Register Info */}
        <div className="flex justify-between items-center mb-4">
             {selectedTable ? (
                <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-between flex-1 mr-4 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center">
                        <Grid3X3 className="mr-3 text-emerald-100" size={24} />
                        <div>
                            <span className="font-bold text-xl block leading-tight">{selectedTable.name}</span>
                            <span className="text-xs text-emerald-100 opacity-90 font-medium">
                                {selectedTable.status === TableStatus.OCCUPIED ? 'Ocupada' : 'Seleccionada'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedTable.status === TableStatus.OCCUPIED && (
                            <button 
                                onClick={() => setIsChangeTableModalOpen(true)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-colors"
                                title="Cambiar/Mover Mesa"
                            >
                                <ArrowRightLeft size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleDeselectTable}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-colors"
                            title="Salir de la Mesa (Deseleccionar)"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>
            ) : orderType === OrderType.DINE_IN ? (
                 <button 
                    onClick={() => setIsTableModalOpen(true)}
                    className="bg-white text-brand-700 px-4 py-3 rounded-2xl border-2 border-brand-100 border-dashed shadow-sm flex items-center justify-between flex-1 mr-4 animate-in slide-in-from-top hover:bg-brand-50 hover:border-brand-300 transition-all duration-200 group"
                 >
                    <div className="flex items-center">
                        <div className="bg-brand-100 p-2 rounded-lg mr-3 group-hover:bg-brand-200 transition-colors">
                            <Grid3X3 className="text-brand-600" size={20} />
                        </div>
                        <span className="font-bold text-lg">Seleccionar Mesa</span>
                    </div>
                    <div className="text-sm bg-brand-100 text-brand-800 px-3 py-1 rounded-full font-bold">Requerido</div>
                </button>
            ) : (
                <div className="flex-1 flex items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Menú</h2>
                </div>
            )}
            
            {/* Active Register Badge */}
            {activeRegisterName && (
                <div className="hidden md:flex items-center bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg shadow-slate-300 text-sm font-medium whitespace-nowrap">
                    <Monitor size={16} className="mr-2 text-emerald-400" />
                    {activeRegisterName}
                </div>
            )}
        </div>

        {/* Search Bar & Filters */}
        <div className="flex flex-col space-y-3 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              className="w-full pl-12 pr-4 py-3 border-none bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-sm ${
                  selectedCategory === cat 
                    ? 'bg-slate-800 text-white scale-105' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid - Responsive Columns */}
        <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24 md:pb-4">
            {filteredProducts.map(product => (
                <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200 flex flex-col h-48 md:h-60 group overflow-hidden border border-transparent hover:border-brand-200 active:scale-95"
                >
                <div className="h-28 md:h-36 overflow-hidden relative bg-slate-100">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white px-2.5 py-1 rounded-lg text-sm font-bold backdrop-blur-sm">
                    ${product.price.toFixed(2)}
                    </div>
                </div>
                <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-sm md:text-base text-slate-800 leading-tight line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium">{product.category}</p>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* Mobile Floating Cart Summary Button */}
      {!isMobileCartOpen && (cart.length > 0 || tableBillTotal > 0) && (
        <div className="md:hidden absolute bottom-4 left-4 right-4 z-30">
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-brand-600 text-white p-4 rounded-xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom duration-300"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">
                {cart.length > 0 ? totalItems : tableOrders.length}
              </div>
              <span className="font-bold text-lg">${grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center font-semibold text-sm">
              Ver Pedido <ChevronRight className="ml-1" size={18} />
            </div>
          </button>
        </div>
      )}

      {/* RIGHT SIDE: Cart - Responsive Drawer */}
      <div className={`
        fixed md:relative inset-0 md:inset-auto z-40 bg-white shadow-2xl flex flex-col h-full 
        md:w-[500px] md:translate-x-0 transition-transform duration-300 border-l border-slate-100
        ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Cart Header */}
        <div className="p-5 border-b border-slate-100 bg-white z-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800 truncate pr-2 flex items-center gap-2">
                    <ShoppingBag size={22} className="text-brand-600" />
                    {selectedTable ? `Mesa: ${selectedTable.name}` : 'Pedido Actual'}
                </h2>
                <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Tabs for Table Mode (Cart vs Bill) */}
            {selectedTable ? (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('cart')}
                        className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${
                            activeTab === 'cart' 
                            ? 'bg-white text-brand-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Nuevo ({cart.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('bill')}
                        className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${
                            activeTab === 'bill' 
                            ? 'bg-white text-brand-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Cuenta (${tableBillTotal.toFixed(0)})
                    </button>
                </div>
            ) : (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {renderOrderTypes()}
                </div>
            )}
        </div>

        {/* Customer Select */}
        <div className="px-5 py-3 border-b border-slate-50 bg-white">
          <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center space-x-2 text-sm bg-slate-50 border-transparent hover:bg-slate-100 rounded-xl px-3 py-2 transition-colors">
                <User size={16} className="text-slate-400" />
                <select 
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-bold outline-none cursor-pointer"
                  onChange={(e) => setSelectedCustomer(activeCustomers.find(c => c.id === e.target.value))}
                  value={selectedCustomer?.id || ''}
                >
                  <option value="">Cliente Ocasional</option>
                  {activeCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.points} pts)</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="bg-slate-800 text-white p-2.5 rounded-xl hover:bg-slate-700 transition-colors shadow-sm"
                title="Agregar Nuevo Cliente"
              >
                  <Plus size={18} />
              </button>
          </div>
          {isBirthday && (
              <div className="mt-3 flex items-center bg-gradient-to-r from-pink-50 to-white p-3 rounded-xl border border-pink-100 animate-pulse shadow-sm">
                  <div className="bg-pink-100 p-2 rounded-lg mr-3">
                    <Cake className="text-pink-500" size={18} />
                  </div>
                  <div className="flex-1">
                      <p className="text-xs font-bold text-pink-600 uppercase tracking-wider">¡Cumpleaños!</p>
                      <p className="text-[10px] text-pink-400 font-medium">Descuento disponible ({loyaltyConfig.birthdayDiscountPercentage || 50}% OFF).</p>
                  </div>
              </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white custom-scrollbar">
          
          {/* VIEW: NEW CART */}
          {(!selectedTable || activeTab === 'cart') && (
              <>
                 {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <ShoppingBag size={40} />
                        </div>
                        <p className="font-medium">El carrito está vacío</p>
                    </div>
                ) : (
                    cart.map(item => (
                    <div key={item.cartId} className="flex justify-between items-start group animate-in slide-in-from-right-2 duration-300">
                        <div className="flex-1 pr-3">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{item.product.name}</h4>
                            <div className="text-xs font-medium text-slate-400">${item.product.price.toFixed(2)} c/u</div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                                <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 hover:text-red-500 transition-all w-7 h-7 flex items-center justify-center"><Minus size={12}/></button>
                                <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 hover:text-green-500 transition-all w-7 h-7 flex items-center justify-center"><Plus size={12}/></button>
                            </div>
                            <div className="w-16 text-right font-bold text-slate-800 text-sm">
                                ${(item.product.price * item.quantity).toFixed(2)}
                            </div>
                            <button onClick={() => removeFromCart(item.cartId)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    ))
                )}
              </>
          )}

          {/* VIEW: TABLE BILL (HISTORY) */}
          {selectedTable && activeTab === 'bill' && (
              <div className="space-y-4">
                  {tableOrders.length === 0 ? (
                      <div className="text-center text-slate-400 py-10 opacity-60">
                          <Clock size={48} className="mx-auto mb-4 opacity-50" />
                          <p>Aún no hay pedidos enviados.</p>
                      </div>
                  ) : (
                      tableOrders.map(order => (
                          <div key={order.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                                  <div>
                                      <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">Orden #{order.id.slice(0,4)}</span>
                                      <span className="text-[10px] text-slate-400 font-medium">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                          order.status === OrderStatus.READY ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-white border border-slate-200 text-slate-500'
                                      }`}>
                                          {order.status}
                                      </span>
                                      {/* Cancel Button */}
                                      <button 
                                        onClick={() => onCancelOrder(order)}
                                        className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Anular Pedido"
                                      >
                                          <Ban size={14} />
                                      </button>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-sm items-center group">
                                          <div className="flex items-center gap-2">
                                              {/* Granular Status Icon */}
                                              {item.status === ItemStatus.READY ? (
                                                  <Check size={14} className="text-emerald-500" />
                                              ) : (
                                                  <ChefHat size={14} className="text-slate-300 group-hover:text-brand-400 transition-colors" />
                                              )}
                                              <span className={`text-slate-700 font-medium ${item.status === ItemStatus.READY ? 'text-emerald-700' : ''}`}>
                                                  {item.quantity}x {item.product.name}
                                              </span>
                                          </div>
                                          <span className="font-bold text-slate-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          )}

        </div>

        {/* Totals Section */}
        <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
            {/* Show totals differently based on context */}
            {selectedTable ? (
                // Table Mode Totals
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-slate-500 font-medium">
                        <span>Cuenta Anterior</span>
                        <span>${tableBillTotal.toFixed(2)}</span>
                    </div>
                    {cart.length > 0 && (
                        <div className="flex justify-between text-sm text-brand-600 font-bold bg-brand-50 p-2 rounded-lg">
                            <span>+ Nuevo Pedido</span>
                            <span>${currentCartTotal.toFixed(2)}</span>
                        </div>
                    )}
                     <div className="flex justify-between text-2xl font-bold text-slate-800 pt-2 border-t border-slate-100">
                        <span>Total</span>
                        <span>${grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            ) : (
                // Takeaway Mode Totals
                <div className="space-y-1 mb-4">
                     <div className="flex justify-between text-sm text-slate-500 font-medium">
                        <span>Subtotal</span>
                        <span>${currentCartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500 font-medium">
                        <span>Impuestos ({(taxRate * 100).toFixed(0)}%)</span>
                        <span>${currentCartTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-slate-800 pt-3 border-t border-slate-100 mt-2">
                        <span>Total</span>
                        <span>${grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            )}

          {/* Birthday Discount Controls */}
          {isBirthday && discountAmount === 0 && (
              <button 
                onClick={applyBirthdayDiscount}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center animate-in fade-in shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all mb-3"
              >
                  <Gift size={16} className="mr-2" /> Aplicar Descuento Cumpleañero ({loyaltyConfig.birthdayDiscountPercentage || 50}%)
              </button>
          )}

          {discountAmount > 0 && (
              <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-sm mb-3">
                  <span className="text-emerald-700 font-bold flex items-center"><Gift size={16} className="mr-2"/> Descuento Aplicado</span>
                  <div className="flex items-center">
                      <span className="font-bold text-emerald-700 mr-2">-${discountAmount.toFixed(2)}</span>
                      <button onClick={removeDiscount} className="text-emerald-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                  </div>
              </div>
          )}

          <div className="flex flex-col gap-3">
              {/* Button to Send to Kitchen */}
              {cart.length > 0 && (
                  <button 
                    onClick={handleSendOrder}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-slate-200 transition-all flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <Send size={20} />
                    <span>Enviar a Cocina</span>
                  </button>
              )}
              
              {/* Payment Button */}
              <button 
                disabled={grandTotal === 0 && discountAmount === 0}
                onClick={openPaymentModal}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 ${
                    selectedTable 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' 
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
                }`}
              >
                {selectedTable ? <ReceiptText size={20} /> : <Banknote size={20} />}
                <span>
                    {selectedTable ? `Cerrar Cuenta` : `Cobrar`}
                </span>
              </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6 text-center text-slate-800">
                {paymentMethod ? 'Confirmar Pago' : 'Selecciona Método de Pago'}
            </h3>
            
            {!paymentMethod ? (
                <>
                {/* Total Display */}
                <div className="mb-8 text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 font-medium mb-1 uppercase tracking-wide text-xs">Total a cobrar</p>
                    <p className="text-5xl font-extrabold text-slate-900 tracking-tight">${totalWithTip.toFixed(2)}</p>
                    {discountAmount > 0 && <p className="text-sm text-emerald-600 font-bold mt-2 bg-emerald-50 inline-block px-3 py-1 rounded-full">¡Descuento aplicado!</p>}
                </div>

                {/* Extras Buttons */}
                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => {
                            const tip = prompt("Ingrese monto de propina:");
                            if (tip) setTipAmount(parseFloat(tip));
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${tipAmount > 0 ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-white border-slate-100 text-slate-600 hover:border-brand-200'}`}
                    >
                        <Coins size={18} className="mr-2" /> {tipAmount > 0 ? `Propina: $${tipAmount}` : 'Propina'}
                    </button>
                    <button 
                        onClick={() => setSplitType(splitType === 'EQUAL' ? 'NONE' : 'EQUAL')}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${splitType === 'EQUAL' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-100 text-slate-600 hover:border-brand-200'}`}
                    >
                        <Split size={18} className="mr-2" /> Dividir
                    </button>
                </div>

                {/* Split Logic UI */}
                {splitType === 'EQUAL' && (
                    <div className="bg-blue-50 p-5 rounded-2xl mb-8 border border-blue-100 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-blue-800">Personas a dividir</span>
                            <div className="flex items-center bg-white rounded-lg shadow-sm border border-blue-100">
                                <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="p-2 hover:bg-slate-50 rounded-l-lg text-blue-600"><Minus size={16}/></button>
                                <span className="w-10 text-center font-bold text-lg text-slate-800">{splitCount}</span>
                                <button onClick={() => setSplitCount(splitCount + 1)} className="p-2 hover:bg-slate-50 rounded-r-lg text-blue-600"><Plus size={16}/></button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold text-blue-700 pt-3 border-t border-blue-200">
                            <span>Monto por persona:</span>
                            <span>${(totalWithTip / splitCount).toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Main Payment Methods Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-all active:scale-95 group">
                        <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-white group-hover:shadow-md transition-all">
                            <Banknote size={32} />
                        </div>
                        <span className="font-bold">Efectivo</span>
                    </button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.CARD)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all active:scale-95 group">
                        <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-white group-hover:shadow-md transition-all">
                            <CreditCard size={32} />
                        </div>
                        <span className="font-bold">Tarjeta</span>
                    </button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.QR)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:bg-purple-50 hover:border-purple-500 hover:text-purple-700 transition-all active:scale-95 group">
                        <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-white group-hover:shadow-md transition-all">
                            <QrCode size={32} />
                        </div>
                        <span className="font-bold">QR / Wallet</span>
                    </button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.MIXED)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700 transition-all active:scale-95 group">
                        <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-white group-hover:shadow-md transition-all">
                            <Users size={32} />
                        </div>
                        <span className="font-bold">Mixto</span>
                    </button>
                </div>
                </>
            ) : paymentMethod === PaymentMethod.CASH ? (
                /* CASH PAYMENT FLOW - WITH INPUT */
                <div className="space-y-6">
                     <div className="text-center mb-4">
                        <p className="text-slate-500 font-medium uppercase text-xs tracking-wide">Total a Pagar</p>
                        <p className="text-4xl font-extrabold text-slate-800">${totalWithTip.toFixed(2)}</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Monto Recibido</label>
                        <div className="relative">
                            <Banknote className="absolute left-4 top-4 text-slate-400" size={24} />
                            <input 
                                autoFocus
                                type="number" 
                                className="w-full border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-2xl font-bold font-mono focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                                value={cashTendered}
                                onChange={e => setCashTendered(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className={`p-5 rounded-2xl border-2 text-center transition-all ${change >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cambio / Vueltas</p>
                        <p className={`text-4xl font-extrabold ${change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            ${change.toFixed(2)}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => setPaymentMethod(null)}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Volver
                        </button>
                        <button 
                            onClick={confirmPayment}
                            disabled={change < 0}
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                        >
                            Confirmar Cobro
                        </button>
                    </div>
                </div>
            ) : (
                /* CARD / QR PAYMENT FLOW */
                <div className="space-y-8 text-center py-4">
                    <div>
                        <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 border-4 border-blue-100 animate-pulse">
                            {paymentMethod === PaymentMethod.CARD ? <CreditCard size={48} /> : <QrCode size={48} />}
                        </div>
                        <p className="text-slate-500 font-medium mb-1">Monto a procesar</p>
                        <p className="text-5xl font-extrabold text-slate-800">${totalWithTip.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-3">
                         <button 
                            onClick={() => setPaymentMethod(null)}
                            className="flex-1 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmPayment}
                            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <Check size={24} />
                            Pago Exitoso
                        </button>
                    </div>
                </div>
            )}
            
            {!paymentMethod && (
                <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full mt-8 py-3 rounded-xl text-slate-400 hover:text-slate-600 font-bold transition-colors text-sm"
                >
                Cancelar Operación
                </button>
            )}
          </div>
        </div>
      )}

      {/* Table Selection Modal (Quick Select from POS) */}
      {isTableModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Seleccionar Mesa</h3>
                        <p className="text-slate-500">Elige una mesa para iniciar o continuar un pedido</p>
                      </div>
                      <button onClick={() => setIsTableModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={24} className="text-slate-600" /></button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tables.map(table => {
                        const isOccupied = table.status === TableStatus.OCCUPIED;
                        return (
                            <button
                                key={table.id}
                                onClick={() => handleTableSelection(table)}
                                className={`relative h-32 w-full rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all transform hover:scale-105 group ${
                                    isOccupied 
                                    ? 'bg-red-50 border-2 border-red-200 text-red-800' 
                                    : 'bg-white border-2 border-emerald-100 text-slate-800 hover:border-emerald-400 hover:shadow-emerald-100'
                                }`}
                            >
                                <div className="flex justify-between items-start w-full">
                                    <span className="font-bold text-lg">{table.name}</span>
                                    {isOccupied ? <Clock size={20} className="text-red-400"/> : <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-sm"></div>}
                                </div>
                                <div className="flex justify-between items-end w-full">
                                    <span className="text-sm font-medium opacity-70">{table.seats} Pax</span>
                                    {isOccupied && <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold">OCUPADA</span>}
                                </div>
                            </button>
                        );
                    })}
                  </div>
              </div>
          </div>
      )}

      {/* Change Table Modal */}
      {isChangeTableModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Mover a Nueva Mesa</h3>
                        <p className="text-slate-500">Selecciona la mesa destino para transferir el pedido</p>
                      </div>
                      <button onClick={() => setIsChangeTableModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={24} className="text-slate-600" /></button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tables.map(table => {
                        const isOccupied = table.status === TableStatus.OCCUPIED;
                        if (table.id === selectedTable?.id || isOccupied) return null;

                        return (
                            <button
                                key={table.id}
                                onClick={() => handleChangeTableSelection(table)}
                                className="relative h-28 w-full rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all transform hover:scale-105 bg-white border-2 border-emerald-100 text-slate-800 hover:border-emerald-400 hover:shadow-lg"
                            >
                                <div className="flex justify-between items-start w-full">
                                    <span className="font-bold text-lg">{table.name}</span>
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                </div>
                                <div className="text-sm font-medium text-slate-500">
                                    Capacidad: {table.seats}
                                </div>
                            </button>
                        );
                    })}
                  </div>
              </div>
          </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Nuevo Cliente</h3>
                    <button onClick={() => setIsNewCustomerModalOpen(false)} className="bg-slate-50 p-1.5 rounded-full hover:bg-slate-200"><X className="text-slate-600" size={20}/></button>
                </div>
                <form onSubmit={handleSaveNewCustomer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                        <input required type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Nombre Completo" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                        <input required type="tel" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="555-1234" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                        <input type="date" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newCustomerBirth} onChange={e => setNewCustomerBirth(e.target.value)} />
                        <p className="text-xs text-slate-400 mt-1 flex items-center"><Gift size={12} className="mr-1"/> Necesario para descuentos de cumpleaños.</p>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl mt-4 flex items-center justify-center shadow-lg transition-all active:scale-95">
                        <Save size={18} className="mr-2"/> Guardar y Seleccionar
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};