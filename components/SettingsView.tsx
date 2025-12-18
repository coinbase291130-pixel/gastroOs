import React, { useState } from 'react';
import { Save, Percent, CheckCircle, Users, Monitor, Store, Gift, Plus, Trash2, Edit2, Shield, User, X, Briefcase, Upload, Image as ImageIcon, MapPin, Phone, Lock, Unlock, Ban, Wallet, Archive, RotateCcw, AlertTriangle, Key, Grid3X3, Tag } from 'lucide-react';
import { LoyaltyConfig, User as UserType, Role, CashRegister, Branch, Category } from '../types';
import { useNotification } from './NotificationContext';

interface SettingsViewProps {
  loyaltyConfig: LoyaltyConfig;
  onUpdateLoyalty: (config: LoyaltyConfig) => void;
  users: UserType[];
  onAddUser: (user: UserType) => void;
  onUpdateUser: (user: UserType) => void;
  registers: CashRegister[];
  onAddRegister: (register: CashRegister) => void;
  onUpdateRegister: (register: CashRegister) => void;
  onDeleteRegister: (id: string) => void;
  taxRate: number;
  onUpdateTax: (rate: number) => void;
  branches: Branch[];
  currentBranchId: string;
  onAddBranch: (branch: Branch) => void;
  onUpdateBranch: (branch: Branch) => void;
  onChangeBranch: (id: string) => void;
  userRole: Role;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  loyaltyConfig, onUpdateLoyalty,
  users, onAddUser, onUpdateUser,
  registers, onAddRegister, onUpdateRegister, onDeleteRegister,
  taxRate, onUpdateTax,
  branches, currentBranchId, onAddBranch, onUpdateBranch, onChangeBranch,
  userRole,
  categories, onAddCategory, onUpdateCategory, onDeleteCategory
}) => {
  const { notify, confirm } = useNotification();
  const [activeTab, setActiveTab] = useState<'loyalty' | 'team' | 'registers' | 'tax' | 'branches' | 'catalog'>('branches');

  // --- TEAM STATE ---
  const [showUserTrash, setShowUserTrash] = useState(false);

  // --- BRANCH STATE ---
  const [showBranchTrash, setShowBranchTrash] = useState(false);

  // --- REGISTER STATE ---
  const [showRegisterTrash, setShowRegisterTrash] = useState(false);
  
  // --- CATALOG STATE ---
  const [showCategoryTrash, setShowCategoryTrash] = useState(false);

  // --- TAX STATE ---
  const [tempTaxRate, setTempTaxRate] = useState(taxRate * 100);

  // --- LOYALTY STATE ---
  const [pointsPerCurrency, setPointsPerCurrency] = useState(loyaltyConfig.pointsPerCurrency);
  const [minRedemption, setMinRedemption] = useState(loyaltyConfig.minRedemptionPoints);
  const [birthdayDiscount, setBirthdayDiscount] = useState(loyaltyConfig.birthdayDiscountPercentage || 50);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(loyaltyConfig.enabled);

  // --- USER MODAL STATE ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>(Role.CASHIER);
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserBranch, setNewUserBranch] = useState(currentBranchId);

  // --- REGISTER MODAL STATE ---
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
  const [registerNameForm, setRegisterNameForm] = useState('');

  // --- CATEGORY MODAL STATE ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryNameForm, setCategoryNameForm] = useState('');

  // --- BRANCH MODAL STATE ---
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchLogo, setNewBranchLogo] = useState('');

  const canManageBranches = userRole === Role.COMPANY_ADMIN || userRole === Role.SUPER_ADMIN;

  const handleSaveTax = () => {
      onUpdateTax(tempTaxRate / 100);
      notify('Tasa de impuestos actualizada correctamente.', 'success');
  };

  const handleSaveLoyalty = () => {
    onUpdateLoyalty({
      enabled: loyaltyEnabled,
      pointsPerCurrency: Number(pointsPerCurrency),
      minRedemptionPoints: Number(minRedemption),
      birthdayDiscountPercentage: Number(birthdayDiscount)
    });
    notify('Configuración de fidelización guardada.', 'success');
  };

  // User Handlers
  const openUserModal = (user?: UserType) => {
      if (user) {
          setEditingUser(user);
          setNewUserName(user.name);
          setNewUserEmail(user.email);
          setNewUserRole(user.role);
          setNewUserPin(user.pin);
          setNewUserBranch(user.branchId || currentBranchId);
      } else {
          setEditingUser(null);
          setNewUserName('');
          setNewUserEmail('');
          setNewUserRole(Role.CASHIER);
          setNewUserPin('');
          setNewUserBranch(currentBranchId);
      }
      setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
        if (onUpdateUser) {
            onUpdateUser({
                ...editingUser,
                name: newUserName,
                email: newUserEmail,
                role: newUserRole,
                pin: newUserPin,
                branchId: newUserBranch
            });
            notify('Usuario actualizado.', 'success');
        }
    } else {
        const newUser: UserType = {
            id: Math.random().toString(36).substr(2, 9),
            name: newUserName,
            email: newUserEmail,
            role: newUserRole,
            pin: newUserPin,
            branchId: newUserBranch,
            isActive: true
        };
        onAddUser(newUser);
        notify('Usuario creado.', 'success');
    }
    setIsUserModalOpen(false);
    setNewUserName(''); setNewUserEmail(''); setNewUserPin(''); setEditingUser(null);
  };

  const toggleUserStatus = async (user: UserType) => {
      if (onUpdateUser) {
          const action = user.isActive ? 'desactivar' : 'activar';
          const confirmMsg = user.isActive 
            ? `¿Estás seguro de desactivar a ${user.name}? Se moverá a la papelera.` 
            : `¿Estás seguro de restaurar a ${user.name}?`;

          const shouldProceed = await confirm({
              title: user.isActive ? 'Desactivar Empleado' : 'Restaurar Empleado',
              message: confirmMsg,
              type: user.isActive ? 'warning' : 'info'
          });

          if (shouldProceed) {
              onUpdateUser({ ...user, isActive: !user.isActive });
              notify(user.isActive ? 'Usuario desactivado.' : 'Usuario restaurado.', 'info');
          }
      }
  };

  // Register Handlers
  const openRegisterModal = (reg?: CashRegister) => {
      if (reg) {
          setEditingRegister(reg);
          setRegisterNameForm(reg.name);
      } else {
          setEditingRegister(null);
          setRegisterNameForm('');
      }
      setIsRegisterModalOpen(true);
  };

  const handleSaveRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingRegister) {
          onUpdateRegister({ ...editingRegister, name: registerNameForm });
          notify('Caja actualizada.', 'success');
      } else {
           const newReg: CashRegister = {
              id: `reg-${Date.now()}`,
              branchId: currentBranchId,
              name: registerNameForm,
              isOpen: false,
              isActive: true
          };
          onAddRegister(newReg);
          notify('Caja creada.', 'success');
      }
      setIsRegisterModalOpen(false);
  };

  const toggleRegisterStatus = async (register: CashRegister) => {
      if (register.isOpen && register.isActive) {
          notify("No puedes desactivar una caja que está abierta. Cierra turno primero.", "error");
          return;
      }

      if (register.isActive) {
           const confirmed = await confirm({
              title: 'Desactivar Caja',
              message: `¿Estás seguro de desactivar la caja "${register.name}"? Se moverá a la papelera.`,
              type: 'warning',
              confirmText: 'Desactivar'
          });
          if (confirmed) {
              onDeleteRegister(register.id); 
          }
      } else {
           // Restore
           onUpdateRegister({ ...register, isActive: true });
           notify('Caja restaurada.', 'success');
      }
  };

  // Category Handlers
  const openCategoryModal = (cat?: Category) => {
      if (cat) {
          setEditingCategory(cat);
          setCategoryNameForm(cat.name);
      } else {
          setEditingCategory(null);
          setCategoryNameForm('');
      }
      setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingCategory) {
          onUpdateCategory({ ...editingCategory, name: categoryNameForm });
          notify('Categoría actualizada.', 'success');
      } else {
           const newCat: Category = {
              id: `cat-${Date.now()}`,
              name: categoryNameForm,
              isActive: true
          };
          onAddCategory(newCat);
          notify('Categoría creada.', 'success');
      }
      setIsCategoryModalOpen(false);
  };

  const toggleCategoryStatus = async (cat: Category) => {
      if (cat.isActive) {
           const confirmed = await confirm({
              title: 'Desactivar Categoría',
              message: `¿Estás seguro de desactivar la categoría "${cat.name}"? Se moverá a la papelera.`,
              type: 'warning',
              confirmText: 'Desactivar'
          });
          if (confirmed) {
              onDeleteCategory(cat.id); 
          }
      } else {
           // Restore
           onUpdateCategory({ ...cat, isActive: true });
           notify('Categoría restaurada.', 'success');
      }
  };

  // Branch Handlers
  const openBranchModal = (branch?: Branch) => {
      if (branch) {
          setEditingBranch(branch);
          setNewBranchName(branch.name);
          setNewBranchAddress(branch.address);
          setNewBranchPhone(branch.phone || '');
          setNewBranchLogo(branch.logoUrl || '');
      } else {
          setEditingBranch(null);
          setNewBranchName('');
          setNewBranchAddress('');
          setNewBranchPhone('');
          setNewBranchLogo('');
      }
      setIsBranchModalOpen(true);
  };

  const handleBranchLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const objectUrl = URL.createObjectURL(file);
          setNewBranchLogo(objectUrl);
      }
  };

  const handleSaveBranch = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingBranch) {
          onUpdateBranch({
              ...editingBranch,
              name: newBranchName,
              address: newBranchAddress,
              phone: newBranchPhone,
              logoUrl: newBranchLogo
          });
          notify('Sucursal actualizada.', 'success');
      } else {
          const newBranch: Branch = {
              id: `b-${Date.now()}`,
              companyId: 'c1', 
              name: newBranchName,
              address: newBranchAddress,
              phone: newBranchPhone,
              isActive: true,
              logoUrl: newBranchLogo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
          };
          onAddBranch(newBranch);
          notify('Sucursal creada.', 'success');
      }
      setIsBranchModalOpen(false);
  };

  const toggleBranchStatus = async (branch: Branch) => {
      if (branch.id === currentBranchId && branch.isActive) {
          notify("No puedes desactivar la sucursal actual. Cambia de sucursal primero.", "error");
          return;
      }

      if (branch.isActive) {
          const confirmed = await confirm({
              title: 'Desactivar Sucursal',
              message: `¿Estás seguro de desactivar la sucursal "${branch.name}"? Se moverá a la papelera.`,
              type: 'danger',
              confirmText: 'Desactivar'
          });
          
          if (confirmed) {
              onUpdateBranch({ ...branch, isActive: false });
              notify('Sucursal desactivada.', 'info');
          }
      } else {
          onUpdateBranch({ ...branch, isActive: true });
          notify('Sucursal restaurada y activa.', 'success');
      }
  };

  const tabs = [
      { id: 'branches', label: 'Sucursales', icon: <Store size={18}/> },
      { id: 'tax', label: 'Impuestos', icon: <Percent size={18}/> },
      { id: 'registers', label: 'Cajas', icon: <Wallet size={18}/> },
      { id: 'catalog', label: 'Catálogo', icon: <Grid3X3 size={18}/> },
      { id: 'team', label: 'Equipo', icon: <Users size={18}/> },
      { id: 'loyalty', label: 'Fidelización', icon: <Gift size={18}/> },
  ];

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50 overflow-y-auto pb-24 md:pb-8 relative">
      <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Ajustes del Sistema</h2>
            <p className="text-slate-500 mt-1">Configuración global y operativa</p>
          </div>
      </div>

      <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[120px] px-4 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.id 
                    ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                {tab.icon}
                <span>{tab.label}</span>
            </button>
        ))}
      </div>

      {/* BRANCHES CONTENT */}
      {activeTab === 'branches' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                        {showBranchTrash ? 'Papelera de Sucursales' : 'Red de Sucursales'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {showBranchTrash ? 'Restaura sucursales inactivas' : 'Gestiona tus ubicaciones activas'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setShowBranchTrash(!showBranchTrash)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center border transition-all ${
                            showBranchTrash 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {showBranchTrash ? <Store size={18} className="mr-2"/> : <Archive size={18} className="mr-2"/>}
                        {showBranchTrash ? 'Ver Activas' : 'Papelera'}
                    </button>
                    {canManageBranches && !showBranchTrash && (
                        <button 
                            onClick={() => openBranchModal()}
                            className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-brand-700 hover:shadow-lg transition-all active:scale-95"
                        >
                            <Plus size={18} className="mr-2" /> Nueva Sucursal
                        </button>
                    )}
                  </div>
              </div>

              {showBranchTrash && (
                  <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 rounded-lg mb-6">
                      <Archive size={16} className="mr-2" /> Sucursales desactivadas (No aparecen en selectores).
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {branches.filter(b => showBranchTrash ? !b.isActive : b.isActive).length === 0 ? (
                      <div className="col-span-full text-center py-20 text-slate-400">
                          <Store size={48} className="mx-auto mb-4 opacity-30" />
                          <p>{showBranchTrash ? 'La papelera está vacía.' : 'No hay sucursales activas.'}</p>
                      </div>
                  ) : (
                      branches.filter(b => showBranchTrash ? !b.isActive : b.isActive).map(branch => (
                          <div key={branch.id} className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden group relative ${branch.id === currentBranchId ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-100 hover:border-brand-200 hover:shadow-md'} ${!branch.isActive && 'opacity-70'}`}>
                              
                              {/* Banner simulado con logo */}
                              <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 relative z-10">
                                  <div className={`absolute -bottom-6 left-6 w-16 h-16 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden ${!branch.isActive && 'grayscale'}`}>
                                    {branch.logoUrl ? (
                                        <img src={branch.logoUrl} alt={branch.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                            <Store size={24}/>
                                        </div>
                                    )}
                                  </div>
                                  
                                  {/* Actions Top Right */}
                                  <div className="absolute top-3 right-3 flex gap-2">
                                    {canManageBranches && !showBranchTrash && (
                                        <button 
                                            onClick={() => openBranchModal(branch)} 
                                            className="bg-white/90 p-2 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-white shadow-sm transition-all"
                                            title="Editar Información"
                                        >
                                            <Edit2 size={16}/>
                                        </button>
                                    )}
                                    {canManageBranches && (
                                        <button 
                                            onClick={() => toggleBranchStatus(branch)}
                                            className={`bg-white/90 p-2 rounded-lg shadow-sm transition-all ${branch.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                                            title={branch.isActive ? "Desactivar" : "Restaurar"}
                                        >
                                            {branch.isActive ? <Trash2 size={16}/> : <RotateCcw size={16}/>}
                                        </button>
                                    )}
                                  </div>
                              </div>

                              <div className="pt-8 px-6 pb-6 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className={`font-bold text-xl text-slate-900 ${!branch.isActive && 'line-through text-slate-500'}`}>{branch.name}</h4>
                                        <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
                                            <MapPin size={14} className="mt-0.5 flex-shrink-0"/> {branch.address}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                            <Phone size={14} className="flex-shrink-0"/> {branch.phone || 'Sin teléfono'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                                    {branch.id === currentBranchId ? (
                                        <div className="flex items-center text-brand-600 text-sm font-bold bg-brand-50 px-3 py-1.5 rounded-full">
                                            <CheckCircle size={14} className="mr-2" /> Activa Ahora
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400">
                                            {branch.isActive ? 'Inactiva en esta sesión' : 'DESACTIVADA'}
                                        </span>
                                    )}
                                    
                                    {canManageBranches && branch.id !== currentBranchId && branch.isActive && (
                                        <button 
                                            onClick={() => onChangeBranch(branch.id)}
                                            className="text-sm font-bold text-slate-600 hover:text-brand-600 border border-slate-200 hover:border-brand-200 px-4 py-2 rounded-lg transition-colors"
                                        >
                                            Cambiar
                                        </button>
                                    )}
                                </div>
                              </div>

                              {/* Decorative blob */}
                              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${branch.isActive ? (branch.id === currentBranchId ? 'bg-brand-500' : 'bg-slate-400') : 'bg-red-500'}`}></div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* TAX TAB */}
      {activeTab === 'tax' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                 <Percent className="text-brand-600 mr-2"/> Configuración Fiscal
             </h3>
      
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                         <div>
                             <span className="font-bold text-slate-800 block">Habilitar Impuestos</span>
                             <span className="text-xs text-slate-500">Aplicar cálculo automático en ventas</span>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={tempTaxRate > 0} readOnly />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                     </div>
      
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Tasa de Impuesto Global (%)</label>
                         <div className="relative">
                             <input
                                type="number"
                                min="0"
                                max="100"
                                className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500"
                                value={tempTaxRate}
                                onChange={(e) => setTempTaxRate(Number(e.target.value))}
                             />
                             <Percent className="absolute right-3 top-3.5 text-slate-400" size={18}/>
                         </div>
                         <p className="text-xs text-slate-400 mt-1">Ej: 16 para IVA, 8 para Impoconsumo, etc.</p>
                     </div>
                 </div>
      
                 <div className="space-y-4">
                      <div className="bg-brand-50 p-6 rounded-xl border border-brand-100 h-full flex flex-col justify-center">
                          <h4 className="font-bold text-brand-800 mb-2 flex items-center"><Shield size={16} className="mr-2"/> Información</h4>
                          <p className="text-sm text-brand-700 mb-4 leading-relaxed">
                              El porcentaje configurado se aplicará automáticamente sobre el precio base de los productos para calcular el total de la venta.
                          </p>
                          <div className="bg-white p-3 rounded-lg border border-brand-100 text-xs font-mono text-slate-600 shadow-sm">
                              <strong>Cálculo:</strong><br/>
                              Total = Subtotal + (Subtotal * {tempTaxRate}%)
                          </div>
                      </div>
                 </div>
             </div>
      
             <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button onClick={handleSaveTax} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all active:scale-95 flex items-center">
                    <Save size={18} className="mr-2"/> Guardar Cambios
                </button>
             </div>
        </div>
      )}
      
      {/* TEAM TAB */}
      {activeTab === 'team' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
             {/* Header and Trash button */}
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Lista de Empleados</h3>
                    <p className="text-sm text-slate-500">Gestiona usuarios y permisos de acceso</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowUserTrash(!showUserTrash)} 
                        className={`px-4 py-2 rounded-lg font-bold flex items-center border transition-all ${
                            showUserTrash 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {showUserTrash ? <Users size={18} className="mr-2"/> : <Archive size={18} className="mr-2"/>}
                        {showUserTrash ? 'Ver Activos' : 'Papelera'}
                    </button>
                    {!showUserTrash && (
                        <button onClick={() => openUserModal()} className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-brand-700 transition-all active:scale-95">
                            <Plus size={18} className="mr-2"/> Nuevo Empleado
                        </button>
                    )}
                </div>
             </div>
             
             {showUserTrash && (
                  <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 rounded-lg mb-6">
                      <Archive size={16} className="mr-2" /> Empleados desactivados (No pueden iniciar sesión).
                  </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.filter(u => showUserTrash ? !u.isActive : u.isActive).map(user => (
                    <div key={user.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all relative overflow-hidden group ${user.isActive ? 'border-slate-100 hover:border-brand-200' : 'border-red-100 opacity-75'}`}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">{user.name}</div>
                                    <div className="text-xs text-slate-500">{user.role.replace('_', ' ')}</div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {!showUserTrash && (
                                    <button onClick={() => openUserModal(user)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                        <Edit2 size={16}/>
                                    </button>
                                )}
                                <button 
                                    onClick={() => toggleUserStatus(user)}
                                    className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                                >
                                    {user.isActive ? <Trash2 size={16} /> : <RotateCcw size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1 relative z-10">
                            <p className="flex items-center"><Key size={14} className="mr-2 text-slate-400"/> PIN: ****</p>
                            <p className="flex items-center"><Store size={14} className="mr-2 text-slate-400"/> {branches.find(b => b.id === user.branchId)?.name || 'Todas'}</p>
                        </div>
                        
                        {/* Decorative blob */}
                        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${user.isActive ? 'bg-brand-500' : 'bg-red-500'}`}></div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* REGISTERS TAB */}
      {activeTab === 'registers' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {showRegisterTrash ? 'Papelera de Cajas' : 'Cajas Registradoras'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {showRegisterTrash ? 'Restaura cajas eliminadas' : 'Puntos de venta habilitados en la sucursal actual'}
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setShowRegisterTrash(!showRegisterTrash)}
                            className={`px-4 py-2 rounded-lg font-bold flex items-center border transition-all ${
                                showRegisterTrash 
                                ? 'bg-red-50 text-red-600 border-red-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {showRegisterTrash ? <Wallet size={18} className="mr-2"/> : <Archive size={18} className="mr-2"/>}
                            {showRegisterTrash ? 'Ver Activas' : 'Papelera'}
                        </button>
                        {!showRegisterTrash && (
                            <button onClick={() => openRegisterModal()} className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-brand-700 transition-all active:scale-95">
                                <Plus size={18} className="mr-2"/> Nueva Caja
                            </button>
                        )}
                    </div>
               </div>
                
               {showRegisterTrash && (
                  <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 rounded-lg mb-6">
                      <Archive size={16} className="mr-2" /> Cajas desactivadas (No aparecen en el Tablero).
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registers.filter(r => r.branchId === currentBranchId && (showRegisterTrash ? !r.isActive : r.isActive)).map(reg => (
                      <div key={reg.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all relative overflow-hidden group ${reg.isActive ? 'border-slate-100 hover:border-brand-200' : 'border-red-100 opacity-75'}`}>
                          <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${reg.isOpen ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                      <Monitor size={20}/>
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-800">{reg.name}</div>
                                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${reg.isOpen ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                          {reg.isOpen ? 'ABIERTA' : 'CERRADA'}
                                      </div>
                                  </div>
                              </div>
                              <div className="flex gap-1">
                                  {!showRegisterTrash && (
                                     <button onClick={() => openRegisterModal(reg)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                  )}
                                  <button 
                                    onClick={() => toggleRegisterStatus(reg)} 
                                    className={`p-2 rounded-lg transition-colors ${reg.isActive ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                                  >
                                      {reg.isActive ? <Trash2 size={16}/> : <RotateCcw size={16}/>}
                                  </button>
                              </div>
                          </div>

                          <div className="text-sm text-slate-600 space-y-1 relative z-10 mt-2">
                              <p className="flex items-center">
                                <User size={14} className="mr-2 text-slate-400"/>
                                <span className={reg.isOpen ? "font-medium text-slate-800" : "text-slate-400 italic"}>
                                    {reg.isOpen ? (reg.currentUser || 'Usuario Desconocido') : 'Sin asignar'}
                                </span>
                              </p>
                              <p className="flex items-center text-xs text-slate-400">
                                <Wallet size={14} className="mr-2 text-slate-400"/>
                                ID: {reg.id.slice(0, 8)}...
                              </p>
                          </div>

                          {/* Decorative blob */}
                          <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${reg.isActive ? (reg.isOpen ? 'bg-green-500' : 'bg-slate-500') : 'bg-red-500'}`}></div>
                      </div>
                  ))}
                  {registers.filter(r => r.branchId === currentBranchId && (showRegisterTrash ? !r.isActive : r.isActive)).length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                          <Wallet size={32} className="mx-auto mb-2 opacity-50"/>
                          <p>{showRegisterTrash ? 'La papelera está vacía.' : 'No hay cajas activas en esta sucursal.'}</p>
                      </div>
                  )}
               </div>
          </div>
      )}

      {/* CATALOG TAB */}
      {activeTab === 'catalog' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {showCategoryTrash ? 'Papelera de Categorías' : 'Catálogo de Categorías'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {showCategoryTrash ? 'Restaura categorías eliminadas' : 'Gestiona las categorías de tus productos'}
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setShowCategoryTrash(!showCategoryTrash)}
                            className={`px-4 py-2 rounded-lg font-bold flex items-center border transition-all ${
                                showCategoryTrash 
                                ? 'bg-red-50 text-red-600 border-red-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {showCategoryTrash ? <Tag size={18} className="mr-2"/> : <Archive size={18} className="mr-2"/>}
                            {showCategoryTrash ? 'Ver Activas' : 'Papelera'}
                        </button>
                        {!showCategoryTrash && (
                            <button onClick={() => openCategoryModal()} className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-brand-700 transition-all active:scale-95">
                                <Plus size={18} className="mr-2"/> Nueva Categoría
                            </button>
                        )}
                    </div>
               </div>
                
               {showCategoryTrash && (
                  <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 rounded-lg mb-6">
                      <Archive size={16} className="mr-2" /> Categorías desactivadas.
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.filter(c => (showCategoryTrash ? !c.isActive : c.isActive)).map(cat => (
                      <div key={cat.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all relative overflow-hidden group ${cat.isActive ? 'border-slate-100 hover:border-brand-200' : 'border-red-100 opacity-75'}`}>
                          <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-brand-50 text-brand-600`}>
                                      <Tag size={20}/>
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-800">{cat.name}</div>
                                      <div className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 bg-slate-100 text-slate-500">
                                          CATÁLOGO
                                      </div>
                                  </div>
                              </div>
                              <div className="flex gap-1">
                                  {!showCategoryTrash && (
                                     <button onClick={() => openCategoryModal(cat)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                  )}
                                  <button 
                                    onClick={() => toggleCategoryStatus(cat)} 
                                    className={`p-2 rounded-lg transition-colors ${cat.isActive ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                                  >
                                      {cat.isActive ? <Trash2 size={16}/> : <RotateCcw size={16}/>}
                                  </button>
                              </div>
                          </div>

                          <div className="text-sm text-slate-600 space-y-1 relative z-10 mt-2">
                              <p className="flex items-center text-xs text-slate-400">
                                <Tag size={14} className="mr-2 text-slate-400"/>
                                ID: {cat.id.slice(0, 8)}...
                              </p>
                          </div>

                          {/* Decorative blob */}
                          <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${cat.isActive ? 'bg-brand-500' : 'bg-red-500'}`}></div>
                      </div>
                  ))}
                  {categories.filter(c => (showCategoryTrash ? !c.isActive : c.isActive)).length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                          <Tag size={32} className="mx-auto mb-2 opacity-50"/>
                          <p>{showCategoryTrash ? 'La papelera está vacía.' : 'No hay categorías creadas.'}</p>
                      </div>
                  )}
               </div>
          </div>
      )}

      {/* LOYALTY TAB */}
      {activeTab === 'loyalty' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                 <Gift className="text-brand-600 mr-2"/> Configuración de Fidelización
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                         <div>
                             <span className="font-bold text-slate-800 block">Habilitar Programa</span>
                             <span className="text-xs text-slate-500">Permitir acumulación y canje de puntos</span>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={loyaltyEnabled} onChange={e => setLoyaltyEnabled(e.target.checked)} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Puntos por unidad de moneda</label>
                         <div className="flex items-center">
                             <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg p-3 text-slate-500 font-bold">1 $ =</span>
                             <input type="number" className="w-full border border-slate-300 rounded-r-lg p-3 outline-none focus:ring-2 focus:ring-brand-500" 
                                value={pointsPerCurrency} onChange={e => setPointsPerCurrency(Number(e.target.value))} />
                             <span className="ml-2 font-bold text-slate-600">Puntos</span>
                         </div>
                         <p className="text-xs text-slate-400 mt-1">Ej: Si el cliente gasta $10 y el valor es 1, gana 10 puntos.</p>
                     </div>
                 </div>

                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Mínimo para canje</label>
                         <input type="number" className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500" 
                            value={minRedemption} onChange={e => setMinRedemption(Number(e.target.value))} />
                     </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Descuento de Cumpleaños (%)</label>
                         <div className="relative">
                             <input type="number" max="100" className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500" 
                                value={birthdayDiscount} onChange={e => setBirthdayDiscount(Number(e.target.value))} />
                             <Percent className="absolute right-3 top-3.5 text-slate-400" size={18}/>
                         </div>
                     </div>
                 </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button onClick={handleSaveLoyalty} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all active:scale-95 flex items-center">
                    <Save size={18} className="mr-2"/> Guardar Cambios
                </button>
             </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                        <input required type="text" className="w-full border rounded-lg p-3" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                        <input required type="email" className="w-full border rounded-lg p-3" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">PIN Acceso</label>
                            <input required type="text" maxLength={4} className="w-full border rounded-lg p-3 font-mono text-center tracking-widest" value={newUserPin} onChange={e => setNewUserPin(e.target.value)} placeholder="0000" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
                            <select className="w-full border rounded-lg p-3 bg-white" value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)}>
                                <option value={Role.CASHIER}>Cajero</option>
                                <option value={Role.WAITER}>Mesero</option>
                                <option value={Role.CHEF}>Chef</option>
                                <option value={Role.BRANCH_ADMIN}>Gerente</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Sucursal Asignada</label>
                        <select className="w-full border rounded-lg p-3 bg-white" value={newUserBranch} onChange={e => setNewUserBranch(e.target.value)}>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-brand-700">Guardar</button>
                </form>
            </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">{editingRegister ? 'Editar Caja' : 'Nueva Caja'}</h3>
                      <button onClick={() => setIsRegisterModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSaveRegister} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Identificador</label>
                          <input required type="text" className="w-full border rounded-lg p-3" value={registerNameForm} onChange={e => setRegisterNameForm(e.target.value)} placeholder="Ej. Caja Principal" />
                      </div>
                      <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-brand-700">Guardar</button>
                  </form>
              </div>
          </div>
      )}
      
      {/* Category Modal */}
      {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                      <button onClick={() => setIsCategoryModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSaveCategory} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Categoría</label>
                          <input required type="text" className="w-full border rounded-lg p-3" value={categoryNameForm} onChange={e => setCategoryNameForm(e.target.value)} placeholder="Ej. Bebidas" />
                      </div>
                      <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-brand-700">Guardar</button>
                  </form>
              </div>
          </div>
      )}

      {/* Branch Modal */}
      {isBranchModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
                      <button onClick={() => setIsBranchModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSaveBranch} className="space-y-4">
                      <div className="flex items-center gap-4 mb-2">
                          <div className="w-20 h-20 bg-slate-100 rounded-xl border flex items-center justify-center overflow-hidden relative group shrink-0">
                                {newBranchLogo ? <img src={newBranchLogo} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={24} />}
                                <input type="file" accept="image/*" onChange={handleBranchLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700">Logo de Sucursal</label>
                              <p className="text-xs text-slate-400">Click en la imagen para subir.</p>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Sucursal</label>
                          <input required type="text" className="w-full border rounded-lg p-3" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Dirección Física</label>
                          <input required type="text" className="w-full border rounded-lg p-3" value={newBranchAddress} onChange={e => setNewBranchAddress(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                          <input type="tel" className="w-full border rounded-lg p-3" value={newBranchPhone} onChange={e => setNewBranchPhone(e.target.value)} />
                      </div>
                      <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-brand-700">Guardar Sucursal</button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};