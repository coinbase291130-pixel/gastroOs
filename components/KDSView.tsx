
import React, { useState, useMemo, useEffect } from 'react';
import { Order, OrderStatus, ProductionArea, OrderType, ItemStatus, Role } from '../types';
import { Clock, CheckCircle, ChefHat, Beer, Flame, Filter, Monitor, Check, ChevronRight } from 'lucide-react';

interface KDSViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateOrderItems: (orderId: string, area: ProductionArea | 'ALL') => void;
  userRole: Role;
}

export const KDSView: React.FC<KDSViewProps> = ({ orders, onUpdateOrderStatus, onUpdateOrderItems, userRole }) => {
  // Determinar si el usuario tiene acceso global
  const hasGlobalAccess = useMemo(() => {
    const globalRoles = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.CASHIER, Role.WAITER];
    return globalRoles.includes(userRole);
  }, [userRole]);

  // Determinar área inicial según rol operativo
  const initialArea = useMemo(() => {
      if (userRole === Role.GRILL_MASTER) return ProductionArea.GRILL;
      if (userRole === Role.CHEF) return ProductionArea.KITCHEN;
      if (userRole === Role.BARTENDER) return ProductionArea.BAR;
      return 'ALL';
  }, [userRole]);

  const [filterArea, setFilterArea] = useState<ProductionArea | 'ALL'>(initialArea);
  const [stationMode, setStationMode] = useState<boolean>(!hasGlobalAccess);

  // Forzar filtro si el rol cambia (por ejemplo si el administrador cambia de usuario simulado)
  useEffect(() => {
      setFilterArea(initialArea);
      setStationMode(!hasGlobalAccess);
  }, [initialArea, hasGlobalAccess]);

  const activeOrders = orders.filter(o => 
    o.status === OrderStatus.PENDING || 
    o.status === OrderStatus.PREPARING
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getAreaIcon = (area: ProductionArea) => {
      switch(area) {
          case ProductionArea.KITCHEN: return <ChefHat size={16} />;
          case ProductionArea.GRILL: return <Flame size={16} />;
          case ProductionArea.BAR: return <Beer size={16} />;
      }
  };

  const getOrderTypeLabel = (type: OrderType) => {
      switch(type) {
          case OrderType.DINE_IN: return 'Mesa';
          case OrderType.TAKEAWAY: return 'Llevar';
          case OrderType.DELIVERY: return 'Envío';
      }
  };

  // Filtrar las pestañas disponibles
  const availableTabs = useMemo(() => {
      const allTabs = [
          { id: 'ALL', label: 'Todo', icon: <Filter size={14} />, roles: 'global' },
          { id: ProductionArea.KITCHEN, label: 'Cocina', icon: <ChefHat size={14} />, roles: [Role.CHEF] },
          { id: ProductionArea.GRILL, label: 'Asador', icon: <Flame size={14} />, roles: [Role.GRILL_MASTER] },
          { id: ProductionArea.BAR, label: 'Barra', icon: <Beer size={14} />, roles: [Role.BARTENDER] }
      ];

      if (hasGlobalAccess) return allTabs;
      
      // Si es operativo, solo ve su pestaña
      return allTabs.filter(tab => Array.isArray(tab.roles) && tab.roles.includes(userRole));
  }, [hasGlobalAccess, userRole]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Header Fijo con Filtros Optimizados para Móvil */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 z-30 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-brand-600 p-2 rounded-lg shrink-0">
                    <Monitor size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold leading-none">Monitor KDS</h2>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                        {stationMode ? `ESTACIÓN: ${filterArea}` : 'VISTA GLOBAL'}
                    </p>
                </div>
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-2 overflow-hidden">
                {/* Selector de Áreas - Solo visible/intercambiable si tiene acceso global */}
                {availableTabs.length > 1 && (
                    <div className="flex bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar flex-1 md:flex-none">
                        {availableTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterArea(tab.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    filterArea === tab.id 
                                    ? 'bg-brand-600 text-white shadow-lg' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {tab.icon}
                                <span className={filterArea === tab.id ? 'inline' : 'hidden sm:inline'}>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {hasGlobalAccess && (
                    <button 
                        onClick={() => setStationMode(!stationMode)}
                        className={`p-2.5 rounded-xl transition-all border ${stationMode ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        title="Alternar Modo Estación"
                    >
                        <Monitor size={18} />
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Grid de Pedidos con scroll independiente */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950 pb-20 md:pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-[1600px] mx-auto">
            {activeOrders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-700">
                    <ChefHat size={80} className="mb-4 opacity-10 animate-pulse" />
                    <h3 className="text-xl font-bold">Sin pedidos activos</h3>
                    <p className="text-sm">La cocina está al día</p>
                </div>
            ) : (
                activeOrders.map(order => {
                    const relevantItems = order.items.filter(item => 
                        filterArea === 'ALL' || item.product.productionArea === filterArea
                    );

                    if (relevantItems.length === 0) return null;
                    
                    const allRelevantReady = relevantItems.every(i => i.status === ItemStatus.READY);
                    const elapsedTime = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
                    const isLate = elapsedTime > 15;

                    return (
                        <div key={order.id} className={`flex flex-col bg-slate-900 rounded-2xl border-2 shadow-2xl transition-all duration-300 ${
                            allRelevantReady ? 'border-emerald-500/50 opacity-60' : isLate ? 'border-red-500/50 animate-pulse' : 'border-slate-800'
                        }`}>
                            {/* Cabecera del Ticket */}
                            <div className={`p-4 rounded-t-xl flex justify-between items-center ${isLate ? 'bg-red-500/10' : 'bg-slate-800/50'}`}>
                                <div>
                                    <h3 className="font-black text-xl text-white">
                                        {order.tableId ? `MESA ${order.tableId.replace(/\D/g, '')}` : `ORDEN #${order.id.slice(0,4)}`}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase">
                                            {getOrderTypeLabel(order.type)}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div className={`flex flex-col items-end ${isLate ? 'text-red-400' : 'text-emerald-400'}`}>
                                    <div className="flex items-center gap-1.5 font-black text-lg">
                                        <Clock size={16} />
                                        {elapsedTime}'
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">Tiempo</span>
                                </div>
                            </div>

                            {/* Lista de Items */}
                            <div className="p-4 flex-1 space-y-4">
                                {relevantItems.map((item, idx) => (
                                    <div key={idx} className={`flex justify-between items-start gap-3 group ${item.status === ItemStatus.READY ? 'opacity-30' : ''}`}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-2xl font-black tabular-nums ${item.status === ItemStatus.READY ? 'text-slate-500' : 'text-brand-500'}`}>
                                                    {item.quantity}
                                                </span>
                                                <span className={`text-sm font-bold leading-tight ${item.status === ItemStatus.READY ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                                    {item.product.name.toUpperCase()}
                                                </span>
                                            </div>
                                            {item.notes && (
                                                <div className="ml-9 mt-1 p-2 bg-yellow-500/10 border-l-2 border-yellow-500 rounded-r-md">
                                                    <p className="text-[11px] text-yellow-500 font-bold italic uppercase">{item.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-1">
                                            {item.status === ItemStatus.READY ? <Check size={20} className="text-emerald-500" /> : <ChevronRight size={18} className="text-slate-700" />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Botón de Acción Grande (Touch Friendly) */}
                            <div className="p-4 bg-slate-900 rounded-b-2xl">
                                {allRelevantReady ? (
                                    <div className="bg-emerald-500/10 text-emerald-400 text-center py-4 rounded-xl font-black uppercase text-xs tracking-widest border border-emerald-500/20 flex items-center justify-center gap-2">
                                        <CheckCircle size={18} /> PEDIDO LISTO
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => onUpdateOrderItems(order.id, filterArea)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-900/20 uppercase text-sm tracking-wide"
                                    >
                                        <Check size={22} strokeWidth={3} />
                                        {stationMode && filterArea !== 'ALL' ? `DESPACHAR ${filterArea}` : 'COMPLETAR TICKET'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
};
