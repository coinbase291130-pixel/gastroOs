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
  const [splitType, setSplitType] = useState<'NONE' | 'EQUAL' | 'PRODUCT'>('NONE');
  const [splitCount, setSplitCount] = useState<number>(1);

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
      return [...prev, { cartId: Math.random().toString(36), product, quantity: 1, status: ItemStatus.PENDING }];
    });
    if (activeTab !== 'cart') setActiveTab('cart');
    // Si estamos en móvil, no cerramos el drawer al añadir, pero mostramos feedback
    if (window.innerWidth < 768) notify(`Añadido: ${product.name}`, 'success');
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

  const applyBirthdayDiscount = () => {
      const discountPercentage = loyaltyConfig.birthdayDiscountPercentage || 50;
      const discountValue = rawGrandTotal * (discountPercentage / 100);
      setDiscountAmount(discountValue);
      notify('Descuento aplicado', 'success');
  };

  const removeDiscount = () => {
      setDiscountAmount(0);
      notify('Descuento removido', 'info');
  };

  const openPaymentModal = async () => {
    if (orderType === OrderType.DINE_IN && !selectedTable) {
        setIsTableModalOpen(true);
        return;
    }
    if (cart.length > 0 && selectedTable) {
         const shouldProceed = await confirm({
             title: 'Items Pendientes',
             message: '¿Deseas cobrar los productos actuales sin enviar a cocina primero?',
             type: 'info',
             confirmText: 'Sí, Cobrar Todo'
         });
         if (!shouldProceed) return;
    }
    setIsPaymentModalOpen(true);
    setPaymentMethod(null);
    setCashTendered('');
    setTipAmount(0);
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
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
      {/* SECCIÓN IZQUIERDA: MENÚ DE PRODUCTOS */}
      <div className={`flex-1 flex flex-col p-2 md:p-6 h-full transition-all duration-300 ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex justify-between items-center mb-4">
             {selectedTable ? (
                <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between flex-1 mr-4">
                    <div className="flex items-center">
                        <Grid3X3 className="mr-3 text-emerald-100" size={24} />
                        <div><span className="font-bold text-xl block leading-tight">{selectedTable.name}</span><span className="text-xs text-emerald-100 opacity-90">{selectedTable.status === TableStatus.OCCUPIED ? 'Ocupada' : 'Seleccionada'}</span></div>
                    </div>
                    <div className="flex gap-2">
                        {selectedTable.status === TableStatus.OCCUPIED && (
                            <button onClick={() => setIsChangeTableModalOpen(true)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"><ArrowRightLeft size={20} /></button>
                        )}
                        <button onClick={handleDeselectTable} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"><XCircle size={20} /></button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsTableModalOpen(true)} className="bg-white text-brand-700 px-4 py-3 rounded-2xl border-2 border-brand-100 border-dashed shadow-sm flex items-center justify-between flex-1 mr-4 hover:bg-brand-50 transition-all">
                    <div className="flex items-center"><div className="bg-brand-100 p-2 rounded-lg mr-3"><Grid3X3 className="text-brand-600" size={20} /></div><span className="font-bold text-lg">Seleccionar Mesa</span></div>
                    <div className="text-sm bg-brand-100 text-brand-800 px-3 py-1 rounded-full font-bold">Requerido</div>
                </button>
            )}
            
            {activeRegisterName && (
                <div className="hidden md:flex items-center bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium">
                    <Monitor size={16} className="mr-2 text-emerald-400" />{activeRegisterName}
                </div>
            )}
        </div>

        <div className="flex flex-col space-y-3 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input type="text" placeholder="Buscar productos..." className="w-full pl-12 pr-4 py-3 border-none bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 text-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat ? 'bg-slate-800 text-white scale-105' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24 md:pb-4">
            {filteredProducts.map(product => (
                <div key={product.id} onClick={() => addToCart(product)} className="bg-white rounded-2xl shadow-sm hover:shadow-lg cursor-pointer transition-all flex flex-col h-48 md:h-60 group overflow-hidden border border-transparent hover:border-brand-200 active:scale-95">
                    <div className="h-28 md:h-36 overflow-hidden relative bg-slate-100">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white px-2.5 py-1 rounded-lg text-sm font-bold backdrop-blur-sm">${product.price.toFixed(2)}</div>
                    </div>
                    <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                        <div><h3 className="font-bold text-sm md:text-base text-slate-800 leading-tight line-clamp-2">{product.name}</h3><p className="text-xs text-slate-400 mt-1">{product.category}</p></div>
                    </div>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* BOTÓN FLOTANTE MÓVIL (RESUMEN CARRITO) */}
      {!isMobileCartOpen && (cart.length > 0 || tableBillTotal > 0) && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-30">
          <button onClick={() => setIsMobileCartOpen(true)} className="w-full bg-brand-600 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom duration-300 ring-4 ring-white/20">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">{cart.length > 0 ? totalItems : (tableOrders.length > 0 ? tableOrders.length : 0)}</div>
              <span className="font-bold text-xl">${grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center font-bold">Ver Pedido <ChevronRight className="ml-1" size={20} /></div>
          </button>
        </div>
      )}

      {/* SECCIÓN DERECHA: EL CARRITO (DRAWER MÓVIL) */}
      <div className={`
        fixed md:relative inset-x-0 top-0 bottom-0 md:bottom-0 md:inset-auto md:right-0 z-40 bg-white md:bg-white shadow-2xl flex flex-col h-full md:h-full 
        md:w-[450px] lg:w-[500px] md:translate-x-0 transition-transform duration-300 ease-in-out border-l border-slate-100
        ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Cabecera del Drawer */}
        <div className="flex-none p-4 md:p-5 border-b border-slate-100 bg-white z-10 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate flex items-center gap-2">
                    <ShoppingBag size={22} className="text-brand-600" />
                    {selectedTable ? `Mesa: ${selectedTable.name}` : 'Pedido Actual'}
                </h2>
                <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
                {selectedTable ? (
                    <>
                    <button 
                        onClick={() => {
                            setActiveTab('cart');
                            if (window.innerWidth < 768) setIsMobileCartOpen(false);
                        }}
                        className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'cart' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Nuevo ({cart.length})
                    </button>
                    <button onClick={() => setActiveTab('bill')} className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'bill' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>
                        Cuenta (${tableBillTotal.toFixed(0)})
                    </button>
                    </>
                ) : (
                    <div className="flex-1 flex gap-1">
                        <button onClick={() => handleOrderTypeChange(OrderType.DINE_IN)} className={`flex-1 py-2 text-xs font-bold rounded-lg ${orderType === OrderType.DINE_IN ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>Mesa</button>
                        <button onClick={() => handleOrderTypeChange(OrderType.TAKEAWAY)} className={`flex-1 py-2 text-xs font-bold rounded-lg ${orderType === OrderType.TAKEAWAY ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>Llevar</button>
                    </div>
                )}
            </div>
        </div>

        {/* Selector de Cliente */}
        {userRole !== Role.WAITER && (
          <div className="flex-none px-4 py-3 border-b border-slate-50 bg-white">
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center space-x-2 text-sm bg-slate-50 border-transparent rounded-xl px-3 py-2">
                  <User size={16} className="text-slate-400" />
                  <select className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-bold outline-none cursor-pointer text-xs md:text-sm" onChange={(e) => setSelectedCustomer(activeCustomers.find(c => c.id === e.target.value))} value={selectedCustomer?.id || ''}>
                    <option value="">Cliente Ocasional</option>
                    {activeCustomers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.points} pts)</option>)}
                  </select>
                </div>
                <button onClick={() => setIsNewCustomerModalOpen(true)} className="bg-slate-800 text-white p-2.5 rounded-xl hover:bg-slate-700 shadow-sm"><Plus size={18} /></button>
            </div>
            {isBirthday && <div className="mt-2 flex items-center bg-pink-50 p-2 rounded-xl border border-pink-100 animate-pulse"><div className="bg-pink-100 p-1.5 rounded-lg mr-2"><Cake className="text-pink-500" size={16} /></div><p className="text-[10px] font-bold text-pink-600 uppercase">¡Cumpleaños! ({loyaltyConfig.birthdayDiscountPercentage}% OFF)</p></div>}
          </div>
        )}

        {/* LISTADO DE PRODUCTOS (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar pb-32">
          {(!selectedTable || activeTab === 'cart') && (
              <>
                 {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 py-10">
                        <ShoppingBag size={48} className="mb-4" />
                        <p className="font-medium text-sm text-center">Selecciona productos para comenzar</p>
                    </div>
                ) : (
                    cart.map(item => (
                    <div key={item.cartId} className="flex justify-between items-center group bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                        <div className="flex-1 pr-3">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{item.product.name}</h4>
                            <div className="text-[10px] font-medium text-slate-400">${item.product.price.toFixed(2)} c/u</div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                                <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-red-500"><Minus size={12}/></button>
                                <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-green-500"><Plus size={12}/></button>
                            </div>
                            <div className="w-16 text-right font-bold text-slate-800 text-sm">${(item.product.price * item.quantity).toFixed(2)}</div>
                            <button onClick={() => removeFromCart(item.cartId)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    ))
                )}
              </>
          )}

          {selectedTable && activeTab === 'bill' && (
              <div className="space-y-3">
                  {tableOrders.length === 0 ? (
                      <div className="text-center text-slate-400 py-10 opacity-60">
                          <Clock size={48} className="mx-auto mb-4" />
                          <p className="text-sm">Sin historial de pedidos.</p>
                      </div>
                  ) : (
                      tableOrders.map(order => (
                          <div key={order.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                              <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                                  <div>
                                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Orden #{order.id.slice(0,4)}</span>
                                      <span className="text-[9px] text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${order.status === OrderStatus.READY ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-white border border-slate-200 text-slate-500'}`}>{order.status}</span>
                              </div>
                              <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-xs items-center">
                                          <div className="flex items-center gap-2">
                                              {item.status === ItemStatus.READY ? <Check size={14} className="text-emerald-500" /> : <ChefHat size={14} className="text-slate-300" />}
                                              <span className="text-slate-700 font-medium">{item.quantity}x {item.product.name}</span>
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

        {/* SECCIÓN DE TOTALES Y BOTONES (ANCLADA ABAJO) */}
        <div className="flex-none p-4 md:p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20 md:pb-6 pb-20">
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-slate-500 font-medium">
                    <span>{selectedTable ? 'Cuenta Abierta' : 'Subtotal'}</span>
                    <span>${(selectedTable ? tableBillTotal : currentCartSubtotal).toFixed(2)}</span>
                </div>
                {!selectedTable && (
                   <div className="flex justify-between text-sm text-slate-500 font-medium">
                        <span>Impuestos</span>
                        <span>${currentCartTax.toFixed(2)}</span>
                    </div>
                )}
                {selectedTable && cart.length > 0 && (
                    <div className="flex justify-between text-sm text-brand-600 font-bold bg-brand-50 p-2 rounded-xl">
                        <span>Nuevo pedido a enviar</span>
                        <span>+${currentCartTotal.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-2xl font-extrabold text-slate-900 pt-2 border-t border-slate-100 mt-2">
                    <span>TOTAL</span>
                    <span>${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            {discountAmount > 0 && (
                <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-sm mb-3">
                    <span className="text-emerald-700 font-bold flex items-center"><Gift size={16} className="mr-2"/> Descuento Aplicado</span>
                    <div className="flex items-center">
                        <span className="font-bold text-emerald-700 mr-2">-${discountAmount.toFixed(2)}</span>
                        <button onClick={removeDiscount} className="text-emerald-400 hover:text-red-500"><X size={16}/></button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {cart.length > 0 && (
                    <button 
                        onClick={handleSendOrder}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
                    >
                        <Send size={20} />
                        <span>Enviar a Cocina</span>
                    </button>
                )}
                
                <button 
                    disabled={grandTotal === 0 && discountAmount === 0}
                    onClick={openPaymentModal}
                    className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-all ${
                        selectedTable 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-brand-600 hover:bg-brand-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
                    }`}
                >
                    {selectedTable ? <ReceiptText size={22} /> : <Banknote size={22} />}
                    <span>{selectedTable ? 'Cerrar Cuenta' : 'Cobrar Caja'}</span>
                </button>
            </div>
        </div>
      </div>

      {/* MODALES REUTILIZADOS */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black mb-6 text-center text-slate-800">
                {paymentMethod ? 'Confirmar Pago' : 'Método de Pago'}
            </h3>
            
            {!paymentMethod ? (
                <>
                <div className="mb-8 text-center bg-slate-50 p-8 rounded-3xl border border-slate-100">
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-1">Monto a Cobrar</p>
                    <p className="text-6xl font-black text-slate-900 tracking-tighter">${totalWithTip.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-3xl hover:bg-emerald-50 hover:border-emerald-500 transition-all active:scale-95 group">
                        <Banknote size={32} className="mb-3 text-slate-400 group-hover:text-emerald-600" /> <span className="font-bold text-slate-700 group-hover:text-emerald-700">Efectivo</span>
                    </button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.CARD)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-3xl hover:bg-blue-50 hover:border-blue-500 transition-all active:scale-95 group">
                        <CreditCard size={32} className="mb-3 text-slate-400 group-hover:text-blue-600" /> <span className="font-bold text-slate-700 group-hover:text-blue-700">Tarjeta</span>
                    </button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.QR)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-3xl hover:bg-purple-50 hover:border-purple-500 transition-all active:scale-95 group">
                        <QrCode size={32} className="mb-3 text-slate-400 group-hover:text-purple-600" /> <span className="font-bold text-slate-700 group-hover:text-purple-700">QR / Wallet</span>
                    </button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.MIXED)} className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-3xl hover:bg-orange-50 hover:border-orange-500 transition-all active:scale-95 group">
                        <Users size={32} className="mb-3 text-slate-400 group-hover:text-orange-600" /> <span className="font-bold text-slate-700 group-hover:text-orange-700">Mixto</span>
                    </button>
                </div>
                </>
            ) : paymentMethod === PaymentMethod.CASH ? (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <label className="block text-sm font-black text-slate-500 uppercase mb-4 text-center">Efectivo Recibido</label>
                        <input autoFocus type="number" className="w-full border-none bg-white rounded-2xl px-4 py-5 text-4xl font-black text-center shadow-inner focus:ring-4 focus:ring-emerald-100 outline-none" value={cashTendered} onChange={e => setCashTendered(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className={`p-6 rounded-3xl border-2 text-center transition-all ${change >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-xs font-bold uppercase mb-1">Vueltas / Cambio</p>
                        <p className={`text-5xl font-black ${change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>${change.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setPaymentMethod(null)} className="flex-1 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100">Volver</button>
                        <button onClick={confirmPayment} disabled={change < 0} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50">Confirmar Cobro</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 text-center py-4">
                    <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 border-4 border-blue-100 animate-pulse">
                        {paymentMethod === PaymentMethod.CARD ? <CreditCard size={48} /> : <QrCode size={48} />}
                    </div>
                    <p className="text-6xl font-black text-slate-800 tracking-tight">${totalWithTip.toFixed(2)}</p>
                    <div className="flex gap-4">
                         <button onClick={() => setPaymentMethod(null)} className="flex-1 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
                        <button onClick={confirmPayment} className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95">Pago Exitoso</button>
                    </div>
                </div>
            )}
            {!paymentMethod && <button onClick={() => setIsPaymentModalOpen(false)} className="w-full mt-8 py-3 rounded-2xl text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest">Cerrar Operación</button>}
          </div>
        </div>
      )}

      {isTableModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-md">
              <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-8">
                      <div><h3 className="text-3xl font-black text-slate-800">Mapa de Mesas</h3><p className="text-slate-500 font-medium">Selecciona una mesa para atender</p></div>
                      <button onClick={() => setIsTableModalOpen(false)} className="bg-slate-100 p-3 rounded-full hover:bg-slate-200 transition-colors"><X size={28}/></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tables.map(table => (
                        <button key={table.id} onClick={() => handleTableSelection(table)} className={`h-36 w-full rounded-[2rem] p-6 flex flex-col justify-between border-2 transition-all active:scale-95 group ${table.status === TableStatus.OCCUPIED ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-emerald-100 hover:border-emerald-400 shadow-sm'}`}>
                            <div className="flex justify-between items-start w-full"><span className="font-black text-2xl">{table.name}</span>{table.status === TableStatus.OCCUPIED ? <Clock size={24} className="text-red-400"/> : <div className="w-5 h-5 rounded-full bg-emerald-400 shadow-sm"></div>}</div>
                            <div className="flex justify-between items-end w-full"><span className="text-sm font-bold opacity-60 uppercase">{table.seats} Pax</span>{table.status === TableStatus.OCCUPIED && <span className="bg-white/60 px-3 py-1 rounded-full text-[10px] font-black uppercase">Ocupada</span>}</div>
                        </button>
                    ))}
                  </div>
              </div>
          </div>
      )}

      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black">Nuevo Cliente</h3><button onClick={() => setIsNewCustomerModalOpen(false)} className="p-2 bg-slate-50 rounded-full"><X/></button></div>
                <form onSubmit={handleSaveNewCustomer} className="space-y-6">
                    <div><label className="block text-sm font-black text-slate-500 uppercase mb-2">Nombre Completo</label><input required className="w-full border-none bg-slate-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-brand-100 outline-none" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} /></div>
                    <div><label className="block text-sm font-black text-slate-500 uppercase mb-2">Teléfono</label><input required type="tel" className="w-full border-none bg-slate-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-brand-100 outline-none" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} /></div>
                    <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl mt-6 flex items-center justify-center shadow-2xl active:scale-95 transition-all"><Save size={20} className="mr-2"/> Guardar y Seleccionar</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};