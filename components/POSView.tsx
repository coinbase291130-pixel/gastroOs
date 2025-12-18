import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, User, Truck, UtensilsCrossed, ShoppingBag, X, ChevronLeft, ChevronRight, Grid3X3, Lock, Send, ReceiptText, Clock, ListChecks, Ban, Monitor, Calculator, Cake, Gift, Check, CheckCircle, ChefHat, Save, XCircle, ArrowRightLeft, Split, Coins, Users, Star, MapPin, Package, AlertCircle, Sparkles } from 'lucide-react';
import { Product, CartItem, OrderType, Customer, PaymentMethod, Table, Order, TableStatus, OrderStatus, ItemStatus, Role, LoyaltyConfig, InventoryItem } from '../types';
import { useNotification } from './NotificationContext';

interface POSViewProps {
  products: Product[];
  inventory: InventoryItem[];
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
  onUpdateCustomer: (customer: Customer) => void;
  onChangeTable: (orderId: string, newTableId: string) => void; 
}

export const POSView: React.FC<POSViewProps> = ({ 
    products, inventory, onProcessPayment, onSendOrder, onCancelOrder, customers, 
    selectedTable, onSelectTable, tables, isRegisterOpen, activeRegisterName,
    orders, taxRate, userRole, loyaltyConfig, onAddCustomer, onUpdateCustomer, onChangeTable
}) => {
  const { notify, confirm } = useNotification();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  const [orderType, setOrderType] = useState<OrderType>(selectedTable ? OrderType.DINE_IN : OrderType.TAKEAWAY);
  const [prevOrderType, setPrevOrderType] = useState<OrderType>(OrderType.TAKEAWAY);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerBirth, setNewCustomerBirth] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'cart' | 'bill' | 'pending'>('cart');
  const [lastAddedTrigger, setLastAddedTrigger] = useState(0);

  const activeCustomers = customers.filter(c => c.isActive);
  const POINTS_VALUE_RATIO = 0.01; 

  // --- LÓGICA DE STOCK DINÁMICO ---
  const currentCartInventoryConsumption = useMemo(() => {
    const consumption: Record<string, number> = {};
    const processProduct = (product: Product, qty: number) => {
        if (product.isCombo && product.comboItems) {
            product.comboItems.forEach(ci => {
                const subP = products.find(p => p.id === ci.productId);
                if (subP) processProduct(subP, qty * ci.quantity);
            });
        } else if (product.ingredients) {
            product.ingredients.forEach(ing => {
                consumption[ing.inventoryItemId] = (consumption[ing.inventoryItemId] || 0) + (ing.quantity * qty);
            });
        }
    };
    cart.forEach(item => processProduct(item.product, item.quantity));
    return consumption;
  }, [cart, products]);

  const calculateAvailableStock = (product: Product): { stock: number, isLow: boolean } => {
    if (product.isCombo && product.comboItems) {
      const subProductStocks = product.comboItems.map(item => {
        const subP = products.find(p => p.id === item.productId);
        return subP ? Math.floor(calculateAvailableStock(subP).stock / item.quantity) : 0;
      });
      const minStock = subProductStocks.length > 0 ? Math.min(...subProductStocks) : 0;
      return { stock: minStock, isLow: minStock > 0 && minStock <= 5 };
    }

    if (product.ingredients && product.ingredients.length > 0) {
      let minAvailable = Infinity;
      let isAnyIngredientLow = false;

      product.ingredients.forEach(ing => {
        const invItem = inventory.find(i => i.id === ing.inventoryItemId);
        if (invItem) {
          const reservedInCart = currentCartInventoryConsumption[ing.inventoryItemId] || 0;
          const currentNetStock = Math.max(0, invItem.stock - reservedInCart);
          const possibleUnits = Math.floor(currentNetStock / ing.quantity);
          if (possibleUnits < minAvailable) minAvailable = possibleUnits;
          if (invItem.stock <= invItem.minStock) isAnyIngredientLow = true;
        } else {
          minAvailable = 0;
        }
      });

      const finalStock = minAvailable === Infinity ? 0 : minAvailable;
      return { 
        stock: finalStock, 
        isLow: (finalStock > 0 && finalStock <= 5) || (finalStock > 0 && isAnyIngredientLow)
      };
    }

    return { stock: 99, isLow: false };
  };

  useEffect(() => {
    if (selectedCustomer) {
      setDeliveryAddress(selectedCustomer.address || '');
    } else {
      setDeliveryAddress('');
      setRedeemedPoints(0);
    }
  }, [selectedCustomer]);

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
        setActiveTab(selectedTable.status === TableStatus.OCCUPIED ? 'bill' : 'cart');
    }
  }, [selectedTable?.id, orders.length]); 

  const handleOrderTypeChange = (type: OrderType) => {
      if (type === OrderType.DINE_IN) {
        setPrevOrderType(orderType);
        setIsTableModalOpen(true);
      } else {
        setOrderType(type);
        onSelectTable(undefined);
      }
  };

  const handleTableSelection = (table: Table) => {
      onSelectTable(table);
      setOrderType(OrderType.DINE_IN);
      setIsTableModalOpen(false);
      notify(`Mesa ${table.name} seleccionada`, 'info');
  };

  const handleDeselectTable = () => {
      onSelectTable(undefined);
      setOrderType(OrderType.TAKEAWAY); 
  };

  const tableOrders = useMemo(() => {
    if (!selectedTable) return [];
    return orders.filter(o => 
        o.tableId === selectedTable.id && 
        o.status !== OrderStatus.CANCELLED && 
        o.status !== OrderStatus.COMPLETED
    );
  }, [selectedTable, orders]);

  const allActiveOrders = useMemo(() => {
    return orders.filter(o => 
        o.status !== OrderStatus.COMPLETED && 
        o.status !== OrderStatus.CANCELLED
    );
  }, [orders]);

  const tableBillTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.isActive;
  });

  const addToCart = (product: Product) => {
    if (!isRegisterOpen) return;
    const { stock } = calculateAvailableStock(product);
    if (stock <= 0) {
      notify(`No hay más existencias de "${product.name}"`, 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { cartId: Math.random().toString(36).substr(2, 9), product, quantity: 1, status: ItemStatus.PENDING }];
    });
    setLastAddedTrigger(d => d + 1);
    // REMOVED: notify(`+1 ${product.name}`, 'success'); - Mensaje deshabilitado a petición
    if (activeTab === 'pending') setActiveTab('cart');
  };

  const updateQuantity = (cartId: string, delta: number) => {
    const cartItem = cart.find(i => i.cartId === cartId);
    if (!cartItem) return;

    if (delta > 0) {
        const { stock } = calculateAvailableStock(cartItem.product);
        if (stock <= 0) {
            notify(`Límite de stock alcanzado para "${cartItem.product.name}"`, 'warning');
            return;
        }
    }

    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const currentCartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const currentCartTax = currentCartSubtotal * taxRate; 
  const currentCartTotal = currentCartSubtotal + currentCartTax;
  const rawGrandTotal = (orderType === OrderType.DINE_IN ? tableBillTotal : 0) + currentCartTotal;
  const pointsDiscount = redeemedPoints * POINTS_VALUE_RATIO;
  const grandTotal = Math.max(0, rawGrandTotal - pointsDiscount);
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Cálculo de cambio para efectivo
  const cashChange = useMemo(() => {
    const tendered = parseFloat(cashTendered) || 0;
    return tendered - grandTotal;
  }, [cashTendered, grandTotal]);

  const openPaymentModal = () => {
    if (!isRegisterOpen) return;
    if (orderType === OrderType.DINE_IN && !selectedTable) {
        setIsTableModalOpen(true);
        return;
    }
    if (orderType === OrderType.DELIVERY && !deliveryAddress.trim()) {
        notify("Ingresa dirección de entrega para domicilios", "error");
        return;
    }
    if (cart.length === 0 && orderType !== OrderType.DINE_IN) {
        notify("Agregue productos al pedido", "warning");
        return;
    }
    setIsPaymentModalOpen(true);
  };

  const resetPOSState = () => {
    setCart([]);
    setIsPaymentModalOpen(false);
    setIsMobileCartOpen(false);
    setSelectedCustomer(undefined);
    setRedeemedPoints(0);
    setDeliveryAddress('');
    setPaymentMethod(null);
    setCashTendered('');
    setActiveTab('cart');
    // IMPORTANTE: Si es mesa, liberar la mesa para que vuelva a estar disponible
    if (selectedTable) {
        onSelectTable(undefined);
    }
  };

  const confirmPayment = () => {
      if (!paymentMethod) return;
      if (paymentMethod === PaymentMethod.CASH && (parseFloat(cashTendered) || 0) < grandTotal) {
          notify("Monto recibido insuficiente", "error");
          return;
      }
      onProcessPayment(cart, grandTotal, orderType, paymentMethod, selectedCustomer ? {...selectedCustomer, address: deliveryAddress} : undefined);
      
      // Limpieza total tras el pago (Cierra mesa o limpia pedido rápido)
      resetPOSState();
  };

  const handleSendOrder = () => {
      if (!isRegisterOpen) return;
      if (orderType === OrderType.DINE_IN && !selectedTable) {
          setIsTableModalOpen(true);
          return;
      }
      if (orderType === OrderType.DELIVERY && !deliveryAddress.trim()) {
        notify("Se requiere dirección para el envío", "error");
        return;
      }
      onSendOrder(cart, orderType, selectedCustomer ? {...selectedCustomer, address: deliveryAddress} : undefined);
      
      if (orderType === OrderType.DINE_IN) {
          setCart([]); 
          setIsMobileCartOpen(false);
          setActiveTab('bill');
      } else {
          // Llevar o Domicilio: Limpieza total para nueva venta
          resetPOSState();
      }
  };

  const getStatusIcon = (status: OrderStatus) => {
      switch(status) {
          case OrderStatus.PREPARING: return <ChefHat size={14} className="text-orange-500 animate-pulse" />;
          case OrderStatus.READY: return <CheckCircle size={14} className="text-emerald-500" />;
          case OrderStatus.ON_WAY: return <Truck size={14} className="text-blue-500" />;
          default: return <Clock size={14} className="text-slate-400" />;
      }
  };

  if (!isRegisterOpen) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-500 w-full animate-in fade-in duration-500">
            <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-sm mx-auto border border-slate-200">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 ring-8 ring-red-50">
                    <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tighter">Punto de Venta Bloqueado</h2>
                <p className="max-w-xs mx-auto text-slate-500 font-medium leading-relaxed">
                    La caja se encuentra cerrada. Debes realizar la apertura en el <strong>Tablero</strong> para comenzar a vender. Solo el administrador puede realizar esta operación.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden w-full max-w-full">
      {/* SECCIÓN IZQUIERDA: MENÚ */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 w-full overflow-hidden ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 md:p-6 pb-0 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                {selectedTable ? (
                    <div className="bg-emerald-600 text-white px-3 py-2.5 rounded-xl shadow-lg flex items-center justify-between flex-1 mr-2">
                        <div className="flex items-center">
                            <Grid3X3 className="mr-2 text-emerald-100" size={20} />
                            <div><span className="font-bold text-sm block leading-tight">{selectedTable.name}</span><span className="text-[9px] text-emerald-100 opacity-90 font-black uppercase">En Mesa</span></div>
                        </div>
                        <button onClick={handleDeselectTable} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                    </div>
                ) : (
                    <div className="flex-1 flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mr-2">
                        <button onClick={() => handleOrderTypeChange(OrderType.DINE_IN)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${orderType === OrderType.DINE_IN ? 'bg-brand-600 text-white' : 'text-slate-500'}`}>Mesa</button>
                        <button onClick={() => handleOrderTypeChange(OrderType.TAKEAWAY)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${orderType === OrderType.TAKEAWAY ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Llevar</button>
                        <button onClick={() => handleOrderTypeChange(OrderType.DELIVERY)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${orderType === OrderType.DELIVERY ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Domicilio</button>
                    </div>
                )}
                {activeRegisterName && <div className="hidden lg:flex items-center bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium"><Monitor size={16} className="mr-2 text-emerald-400" />{activeRegisterName}</div>}
            </div>

            <div className="flex flex-col space-y-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-2.5 border-none bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 text-slate-700 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                {['Todos', ...new Set(products.map(p => p.category))].map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap shadow-sm transition-all ${selectedCategory === cat ? 'bg-slate-800 text-white scale-105' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{cat}</button>
                ))}
              </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 md:px-6 pt-2 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-32">
            {filteredProducts.map(product => {
                const { stock, isLow } = calculateAvailableStock(product);
                const outOfStock = stock <= 0;

                return (
                  <div key={product.id} onClick={() => addToCart(product)} className={`bg-white rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col group overflow-hidden border border-slate-100 hover:border-brand-200 active:scale-[0.97] ${outOfStock ? 'opacity-50 grayscale' : ''}`}>
                      <div className="h-24 md:h-36 overflow-hidden relative bg-slate-100">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute bottom-2 right-2 bg-slate-900/90 text-white px-2 py-1 rounded-lg text-[10px] font-black tabular-nums shadow-lg">${product.price.toFixed(2)}</div>
                          {!outOfStock && (
                            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shadow-lg flex items-center gap-1 border ${isLow ? 'bg-orange-500 text-white border-orange-400 animate-pulse' : 'bg-white/90 text-slate-700 border-white'}`}>
                              <Package size={10} /> {isLow ? 'Bajo Stock:' : 'Disp:'} {stock > 50 ? '50+' : stock}
                            </div>
                          )}
                          {outOfStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                              <span className="bg-red-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl ring-4 ring-white/10">Agotado</span>
                            </div>
                          )}
                      </div>
                      <div className="p-2.5 md:p-3 flex-1 flex flex-col justify-between gap-1">
                          <h3 className="font-bold text-[11px] md:text-sm text-slate-800 leading-tight line-clamp-2 uppercase">{product.name}</h3>
                          <div className="flex justify-end mt-1 md:hidden">
                            <div className={`p-1.5 rounded-lg ${!outOfStock ? 'bg-brand-50' : 'bg-slate-100'}`}>
                              {!outOfStock ? <Plus size={16} className="text-brand-600" /> : <Ban size={16} className="text-slate-400" />}
                            </div>
                          </div>
                      </div>
                  </div>
                );
            })}
            </div>
        </div>
      </div>

      {/* BOTÓN FLOTANTE MÓVIL */}
      {!isMobileCartOpen && (cartItemCount > 0 || tableBillTotal > 0) && (
        <div className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-full px-4 animate-in slide-in-from-bottom duration-300">
          <button 
            onClick={() => setIsMobileCartOpen(true)} 
            className={`w-full bg-brand-600 text-white h-14 rounded-2xl shadow-2xl flex justify-between items-center px-5 ring-4 ring-white/20 active:scale-95 transition-all ${lastAddedTrigger > 0 ? 'animate-bounce' : ''}`}
            key={lastAddedTrigger}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-8 h-8 flex items-center justify-center rounded-xl font-black text-xs">
                {orderType === OrderType.DINE_IN && activeTab === 'bill' ? tableOrders.length : cartItemCount}
              </div>
              <span className="font-black text-lg tabular-nums">${grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center font-black text-xs uppercase tracking-widest gap-1">Gestionar Pedido <ChevronRight size={18} /></div>
          </button>
        </div>
      )}

      {/* SECCIÓN DERECHA: DRAWER */}
      <div className={`fixed md:relative inset-x-0 top-0 bottom-0 md:inset-auto md:right-0 z-[80] md:z-40 bg-white shadow-2xl flex flex-col h-full md:w-[400px] lg:w-[450px] md:translate-x-0 transition-transform duration-300 ease-in-out border-l border-slate-100 ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex-none p-4 md:p-5 border-b border-slate-100 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden p-2 -ml-2 text-slate-500 bg-slate-100 rounded-xl"><ChevronLeft size={24} /></button>
                <h2 className="text-base md:text-xl font-black text-slate-800 truncate flex-1 uppercase tracking-tight">
                    {selectedTable ? selectedTable.name : orderType === OrderType.DELIVERY ? 'Domicilio' : 'Llevar / Mostrador'}
                </h2>
                <button onClick={() => setIsMobileCartOpen(false)} className="hidden md:block p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={22} /></button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setActiveTab('cart')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'cart' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>Nuevo ({cartItemCount})</button>
                {selectedTable && (
                    <button onClick={() => setActiveTab('bill')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'bill' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>Cuenta (${tableBillTotal.toFixed(0)})</button>
                )}
                <button onClick={() => setActiveTab('pending')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'pending' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>En Curso ({allActiveOrders.length})</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {activeTab === 'cart' && (
              <div className="px-4 py-3 border-b border-slate-50 space-y-3">
                  <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center space-x-2 text-xs bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                        <User size={14} className="text-slate-400" />
                        <select className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-bold outline-none text-[10px] uppercase" onChange={(e) => setSelectedCustomer(activeCustomers.find(c => c.id === e.target.value))} value={selectedCustomer?.id || ''}>
                          <option value="">Cliente Ocasional</option>
                          {activeCustomers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.points} pts)</option>)}
                        </select>
                      </div>
                      <button onClick={() => setIsNewCustomerModalOpen(true)} className="bg-slate-800 text-white p-2.5 rounded-lg active:scale-95 transition-transform"><Plus size={16} /></button>
                  </div>

                  {/* SOLICITUD DE DIRECCIÓN PARA DOMICILIOS */}
                  {orderType === OrderType.DELIVERY && (
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 animate-in slide-in-from-top-1">
                        <label className="block text-[10px] font-black text-blue-700 uppercase mb-1 flex items-center gap-1">
                            <MapPin size={10}/> Dirección de Entrega
                        </label>
                        <textarea 
                            className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px] placeholder:text-blue-300"
                            placeholder="Calle, Número, Edificio, Apartamento..."
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                        />
                    </div>
                  )}

                  {selectedCustomer && loyaltyConfig.enabled && (
                      <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 animate-in slide-in-from-top-2">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-black text-brand-800 uppercase flex items-center gap-1"><Sparkles size={12}/> Puntos Disponibles: {selectedCustomer.points}</span>
                              <span className="text-[10px] font-black text-brand-700 uppercase">Valor: ${(selectedCustomer.points * POINTS_VALUE_RATIO).toFixed(2)}</span>
                          </div>
                          <div className="flex gap-2">
                              <div className="relative flex-1">
                                  <input 
                                      type="number" 
                                      className="w-full bg-white border border-brand-200 rounded-lg pl-3 pr-8 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500" 
                                      placeholder="Redimir pts"
                                      value={redeemedPoints || ''}
                                      onChange={(e) => {
                                          const val = Math.min(Number(e.target.value), selectedCustomer.points);
                                          setRedeemedPoints(val);
                                      }}
                                  />
                                  <div className="absolute right-2 top-2 text-[9px] font-black text-brand-400">PTS</div>
                              </div>
                              <button 
                                  onClick={() => {
                                      const maxByBill = Math.floor(rawGrandTotal / POINTS_VALUE_RATIO);
                                      setRedeemedPoints(Math.min(selectedCustomer.points, maxByBill));
                                      notify("Puntos aplicados", "success");
                                  }}
                                  className="bg-brand-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap shadow-sm hover:bg-brand-700 active:scale-95 transition-all"
                              >
                                  Canjear Todo
                              </button>
                          </div>
                          {redeemedPoints > 0 && (
                              <div className="mt-2 text-[9px] font-black text-brand-600 uppercase flex justify-between">
                                  <span>Descuento Aplicado:</span>
                                  <span>-${pointsDiscount.toFixed(2)}</span>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          )}

          <div className="p-4 space-y-2 pb-10">
            {activeTab === 'cart' ? (
                cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                      <ShoppingBag size={48} className="opacity-20 mb-4" />
                      <p className="font-black uppercase text-xs tracking-widest">Pedido Vacío</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.cartId} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                      <div className="flex-1 pr-2 overflow-hidden">
                          <h4 className="font-black text-slate-800 text-[11px] leading-tight truncate uppercase">{item.product.name}</h4>
                          <div className="text-[9px] font-bold text-slate-400 tabular-nums">${item.product.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                              <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1.5 text-slate-500 bg-white rounded-lg shadow-sm"><Minus size={10}/></button>
                              <span className="w-7 text-center text-[12px] font-black text-slate-800 tabular-nums">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1.5 text-slate-500 bg-white rounded-lg shadow-sm"><Plus size={10}/></button>
                          </div>
                          <div className="w-14 text-right font-black text-slate-800 text-[11px] tabular-nums">${(item.product.price * item.quantity).toFixed(2)}</div>
                          <button onClick={() => removeFromCart(item.cartId)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                  </div>
                ))
            ) : activeTab === 'bill' ? (
                  tableOrders.map(order => (
                      <div key={order.id} className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/50 mb-3 shadow-sm">
                          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orden #{order.id.slice(0,4)}</span>
                              <div className="flex items-center gap-1 text-[9px] uppercase font-black px-2 py-1 rounded-lg bg-white border border-slate-200 text-brand-600 shadow-sm">
                                  {getStatusIcon(order.status)} {order.status}
                              </div>
                          </div>
                          <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-[11px] font-medium items-center">
                                      <span className="text-slate-700 flex-1 truncate pr-2 uppercase"><strong className="text-brand-600 mr-1">{item.quantity}x</strong> {item.product.name}</span>
                                      <span className="font-black text-slate-900 tabular-nums">${(item.product.price * item.quantity).toFixed(2)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))
            ) : (
                  allActiveOrders.map(order => (
                      <div key={order.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm mb-3">
                          <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg ${order.type === OrderType.DELIVERY ? 'bg-blue-50 text-blue-600' : order.type === OrderType.DINE_IN ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                      {order.type === OrderType.DELIVERY ? <Truck size={16} /> : order.type === OrderType.DINE_IN ? <Grid3X3 size={16} /> : <ShoppingBag size={16} />}
                                  </div>
                                  <div>
                                      <div className="text-[10px] font-black uppercase text-slate-400">#{order.id.slice(0, 5)}</div>
                                      <div className="text-xs font-bold text-slate-800">{order.type === OrderType.DELIVERY ? 'Domicilio' : order.type === OrderType.DINE_IN ? `Mesa ${order.tableId?.replace(/\D/g, '')}` : 'Llevar'}</div>
                                  </div>
                              </div>
                              <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 ${order.status === OrderStatus.READY ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                    {getStatusIcon(order.status)}
                                    {order.status}
                              </div>
                          </div>
                      </div>
                  ))
            )}
          </div>
        </div>

        {activeTab !== 'pending' && (
            <div className="flex-none p-4 md:p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] pb-safe-bottom">
                <div className="space-y-1.5 mb-5">
                    {pointsDiscount > 0 && (
                        <div className="flex justify-between text-[11px] text-brand-600 font-black uppercase tracking-wider">
                            <span>Descuento Puntos</span>
                            <span className="tabular-nums">-${pointsDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-2xl font-black text-slate-900 pt-2 border-t border-slate-100 mt-2">
                        <span className="tracking-tighter uppercase">Total</span>
                        <span className="tabular-nums">${grandTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    {cart.length > 0 && orderType === OrderType.DINE_IN && (
                        <button onClick={handleSendOrder} className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg">
                            <Send size={18} /> <span>Mandar Pedido</span>
                        </button>
                    )}
                    <button 
                        disabled={(grandTotal === 0 && discountAmount === 0) || (orderType === OrderType.DINE_IN && !selectedTable)}
                        onClick={openPaymentModal}
                        className={`w-full h-14 rounded-2xl font-black text-base uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all ${orderType === OrderType.DELIVERY ? 'bg-blue-600 text-white' : 'bg-brand-600 text-white disabled:bg-slate-200 disabled:text-slate-400'}`}
                    >
                        {orderType === OrderType.DELIVERY ? <Truck size={22} /> : orderType === OrderType.TAKEAWAY ? <ShoppingBag size={22} /> : <ReceiptText size={22} />}
                        <span>{orderType === OrderType.DELIVERY ? 'Pagar Envío' : orderType === OrderType.TAKEAWAY ? 'Pagar Ahora' : 'Cerrar Mesa'}</span>
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* MODAL PAGO CON CÁLCULO DE CAMBIO */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-3 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black mb-5 text-center text-slate-800 uppercase tracking-tighter">Confirmar Pago</h3>
            <div className="mb-6 text-center bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                <p className="text-slate-500 font-black uppercase text-[10px] mb-1 tracking-widest">Monto a Cobrar</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">${grandTotal.toFixed(2)}</p>
            </div>
            {!paymentMethod ? (
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: PaymentMethod.CASH, label: 'Efectivo', icon: Banknote },
                        { id: PaymentMethod.CARD, label: 'Tarjeta', icon: CreditCard },
                        { id: PaymentMethod.QR, label: 'QR Transfer', icon: QrCode },
                        { id: PaymentMethod.MIXED, label: 'Dividir', icon: Users }
                    ].map(m => (
                        <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex flex-col items-center justify-center p-5 border-2 border-slate-100 rounded-2xl hover:border-brand-500 active:scale-95 transition-all group`}>
                            <m.icon size={32} className={`mb-2 text-slate-400 group-hover:text-brand-600 transition-colors`} />
                            <span className="font-black text-[10px] uppercase text-slate-700">{m.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {paymentMethod === PaymentMethod.CASH && (
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase text-center mb-2 tracking-widest">Recibido del Cliente</label>
                                <div className="relative">
                                    <input 
                                        autoFocus 
                                        type="number" 
                                        className="w-full border-none bg-white rounded-2xl py-4 text-3xl font-black text-center shadow-inner outline-none focus:ring-2 focus:ring-brand-500 tabular-nums" 
                                        value={cashTendered} 
                                        onChange={e => setCashTendered(e.target.value)} 
                                        placeholder="0.00" 
                                    />
                                    <Calculator className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap justify-center gap-2">
                                {[10, 20, 50, 100].map(val => (
                                    <button 
                                        key={val} 
                                        onClick={() => setCashTendered(val.toString())}
                                        className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-black text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                                    >
                                        ${val}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setCashTendered(grandTotal.toFixed(2))}
                                    className="bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-lg text-xs font-black text-brand-600 hover:bg-brand-100"
                                >
                                    Exacto
                                </button>
                            </div>

                            <div className={`p-4 rounded-2xl text-center border-2 transition-all ${cashChange >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                <p className={`text-[10px] font-black uppercase mb-1 ${cashChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {cashChange >= 0 ? 'Vuelto a entregar' : 'Saldo Faltante'}
                                </p>
                                <p className={`text-3xl font-black tabular-nums ${cashChange >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    ${Math.abs(cashChange).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {paymentMethod !== PaymentMethod.CASH && (
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-center italic text-slate-500 font-medium">
                            Procesando pago con {paymentMethod === PaymentMethod.CARD ? 'Tarjeta' : paymentMethod === PaymentMethod.QR ? 'QR' : 'Método Dividido'}...
                        </div>
                    )}

                    <div className="flex gap-3 mt-4">
                        <button onClick={() => {setPaymentMethod(null); setCashTendered('');}} className="flex-1 h-14 font-black text-xs text-slate-500 uppercase tracking-widest bg-slate-100 rounded-2xl active:bg-slate-200 transition-colors">Atrás</button>
                        <button 
                            disabled={paymentMethod === PaymentMethod.CASH && cashChange < 0}
                            onClick={confirmPayment} 
                            className="flex-[2] bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black h-14 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all uppercase text-xs tracking-widest"
                        >
                            Completar Pago
                        </button>
                    </div>
                </div>
            )}
            {!paymentMethod && <button onClick={() => setIsPaymentModalOpen(false)} className="w-full mt-5 py-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600">Cancelar</button>}
          </div>
        </div>
      )}

      {/* MAPA DE MESAS */}
      {isTableModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[120] p-3 backdrop-blur-md">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-6 animate-in zoom-in duration-200 flex flex-col max-h-[85dvh]">
                  <div className="flex justify-between items-center mb-6">
                      <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Salón Principal</h3><p className="text-slate-500 font-bold text-[10px] mt-1 uppercase tracking-widest">Selecciona una mesa</p></div>
                      <button onClick={() => setIsTableModalOpen(false)} className="bg-slate-100 p-2.5 rounded-xl transition-colors"><X size={22}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-1 pb-4 custom-scrollbar">
                    {tables.map(table => {
                        const hasActiveOrder = orders.some(o => o.tableId === table.id && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED);
                        const isTrulyOccupied = table.status === TableStatus.OCCUPIED && hasActiveOrder;
                        return (
                            <button key={table.id} onClick={() => handleTableSelection(table)} className={`h-28 w-full rounded-3xl p-4 flex flex-col justify-between border-2 transition-all active:scale-95 group ${isTrulyOccupied ? 'bg-red-50 border-red-200 text-red-800 shadow-inner' : 'bg-white border-emerald-100 hover:border-emerald-400 shadow-sm'}`}>
                                <div className="flex justify-between items-start w-full"><span className="font-black text-base">{table.name}</span>{isTrulyOccupied ? <Clock size={18} className="text-red-400"/> : <div className="w-4 h-4 rounded-full bg-emerald-400 border-4 border-emerald-100"></div>}</div>
                                <div className="flex justify-between items-end w-full"><span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{table.seats} PAX</span>{isTrulyOccupied && <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm animate-pulse">Ocupada</span>}</div>
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