import React, { useState } from 'react';
import { Save, Percent, CheckCircle, Users, Monitor, Store, Gift, Plus, Trash2, Edit2, Shield, User, X, Briefcase, Upload, Image as ImageIcon, MapPin, Phone, Lock, Unlock, Ban, Wallet, Archive, RotateCcw } from 'lucide-react';
import { LoyaltyConfig, User as UserType, Role, CashRegister, Branch } from '../types';
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
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  loyaltyConfig, onUpdateLoyalty,
  users, onAddUser, onUpdateUser,
  registers, onAddRegister, onUpdateRegister, onDeleteRegister,
  taxRate, onUpdateTax,
  branches, currentBranchId, onAddBranch, onUpdateBranch, onChangeBranch,
  userRole
}) => {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState<'loyalty' | 'team' | 'registers' | 'tax' | 'branches'>('branches');

  // --- TEAM STATE ---
  const [showUserTrash, setShowUserTrash] = useState(false);

  // --- BRANCH STATE ---
  const [showBranchTrash, setShowBranchTrash] = useState(false);

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

  // --- BRANCH MODAL STATE ---
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchLogo, setNewBranchLogo] = useState('');

  const canManageBranches = userRole === Role.COMPANY_ADMIN || userRole === Role.SUPER_ADMIN;

  // --- HANDLERS ---

  const handleSaveTax = () => {
      onUpdateTax(tempTaxRate / 100);
      notify('Tasa de impuestos actualizada correctamente.');
  };

  const handleSaveLoyalty = () => {
    onUpdateLoyalty({
      enabled: loyaltyEnabled,
      pointsPerCurrency: Number(pointsPerCurrency),
      minRedemptionPoints: Number(minRedemption),
      birthdayDiscountPercentage: Number(birthdayDiscount)
    });
    notify('Configuración de fidelización guardada.');
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
    }
    setIsUserModalOpen(false);
    setNewUserName(''); setNewUserEmail(''); setNewUserPin(''); setEditingUser(null);
  };

  const toggleUserStatus = (user: UserType) => {
      if (onUpdateUser) {
          const action = user.isActive ? 'desactivar' : 'activar';
          const confirmMsg = user.isActive 
            ? `¿Estás seguro de desactivar a ${user.name}? Se moverá a la papelera.` 
            : `¿Estás seguro de restaurar a ${user.name}?`;

          if (confirm(confirmMsg)) {
              onUpdateUser({ ...user, isActive: !user.isActive });
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
      } else {
           const newReg: CashRegister = {
              id: `reg-${Date.now()}`,
              branchId: currentBranchId,
              name: registerNameForm,
              isOpen: false
          };
          onAddRegister(newReg);
      }
      setIsRegisterModalOpen(false);
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
      } else {
          const newBranch: Branch = {
              id: `b-${Date.now()}`,
              companyId: 'c1', // Fixed for single tenant SaaS for now
              name: newBranchName,
              address: newBranchAddress,
              phone: newBranchPhone,
              isActive: true,
              logoUrl: newBranchLogo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
          };
          onAddBranch(newBranch);
      }
      setIsBranchModalOpen(false);
  };

  const toggleBranchStatus = (branch: Branch) => {
      // Prevent deactivating the CURRENT branch to avoid UI inconsistency
      if (branch.id === currentBranchId && branch.isActive) {
          notify("No puedes desactivar la sucursal actual. Cambia de sucursal primero.", "error");
          return;
      }

      if (branch.isActive) {
          if (confirm(`¿Desactivar la sucursal "${branch.name}"? Se moverá a la papelera.`)) {
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

      {/* Tabs */}
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

      {/* TAX CONFIG CONTENT */}
      {activeTab === 'tax' && (
           <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md border border-slate-100 max-w-5xl animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start relative z-10">
                   <div className="md:col-span-1">
                       <h3 className="text-xl font-bold text-slate-800 mb-3">Configuración Fiscal</h3>
                       <p className="text-slate-500 text-sm leading-relaxed mb-6">
                           Define el porcentaje de impuesto global (IVA, VAT, Impoconsumo) aplicable a las ventas.
                       </p>
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-sm flex items-center mb-2">
                                <CheckCircle size={16} className="mr-2"/> Nota Importante
                            </h4>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Este valor se usará para calcular el desglose de impuestos en los recibos y reportes financieros.
                            </p>
                       </div>
                   </div>

                   <div className="md:col-span-2 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200">
                      <label className="block text-sm font-bold text-slate-700 mb-3">Impuesto Global (%)</label>
                      <div className="flex items-center relative mb-6">
                         <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={tempTaxRate}
                            onChange={(e) => setTempTaxRate(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-2xl p-5 pr-12 text-4xl font-bold font-mono text-slate-800 focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all bg-white shadow-sm"
                            placeholder="0"
                         />
                         <Percent className="absolute right-6 text-slate-400" size={32} />
                      </div>
                      
                      <div className="flex justify-end">
                        <button 
                            onClick={handleSaveTax}
                            className="w-full md:w-auto bg-brand-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all active:scale-95 flex items-center justify-center text-lg"
                        >
                            <Save size={20} className="mr-2" /> Guardar Configuración
                        </button>
                      </div>
                   </div>
               </div>
               <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-brand-500 pointer-events-none"></div>
           </div>
      )}

      {/* REGISTERS CONFIG CONTENT */}
      {activeTab === 'registers' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Wallet size={20} className="text-slate-400"/>
                        Cajas en {branches.find(b => b.id === currentBranchId)?.name}
                    </h3>
                    <p className="text-sm text-slate-500">Administra los puntos de cobro.</p>
                </div>
                <button 
                    onClick={() => openRegisterModal()}
                    className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all"
                >
                    <Plus size={18} className="mr-2" /> Nueva Caja
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {registers.filter(r => r.branchId === currentBranchId).length === 0 ? (
                      <p className="text-slate-400 text-sm col-span-full py-12 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">No hay cajas registradas en esta sucursal.</p>
                  ) : (
                      registers.filter(r => r.branchId === currentBranchId).map(reg => (
                          <div key={reg.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:border-brand-200 transition-all group relative overflow-hidden">
                              <div className="flex justify-between items-start mb-4 relative z-10">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${reg.isOpen ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                          <Wallet size={24} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-slate-800">{reg.name}</h4>
                                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${reg.isOpen ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                              {reg.isOpen ? 'Abierta' : 'Cerrada'}
                                          </span>
                                      </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button 
                                        onClick={() => openRegisterModal(reg)}
                                        className="text-slate-400 hover:text-brand-600 p-2 hover:bg-brand-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => onDeleteRegister(reg.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                  </div>
                              </div>
                              
                              <div className="text-xs text-slate-500 border-t pt-3 border-slate-50 flex justify-between items-center relative z-10">
                                  <span>Estado actual</span>
                                  {reg.isOpen ? <div className="flex items-center text-green-600 font-medium"><Unlock size={14} className="mr-1"/> Operativa</div> : <div className="flex items-center text-slate-400"><Lock size={14} className="mr-1"/> Inactiva</div>}
                              </div>

                              {/* Decorative blob */}
                              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${reg.isOpen ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* TEAM CONTENT */}
      {activeTab === 'team' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">
                        {showUserTrash ? 'Papelera de Empleados' : 'Lista de Empleados'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {showUserTrash ? 'Gestiona usuarios desactivados' : 'Gestión de usuarios y accesos'}
                    </p>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setShowUserTrash(!showUserTrash)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center border transition-all ${
                            showUserTrash 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {showUserTrash ? <Users size={18} className="mr-2"/> : <Archive size={18} className="mr-2"/>}
                        {showUserTrash ? 'Ver Activos' : 'Papelera'}
                    </button>
                    {!showUserTrash && (
                        <button 
                            onClick={() => openUserModal()}
                            className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all"
                        >
                            <Plus size={18} className="mr-2" /> Nuevo Empleado
                        </button>
                    )}
                </div>
            </div>

            {showUserTrash && (
                <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 rounded-lg mb-6">
                    <Archive size={16} className="mr-2" /> Usuarios desactivados (Eliminación Lógica).
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.filter(u => showUserTrash ? !u.isActive : u.isActive).map(user => (
                    <div key={user.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all group relative overflow-hidden ${!user.isActive ? 'border-slate-100 opacity-60' : 'border-slate-100 hover:border-brand-200 hover:shadow-md'}`}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-xl border border-slate-200">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-tight text-lg">{user.name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                                        <Shield size={10} className="mr-1"/> {user.role.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {!showUserTrash && (
                                    <button 
                                        onClick={() => openUserModal(user)}
                                        className="text-slate-400 hover:text-brand-600 p-2 hover:bg-brand-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => toggleUserStatus(user)}
                                    className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                    title={user.isActive ? "Desactivar" : "Restaurar"}
                                >
                                    {user.isActive ? <Trash2 size={18} /> : <RotateCcw size={18} />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-3 text-sm text-slate-500 border-t border-slate-50 pt-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Acceso PIN</span>
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">****</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sucursal</span>
                                <span className="font-medium text-slate-700">{branches.find(b => b.id === user.branchId)?.name || 'Global'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className={`w-full text-center text-xs py-1 rounded-md font-bold ${user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {user.isActive ? 'CUENTA ACTIVA' : 'DESACTIVADO'}
                                </span>
                            </div>
                        </div>

                         {/* Decorative blob */}
                         <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${user.isActive ? 'bg-brand-500' : 'bg-red-500'}`}></div>
                    </div>
                ))}
            </div>

            {users.filter(u => showUserTrash ? !u.isActive : u.isActive).length === 0 && (
                <div className="text-center py-20 text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                    <p>{showUserTrash ? 'La papelera está vacía.' : 'No hay empleados activos.'}</p>
                </div>
            )}
        </div>
      )}

      {/* LOYALTY CONTENT */}
      {activeTab === 'loyalty' && (
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md border border-slate-100 max-w-5xl animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-6 relative z-10">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Programa de Fidelización</h3>
                <p className="text-sm text-slate-500">Configura como tus clientes ganan y gastan puntos.</p>
            </div>
            <div className="flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                <span className={`mr-3 text-sm font-bold ${loyaltyEnabled ? 'text-green-600' : 'text-slate-400'}`}>
                    {loyaltyEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
                </span>
                <button 
                    onClick={() => setLoyaltyEnabled(!loyaltyEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${loyaltyEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${loyaltyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
          </div>
          
          <div className="space-y-6 opacity-100 transition-opacity relative z-10">
            <div className={`grid grid-cols-2 gap-6 ${!loyaltyEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Puntos por $1</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={pointsPerCurrency}
                            onChange={(e) => setPointsPerCurrency(Number(e.target.value))}
                            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <span className="absolute right-3 top-3 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">PTS</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Mínimo para Canje</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={minRedemption}
                            onChange={(e) => setMinRedemption(Number(e.target.value))}
                            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                         <span className="absolute right-3 top-3 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">PTS</span>
                    </div>
                </div>
            </div>

            <div className={`${!loyaltyEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="block text-sm font-bold text-slate-700 mb-2">Descuento Cumpleañero</label>
              <div className="flex items-center">
                 <input 
                    type="range" 
                    min="0"
                    max="100"
                    value={birthdayDiscount}
                    onChange={(e) => setBirthdayDiscount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 mr-4"
                 />
                 <div className="w-20 text-right font-bold text-brand-600 text-lg">{birthdayDiscount}%</div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Este descuento aparecerá disponible automáticamente en el TPV si es el cumpleaños del cliente.</p>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <button 
                    onClick={handleSaveLoyalty}
                    className="w-full bg-brand-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all flex items-center justify-center"
                >
                    <Save size={18} className="mr-2" /> Guardar Configuración
                </button>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-brand-500 pointer-events-none"></div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4 text-slate-800">{editingUser ? 'Editar Empleado' : 'Registrar Empleado'}</h3>
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                        <input required type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                        <input required type="email" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">PIN de Acceso (4 dígitos)</label>
                        <input required type="text" maxLength={4} pattern="\d{4}" className="w-full border rounded-xl p-3 font-mono text-center tracking-widest text-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newUserPin} onChange={e => setNewUserPin(e.target.value)} placeholder="0000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
                            <select 
                                className="w-full border rounded-xl p-3 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value as Role)}
                            >
                                <option value={Role.CASHIER}>Cajero</option>
                                <option value={Role.CHEF}>Cocinero</option>
                                <option value={Role.BRANCH_ADMIN}>Gerente Sucursal</option>
                                <option value={Role.DRIVER}>Repartidor</option>
                                <option value={Role.WAITER}>Mesero</option>
                                <option value={Role.COMPANY_ADMIN}>Admin General</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Sucursal</label>
                            <select 
                                className="w-full border rounded-xl p-3 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                                value={newUserBranch}
                                onChange={(e) => setNewUserBranch(e.target.value)}
                            >
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors shadow-lg">{editingUser ? 'Guardar Cambios' : 'Registrar'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Add/Edit Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-0 overflow-hidden animate-in zoom-in duration-200">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold">{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
                    <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleSaveBranch} className="p-6 space-y-5">
                    
                    {/* Logo Upload */}
                    <div className="flex items-center gap-5 border-b border-slate-100 pb-5">
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-slate-200 border-dashed flex items-center justify-center overflow-hidden relative group hover:border-brand-400 transition-colors">
                            {newBranchLogo ? (
                                <img src={newBranchLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-slate-300" size={32} />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-white text-xs font-bold uppercase tracking-wide">Cambiar</span>
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleBranchLogoUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-800 mb-1">Logo Corporativo</label>
                            <p className="text-xs text-slate-500 mb-3 leading-relaxed">Formato recomendado: PNG o JPG cuadrado (500x500px). Se usará en reportes.</p>
                            <button type="button" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg flex items-center relative transition-colors">
                                <Upload size={14} className="mr-2" /> Subir Imagen
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleBranchLogoUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Comercial</label>
                        <input required type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newBranchName} onChange={e => setNewBranchName(e.target.value)} placeholder="Ej. Restaurante Centro" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Dirección Física</label>
                        <input required type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newBranchAddress} onChange={e => setNewBranchAddress(e.target.value)} placeholder="Calle, Número, Colonia" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                        <input type="tel" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newBranchPhone} onChange={e => setNewBranchPhone(e.target.value)} placeholder="(000) 000-0000" />
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-8 pt-4">
                        <button type="button" onClick={() => setIsBranchModalOpen(false)} className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg transition-all">{editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800">{editingRegister ? 'Editar Caja' : 'Nueva Caja'}</h3>
                      <button onClick={() => setIsRegisterModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSaveRegister} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Caja</label>
                          <input required type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none" 
                              value={registerNameForm} onChange={e => setRegisterNameForm(e.target.value)} placeholder="Ej. Caja Principal" />
                      </div>
                      
                      <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-brand-700 flex items-center justify-center">
                          <Save size={18} className="mr-2" /> {editingRegister ? 'Guardar Cambios' : 'Crear Caja'}
                      </button>
                  </form>
             </div>
          </div>
      )}
    </div>
  );
};