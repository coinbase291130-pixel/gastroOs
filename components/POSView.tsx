import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, User, Truck, UtensilsCrossed, ShoppingBag, X, ChevronLeft, ChevronRight, Grid3X3, Lock, Send, ReceiptText, Clock, ListChecks, Ban, Monitor, Calculator, Cake, Gift, Check, CheckCircle, ChefHat, Save, XCircle, ArrowRightLeft, Split, Coins, Users, Star, MapPin, Package, AlertCircle } from 'lucide-react';
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

  // --- LÓGICA DE STOCK DINÁMICO (RESTANDO CARRITO ACTUAL) ---
  
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
    if (window.innerWidth < 768) {
        notify(`+1 ${product.name}`, 'success');
    }
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

  const openPaymentModal = () => {
    if (!isRegisterOpen) return;
    if (orderType === OrderType.DINE_IN && !selectedTable) {
        setIsTableModalOpen(true);
        return;
    }
    if (orderType === OrderType.DELIVERY && !deliveryAddress) {
        notify("Ingresa dirección de entrega", "error");
        return;
    }
    if (cart.length === 0 && orderType !== OrderType.DINE_IN) {
        notify("Agregue productos al pedido", "warning");
        return;
    }
    setIsPaymentModalOpen(true);
  };

  const confirmPayment = () => {
      if (!paymentMethod) return;
      onProcessPayment(cart, grandTotal, orderType, paymentMethod, selectedCustomer ? {...selectedCustomer, address: deliveryAddress} : undefined);
      setCart([]);
      setIsPaymentModalOpen(false);
      setIsMobileCartOpen(false);
      setSelectedCustomer(undefined);
      setRedeemedPoints(0);
      setDeliveryAddress('');
      setActiveTab('pending');
  };

  const handleSendOrder = () => {
      if (!isRegisterOpen) return;
      if (orderType === OrderType.DINE_IN && !selectedTable) {
          setIsTableModalOpen(true);
          return;
      }
      onSendOrder(cart, orderType, selectedCustomer ? {...selectedCustomer, address: deliveryAddress} : undefined);
      setCart([]); 
      setIsMobileCartOpen(false);
      setActiveTab('bill');
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

      <div className={`fixed md:relative inset-x-0 top-0 bottom-0 md:inset-auto md:right-0 z-[60] md:z-40 bg-white shadow-2xl flex flex-col h-full md:w-[400px] lg:w-[450px] md:translate-x-0 transition-transform duration-300 ease-in-out border-l border-slate-100 ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white custom-scrollbar pb-10">
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
                        </div>
                    </div>
                ))
          )}
        </div>

        {activeTab !== 'pending' && (
            <div className="flex-none p-4 md:p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] pb-safe-bottom">
                <div className="space-y-1.5 mb-5">
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
                        <span>{orderType === OrderType.DELIVERY ? 'Pagar Envío' : orderType === OrderType.TAKEAWAY ? 'Pagar Ahora' : 'Cerrar Mesa'}</span>
                    </button>
                </div>
            </div>
        )}
      </div>
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