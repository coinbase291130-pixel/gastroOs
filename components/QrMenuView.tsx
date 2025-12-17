import React, { useMemo } from 'react';
import { Product, Branch } from '../types';
import { QrCode, ExternalLink, Printer, Share2, Smartphone, ChefHat } from 'lucide-react';

interface QrMenuViewProps {
  products: Product[];
  currentBranch: Branch | undefined;
}

export const QrMenuView: React.FC<QrMenuViewProps> = ({ products, currentBranch }) => {
  // Generar URL basada en el dominio actual
  // Si estamos en localhost:5173 -> http://localhost:5173/menu/b1
  // Si estamos en vercel -> https://tu-app.vercel.app/menu/b1
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gastroos.app';
  const menuUrl = `${origin}/menu/${currentBranch?.id || 'demo'}`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}&bgcolor=ffffff&color=000000`;

  // Agrupar productos por categoría
  const productsByCategory = useMemo(() => {
    const activeProducts = products.filter(p => p.isActive);
    const groups: Record<string, Product[]> = {};
    
    activeProducts.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    
    return groups;
  }, [products]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50 overflow-y-auto pb-24 md:pb-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Menú Digital QR</h2>
            <p className="text-slate-500">Comparte tu catálogo para que los clientes lo vean en su móvil.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={() => window.open(menuUrl, '_blank')}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold flex items-center shadow-sm transition-all"
            >
                <ExternalLink size={18} className="mr-2" /> Abrir Enlace
            </button>
            <button 
                onClick={handlePrint}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow-lg transition-transform active:scale-95"
            >
                <Printer size={18} className="mr-2" /> Imprimir QR
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: QR Card & Info */}
          <div className="lg:col-span-1 space-y-6">
              {/* QR Display Card */}
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden print:shadow-none print:border-2 print:border-black">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-brand-600"></div>
                  
                  <div className="mb-6">
                      <div className="bg-brand-50 p-4 rounded-full inline-block mb-2">
                        <ChefHat size={32} className="text-brand-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800">{currentBranch?.name || 'Nuestro Menú'}</h3>
                      <p className="text-slate-500 text-sm mt-1">Escanea para ver platos y precios</p>
                  </div>

                  <div className="bg-white p-2 rounded-xl border-2 border-slate-100 shadow-inner mb-6">
                    <img 
                        src={qrCodeUrl} 
                        alt="QR Menú" 
                        className="w-48 h-48 object-contain mix-blend-multiply"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-full overflow-hidden">
                      <Share2 size={12} />
                      <span className="truncate">{menuUrl}</span>
                  </div>
              </div>

              {/* Instructions Card (Hidden on Print) */}
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 print:hidden">
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                      <Smartphone size={18} className="mr-2"/> Modo de Uso
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                      <li>Imprime el código QR y colócalo en las mesas (acrílicos o stickers).</li>
                      <li>Los clientes escanean con la cámara de su celular.</li>
                      <li>Acceden instantáneamente al catálogo actualizado sin descargar apps.</li>
                  </ul>
              </div>
          </div>

          {/* Right Column: Mobile Preview (The Catalog) */}
          <div className="lg:col-span-2 print:hidden">
              <div className="bg-slate-900 p-4 rounded-[2.5rem] shadow-2xl max-w-sm mx-auto border-4 border-slate-800 relative">
                  {/* Phone Notch/Header */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
                  
                  {/* Phone Screen */}
                  <div className="bg-slate-50 rounded-[2rem] overflow-hidden h-[700px] overflow-y-auto custom-scrollbar relative">
                      
                      {/* App Header */}
                      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 p-4 border-b border-slate-100 shadow-sm">
                          <div className="flex items-center justify-center mb-1">
                              <ChefHat size={20} className="text-brand-600 mr-2" />
                              <span className="font-bold text-slate-800">Menú Digital</span>
                          </div>
                          <p className="text-center text-xs text-slate-500">Bienvenido a {currentBranch?.name}</p>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-6 pb-20">
                          {Object.keys(productsByCategory).length === 0 ? (
                              <div className="text-center py-10 text-slate-400">
                                  <p>No hay productos activos para mostrar.</p>
                              </div>
                          ) : (
                              Object.entries(productsByCategory).map(([category, items]) => (
                                  <div key={category}>
                                      <h3 className="font-bold text-lg text-slate-800 mb-3 sticky top-16 bg-slate-50 py-1 z-0 px-1 border-l-4 border-brand-500 pl-2">
                                          {category}
                                      </h3>
                                      <div className="space-y-3">
                                          {items.map(product => (
                                              <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-3">
                                                  <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                  </div>
                                                  <div className="flex-1 flex flex-col justify-between">
                                                      <div>
                                                          <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{product.name}</h4>
                                                          {product.ingredients.length > 0 && (
                                                            <p className="text-[10px] text-slate-400 line-clamp-2">
                                                                {product.ingredients.length} Ingredientes
                                                            </p>
                                                          )}
                                                      </div>
                                                      <div className="font-bold text-brand-600 text-sm">
                                                          ${product.price.toFixed(2)}
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
              <p className="text-center text-slate-400 text-sm mt-4">Vista previa simulada del cliente</p>
          </div>
      </div>
    </div>
  );
};