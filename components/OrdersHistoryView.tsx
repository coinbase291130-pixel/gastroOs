import React, { useMemo } from 'react';
import { Order, OrderStatus, OrderType } from '../types';
import { Clock, Search, Filter, ArrowRight } from 'lucide-react';

interface OrdersHistoryViewProps {
  orders: Order[];
}

export const OrdersHistoryView: React.FC<OrdersHistoryViewProps> = ({ orders }) => {
  // Ordenar por fecha descendente
  const sortedOrders = useMemo(() => {
      return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const getDuration = (start: Date, end?: Date) => {
      if (!end) return '-';
      const diffMs = new Date(end).getTime() - new Date(start).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return `${diffMins} min`;
  };

  const getStatusColor = (status: OrderStatus) => {
      switch (status) {
          case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
          case OrderStatus.READY: return 'bg-emerald-100 text-emerald-800';
          case OrderStatus.PREPARING: return 'bg-yellow-100 text-yellow-800';
          case OrderStatus.PENDING: return 'bg-slate-100 text-slate-800';
          case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
          default: return 'bg-slate-100 text-slate-800';
      }
  };

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50 overflow-y-auto pb-24 md:pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Historial de Producción y Ventas</h2>
        <p className="text-slate-500">Monitorea tiempos de cocina y estado de pedidos</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">ID / Mesa</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Tipo</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Hora Pedido</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Hora Listo</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Tiempo Prep.</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Estado</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Total</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {sortedOrders.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                            No hay historial de pedidos aun.
                        </td>
                    </tr>
                ) : (
                    sortedOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">
                                {order.tableId 
                                    ? <span className="flex flex-col"><span className="font-bold">Mesa {order.tableId.replace('t', '')}</span><span className="text-xs text-slate-400">#{order.id.slice(0,4)}</span></span> 
                                    : `#${order.id.slice(0,6)}`
                                }
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm">
                                {order.type}
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                                {new Date(order.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                                {order.readyAt ? new Date(order.readyAt).toLocaleTimeString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                                {order.readyAt ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                                        <Clock size={12} className="mr-1" />
                                        {getDuration(order.createdAt, order.readyAt)}
                                    </span>
                                ) : (
                                    <span className="text-slate-300">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                ${order.total.toFixed(2)}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};