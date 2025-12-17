import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, LogOut, Store, Grid3X3, MonitorPlay, BarChart3, Receipt, ChefHat, ChevronDown, QrCode } from 'lucide-react';
import { Branch, Role } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  userRole: Role;
  branches: Branch[];
  currentBranchId: string;
  onBranchChange: (branchId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, onChangeView, onLogout, userRole,
    branches, currentBranchId, onBranchChange
}) => {
  // Reordenado y permisos ajustados: El Mesero ya no ve "Clientes"
  const allItems = [
    { id: 'dashboard', label: 'Tablero', icon: <LayoutDashboard size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.CASHIER] },
    { id: 'tables', label: 'Mesas', icon: <Grid3X3 size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.CASHIER, Role.WAITER] },
    { id: 'pos', label: 'Caja', icon: <Store size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.CASHIER, Role.WAITER] },
    { id: 'kds', label: 'KDS', icon: <MonitorPlay size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.CHEF, Role.GRILL_MASTER, Role.WAITER, Role.CASHIER, Role.BARTENDER] },
    { id: 'qr-menu', label: 'Menú Digital', icon: <QrCode size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.WAITER, Role.CASHIER] },
    { id: 'reports', label: 'Reportes', icon: <BarChart3 size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN] },
    { id: 'expenses', label: 'Gastos', icon: <Receipt size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN] },
    { id: 'orders', label: 'Historial', icon: <ShoppingBag size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN] },
    { id: 'inventory', label: 'Productos', icon: <Package size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN] },
    { id: 'customers', label: 'Clientes', icon: <Users size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.BRANCH_ADMIN, Role.CASHIER] },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={20} />, roles: [Role.SUPER_ADMIN, Role.COMPANY_ADMIN] },
  ];

  const menuItems = allItems.filter(item => item.roles.includes(userRole));

  const formatRole = (role: string) => {
    switch(role) {
      case 'COMPANY_ADMIN': return 'ADMINISTRADOR';
      case 'BRANCH_ADMIN': return 'GERENTE';
      case 'CASHIER': return 'CAJERO';
      case 'CHEF': return 'CHEF COCINA';
      case 'GRILL_MASTER': return 'ASADOR MASTER';
      case 'BARTENDER': return 'BARMAN / BARRA';
      case 'WAITER': return 'MESERO / ATENCIÓN';
      default: return role.replace('_', ' ');
    }
  };

  const isStrictlyOperational = userRole === Role.CHEF || userRole === Role.GRILL_MASTER || userRole === Role.BARTENDER;

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 text-white h-screen flex-col shadow-2xl flex-shrink-0 z-50 transition-all duration-300">
        <div className="p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-900/50">
                <ChefHat size={24} className="text-white" />
             </div>
             <h1 className="text-xl font-bold tracking-tight text-white">
                GastroOS
             </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-2 pl-1 border-l-2 border-brand-600">
              {formatRole(userRole)}
          </p>

          {!isStrictlyOperational && (
            <div className="mt-5 pt-5 border-t border-slate-800 space-y-3">
                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                        <Store size={10} /> Sucursal
                    </label>
                    <div className="relative">
                        <select
                            value={currentBranchId}
                            onChange={(e) => onBranchChange(e.target.value)}
                            className="w-full bg-slate-800 text-white text-xs font-medium border border-slate-700 rounded-lg py-2.5 pl-3 pr-8 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors cursor-pointer appearance-none"
                        >
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20 font-medium translate-x-1'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
              }`}
            >
              <span className={`transition-colors ${currentView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-all duration-200 group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Solo opciones de vista, Logout movido al header superior */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden">
        <div className="flex justify-around items-center h-16 px-1">
          {/* Mostramos hasta 5 ítems máximo en la barra inferior para evitar saturación */}
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                currentView === item.id ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {React.cloneElement(item.icon as React.ReactElement<any>, { 
                  size: 22, 
                  strokeWidth: currentView === item.id ? 2.5 : 2 
              })}
              <span className="text-[10px] font-bold truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};