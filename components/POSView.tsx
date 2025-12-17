import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, User, Truck, UtensilsCrossed, ShoppingBag, X, ChevronLeft, ChevronRight, Grid3X3, Lock, Send, ReceiptText, Clock, ListChecks, Ban, Monitor, Calculator, Cake, Gift, Check, ChefHat, Save, XCircle, ArrowRightLeft, Split, Coins, Users } from 'lucide-react';
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
  orders: Order[];
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
  const { notify, confirm } = useNotification();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [orderType, setOrderType] = useState<OrderType>(selectedTable ? OrderType.DINE_IN : OrderType.TAKEAWAY);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isChangeTableModalOpen, setIsChangeTableModalOpen] = useState(false);
  
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerBirth, setNewCustomerBirth] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isBirthday, setIsBirthday] = useState(false);
  const [activeTab, setActiveTab] = useState<'cart' | 'bill'>('cart');

  const activeCustomers = customers.filter(c => c.isActive);

  useEffect(() => {
    if (selectedTable) {
        setOrderType(OrderType.DINE_IN);
        const activeOrder = orders.find(o => 
            o.tableId === selectedTable.id && 
            o.status !== OrderStatus.CANCELLED && 
            o.status !== OrderStatus.COMPLETED
        );
        if (activeOrder?.customerId) {
            const customer = customers.find(c => c.id === activeOrder.customerId);
            if (customer) setSelectedCustomer(customer);
        } else if (cart.length === 0) {
            setSelectedCustomer(undefined);
        }
        if (selectedTable.status === TableStatus.OCCUPIED) {
            setActiveTab('bill');
        } else {
            setActiveTab('cart');
        }
    }
  }, [selectedTable?.id, orders.length]); 

  useEffect(() => {
      if (selectedCustomer?.birthDate) {
          const d = new Date();
          const b = new Date(selectedCustomer.birthDate + 'T00:00:00');
          const isBday = d.getMonth() === b.getMonth() && d.getDate() === b.getDate();
          setIsBirthday(isBday);
          if (!isBday) setDiscountAmount(0);
      } else {
          setIsBirthday(false);
          setDiscountAmount(0);
      }
  }, [selectedCustomer]);

  const handleOrderTypeChange = (type: OrderType) => {
      setOrderType(type);
      if (type === OrderType.DINE_IN && !selectedTable) setIsTableModalOpen(true);
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
      if (!selectedTable || !selectedTable.currentOrderId) return;
      onChangeTable(selectedTable.currentOrderId, targetTable.id);
      setIsChangeTableModalOpen(false);
  };

  const tableOrders = useMemo(() => {
    if (!selectedTable) return [];
    return orders.filter(o => 
        o.tableId === selectedTable.id && 
        o.status !== OrderStatus.CANCELLED && 
        o.status !== OrderStatus.COMPLETED
    );
  }, [selectedTable, orders]);

  const tableBillTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.isActive;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { cartId: Math.random().toString(36).substr(2, 9), product, quantity: 1, status: ItemStatus.PENDING }];
    });
    if (activeTab !== 'cart') setActiveTab('cart');
    if (window.innerWidth < 768) notify(`+ ${product.name}`, 'success');
  };

  const removeFromCart = (cartId: string) => setCart(prev => prev.filter(item => item.cartId !== cartId));

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const currentCartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const currentCartTax = currentCartSubtotal * taxRate; 
  const currentCartTotal = currentCartSubtotal + currentCartTax;
  const rawGrandTotal = tableBillTotal + currentCartTotal;
  const grandTotal = Math.max(0, rawGrandTotal - discountAmount);
  const totalWithTip = grandTotal + tipAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const openPaymentModal = async () => {
    if (orderType === OrderType.DINE_IN && !selectedTable) {
        setIsTableModalOpen(true);
        return;
    }
    if (cart.length > 0 && selectedTable) {
         const shouldProceed = await confirm({
             title: 'Items Pendientes',
             message: '¿Deseas cobrar la cuenta incluyendo lo que está en el carrito?',
             type: 'info',
             confirmText: 'Sí, Cobrar Todo'
         });
         if (!shouldProceed) return;
    }
    setIsPaymentModalOpen(true);
    setPaymentMethod(null);
    setCashTendered('');
  };

  const confirmPayment = () => {
      if (!paymentMethod) return;
      onProcessPayment(cart, grandTotal, orderType, paymentMethod, selectedCustomer);
      setCart([]);
      setIsPaymentModalOpen(false);
      setIsMobileCartOpen(false);
      setSelectedCustomer(undefined);
      setDiscountAmount(0);
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
    notify('Cliente registrado', 'success');
  };

  if (!isRegisterOpen) {
      return (
          <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-500">
              <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Lock size={32} /></div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Caja Cerrada</h2>
                  <p className="max-w-xs mx-auto">No se pueden procesar pedidos mientras la caja esté cerrada.</p>
              </div>
          </div>
      )
  }

  const tendered = parseFloat(cashTendered) || 0;
  const change = tendered - totalWithTip;

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden w-full max-w-full">
      {/* SECCIÓN IZQUIERDA: MENÚ DE PRODUCTOS */}
      <div className={`flex-1 flex flex-col p-3 md:p-6 h-full transition-all duration-300 w-full overflow-hidden ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex justify-between items-center mb-3">
             {selectedTable ? (
                <div className="bg-emerald-600 text-white px-3 py-2.5 rounded-xl shadow-lg flex items-center justify-between flex-1 mr-2">
                    <div className="flex items-center">
                        <Grid3X3 className="mr-2 text-emerald-100" size={20} />
                        <div><span className="font-bold text-base block leading-tight">{selectedTable.name}</span><span className="text-[9px] text-emerald-100 opacity-90">{selectedTable.status === TableStatus.OCCUPIED ? 'Ocupada' : 'Seleccionada'}</span></div>
                    </div>
                    <div className="flex gap-1">
                        {selectedTable.status === TableStatus.OCCUPIED && (
                            <button onClick={() => setIsChangeTableModalOpen(true)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"><ArrowRightLeft size={16} /></button>
                        )}
                        <button onClick={handleDeselectTable} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"><XCircle size={16} /></button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsTableModalOpen(true)} className="bg-white text-brand-700 px-3 py-2.5 rounded-xl border-2 border-brand-100 border-dashed shadow-sm flex items-center justify-between flex-1 mr-2 hover:bg-brand-50 transition-all">
                    <div className="flex items-center"><div className="bg-brand-100 p-1.5 rounded-lg mr-2"><Grid3X3 className="text-brand-600" size={18} /></div><span className="font-bold text-sm">Seleccionar Mesa</span></div>
                    <div className="text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-bold">Requerido</div>
                </button>
            )}
            
            {activeRegisterName && (
                <div className="hidden md:flex items-center bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap">
                    <Monitor size={16} className="mr-2 text-emerald-400" />{activeRegisterName}
                </div>
            )}
        </div>

        <div className="flex flex-col space-y-2 mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2.5 border-none bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 text-slate-700 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat ? 'bg-slate-800 text-white scale-105' : 'bg-white text-slate-600'}`}>{cat}</button>
            ))}
          </div>
        </div>

        {/* LISTADO DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex flex-col gap-2 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-4 pb-28">
            {filteredProducts.map(product => (
                <div 
                    key={product.id} 
                    onClick={() => addToCart(product)} 
                    className="bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-row md:flex-col h-20 md:h-60 group overflow-hidden border border-slate-50 hover:border-brand-200 active:scale-95 w-full"
                >
                    <div className="w-20 md:w-full h-full md:h-36 overflow-hidden relative bg-slate-100 shrink-0">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="hidden md:block absolute bottom-2 right-2 bg-slate-900/80 text-white px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm">
                            ${product.price.toFixed(2)}
                        </div>
                    </div>
                    <div className="p-2 md:p-4 flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-xs md:text-base text-slate-800 leading-tight truncate md:line-clamp-2">{product.name}</h3>
                            <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 font-medium">{product.category}</p>
                        </div>
                        <div className="md:hidden flex justify-between items-end mt-1">
                             <span className="font-black text-brand-600 text-sm">${product.price.toFixed(2)}</span>
                             <div className="bg-brand-50 p-1 rounded-lg"><Plus size={14} className="text-brand-600"/></div>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* BOTÓN FLOTANTE MÓVIL */}
      {!isMobileCartOpen && (cart.length > 0 || tableBillTotal > 0) && (
        <div className="md:hidden fixed bottom-[72px] left-4 right-4 z-30 pointer-events-none">
          <button 
            onClick={() => setIsMobileCartOpen(true)} 
            className="w-full bg-brand-600 text-white p-3.5 rounded-2xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom duration-300 ring-4 ring-white/20 pointer-events-auto active:scale-95 transition-transform"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs">{cart.length > 0 ? totalItems : (tableOrders.length > 0 ? tableOrders.length : 0)}</div>
              <span className="font-bold text-lg">${grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center font-bold text-sm">Ver Cuenta <ChevronRight className="ml-1" size={18} /></div>
          </button>
        </div>
      )}

      {/* SECCIÓN DERECHA: EL CARRITO (CON BOTÓN VOLVER PARA MÓVIL) */}
      <div className={`
        fixed md:relative inset-x-0 top-0 bottom-16 md:bottom-0 md:inset-auto md:right-0 z-40 bg-white shadow-2xl flex flex-col h-[calc(100dvh-64px)] md:h-full 
        md:w-[450px] lg:w-[500px] md:translate-x-0 transition-transform duration-300 ease-in-out border-l border-slate-100
        ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Cabecera del Drawer */}
        <div className="flex-none p-4 md:p-5 border-b border-slate-100 bg-white z-10">
            <div className="flex items-center gap-3 mb-3">
                {/* BOTÓN VOLVER (NUEVO) */}
                <button 
                    onClick={() => setIsMobileCartOpen(false)} 
                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 group active:scale-90"
                >
                    <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-tight">Volver</span>
                </button>
                
                <h2 className="text-base md:text-xl font-bold text-slate-800 truncate flex-1 flex items-center gap-2">
                    <ShoppingBag size={20} className="text-brand-600 hidden xs:block" />
                    {selectedTable ? `Mesa: ${selectedTable.name}` : 'Resumen'}
                </h2>
                
                {/* Botón X solo en desktop si fuera necesario, en móvil usamos Volver */}
                <button onClick={() => setIsMobileCartOpen(false)} className="hidden md:block p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={22} /></button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
                {selectedTable ? (
                    <>
                    <button 
                        onClick={() => {
                            setActiveTab('cart');
                            // Si estamos en móvil, el "Nuevo" ya no cierra el panel, solo cambia de pestaña
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'cart' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Nuevo ({cart.length})
                    </button>
                    <button onClick={() => setActiveTab('bill')} className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'bill' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>
                        Cuenta (${tableBillTotal.toFixed(0)})
                    </button>
                    </>
                ) : (
                    <div className="flex-1 flex gap-1">
                        <button onClick={() => handleOrderTypeChange(OrderType.DINE_IN)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${orderType === OrderType.DINE_IN ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>Mesa</button>
                        <button onClick={() => handleOrderTypeChange(OrderType.TAKEAWAY)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${orderType === OrderType.TAKEAWAY ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>Llevar</button>
                    </div>
                )}
            </div>
        </div>

        {/* Selector de Cliente */}
        {userRole !== Role.WAITER && (
          <div className="flex-none px-4 py-2 border-b border-slate-50 bg-white">
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center space-x-2 text-xs bg-slate-50 border-transparent rounded-lg px-2 py-1.5">
                  <User size={14} className="text-slate-400" />
                  <select className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-bold outline-none cursor-pointer text-[10px]" onChange={(e) => setSelectedCustomer(activeCustomers.find(c => c.id === e.target.value))} value={selectedCustomer?.id || ''}>
                    <option value="">Cliente Ocasional</option>
                    {activeCustomers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.points} pts)</option>)}
                  </select>
                </div>
                <button onClick={() => setIsNewCustomerModalOpen(true)} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 shadow-sm"><Plus size={14} /></button>
            </div>
          </div>
        )}

        {/* LISTADO DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white custom-scrollbar">
          {(!selectedTable || activeTab === 'cart') && (
              <>
                 {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                        <ShoppingBag size={40} className="mb-2 opacity-20" />
                        <p className="font-bold text-xs text-center mb-4">Sin productos seleccionados</p>
                        <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden bg-slate-100 text-slate-600 px-6 py-2 rounded-xl font-bold text-xs hover:bg-slate-200">Volver al Menú</button>
                    </div>
                ) : (
                    <>
                    {cart.map(item => (
                    <div key={item.cartId} className="flex justify-between items-center bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
                        <div className="flex-1 pr-2 overflow-hidden">
                            <h4 className="font-bold text-slate-800 text-[11px] leading-tight truncate">{item.product.name}</h4>
                            <div className="text-[9px] font-medium text-slate-400">${item.product.price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                                <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:bg-white rounded-md text-slate-500"><Minus size={10}/></button>
                                <span className="w-5 text-center text-[11px] font-bold text-slate-800">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:bg-white rounded-md text-slate-500"><Plus size={10}/></button>
                            </div>
                            <div className="w-12 text-right font-bold text-slate-800 text-[11px]">${(item.product.price * item.quantity).toFixed(2)}</div>
                            <button onClick={() => removeFromCart(item.cartId)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                        </div>
                    </div>
                    ))}
                    {/* BOTÓN AGREGAR MÁS EN EL SCROLL (NUEVO) */}
                    <button 
                        onClick={() => setIsMobileCartOpen(false)}
                        className="md:hidden w-full py-4 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors mt-4"
                    >
                        <Plus size={14} /> Seguir agregando productos
                    </button>
                    </>
                )}
              </>
          )}

          {selectedTable && activeTab === 'bill' && (
              <div className="space-y-2">
                  {tableOrders.length === 0 ? (
                      <div className="text-center text-slate-300 py-10">
                          <Clock size={40} className="mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold mb-4">Esperando pedidos...</p>
                          <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden bg-slate-100 text-slate-600 px-6 py-2 rounded-xl font-bold text-xs">Volver al Menú</button>
                      </div>
                  ) : (
                      <>
                      {tableOrders.map(order => (
                          <div key={order.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                              <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1.5">
                                  <div><span className="text-[9px] font-bold text-slate-500 block uppercase">Orden #{order.id.slice(0,4)}</span></div>
                                  <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full ${order.status === OrderStatus.READY ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-white border border-slate-200 text-slate-500'}`}>{order.status}</span>
                              </div>
                              <div className="space-y-1.5">
                                  {order.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-[10px] items-center">
                                          <span className="text-slate-700 font-medium truncate flex-1 pr-2">{item.quantity}x {item.product.name}</span>
                                          <span className="font-bold text-slate-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                      <button 
                        onClick={() => setIsMobileCartOpen(false)}
                        className="md:hidden w-full py-4 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors mt-4"
                      >
                        <Plus size={14} /> Seguir agregando productos
                      </button>
                      </>
                  )}
              </div>
          )}
        </div>

        {/* SECCIÓN DE TOTALES Y BOTONES */}
        <div className="flex-none p-4 bg-white border-t border-slate-100 shadow-[0_-8px_15px_rgba(0,0,0,0.05)] z-20">
            <div className="space-y-1 mb-3">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>{selectedTable ? 'Cuenta Acumulada' : 'Subtotal'}</span>
                    <span>${(selectedTable ? tableBillTotal : currentCartSubtotal).toFixed(2)}</span>
                </div>
                {selectedTable && cart.length > 0 && (
                    <div className="flex justify-between text-[10px] text-brand-600 font-bold bg-brand-50 p-1.5 rounded-lg border border-brand-100/50">
                        <span>+ Nuevo por enviar</span>
                        <span>+${currentCartTotal.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-black text-slate-900 pt-1.5 border-t border-slate-100 mt-1">
                    <span>TOTAL</span>
                    <span>${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {cart.length > 0 && (
                    <button 
                        onClick={handleSendOrder}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-black text-sm shadow-md flex items-center justify-center space-x-2 active:scale-[0.98]"
                    >
                        <Send size={16} />
                        <span>Enviar a Cocina</span>
                    </button>
                )}
                
                <button 
                    disabled={grandTotal === 0 && discountAmount === 0}
                    onClick={openPaymentModal}
                    className={`w-full py-3.5 rounded-xl font-black text-base shadow-lg flex items-center justify-center space-x-2 active:scale-[0.98] ${
                        selectedTable 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-brand-600 text-white disabled:bg-slate-200 disabled:text-slate-400'
                    }`}
                >
                    {selectedTable ? <ReceiptText size={20} /> : <Banknote size={20} />}
                    <span>{selectedTable ? 'Cerrar Mesa' : 'Cobrar Venta'}</span>
                </button>
            </div>
        </div>
      </div>

      {/* MODALES REUTILIZADOS */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-5 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90dvh]">
            <h3 className="text-lg font-black mb-4 text-center text-slate-800">Método de Pago</h3>
            
            <div className="flex-1 overflow-y-auto pr-1">
                {!paymentMethod ? (
                    <>
                    <div className="mb-5 text-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-1">Monto a Recibir</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">${totalWithTip.toFixed(2)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 rounded-2xl hover:border-emerald-500 transition-all active:scale-95 group">
                            <Banknote size={28} className="mb-2 text-slate-400 group-hover:text-emerald-600" /> <span className="font-bold text-slate-700 text-[11px]">Efectivo</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.CARD)} className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 rounded-2xl hover:border-blue-500 transition-all active:scale-95 group">
                            <CreditCard size={28} className="mb-2 text-slate-400 group-hover:text-blue-600" /> <span className="font-bold text-slate-700 text-[11px]">Tarjeta</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.QR)} className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 rounded-2xl hover:border-purple-500 transition-all active:scale-95 group">
                            <QrCode size={28} className="mb-2 text-slate-400 group-hover:text-purple-600" /> <span className="font-bold text-slate-700 text-[11px]">QR / Wallet</span>
                        </button>
                        <button onClick={() => setPaymentMethod(PaymentMethod.MIXED)} className="flex flex-col items-center justify-center p-4 border-2 border-slate-100 rounded-2xl hover:border-orange-500 transition-all active:scale-95 group">
                            <Users size={28} className="mb-2 text-slate-400 group-hover:text-orange-600" /> <span className="font-bold text-slate-700 text-[11px]">Mixto</span>
                        </button>
                    </div>
                    </>
                ) : paymentMethod === PaymentMethod.CASH ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 text-center tracking-widest">Efectivo Recibido</label>
                            <input autoFocus type="number" className="w-full border-none bg-white rounded-xl px-3 py-3 text-2xl font-black text-center shadow-inner focus:ring-4 focus:ring-emerald-100 outline-none" value={cashTendered} onChange={e => setCashTendered(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className={`p-4 rounded-2xl border-2 text-center transition-all ${change >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-[9px] font-bold uppercase mb-1 tracking-wider">Cambio / Vueltas</p>
                            <p className={`text-3xl font-black ${change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>${change.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setPaymentMethod(null)} className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors">Volver</button>
                            <button onClick={confirmPayment} disabled={change < 0} className="flex-[2] bg-emerald-600 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 text-xs">Confirmar</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 text-center py-2">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 border-4 border-blue-100 animate-pulse">
                            {paymentMethod === PaymentMethod.CARD ? <CreditCard size={40} /> : <QrCode size={40} />}
                        </div>
                        <p className="text-4xl font-black text-slate-800 tracking-tight">${totalWithTip.toFixed(2)}</p>
                        <div className="flex gap-2">
                             <button onClick={() => setPaymentMethod(null)} className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100">Cancelar</button>
                            <button onClick={confirmPayment} className="flex-[2] bg-blue-600 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 text-xs">Pago Exitoso</button>
                        </div>
                    </div>
                )}
            </div>
            {!paymentMethod && <button onClick={() => setIsPaymentModalOpen(false)} className="w-full mt-4 py-2.5 rounded-xl text-slate-400 font-bold text-[10px] hover:text-slate-600 uppercase tracking-widest transition-all">Cancelar</button>}
          </div>
        </div>
      )}

      {/* MAPA DE MESAS */}
      {isTableModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 backdrop-blur-md">
              <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-5 animate-in zoom-in duration-200 flex flex-col max-h-[85dvh]">
                  <div className="flex justify-between items-center mb-4">
                      <div><h3 className="text-lg font-black text-slate-800">Mapa de Mesas</h3><p className="text-slate-500 font-medium text-[10px]">Selecciona para atender</p></div>
                      <button onClick={() => setIsTableModalOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={18}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 pb-2">
                    {tables.map(table => (
                        <button key={table.id} onClick={() => handleTableSelection(table)} className={`h-24 w-full rounded-2xl p-3 flex flex-col justify-between border-2 transition-all active:scale-95 group ${table.status === TableStatus.OCCUPIED ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-emerald-100 hover:border-emerald-400 shadow-sm'}`}>
                            <div className="flex justify-between items-start w-full"><span className="font-black text-sm">{table.name}</span>{table.status === TableStatus.OCCUPIED ? <Clock size={16} className="text-red-400"/> : <div className="w-3 h-3 rounded-full bg-emerald-400"></div>}</div>
                            <div className="flex justify-between items-end w-full"><span className="text-[9px] font-bold opacity-60 uppercase">{table.seats} Pax</span>{table.status === TableStatus.OCCUPIED && <span className="bg-white/60 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase">Ocupada</span>}</div>
                        </button>
                    ))}
                  </div>
              </div>
          </div>
      )}

      {/* NUEVO CLIENTE */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 backdrop-blur-md">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4"><h3 className="text-base font-black">Nuevo Cliente</h3><button onClick={() => setIsNewCustomerModalOpen(false)} className="p-1.5 bg-slate-50 rounded-full"><X size={18}/></button></div>
                <form onSubmit={handleSaveNewCustomer} className="space-y-3">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Nombre</label><input required className="w-full border-none bg-slate-100 rounded-xl p-2.5 font-bold text-sm outline-none" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Teléfono</label><input required type="tel" className="w-full border-none bg-slate-100 rounded-xl p-2.5 font-bold text-sm outline-none" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} /></div>
                    <button type="submit" className="w-full bg-slate-900 text-white font-black py-3 rounded-xl mt-2 flex items-center justify-center active:scale-95 transition-all text-xs">Guardar</button>
                </form>
            </div>
        </div>
      )}

      {/* TRANSFERIR MESA */}
       {isChangeTableModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 animate-in zoom-in duration-200 flex flex-col max-h-[80dvh]">
                  <div className="flex justify-between items-center mb-3">
                      <div><h3 className="text-base font-bold text-slate-800">Transferir</h3><p className="text-slate-500 text-[10px]">Mesa destino</p></div>
                      <button onClick={() => setIsChangeTableModalOpen(false)} className="bg-slate-100 p-1.5 rounded-full"><X size={16}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-2">
                    {tables.map(table => {
                        if (table.id === selectedTable?.id || table.status === TableStatus.OCCUPIED) return null;
                        return (
                            <button key={table.id} onClick={() => handleChangeTableSelection(table)} className="h-16 w-full rounded-xl p-2 flex flex-col justify-between border-2 border-emerald-100 bg-white active:scale-95">
                                <span className="font-bold text-xs">{table.name}</span>
                                <div className="text-[9px] font-medium text-slate-400">{table.seats} Pax</div>
                            </button>
                        );
                    })}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};