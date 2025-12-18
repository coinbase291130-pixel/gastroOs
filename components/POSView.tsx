import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, User, Truck, UtensilsCrossed, ShoppingBag, X, ChevronLeft, ChevronRight, Grid3X3, Lock, Send, ReceiptText, Clock, ListChecks, Ban, Monitor, Calculator, Cake, Gift, Check, ChefHat, Save, XCircle, ArrowRightLeft, Split, Coins, Users, Star, MapPin } from 'lucide-react';
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
  onUpdateCustomer: (customer: Customer) => void;
  onChangeTable: (orderId: string, newTableId: string) => void; 
}

export const POSView: React.FC<POSViewProps> = ({ 
    products, onProcessPayment, onSendOrder, onCancelOrder, customers, 
    selectedTable, onSelectTable, tables, isRegisterOpen, activeRegisterName,
    orders, taxRate, userRole, loyaltyConfig, onAddCustomer, onUpdateCustomer, onChangeTable
}) => {
  const { notify, confirm } = useNotification();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [orderType, setOrderType] = useState<OrderType>(selectedTable ? OrderType.DINE_IN : OrderType.TAKEAWAY);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
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
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [isBirthday, setIsBirthday] = useState(false);
  const [activeTab, setActiveTab] = useState<'cart' | 'bill'>('cart');

  const activeCustomers = customers.filter(c => c.isActive);
  const POINTS_VALUE_RATIO = 0.01; 

  // Sincronizar dirección de delivery cuando cambia el cliente
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
      } else {
          setIsBirthday(false);
      }
      setRedeemedPoints(0);
  }, [selectedCustomer]);

  const handleOrderTypeChange = (type: OrderType) => {
      setOrderType(type);
      if (type === OrderType.DINE_IN && !selectedTable) setIsTableModalOpen(true);
      if (type !== OrderType.DINE_IN) onSelectTable(undefined);
  };

  // Helper para actualizar cliente si la dirección cambió
  const checkAndUpdateCustomerAddress = () => {
    if (selectedCustomer && orderType === OrderType.DELIVERY && deliveryAddress !== selectedCustomer.address) {
        onUpdateCustomer({
            ...selectedCustomer,
            address: deliveryAddress
        });
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

  const tableBillTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);

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
  };

  // Added missing helper function to update cart item quantity
  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  // Added missing helper function to remove item from cart
  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const currentCartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const currentCartTax = currentCartSubtotal * taxRate; 
  const currentCartTotal = currentCartSubtotal + currentCartTax;
  const rawGrandTotal = tableBillTotal + currentCartTotal;
  const pointsDiscount = redeemedPoints * POINTS_VALUE_RATIO;
  const grandTotal = Math.max(0, rawGrandTotal - discountAmount - pointsDiscount);
  const totalWithTip = grandTotal + tipAmount;

  const handleRedeemToggle = () => {
    if (!selectedCustomer) return;
    if (redeemedPoints > 0) {
        setRedeemedPoints(0);
    } else {
        if (selectedCustomer.points < loyaltyConfig.minRedemptionPoints) {
            notify(`El mínimo para redimir son ${loyaltyConfig.minRedemptionPoints} puntos`, 'warning');
            return;
        }
        const maxPointsValue = selectedCustomer.points * POINTS_VALUE_RATIO;
        setRedeemedPoints(maxPointsValue > rawGrandTotal ? Math.floor(rawGrandTotal / POINTS_VALUE_RATIO) : selectedCustomer.points);
        notify('Puntos aplicados', 'success');
    }
  };

  const openPaymentModal = async () => {
    if (orderType === OrderType.DINE_IN && !selectedTable) {
        setIsTableModalOpen(true);
        return;
    }
    if (orderType === OrderType.DELIVERY && !deliveryAddress) {
        notify("Debes ingresar una dirección para el delivery", "error");
        return;
    }
    setIsPaymentModalOpen(true);
  };

  const confirmPayment = () => {
      if (!paymentMethod) return;
      checkAndUpdateCustomerAddress();
      onProcessPayment(cart, grandTotal, orderType, paymentMethod, selectedCustomer ? {...selectedCustomer, address: deliveryAddress} : undefined);
      setCart([]);
      setIsPaymentModalOpen(false);
      setIsMobileCartOpen(false);
      setSelectedCustomer(undefined);
      setRedeemedPoints(0);
  };

  const handleSendOrder = () => {
      if (orderType === OrderType.DINE_IN && !selectedTable) {
          setIsTableModalOpen(true);
          return;
      }
      if (orderType === OrderType.DELIVERY && !deliveryAddress) {
          notify("Debes ingresar una dirección para el delivery", "error");
          return;
      }
      checkAndUpdateCustomerAddress();
      onSendOrder(cart, orderType, selectedCustomer ? {...selectedCustomer, address: deliveryAddress} : undefined);
      setCart([]); 
      setIsMobileCartOpen(false);
      setActiveTab('bill');
  };

  // Added missing handler for saving a new customer from the modal
  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      notify("Nombre y teléfono son obligatorios", "error");
      return;
    }

    const newCustomer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCustomerName,
      phone: newCustomerPhone,
      birthDate: newCustomerBirth,
      points: 0,
      isActive: true,
    };

    onAddCustomer(newCustomer);
    setSelectedCustomer(newCustomer);
    setIsNewCustomerModalOpen(false);
    
    // Reset form
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerBirth('');
    
    notify(`Cliente ${newCustomerName} registrado`, 'success');
  };

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden w-full max-w-full">
      {/* SECCIÓN IZQUIERDA: MENÚ */}
      <div className={`flex-1 flex flex-col p-3 md:p-6 h-full transition-all duration-300 w-full overflow-hidden ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex justify-between items-center mb-3">
             {selectedTable ? (
                <div className="bg-emerald-600 text-white px-3 py-2.5 rounded-xl shadow-lg flex items-center justify-between flex-1 mr-2">
                    <div className="flex items-center">
                        <Grid3X3 className="mr-2 text-emerald-100" size={20} />
                        <div><span className="font-bold text-base block leading-tight">{selectedTable.name}</span><span className="text-[9px] text-emerald-100 opacity-90">Salón</span></div>
                    </div>
                    <button onClick={handleDeselectTable} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><XCircle size={16} /></button>
                </div>
            ) : (
                <div className="flex-1 flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mr-2">
                    <button onClick={() => handleOrderTypeChange(OrderType.DINE_IN)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${orderType === OrderType.DINE_IN ? 'bg-brand-600 text-white' : 'text-slate-500'}`}>Mesa</button>
                    <button onClick={() => handleOrderTypeChange(OrderType.TAKEAWAY)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${orderType === OrderType.TAKEAWAY ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Llevar</button>
                    <button onClick={() => handleOrderTypeChange(OrderType.DELIVERY)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${orderType === OrderType.DELIVERY ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Delivery</button>
                </div>
            )}
            
            {activeRegisterName && <div className="hidden md:flex items-center bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium"><Monitor size={16} className="mr-2 text-emerald-400" />{activeRegisterName}</div>}
        </div>

        <div className="flex flex-col space-y-2 mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-2.5 border-none bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 text-slate-700 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {['Todos', ...new Set(products.map(p => p.category))].map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition-all ${selectedCategory === cat ? 'bg-slate-800 text-white scale-105' : 'bg-white text-slate-600'}`}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-28">
            {filteredProducts.map(product => (
                <div key={product.id} onClick={() => addToCart(product)} className="bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col group overflow-hidden border border-slate-50 hover:border-brand-200 active:scale-95">
                    <div className="h-28 md:h-36 overflow-hidden relative bg-slate-100">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white px-2 py-1 rounded-lg text-[10px] font-bold">${product.price.toFixed(2)}</div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                        <h3 className="font-bold text-xs md:text-sm text-slate-800 leading-tight truncate">{product.name}</h3>
                        <p className="text-[9px] text-slate-400 mt-1 font-medium">{product.category}</p>
                    </div>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: CARRITO Y CLIENTE */}
      <div className={`fixed md:relative inset-x-0 top-0 bottom-16 md:bottom-0 md:inset-auto md:right-0 z-40 bg-white shadow-2xl flex flex-col h-[calc(100dvh-64px)] md:h-full md:w-[450px] lg:w-[500px] md:translate-x-0 transition-transform duration-300 ease-in-out border-l border-slate-100 ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex-none p-4 md:p-5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden p-1.5 -ml-1 text-slate-500"><ChevronLeft size={24} /></button>
                <h2 className="text-base md:text-xl font-bold text-slate-800 truncate flex-1">
                    {selectedTable ? `Mesa: ${selectedTable.name}` : orderType === OrderType.DELIVERY ? 'Nuevo Delivery' : 'Venta Rápida'}
                </h2>
                <button onClick={() => setIsMobileCartOpen(false)} className="hidden md:block p-2 text-slate-400"><X size={22} /></button>
            </div>

            {selectedTable && (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('cart')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'cart' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>Pedido ({cart.length})</button>
                    <button onClick={() => setActiveTab('bill')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'bill' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>Cuenta (${tableBillTotal.toFixed(0)})</button>
                </div>
            )}
        </div>

        {/* CLIENTE Y DIRECCIÓN */}
        <div className="flex-none px-4 py-3 border-b border-slate-50 bg-white space-y-3">
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center space-x-2 text-xs bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                  <User size={14} className="text-slate-400" />
                  <select className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-bold outline-none text-[10px]" onChange={(e) => setSelectedCustomer(activeCustomers.find(c => c.id === e.target.value))} value={selectedCustomer?.id || ''}>
                    <option value="">Cliente Ocasional</option>
                    {activeCustomers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.points} pts)</option>)}
                  </select>
                </div>
                <button onClick={() => setIsNewCustomerModalOpen(true)} className="bg-slate-800 text-white p-2 rounded-lg"><Plus size={14} /></button>
            </div>
            
            {orderType === OrderType.DELIVERY && (
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-blue-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Dirección de envío..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-blue-50 border-none rounded-xl text-xs font-bold text-blue-900 placeholder:text-blue-300 focus:ring-2 focus:ring-blue-400"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                </div>
            )}

            {selectedCustomer && loyaltyConfig.enabled && (
                <div className="flex items-center justify-between bg-brand-50 p-2 rounded-xl border border-brand-100">
                    <div className="flex items-center gap-2">
                        <Star size={14} className="text-brand-600" />
                        <span className="text-[10px] font-bold text-brand-800">{selectedCustomer.points} pts disponibles</span>
                    </div>
                    <button onClick={handleRedeemToggle} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${redeemedPoints > 0 ? 'bg-brand-600 text-white' : 'bg-white text-brand-600 border border-brand-200'}`}>
                        {redeemedPoints > 0 ? 'Remover' : 'Redimir'}
                    </button>
                </div>
            )}
        </div>

        {/* LISTADO ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white custom-scrollbar">
          {(!selectedTable || activeTab === 'cart') ? (
              cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                    <ShoppingBag size={40} className="mb-2 opacity-20" />
                    <p className="font-bold text-xs">Carrito Vacío</p>
                </div>
              ) : cart.map(item => (
                <div key={item.cartId} className="flex justify-between items-center bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
                    <div className="flex-1 pr-2 overflow-hidden">
                        <h4 className="font-bold text-slate-800 text-[11px] leading-tight truncate">{item.product.name}</h4>
                        <div className="text-[9px] font-medium text-slate-400">${item.product.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                            <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 text-slate-500"><Minus size={10}/></button>
                            <span className="w-5 text-center text-[11px] font-bold text-slate-800">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 text-slate-500"><Plus size={10}/></button>
                        </div>
                        <div className="w-12 text-right font-bold text-slate-800 text-[11px]">${(item.product.price * item.quantity).toFixed(2)}</div>
                        <button onClick={() => removeFromCart(item.cartId)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                </div>
              ))
          ) : (
              tableOrders.map(order => (
                  <div key={order.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 mb-2">
                      <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Orden #{order.id.slice(0,4)}</span>
                          <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">{order.status}</span>
                      </div>
                      <div className="space-y-1">
                          {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-[10px]">
                                  <span className="text-slate-700">{item.quantity}x {item.product.name}</span>
                                  <span className="font-bold text-slate-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              ))
          )}
        </div>

        {/* TOTALES Y ACCIÓN */}
        <div className="flex-none p-4 bg-white border-t border-slate-100 shadow-[0_-8px_15px_rgba(0,0,0,0.05)]">
            <div className="space-y-1 mb-4">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>{selectedTable ? 'Cuenta Acumulada' : 'Subtotal'}</span>
                    <span>${(selectedTable ? tableBillTotal : currentCartSubtotal).toFixed(2)}</span>
                </div>
                {redeemedPoints > 0 && (
                    <div className="flex justify-between text-[10px] text-emerald-600 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                        <span className="flex items-center gap-1"><Star size={10} /> Puntos ({redeemedPoints} pts)</span>
                        <span>-${pointsDiscount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-black text-slate-900 pt-1.5 border-t border-slate-100">
                    <span>TOTAL</span>
                    <span>${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {cart.length > 0 && (
                    <button onClick={handleSendOrder} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center space-x-2 active:scale-95">
                        <Send size={16} /> <span>Enviar a Cocina</span>
                    </button>
                )}
                <button 
                    disabled={grandTotal === 0 && discountAmount === 0}
                    onClick={openPaymentModal}
                    className={`w-full py-3.5 rounded-xl font-black text-base shadow-lg flex items-center justify-center space-x-2 active:scale-95 ${orderType === OrderType.DELIVERY ? 'bg-blue-600 text-white' : 'bg-brand-600 text-white disabled:bg-slate-200'}`}
                >
                    {orderType === OrderType.DELIVERY ? <Truck size={20} /> : selectedTable ? <ReceiptText size={20} /> : <Banknote size={20} />}
                    <span>{orderType === OrderType.DELIVERY ? 'Cobrar Delivery' : selectedTable ? 'Cerrar Mesa' : 'Cobrar Venta'}</span>
                </button>
            </div>
        </div>
      </div>

      {/* MODAL PAGO */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-5 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-black mb-4 text-center text-slate-800">Método de Pago</h3>
            <div className="mb-5 text-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-slate-500 font-bold uppercase text-[9px] mb-1">Total a Pagar</p>
                <p className="text-4xl font-black text-slate-900">${totalWithTip.toFixed(2)}</p>
            </div>
            {!paymentMethod ? (
                <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className="flex flex-col items-center p-4 border-2 border-slate-100 rounded-2xl hover:border-emerald-500"><Banknote size={28} className="mb-2 text-slate-400" /><span className="font-bold text-[11px]">Efectivo</span></button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.CARD)} className="flex flex-col items-center p-4 border-2 border-slate-100 rounded-2xl hover:border-blue-500"><CreditCard size={28} className="mb-2 text-slate-400" /><span className="font-bold text-[11px]">Tarjeta</span></button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.QR)} className="flex flex-col items-center p-4 border-2 border-slate-100 rounded-2xl hover:border-purple-500"><QrCode size={28} className="mb-2 text-slate-400" /><span className="font-bold text-[11px]">QR / Wallet</span></button>
                    <button onClick={() => setPaymentMethod(PaymentMethod.MIXED)} className="flex flex-col items-center p-4 border-2 border-slate-100 rounded-2xl hover:border-orange-500"><Users size={28} className="mb-2 text-slate-400" /><span className="font-bold text-[11px]">Mixto</span></button>
                </div>
            ) : (
                <div className="space-y-4">
                    {paymentMethod === PaymentMethod.CASH && (
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <label className="block text-[9px] font-black text-slate-500 uppercase text-center mb-2">Efectivo Recibido</label>
                            <input autoFocus type="number" className="w-full border-none bg-white rounded-xl py-3 text-2xl font-black text-center shadow-inner" value={cashTendered} onChange={e => setCashTendered(e.target.value)} />
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => setPaymentMethod(null)} className="flex-1 py-3 font-bold text-xs text-slate-500">Volver</button>
                        <button onClick={confirmPayment} className="flex-[2] bg-emerald-600 text-white font-black py-3 rounded-xl shadow-lg">Confirmar</button>
                    </div>
                </div>
            )}
            <button onClick={() => setIsPaymentModalOpen(false)} className="w-full mt-4 py-2.5 text-slate-400 font-bold text-[10px] uppercase">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 backdrop-blur-md">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4"><h3 className="text-base font-black">Nuevo Cliente</h3><button onClick={() => setIsNewCustomerModalOpen(false)} className="p-1.5 bg-slate-50 rounded-full"><X size={18}/></button></div>
                <form onSubmit={handleSaveNewCustomer} className="space-y-3">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nombre</label><input required className="w-full border-none bg-slate-100 rounded-xl p-2.5 font-bold text-sm outline-none" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Teléfono</label><input required type="tel" className="w-full border-none bg-slate-100 rounded-xl p-2.5 font-bold text-sm outline-none" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Fecha Nacimiento (Opcional)</label><input type="date" className="w-full border-none bg-slate-100 rounded-xl p-2.5 font-bold text-sm outline-none" value={newCustomerBirth} onChange={e => setNewCustomerBirth(e.target.value)} /></div>
                    <button type="submit" className="w-full bg-slate-900 text-white font-black py-3 rounded-xl mt-2 flex items-center justify-center text-xs">Guardar</button>
                </form>
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
                    {tables.map(table => {
                        const hasActiveOrder = orders.some(o => o.tableId === table.id && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED);
                        const isTrulyOccupied = table.status === TableStatus.OCCUPIED && hasActiveOrder;
                        return (
                            <button key={table.id} onClick={() => handleTableSelection(table)} className={`h-24 w-full rounded-2xl p-3 flex flex-col justify-between border-2 transition-all active:scale-95 group ${isTrulyOccupied ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-emerald-100 hover:border-emerald-400 shadow-sm'}`}>
                                <div className="flex justify-between items-start w-full"><span className="font-black text-sm">{table.name}</span>{isTrulyOccupied ? <Clock size={16} className="text-red-400"/> : <div className="w-3 h-3 rounded-full bg-emerald-400"></div>}</div>
                                <div className="flex justify-between items-end w-full"><span className="text-[9px] font-bold opacity-60 uppercase">{table.seats} Pax</span>{isTrulyOccupied && <span className="bg-white/60 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase">Ocupada</span>}</div>
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