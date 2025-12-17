import React, { useState } from 'react';
import { Customer } from '../types';
import { Users, Search, Plus, Phone, MapPin, Mail, X, Save, Cake, Trash2, Edit2, RotateCcw, Archive } from 'lucide-react';
import { useNotification } from './NotificationContext';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, onAddCustomer, onUpdateCustomer }) => {
  const { notify, confirm } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const filteredCustomers = customers.filter(c => {
      // Filter by trash status first
      if (showTrash && c.isActive) return false;
      if (!showTrash && !c.isActive) return false;

      // Then filter by search properties
      const searchLower = searchTerm.toLowerCase();
      return c.name.toLowerCase().includes(searchLower) || 
             c.phone.includes(searchTerm) ||
             (c.email && c.email.toLowerCase().includes(searchLower)) ||
             (c.address && c.address.toLowerCase().includes(searchLower));
  });

  const handleOpenModal = (customer?: Customer) => {
      if (customer) {
          setEditingId(customer.id);
          setName(customer.name);
          setPhone(customer.phone);
          setEmail(customer.email || '');
          setAddress(customer.address || '');
          setBirthDate(customer.birthDate || '');
      } else {
          setEditingId(null);
          setName('');
          setPhone('');
          setEmail('');
          setAddress('');
          setBirthDate('');
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId && onUpdateCustomer) {
        // Edit Mode
        const original = customers.find(c => c.id === editingId);
        if (original) {
            onUpdateCustomer({
                ...original,
                name, phone, email, address, birthDate
            });
            notify('Cliente actualizado correctamente.', 'success');
        }
    } else {
        // Create Mode
        const newCustomer: Customer = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            phone,
            email,
            address,
            birthDate,
            points: 0,
            isActive: true
        };
        onAddCustomer(newCustomer);
        notify('Cliente registrado con éxito.', 'success');
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setName(''); setPhone(''); setEmail(''); setAddress(''); setBirthDate('');
  };

  const toggleStatus = async (customer: Customer) => {
      if (onUpdateCustomer) {
          if (customer.isActive) {
              const confirmed = await confirm({
                  title: 'Desactivar Cliente',
                  message: `¿Mover "${customer.name}" a la papelera? Dejará de estar disponible para ventas.`,
                  type: 'warning',
                  confirmText: 'Mover a Papelera'
              });

              if (confirmed) {
                  onUpdateCustomer({ ...customer, isActive: false });
                  notify('Cliente movido a papelera.', 'info');
              }
          } else {
              onUpdateCustomer({ ...customer, isActive: true });
              notify('Cliente restaurado correctamente.', 'success');
          }
      }
  };

  // Improved check ignoring potential timezone parsing offset for demo
  const checkBirthday = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date();
      const b = new Date(dateStr + 'T00:00:00'); // Force local time
      return d.getMonth() === b.getMonth() && d.getDate() === b.getDate();
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50 pb-24 md:pb-8 relative">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Clientes & Fidelización</h2>
            <p className="text-slate-500">Gestiona tu base de datos de clientes</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowTrash(!showTrash)}
                className={`px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-transform active:scale-95 border ${
                    showTrash 
                    ? 'bg-red-50 text-red-600 border-red-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
            >
                {showTrash ? <Users size={18} className="mr-2"/> : <Archive size={18} className="mr-2" />}
                {showTrash ? 'Ver Activos' : 'Papelera'}
            </button>
            {!showTrash && (
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95"
                >
                    <Plus size={18} className="mr-2" />
                    Nuevo Cliente
                </button>
            )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, teléfono, email o dirección..." 
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {showTrash && (
          <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 rounded-lg mb-4">
              <Archive size={16} className="mr-2" /> Estás viendo la papelera de reciclaje de clientes.
          </div>
      )}

      {/* Responsive Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
              const isBday = checkBirthday(customer.birthDate);
              return (
                <div key={customer.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-colors relative overflow-hidden ${isBday ? 'border-pink-300 ring-2 ring-pink-100' : 'border-slate-100 hover:border-brand-200'}`}>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg relative">
                                {customer.name.charAt(0)}
                                {isBday && <div className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full p-1"><Cake size={12}/></div>}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    {customer.name}
                                    {isBday && <span className="text-xs text-pink-500 font-bold animate-pulse">¡Cumpleaños!</span>}
                                </h3>
                                <div className="text-xs text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                    {customer.points} Puntos
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {!showTrash && (
                                <button onClick={() => handleOpenModal(customer)} className="text-slate-400 hover:text-brand-600 p-1.5 hover:bg-brand-50 rounded">
                                    <Edit2 size={16} />
                                </button>
                            )}
                            <button 
                                onClick={() => toggleStatus(customer)}
                                className={`p-1.5 rounded ${showTrash ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                title={showTrash ? "Restaurar" : "Eliminar"}
                            >
                                {showTrash ? <RotateCcw size={16} /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600 relative z-10">
                        <div className="flex items-center">
                            <Phone size={14} className="mr-2 text-slate-400" />
                            {customer.phone}
                        </div>
                        <div className="flex items-center">
                            <Mail size={14} className="mr-2 text-slate-400" />
                            {customer.email || 'No registrado'}
                        </div>
                        {customer.birthDate && (
                            <div className="flex items-center">
                                <Cake size={14} className="mr-2 text-slate-400" />
                                {customer.birthDate}
                            </div>
                        )}
                        <div className="flex items-center">
                            <MapPin size={14} className="mr-2 text-slate-400" />
                            <span className="truncate">{customer.address || 'Sin dirección'}</span>
                        </div>
                    </div>

                    {/* Decorative blob */}
                    <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${isBday ? 'bg-pink-500' : 'bg-brand-500'}`}></div>
                </div>
              );
          })}
      </div>

      {filteredCustomers.length === 0 && (
          <div className="text-center py-20 text-slate-400">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p>{showTrash ? 'La papelera está vacía.' : 'No se encontraron clientes.'}</p>
          </div>
      )}

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Cliente' : 'Registrar Cliente'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                        <input required type="text" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500"
                            value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Juan Pérez" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                            <input required type="tel" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500"
                                value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej. 555-1234" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cumpleaños</label>
                            <input type="date" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500"
                                value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email (Opcional)</label>
                        <input type="email" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500"
                            value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dirección (Opcional)</label>
                        <input type="text" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500"
                            value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle Principal 123" />
                    </div>
                    
                    <button type="submit" className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg flex justify-center items-center">
                        <Save size={18} className="mr-2" /> {editingId ? 'Guardar Cambios' : 'Guardar Cliente'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};