
import React, { useMemo, useState } from 'react';
import { Product, Branch } from '../types';
import { QrCode, ExternalLink, Printer, Share2, Smartphone, ChefHat, Copy, Check, ArrowRight } from 'lucide-react';

interface QrMenuViewProps {
  products: Product[];
  currentBranch: Branch | undefined;
}

export const QrMenuView: React.FC<QrMenuViewProps> = ({ products, currentBranch }) => {
  const [copied, setCopied] = useState(false);

  // Generar URL basada en el dominio actual
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gastroos.app';
  const menuUrl = `${origin}/menu/${currentBranch?.id || 'demo'}`;
  
  // URL del servicio de generación de QR
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}&bgcolor=ffffff&color=000000&margin=10`;

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50 overflow-y-auto pb-24 md:pb-8">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Menú Digital QR</h2>
            <p className="text-slate-500 mt-2 max-w-xl">
                Tus clientes pueden escanear este código para ver el menú actualizado en tiempo real sin descargar aplicaciones.
            </p>
        </div>
        <div className="flex flex-wrap gap-3">
             <button 
                onClick={() => window.open(menuUrl, '_blank')}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-bold flex items-center shadow-sm transition-all text-sm"
            >
                <ExternalLink size={18} className="mr-2" /> Ver Menú en Vivo
            </button>
            <button 
                onClick={handlePrint}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-lg transition-transform active:scale-95 text-sm"
            >
                <Printer size={18} className="mr-2" /> Imprimir Diseño
            </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: QR Card & Branding */}
          <div className="lg:col-span-5 space-y-6">
              
              {/* Printable QR Card */}
              <div id="printable-qr" className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden relative print:shadow-none print:border-2 print:border-black print:w-[350px] print:mx-auto">
                  {/* Decorative Header */}
                  <div className="bg-brand-600 h-56 relative overflow-hidden flex flex-col items-center justify-start pt-6">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10"></div>
                       <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                       
                       {/* Brand Info - MOVED UP with padding and mb-auto */}
                       <div className="text-center text-white relative z-10 px-4 mb-auto">
                           <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl inline-flex mb-3 shadow-lg">
                               <ChefHat size={32} className="text-white" />
                           </div>
                           <h3 className="font-bold text-2xl tracking-wide drop-shadow-md">{currentBranch?.name || 'GastroOS'}</h3>
                       </div>
                  </div>

                  {/* Main Content - Increased top padding (pt-40) to push text below the floating QR */}
                  <div className="px-8 pb-10 pt-40 relative text-center">
                      {/* Floating QR Container - z-20 ensures it sits on top of any header text overflow */}
                      <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white p-3 rounded-3xl shadow-2xl shadow-brand-900/10 border-4 border-white z-20">
                          <img 
                            src={qrCodeUrl} 
                            alt="Scan Menu" 
                            className="w-48 h-48 object-contain rounded-2xl mix-blend-multiply" 
                          />
                      </div>

                      <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-6">Escanea el Menú</h2>
                      <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Abre la cámara de tu celular y apunta al código para ver nuestros platos.</p>
                      
                      <div className="flex justify-center items-center gap-2 text-xs font-mono text-slate-400 bg-slate-50 py-2 px-4 rounded-full border border-slate-100 w-full overflow-hidden print:hidden">
                          <span className="truncate flex-1 text-left">{menuUrl}</span>
                          <button onClick={handleCopyLink} className="text-brand-600 hover:text-brand-700 font-bold p-1">
                              {copied ? <Check size={14}/> : <Copy size={14}/>}
                          </button>
                      </div>
                  </div>

                  {/* Footer Decoration */}
                  <div className="h-3 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600"></div>
              </div>

              {/* Instructions / Steps (Hidden on Print) */}
              <div className="bg-slate-100 p-6 rounded-3xl print:hidden">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Smartphone size={20} className="mr-2 text-brand-600"/> Cómo usarlo
                  </h4>
                  <div className="space-y-4">
                      <div className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-900 shadow-sm shrink-0">1</div>
                          <p className="text-sm text-slate-600 mt-1">Imprime la tarjeta de arriba o descárgala para ponerla en acrílicos sobre las mesas.</p>
                      </div>
                      <div className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-900 shadow-sm shrink-0">2</div>
                          <p className="text-sm text-slate-600 mt-1">Tus clientes escanean el código sin necesidad de instalar nada.</p>
                      </div>
                      <div className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-900 shadow-sm shrink-0">3</div>
                          <p className="text-sm text-slate-600 mt-1">Cualquier cambio de precio o producto en el sistema se actualiza al instante.</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Column: Phone Simulator */}
          <div className="lg:col-span-7 flex justify-center items-start pt-4 print:hidden">
              <div className="relative">
                  {/* Phone Case */}
                  <div className="relative bg-slate-900 w-[320px] md:w-[350px] h-[700px] rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-[8px] border-slate-900 overflow-hidden ring-4 ring-slate-200">
                      
                      {/* Notch & Sensors */}
                      <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-20 flex justify-center">
                          <div className="w-32 h-5 bg-black rounded-b-2xl"></div>
                      </div>

                      {/* Screen Content */}
                      <div className="w-full h-full bg-slate-50 overflow-y-auto no-scrollbar pb-20">
                          
                          {/* App Header Simulator */}
                          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-5 pt-10 pb-4 border-b border-slate-100 shadow-sm">
                              <div className="flex items-center justify-between">
                                  <div>
                                      <h5 className="font-bold text-slate-800 text-lg leading-none">{currentBranch?.name}</h5>
                                      <span className="text-[10px] text-brand-600 font-bold tracking-wider uppercase">Menú Digital</span>
                                  </div>
                                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                      <ChefHat size={16} className="text-slate-400" />
                                  </div>
                              </div>
                              {/* Fake Search Bar */}
                              <div className="mt-4 h-10 bg-slate-100 rounded-xl w-full flex items-center px-3">
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                                  <div className="ml-2 h-2 w-24 bg-slate-200 rounded-full"></div>
                              </div>
                          </div>

                          {/* Menu Items */}
                          <div className="p-4 space-y-6">
                              {Object.keys(productsByCategory).length === 0 ? (
                                  <div className="text-center py-20 opacity-50">
                                      <ChefHat size={40} className="mx-auto mb-2 text-slate-300"/>
                                      <p className="text-sm text-slate-400">Menú vacío</p>
                                  </div>
                              ) : (
                                  Object.entries(productsByCategory).map(([category, items]) => (
                                      <div key={category} className="animate-in slide-in-from-bottom-4 duration-700">
                                          <div className="flex items-center gap-2 mb-3">
                                              <h3 className="font-bold text-slate-800 text-lg">{category}</h3>
                                              <div className="h-px bg-slate-200 flex-1"></div>
                                          </div>
                                          
                                          <div className="space-y-3">
                                              {/* Cast items as Product[] to fix unknown property map error */}
                                              {(items as Product[]).map(product => (
                                                  <div key={product.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-3">
                                                      <div className="w-20 h-20 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden relative">
                                                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                      </div>
                                                      <div className="flex-1 flex flex-col justify-between py-0.5">
                                                          <div>
                                                              <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{product.name}</h4>
                                                              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                                                  {product.description || 'Delicioso plato preparado al momento con los mejores ingredientes.'}
                                                              </p>
                                                          </div>
                                                          <div className="flex justify-between items-end mt-1">
                                                              <span className="font-bold text-brand-600 text-sm">${product.price.toFixed(2)}</span>
                                                              <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                                  <ArrowRight size={12} />
                                                              </div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>

                          {/* Branding Footer inside phone */}
                          <div className="py-8 text-center">
                              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Powered by GastroOS</p>
                          </div>
                      </div>
                      
                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-200 rounded-full opacity-50 z-20"></div>
                  </div>
                  
                  {/* Reflection Gloss (CSS Effect) */}
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none rounded-r-[3rem]"></div>
                  
                  <p className="text-center text-slate-400 text-sm mt-6 font-medium">Vista Previa Móvil</p>
              </div>
          </div>
      </div>
    </div>
  );
};
