import React, { useState, useMemo } from 'react';
import { Order, User, CashRegister, RegisterSession } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Users, ArrowUpRight, Clock, Lock, Unlock, X, Timer, Wallet, AlertTriangle, CalendarRange } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  activeSession: RegisterSession | null;
  registers: CashRegister[];
  onOpenRegister: (registerId: string, amount: number) => void;
  onCloseRegister: (closingAmount: number) => void;
  currentUser: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ orders, activeSession, registers, onOpenRegister, onCloseRegister, currentUser }) => {
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [targetRegisterId, setTargetRegisterId] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');

  // KPIs
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Calculo de Tiempo Promedio de Producción (Solo ordenes con readyAt)
  const avgPrepTime = useMemo(() => {
      const completedOrders = orders.filter(o => o.readyAt && o.createdAt);
      if (completedOrders.length === 0) return 0;
      
      const totalMinutes = completedOrders.reduce((acc, o) => {
          const start = new Date(o.createdAt).getTime();
          const end = new Date(o.readyAt!).getTime();
          return acc + ((end - start) / 60000);
      }, 0);
      
      return Math.round(totalMinutes / completedOrders.length);
  }, [orders]);

  // Chart Data (Mock enhanced)
  const data = [
    { name: 'Lun', sales: 4000 },
    { name: 'Mar', sales: 3000 },
    { name: 'Mie', sales: 2000 },
    { name: 'Jue', sales: 2780 },
    { name: 'Vie', sales: 1890 },
    { name: 'Sab', sales: 2390 },
    { name: 'Dom', sales: 3490 },
  ];

  const handleOpenClick = (registerId: string) => {
      setTargetRegisterId(registerId);
      setIsOpenModalOpen(true);
  };

  const handleConfirmOpen = (e: React.FormEvent) => {
      e.preventDefault();
      onOpenRegister(targetRegisterId, parseFloat(amountInput));
      setIsOpenModalOpen(false);
      setAmountInput('');
  };

  const handleCloseClick = () => {
      setIsCloseModalOpen(true);
  };

  const handleConfirmClose = (e: React.FormEvent) => {
      e.preventDefault();
      onCloseRegister(parseFloat(amountInput));
      setIsCloseModalOpen(false);
      setAmountInput('');
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 h-full overflow-y-auto pb-24 md:pb-8 relative">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tablero Principal</h2>
            <p className="text-slate-500 mt-1">Bienvenido de nuevo, {currentUser.name.split(' ')[0]}</p>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 flex items-center shadow-sm font-medium">
                <CalendarRange size={16} className="mr-2 text-brand-600" />
                Hoy, {new Date().toLocaleDateString()}
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 flex items-center shadow-sm font-medium">
                <Clock size={16} className="mr-2 text-brand-600" />
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors"><DollarSign size={24}/></div>
                <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-full">+12% <ArrowUpRight size={12}/></span>
            </div>
            <div className="relative z-10">
                <p className="text-sm text-slate-500 font-semibold mb-1">Ventas Totales</p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">${totalSales.toLocaleString()}</h3>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-emerald-500 pointer-events-none"></div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors"><ShoppingBag size={24}/></div>
            </div>
            <div className="relative z-10">
                <p className="text-sm text-slate-500 font-semibold mb-1">Pedidos Realizados</p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{totalOrders}</h3>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-blue-500 pointer-events-none"></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors"><Timer size={24}/></div>
            </div>
            <div className="relative z-10">
                <p className="text-sm text-slate-500 font-semibold mb-1">Tiempo Prep. Promedio</p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{avgPrepTime} <span className="text-lg font-medium text-slate-400">min</span></h3>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-orange-500 pointer-events-none"></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors"><TrendingUp size={24}/></div>
            </div>
            <div className="relative z-10">
                <p className="text-sm text-slate-500 font-semibold mb-1">Ticket Promedio</p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">${avgTicket.toFixed(2)}</h3>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-purple-500 pointer-events-none"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Chart Section (60% width) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Rendimiento Semanal</h3>
                        <p className="text-sm text-slate-400">Ventas comparadas con la semana anterior</p>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#cc6600" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#cc6600" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} fontSize={12} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} fontSize={12} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                                formatter={(val: number) => [`$${val}`, 'Ventas']}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#cc6600" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
          </div>

          {/* Register Management Section (40% width) */}
          <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Wallet className="text-brand-600" size={20} />
                    Puntos de Venta
                </h3>
              </div>
              
              <div className="space-y-4">
                  {registers.map(reg => {
                      const isMySession = activeSession?.registerId === reg.id;
                      
                      return (
                        <div key={reg.id} className={`p-5 rounded-xl border transition-all relative overflow-hidden ${
                            reg.isOpen 
                            ? 'bg-white border-green-200 shadow-sm' 
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                            {reg.isOpen && <div className="absolute top-0 left-0 w-1 h-full bg-green-500 z-20"></div>}
                            
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div>
                                    <h4 className="font-bold text-slate-800">{reg.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${reg.isOpen ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        <span className="text-xs font-medium text-slate-500">{reg.isOpen ? 'En línea' : 'Cerrada'}</span>
                                    </div>
                                </div>
                                <div className={`p-2 rounded-lg ${reg.isOpen ? 'bg-green-50 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                    {reg.isOpen ? <Unlock size={18} /> : <Lock size={18} />}
                                </div>
                            </div>

                            <div className="relative z-10">
                                {reg.isOpen ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center font-bold text-xs text-slate-700">
                                                {reg.currentUser?.charAt(0)}
                                            </div>
                                            <div className="text-xs">
                                                <p className="font-bold text-slate-700">{reg.currentUser}</p>
                                                <p className="text-slate-400">Responsable</p>
                                            </div>
                                        </div>
                                        
                                        {isMySession ? (
                                            <button 
                                                onClick={handleCloseClick}
                                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                            >
                                                <Lock size={14} /> Cerrar Turno
                                            </button>
                                        ) : (
                                            <div className="w-full bg-slate-100 text-slate-400 font-medium py-2 rounded-lg text-center text-xs border border-slate-200">
                                                Ocupada por otro usuario
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleOpenClick(reg.id)}
                                        disabled={!!activeSession} 
                                        className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-sm mt-4"
                                    >
                                        <Unlock size={14} /> Abrir Caja
                                    </button>
                                )}
                            </div>
                            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${reg.isOpen ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                        </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* OPEN REGISTER MODAL */}
      {isOpenModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800">Abrir {registers.find(r => r.id === targetRegisterId)?.name}</h3>
                      <button onClick={() => setIsOpenModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleConfirmOpen} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Monto de Apertura ($)</label>
                          <input 
                            required
                            type="number" 
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full border rounded-lg p-3 text-lg font-mono focus:ring-2 focus:ring-brand-500 outline-none"
                            value={amountInput}
                            onChange={(e) => setAmountInput(e.target.value)}
                          />
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex items-start gap-3">
                          <Users size={16} className="mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-bold">{currentUser.name}</p>
                            <p className="opacity-80">Registrar apertura a las {new Date().toLocaleTimeString()}</p>
                          </div>
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg mt-2 shadow-lg shadow-brand-200"
                      >
                          Iniciar Turno
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* CLOSE REGISTER MODAL */}
      {isCloseModalOpen && activeSession && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800">Cierre de Caja</h3>
                      <button onClick={() => setIsCloseModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                      <div className="flex justify-between text-sm text-slate-600">
                          <span>Monto Apertura:</span>
                          <span className="font-mono">${activeSession.openingAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                          <span>Ventas Totales:</span>
                          <span className="font-mono">${activeSession.totalSales.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800 text-lg">
                          <span>Esperado:</span>
                          <span className="font-mono text-brand-600">${(activeSession.openingAmount + activeSession.totalSales).toFixed(2)}</span>
                      </div>
                  </div>

                  <form onSubmit={handleConfirmClose} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Monto Real en Caja ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                required
                                type="number" 
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full border rounded-lg pl-10 pr-4 py-3 text-lg font-mono focus:ring-2 focus:ring-red-500 outline-none"
                                value={amountInput}
                                onChange={(e) => setAmountInput(e.target.value)}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-2">Cuenta el efectivo y comprobantes físicos.</p>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 text-xs text-amber-800">
                          <AlertTriangle className="flex-shrink-0" size={16} />
                          <p>Esta acción es irreversible y generará el reporte de cierre automáticamente.</p>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg mt-2 shadow-lg shadow-red-200"
                      >
                          Confirmar Cierre
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};