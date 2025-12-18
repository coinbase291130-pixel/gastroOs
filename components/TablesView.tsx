import React, { useState } from 'react';
import { Table, TableStatus } from '../types';
import { Users, CheckCircle, Clock, Lock, Plus, Save, X, Edit2 } from 'lucide-react';

interface TablesViewProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  onAddTable: (table: Table) => void;
  onUpdateTable: (table: Table) => void;
  isRegisterOpen: boolean;
}

export const TablesView: React.FC<TablesViewProps> = ({ tables, onSelectTable, onAddTable, onUpdateTable, isRegisterOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);

  const handleOpenModal = (table?: Table) => {
      if (table) {
          setEditingId(table.id);
          setNewTableName(table.name);
          setNewTableSeats(table.seats);
      } else {
          setEditingId(null);
          setNewTableName('');
          setNewTableSeats(4);
      }
      setIsModalOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        // Update Logic
        const updatedTable = tables.find(t => t.id === editingId);
        if (updatedTable) {
            onUpdateTable({
                ...updatedTable,
                name: newTableName,
                seats: newTableSeats
            });
        }
    } else {
        // Create Logic
        const newTable: Table = {
            id: `t-${Date.now()}`,
            branchId: 'b1', // Default branch
            name: newTableName,
            seats: newTableSeats,
            status: TableStatus.AVAILABLE
        };
        onAddTable(newTable);
    }
    
    setIsModalOpen(false);
    setNewTableName('');
    setNewTableSeats(4);
  };

  if (!isRegisterOpen) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-500 w-full animate-in fade-in duration-500">
            <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-sm mx-auto border border-slate-200">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 ring-8 ring-red-50">
                    <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tighter">Punto de Venta Bloqueado</h2>
                <p className="max-w-xs mx-auto text-slate-500 font-medium leading-relaxed">
                    La caja se encuentra cerrada. Debes realizar la apertura en el <strong>Tablero</strong> para comenzar a vender. Solo el administrador puede realizar esta operación.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50 pb-24 md:pb-8 relative">
      <div className="mb-8 flex justify-between items-center">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Gestión de Mesas</h2>
            <p className="text-slate-500">Seleccione una mesa para tomar pedido o gestiónelas</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow transition-transform active:scale-95"
        >
            <Plus size={20} className="mr-2" />
            Nueva Mesa
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map(table => {
          const isOccupied = table.status === TableStatus.OCCUPIED;
          
          return (
            <div key={table.id} className="relative group">
                <button
                    onClick={() => onSelectTable(table)}
                    className={`relative h-40 w-full rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all transform hover:scale-105 ${
                        isOccupied 
                        ? 'bg-red-50 border-2 border-red-200 text-red-800' 
                        : 'bg-white border-2 border-emerald-100 text-slate-800 hover:border-emerald-400'
                    }`}
                >
                    <div className="flex justify-between items-start w-full">
                        <span className="font-bold text-lg">{table.name}</span>
                        {isOccupied ? <Clock size={20} /> : <CheckCircle size={20} className="text-emerald-500" />}
                    </div>

                    <div className="flex items-center justify-center flex-1">
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                            isOccupied ? 'border-red-200 bg-red-100' : 'border-slate-100 bg-slate-50'
                        }`}>
                            <Users size={24} className={isOccupied ? 'text-red-400' : 'text-slate-400'} />
                        </div>
                    </div>

                    <div className="flex justify-between items-end w-full text-sm font-medium">
                        <span>{table.seats} Personas</span>
                        <span className={`px-2 py-1 rounded-md text-xs ${
                            isOccupied ? 'bg-red-200 text-red-900' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                            {isOccupied ? 'Ocupada' : 'Disponible'}
                        </span>
                    </div>
                </button>
                {/* Edit Button - Always Visible */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(table); }}
                    className="absolute top-2 right-2 bg-white text-slate-500 p-1.5 rounded-full shadow-md hover:text-blue-600 transition-colors z-10"
                    title="Editar Mesa"
                >
                    <Edit2 size={16} />
                </button>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Mesa' : 'Registrar Mesa'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSaveTable} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Identificador</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500"
                            value={newTableName} 
                            onChange={e => setNewTableName(e.target.value)} 
                            placeholder="Ej. Mesa 10 o Terraza 2" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad (Personas)</label>
                        <input 
                            required 
                            type="number" 
                            min="1"
                            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500"
                            value={newTableSeats} 
                            onChange={e => setNewTableSeats(Number(e.target.value))} 
                        />
                    </div>
                    
                    <button type="submit" className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg flex justify-center items-center">
                        <Save size={18} className="mr-2" /> {editingId ? 'Actualizar' : 'Guardar Mesa'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};