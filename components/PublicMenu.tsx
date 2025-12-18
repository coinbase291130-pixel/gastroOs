import React, { useMemo, useState } from 'react';
import { Product, Branch } from '../types';
import { ChefHat, Search, MapPin, Clock, Phone, ChevronRight, Info } from 'lucide-react';

interface PublicMenuProps {
  products: Product[];
  branch: Branch;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({ products, branch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = useMemo(() => {
    const cats = new Set(products.filter(p => p.isActive).map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter(p => {
    if (!p.isActive) return false;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      {/* Header Premium de Sucursal */}
      <div className="bg-slate-900 text-white relative overflow-hidden rounded-b-[2.5rem] shadow-2xl">
         {/* Fondo decorativo animado o degradado */}
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-600/40 via-slate-900 to-slate-950 z-0"></div>
         <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand-500/10 rounded-full blur-[100px]"></div>
         
         <div className="relative z-10 px-6 pt-10 pb-8">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl">
                        {branch.logoUrl ? (
                            <img src={branch.logoUrl} alt="Logo" className="w-8 h-8 object-cover rounded-lg" />
                        ) : (
                            <ChefHat size={32} className="text-brand-500" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight leading-none text-white uppercase">{branch.name}</h1>
                        <div className="flex items-center gap-1.5 mt-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Abierto Ahora</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full backdrop-blur-md shrink-0" title={branch.address}>
                    <MapPin size={14} className="text-brand-500" />
                    <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{branch.address}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full backdrop-blur-md shrink-0" title={branch.businessHours}>
                    <Clock size={14} className="text-brand-500" />
                    <span className="text-xs font-bold text-slate-300">{branch.businessHours || 'Consultar Horario'}</span>
                </div>
                {branch.phone && (
                    <a href={`tel:${branch.phone}`} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full backdrop-blur-md shrink-0">
                        <Phone size={14} className="text-brand-500" />
                        <span className="text-xs font-bold text-slate-300">{branch.phone}</span>
                    </a>
                )}
            </div>

            {/* Buscador Estilo Moderno */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-slate-500 group-focus-within:text-brand-500 transition-colors" size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="¿Buscas algo en especial?" 
                  className="w-full pl-12 pr-4 py-4 bg-white/95 border-none rounded-2xl shadow-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
         </div>
      </div>

      {/* Selector de Categorías (Sticky) */}
      <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-xl py-4 border-b border-slate-200/50">
          <div className="flex space-x-3 overflow-x-auto no-scrollbar px-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap uppercase tracking-widest transition-all duration-300 transform ${
                  selectedCategory === cat 
                    ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/30 scale-105' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
      </div>

      {/* Lista de Productos Estilo Card Premium */}
      <div className="px-6 mt-8 space-y-6 max-w-3xl mx-auto">
          {filteredProducts.length === 0 ? (
              <div className="text-center py-24 text-slate-400 flex flex-col items-center">
                  <Search size={48} className="mb-4 opacity-20" />
                  <p className="font-bold">No encontramos resultados</p>
                  <button onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}} className="mt-4 text-brand-600 font-bold text-sm">Ver todo el menú</button>
              </div>
          ) : (
              filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-all flex flex-col sm:flex-row animate-in slide-in-from-bottom-4 duration-500">
                      <div className="w-full sm:w-40 h-48 sm:h-auto bg-slate-100 flex-shrink-0 relative">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          {product.isCombo && (
                              <div className="absolute top-3 left-3 bg-brand-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg uppercase tracking-widest">
                                  Combo
                              </div>
                          )}
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-black text-xl text-slate-900 leading-tight">{product.name}</h3>
                              </div>
                              <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                                  {product.description || 'Una de nuestras especialidades preparadas hoy por el chef con ingredientes frescos y locales.'}
                              </p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                              <div className="flex flex-col">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio</span>
                                  <span className="text-2xl font-black text-brand-600 tabular-nums">${product.price.toFixed(2)}</span>
                              </div>
                              <button className="bg-slate-100 text-slate-800 p-3 rounded-2xl hover:bg-brand-600 hover:text-white transition-all flex items-center gap-2 group">
                                  <span className="text-xs font-black uppercase tracking-widest">Detalles</span>
                                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                              </button>
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* Footer Branding */}
      <div className="mt-16 text-center px-10">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm">
               <Info size={14} className="text-slate-400" />
               <p className="text-[10px] text-slate-500 font-medium">Los precios mostrados ya incluyen impuestos aplicables.</p>
          </div>
          <p className="mt-8 text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Powered by GastroOS Cloud</p>
      </div>
    </div>
  );
};