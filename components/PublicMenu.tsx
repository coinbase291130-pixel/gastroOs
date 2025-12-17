import React, { useMemo, useState } from 'react';
import { Product, Branch } from '../types';
import { ChefHat, Search, MapPin, Clock, Phone } from 'lucide-react';

interface PublicMenuProps {
  products: Product[];
  branch: Branch;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({ products, branch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(products.filter(p => p.isActive).map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtrado
  const filteredProducts = products.filter(p => {
    if (!p.isActive) return false;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      {/* Hero / Header de la Sucursal */}
      <div className="bg-slate-900 text-white pb-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-600/20 to-slate-900 z-0"></div>
         
         <div className="relative z-10 px-6 pt-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-600 p-2.5 rounded-xl shadow-lg shadow-brand-900/50">
                    <ChefHat size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">{branch.name}</h1>
                    <p className="text-xs text-slate-400">Menú Digital</p>
                </div>
            </div>

            <div className="space-y-2 text-sm text-slate-300 mb-6 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-brand-500 mt-0.5 shrink-0" />
                    <span className="leading-tight">{branch.address}</span>
                </div>
                {branch.phone && (
                    <div className="flex items-center gap-2">
                        <Phone size={16} className="text-brand-500 shrink-0" />
                        <span>{branch.phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-brand-500 shrink-0" />
                    <span>Abierto hoy hasta las 11:00 PM</span>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="¿Qué se te antoja hoy?" 
                  className="w-full pl-12 pr-4 py-3 bg-white text-slate-800 rounded-xl shadow-lg border-none focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
         </div>
      </div>

      {/* Categorías Sticky */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm py-4 border-b border-slate-200/50 shadow-sm">
          <div className="flex space-x-2 overflow-x-auto no-scrollbar px-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-200' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
      </div>

      {/* Lista de Productos */}
      <div className="px-4 mt-6 space-y-4 max-w-2xl mx-auto">
          {filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                  <p>No encontramos productos con esa búsqueda.</p>
              </div>
          ) : (
              filteredProducts.map(product => (
                  <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 animate-in slide-in-from-bottom-2 duration-500">
                      <div className="w-24 h-24 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden relative">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-slate-800 leading-tight mb-1">{product.name}</h3>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                  {product.description || product.ingredients.length + ' Ingredientes seleccionados por el chef.'}
                              </p>
                          </div>
                          <div className="flex justify-between items-end mt-2">
                              <span className="font-bold text-lg text-brand-600">${product.price.toFixed(2)}</span>
                              <button className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors">
                                  <span className="text-xs font-bold">Ver</span>
                              </button>
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>

      <div className="mt-10 text-center text-slate-400 text-xs px-6">
          <p>Los precios incluyen impuestos. Imágenes referenciales.</p>
          <p className="mt-2 font-bold text-slate-300">Powered by GastroOS</p>
      </div>
    </div>
  );
};