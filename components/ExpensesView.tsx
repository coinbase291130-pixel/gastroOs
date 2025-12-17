import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { Plus, Trash2, DollarSign, Calendar, Tag, Filter, X, Save, Edit2, Receipt, Search, Archive, RotateCcw } from 'lucide-react';
import { useNotification } from './NotificationContext';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense }) => {
  const { notify } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.OTHER);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrash, setShowTrash] = useState(false);

  const activeExpenses = expenses.filter(e => e.isActive);
  const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    // Filter by trash status
    if (showTrash && e.isActive) return false;
    if (!showTrash && !e.isActive) return false;

    // Filter by search
    return e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           e.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenModal = (expense?: Expense) => {
      if (expense) {
          setEditingExpense(expense);
          setDescription(expense.description);
          setAmount(expense.amount.toString());
          setCategory(expense.category);
      } else {
          setEditingExpense(null);
          setDescription('');
          setAmount('');
          setCategory(ExpenseCategory.OTHER);
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingExpense) {
        onUpdateExpense({
            ...editingExpense,
            description,
            amount: parseFloat(amount),
            category
        });
    } else {
        const newExpense: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            branchId: 'b1', // Default branch
            description,
            amount: parseFloat(amount),
            category,
            date: new Date(),
            registeredBy: 'Admin', // Should come from context
            isActive: true
        };
        onAddExpense(newExpense);
    }
    
    setIsModalOpen(false);
    setDescription('');
    setAmount('');
    setCategory(ExpenseCategory.OTHER);
    setEditingExpense(null);
  };

  const handleRestore = (expense: Expense) => {
      onUpdateExpense({ ...expense, isActive: true });
      notify('Gasto restaurado correctamente.', 'success');
  };

  const getCategoryColor = (cat: ExpenseCategory) => {
      switch(cat) {
          case ExpenseCategory.RENT: return 'bg-purple-100 text-purple-700';
          case ExpenseCategory.UTILITIES: return 'bg-yellow-100 text-yellow-700';
          case ExpenseCategory.SALARY: return 'bg-brand-100 text-brand-700';
          case ExpenseCategory.INVENTORY: return 'bg-orange-100 text-orange-700';
          case ExpenseCategory.MAINTENANCE: return 'bg-slate-200 text-slate-700';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  const trashCount = expenses.filter(e => !e.isActive).length;

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50 overflow-y-auto pb-24 md:pb-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Gastos Operativos</h2>
            <p className="text-slate-500">Registro de salidas de dinero y pagos.</p>
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto">
            {!showTrash && (
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100 font-bold flex items-center shadow-sm mr-2">
                    Total: ${totalExpenses.toFixed(2)}
                </div>
            )}
            <button 
                onClick={() => setShowTrash(!showTrash)}
                className={`px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-transform active:scale-95 border ${
                    showTrash 
                    ? 'bg-red-50 text-red-600 border-red-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
            >
                {showTrash ? <DollarSign size={18} className="mr-2"/> : <Archive size={18} className="mr-2"/>}
                {showTrash ? 'Ver Activos' : `Papelera (${trashCount})`}
            </button>
            {!showTrash && (
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow transition-transform active:scale-95"
                >
                    <Plus size={18} className="mr-2" /> Registrar Gasto
                </button>
            )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por descripción o categoría..." 
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {showTrash && (
          <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 mb-4 rounded-lg">
              <Archive size={16} className="mr-2" /> Estás viendo la papelera de gastos eliminados.
          </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-400">
                  <Receipt size={48} className="mx-auto mb-4 opacity-30" />
                  <p>{showTrash ? 'La papelera está vacía.' : 'No hay gastos registrados que coincidan.'}</p>
              </div>
          ) : (
              filteredExpenses.map(expense => (
                  <div key={expense.id} className={`bg-white p-5 rounded-xl shadow-sm border border-slate-100 transition-all group relative overflow-hidden ${!expense.isActive ? 'opacity-75' : 'hover:border-red-200'}`}>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                  <DollarSign size={20} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-800 leading-tight">{expense.description}</h3>
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${getCategoryColor(expense.category)}`}>
                                      {expense.category}
                                  </span>
                              </div>
                          </div>
                          <div className="flex gap-1">
                              {!showTrash ? (
                                  <>
                                    <button 
                                        onClick={() => handleOpenModal(expense)}
                                        className="text-slate-400 hover:text-brand-600 p-1.5 hover:bg-brand-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => onDeleteExpense(expense.id)}
                                        className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Mover a Papelera"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                  </>
                              ) : (
                                  <button 
                                      onClick={() => handleRestore(expense)}
                                      className="text-emerald-500 hover:text-emerald-700 p-1.5 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Restaurar"
                                  >
                                      <RotateCcw size={18} />
                                  </button>
                              )}
                          </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-slate-50 pt-3 mt-2 relative z-10">
                          <div className="flex items-center text-slate-500 text-xs">
                              <Calendar size={14} className="mr-1" />
                              {new Date(expense.date).toLocaleDateString()}
                          </div>
                          <span className="font-mono font-bold text-xl text-red-600">
                              -${expense.amount.toFixed(2)}
                          </span>
                      </div>

                      {/* Decorative blob */}
                      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${expense.isActive ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                  </div>
              ))
          )}
      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800">{editingExpense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                          <input required type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-500" 
                              value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej. Pago Luz" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                          <select className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-brand-500"
                              value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>
                              {Object.values(ExpenseCategory).map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Monto ($)</label>
                          <input required type="number" step="0.01" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-500" 
                              value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                      </div>
                      
                      <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-brand-700 flex items-center justify-center">
                          <Save size={18} className="mr-2" /> {editingExpense ? 'Actualizar Gasto' : 'Guardar Gasto'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};