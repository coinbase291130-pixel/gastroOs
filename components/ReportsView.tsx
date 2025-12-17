import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, DollarSign, ShoppingBag, CreditCard, Filter, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  expenses: Expense[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, expenses }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate >= start && 
        orderDate <= end && 
        order.status !== OrderStatus.CANCELLED
      );
    });
  }, [orders, startDate, endDate]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= start && expenseDate <= end;
      });
  }, [expenses, startDate, endDate]);

  // --- Calculations ---

  const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCostOfGoods = filteredOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const grossProfit = totalSales - totalCostOfGoods;
  const netProfit = grossProfit - totalOperatingExpenses;
  
  const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  const netMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const totalOrders = filteredOrders.length;
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Sales by Category
  const salesByCategory = useMemo(() => {
      const stats: Record<string, number> = {};
      filteredOrders.forEach(order => {
          order.items.forEach(item => {
              const cat = item.product.category;
              stats[cat] = (stats[cat] || 0) + (item.product.price * item.quantity);
          });
      });
      return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Sales by Payment Method
  const salesByPayment = useMemo(() => {
      const stats: Record<string, number> = {};
      filteredOrders.forEach(order => {
          if (order.paymentMethod) {
              stats[order.paymentMethod] = (stats[order.paymentMethod] || 0) + 1;
          }
      });
      return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50 overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Reportes Financieros</h2>
            <p className="text-slate-500">Análisis de pérdidas y ganancias reales.</p>
        </div>
        
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-lg">
                <Calendar size={18} className="text-slate-400" />
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="border-none bg-transparent text-sm focus:ring-0 outline-none w-full"
                />
            </div>
            <span className="text-slate-400 hidden md:block">-</span>
            <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-lg">
                <span className="md:hidden text-slate-400 text-xs">Hasta:</span>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="border-none bg-transparent text-sm focus:ring-0 outline-none w-full"
                />
            </div>
            <button className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 transition-colors w-full md:w-auto flex justify-center shadow-lg shadow-brand-200">
                <Filter size={18} />
            </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                      <DollarSign size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">Ingresos Totales</p>
                      <h3 className="text-2xl font-bold text-slate-800">${totalSales.toFixed(2)}</h3>
                  </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-blue-500 pointer-events-none"></div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-red-100 text-red-600 rounded-full">
                      <Receipt size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">Gastos + Costos</p>
                      <h3 className="text-2xl font-bold text-red-600">${(totalOperatingExpenses + totalCostOfGoods).toFixed(2)}</h3>
                      <p className="text-xs text-slate-400">Op: ${totalOperatingExpenses} | MP: ${totalCostOfGoods}</p>
                  </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-red-500 pointer-events-none"></div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {netProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">Ganancia Neta (Real)</p>
                      <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          ${netProfit.toFixed(2)}
                      </h3>
                      <span className="text-xs text-slate-400">Margen Neto: {netMargin.toFixed(1)}%</span>
                  </div>
              </div>
              {/* Decorative background element */}
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                      <CreditCard size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500">Ticket Promedio</p>
                      <h3 className="text-2xl font-bold text-slate-800">${avgTicket.toFixed(2)}</h3>
                  </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-purple-500 pointer-events-none"></div>
          </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales by Category */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
              <h3 className="text-lg font-bold text-slate-800 mb-4 relative z-10">Ventas por Categoría</h3>
              <div className="h-64 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
                        <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-brand-500 pointer-events-none"></div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
              <h3 className="text-lg font-bold text-slate-800 mb-4 relative z-10">Métodos de Pago (Frecuencia)</h3>
              <div className="h-64 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={salesByPayment}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {salesByPayment.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-purple-500 pointer-events-none"></div>
          </div>
      </div>
    </div>
  );
};