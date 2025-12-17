import React, { useState } from 'react';
import { Order, OrderStatus, ProductionArea, OrderType, ItemStatus, CartItem } from '../types';
import { Clock, CheckCircle, ChefHat, Beer, Flame, Filter, Monitor, Check } from 'lucide-react';

interface KDSViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateOrderItems: (orderId: string, area: ProductionArea | 'ALL') => void;
}

export const KDSView: React.FC<KDSViewProps> = ({ orders, onUpdateOrderStatus, onUpdateOrderItems }) => {
  const [filterArea, setFilterArea] = useState<ProductionArea | 'ALL'>('ALL');
  const [stationMode, setStationMode] = useState<boolean>(false);

  // Filtrar solo pedidos activos (Pendientes o Preparando)
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
          case OrderType.DELIVERY: return 'Delivery';
      }
  };

  return (
    <div className="p-4 md:p-6 h-full bg-slate-900 text-white overflow-y-auto pb-24 md:pb-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                {stationMode ? (
                    <span className="text-emerald-400 flex items-center gap-2"><Monitor size={24}/> Estación: {filterArea === 'ALL' ? 'MAESTRA' : filterArea}</span>
                ) : (
                    <>
                    <ChefHat className="text-brand-500" />
                    Monitor de Pedidos (KDS)
                    </>
                )}
            </h2>
            <p className="text-slate-400 text-sm">
                {stationMode 
                    ? `Solo mostrando tickets correspondientes a ${filterArea === 'ALL' ? 'todas las áreas' : filterArea}` 
                    : 'Vista general de producción'}
            </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
            {/* Station Mode Toggle */}
            <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-lg">
                <span className="text-xs font-bold text-slate-400 px-2">MODO ESTACIÓN</span>
                <button 
                    onClick={() => setStationMode(!stationMode)}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${stationMode ? 'bg-emerald-500 justify-end' : 'bg-slate-600 justify-start'}`}
                >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </button>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
                {[
                    { id: 'ALL', label: 'Todo', icon: <Filter size={16} /> },
                    { id: ProductionArea.KITCHEN, label: 'Cocina', icon: <ChefHat size={16} /> },
                    { id: ProductionArea.GRILL, label: 'Asador', icon: <Flame size={16} /> },
                    { id: ProductionArea.BAR, label: 'Barra', icon: <Beer size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterArea(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${
                            filterArea === tab.id 
                            ? 'bg-brand-600 text-white' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeOrders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
                <ChefHat size={64} className="mb-4 opacity-20" />
                <h3 className="text-xl font-bold">No hay pedidos pendientes</h3>
                <p>Todo está tranquilo por ahora.</p>
            </div>
        ) : (
            activeOrders.map(order => {
                // Filter items inside the order based on the selected area
                const relevantItems = order.items.filter(item => 
                    filterArea === 'ALL' || item.product.productionArea === filterArea
                );

                if (relevantItems.length === 0) return null;
                
                // Verificar si todos los items RELEVANTES para esta vista estan listos
                const allRelevantReady = relevantItems.every(i => i.status === ItemStatus.READY);

                const elapsedTime = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
                const isLate = elapsedTime > 15; // 15 mins warning

                return (
                    <div key={order.id} className={`bg-slate-800 rounded-xl border overflow-hidden flex flex-col shadow-lg animate-in zoom-in-95 duration-200 ${allRelevantReady ? 'border-emerald-500 opacity-60' : 'border-slate-700'}`}>
                        {/* Order Header */}
                        <div className={`p-3 flex justify-between items-center ${isLate ? 'bg-red-900/50' : 'bg-slate-700/50'}`}>
                            <div>
                                <h3 className="font-bold text-lg">
                                    {order.tableId 
                                        ? `Mesa ${order.tableId.replace('t', '')}` // Simple parsing for demo
                                        : `#${order.id.slice(0,4)}`
                                    }
                                </h3>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-600 text-slate-300">
                                    {getOrderTypeLabel(order.type)}
                                </span>
                            </div>
                            <div className={`flex items-center gap-1 font-mono font-bold ${isLate ? 'text-red-400' : 'text-emerald-400'}`}>
                                <Clock size={16} />
                                {elapsedTime} min
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="p-4 flex-1 space-y-3">
                            {relevantItems.map((item, idx) => (
                                <div key={idx} className={`flex justify-between items-start border-b border-slate-700/50 pb-2 last:border-0 last:pb-0 ${item.status === ItemStatus.READY ? 'opacity-40' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-lg ${item.status === ItemStatus.READY ? 'text-emerald-500 line-through' : 'text-brand-400'}`}>{item.quantity}x</span>
                                            <span className="font-medium text-slate-200">{item.product.name}</span>
                                        </div>
                                        {item.notes && (
                                            <p className="text-xs text-yellow-500 italic mt-1">Nota: {item.notes}</p>
                                        )}
                                        {item.variant && (
                                            <p className="text-xs text-slate-500">{item.variant.name}</p>
                                        )}
                                    </div>
                                    <div className="text-slate-500 flex flex-col items-end gap-1" title={item.product.productionArea}>
                                        {getAreaIcon(item.product.productionArea)}
                                        {item.status === ItemStatus.READY && <Check size={14} className="text-emerald-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Footer */}
                        <div className="p-3 bg-slate-700/30 border-t border-slate-700">
                            {allRelevantReady ? (
                                <div className="text-center text-emerald-400 font-bold py-3 flex items-center justify-center gap-2">
                                    <CheckCircle size={20} />
                                    <span>Completado</span>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => onUpdateOrderItems(order.id, filterArea)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
                                >
                                    <CheckCircle size={20} />
                                    {stationMode && filterArea !== 'ALL' 
                                        ? `Listo ${filterArea}` 
                                        : 'Marcar Todo Listo'
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};