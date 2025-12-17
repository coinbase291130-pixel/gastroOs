import React, { useState, useMemo } from 'react';
import { InventoryItem, Product, ProductionArea, RecipeItem, Supplier, ItemSupplierInfo } from '../types';
import { Package, Plus, X, Save, ChefHat, Flame, Beer, Edit, Trash2, RefreshCw, Upload, Image as ImageIcon, ShoppingCart, TrendingDown, Truck, Tag, Users, Archive, RotateCcw, AlertTriangle, Phone, Mail, User, Layers, CheckCircle, Edit2 } from 'lucide-react';
import { useNotification } from './NotificationContext';

interface InventoryViewProps {
  products: Product[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onUpdateInventory?: (item: InventoryItem) => void;
  onAddSupplier?: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
    products, inventory, suppliers, 
    onAddProduct, onUpdateProduct, onUpdateInventory,
    onAddSupplier, onUpdateSupplier
}) => {
  const { notify } = useNotification();
  const [viewMode, setViewMode] = useState<'products' | 'inventory' | 'suppliers'>('products');
  const [showProductTrash, setShowProductTrash] = useState(false); // Toggle for Trash View (Products)
  const [showSupplierTrash, setShowSupplierTrash] = useState(false); // Toggle for Trash View (Suppliers)
  
  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isInventoryItemModalOpen, setIsInventoryItemModalOpen] = useState(false);

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formArea, setFormArea] = useState<ProductionArea>(ProductionArea.KITCHEN);
  const [formIngredients, setFormIngredients] = useState<RecipeItem[]>([]);
  const [formImageUrl, setFormImageUrl] = useState<string>('');

  // Supplier Form State
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  // Inventory Item Form State (For editing min/max/suppliers)
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [invMinStock, setInvMinStock] = useState(0);
  const [invMaxStock, setInvMaxStock] = useState(0);
  const [invSuppliers, setInvSuppliers] = useState<ItemSupplierInfo[]>([]);

  // Purchase Form
  // Structure: { [itemId]: { quantity: number, supplierId: string, cost: number } }
  const [purchaseOrders, setPurchaseOrders] = useState<Record<string, { quantity: number, supplierId: string, cost: number }>>({});

  // Unique Categories for suggestion
  const existingCategories = useMemo(() => {
      const cats = new Set(products.map(p => p.category));
      return Array.from(cats);
  }, [products]);
  
  // --- PRODUCT HANDLERS ---
  const handleOpenProductModal = (product?: Product) => {
      if (product) {
          setEditingProductId(product.id);
          setFormName(product.name);
          setFormPrice(product.price.toString());
          setFormCategory(product.category);
          setFormArea(product.productionArea);
          setFormIngredients(product.ingredients);
          setFormImageUrl(product.imageUrl || '');
      } else {
          setEditingProductId(null);
          setFormName('');
          setFormPrice('');
          setFormCategory('');
          setFormArea(ProductionArea.KITCHEN);
          setFormIngredients([]);
          setFormImageUrl('');
      }
      setIsProductModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
        id: editingProductId || Math.random().toString(36).substr(2, 9),
        companyId: 'c1',
        name: formName,
        price: parseFloat(formPrice),
        category: formCategory,
        productionArea: formArea,
        ingredients: formIngredients,
        isActive: true, 
        imageUrl: formImageUrl || `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
        cost: 0 
    };

    if (editingProductId) {
        // Preserve isActive status if editing
        const original = products.find(p => p.id === editingProductId);
        if (original) productData.isActive = original.isActive;
        onUpdateProduct(productData);
    } else {
        onAddProduct(productData);
    }
    setIsProductModalOpen(false);
  };

  const handleDeactivateProduct = (product: Product) => {
      if (confirm(`¿Mover "${product.name}" a la papelera? Dejará de aparecer en el TPV.`)) {
          onUpdateProduct({ ...product, isActive: false });
          notify('Producto movido a papelera.', 'info');
      }
  };

  const handleRestoreProduct = (product: Product) => {
      onUpdateProduct({ ...product, isActive: true });
      notify(`"${product.name}" restaurado correctamente.`, 'success');
  };

  // --- SUPPLIER HANDLERS ---
  const handleOpenSupplierModal = (supplier?: Supplier) => {
      if (supplier) {
          setEditingSupplierId(supplier.id);
          setSupplierName(supplier.name);
          setSupplierContact(supplier.contactName);
          setSupplierPhone(supplier.phone);
          setSupplierEmail(supplier.email || '');
      } else {
          setEditingSupplierId(null);
          setSupplierName('');
          setSupplierContact('');
          setSupplierPhone('');
          setSupplierEmail('');
      }
      setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onAddSupplier || !onUpdateSupplier) return;

      const supplierData: Supplier = {
          id: editingSupplierId || Math.random().toString(36).substr(2, 9),
          name: supplierName,
          contactName: supplierContact,
          phone: supplierPhone,
          email: supplierEmail,
          isActive: true // Default active
      };

      if (editingSupplierId) {
          const original = suppliers.find(s => s.id === editingSupplierId);
          if (original) supplierData.isActive = original.isActive;
          onUpdateSupplier(supplierData);
      } else {
          onAddSupplier(supplierData);
      }
      setIsSupplierModalOpen(false);
  };

  const toggleSupplierStatus = (supplier: Supplier) => {
      if (onUpdateSupplier) {
          if (supplier.isActive) {
              if (confirm('¿Desactivar este proveedor? Irá a la papelera.')) {
                  onUpdateSupplier({ ...supplier, isActive: false });
                  notify('Proveedor desactivado.', 'info');
              }
          } else {
              onUpdateSupplier({ ...supplier, isActive: true });
              notify('Proveedor reactivado.', 'success');
          }
      }
  };

  // --- INVENTORY ITEM HANDLERS (Edit Min/Max/Suppliers) ---
  const handleOpenInventoryModal = (item: InventoryItem) => {
      setEditingInventoryItem(item);
      setInvMinStock(item.minStock);
      setInvMaxStock(item.maxStock || item.minStock * 2); // Default max if not set
      setInvSuppliers(item.suppliers || []);
      setIsInventoryItemModalOpen(true);
  };

  const handleAddSupplierToItem = () => {
      if (suppliers.length === 0) return notify('Primero registra proveedores.', 'warning');
      setInvSuppliers([...invSuppliers, { supplierId: suppliers[0].id, cost: 0 }]);
  };

  const updateItemSupplier = (index: number, field: keyof ItemSupplierInfo, value: any) => {
      const updated = [...invSuppliers];
      updated[index] = { ...updated[index], [field]: value };
      setInvSuppliers(updated);
  };

  const removeItemSupplier = (index: number) => {
      setInvSuppliers(invSuppliers.filter((_, i) => i !== index));
  };

  const handleInventoryItemSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingInventoryItem || !onUpdateInventory) return;

      // Calculate avg cost based on preferred supplier or average
      let avgCost = editingInventoryItem.cost;
      const preferred = invSuppliers.find(s => s.isPreferred);
      if (preferred) avgCost = preferred.cost;
      else if (invSuppliers.length > 0) avgCost = invSuppliers[0].cost; // simplified

      onUpdateInventory({
          ...editingInventoryItem,
          minStock: invMinStock,
          maxStock: invMaxStock,
          suppliers: invSuppliers,
          cost: avgCost
      });
      setIsInventoryItemModalOpen(false);
  };

  // --- PURCHASE / RESTOCK HANDLERS ---
  const handleOpenPurchaseModal = () => {
      // Pre-fill orders for low stock items
      const newOrders: Record<string, { quantity: number, supplierId: string, cost: number }> = {};
      inventory.forEach(item => {
          if (item.stock <= item.minStock + (item.minStock * 0.2)) { // Alert if close to min (20% buffer)
              const suggestedQty = Math.max(0, (item.maxStock || item.minStock * 2) - item.stock);
              const defaultSupplier = item.suppliers?.find(s => s.isPreferred) || item.suppliers?.[0];
              
              if (suggestedQty > 0) {
                  newOrders[item.id] = {
                      quantity: suggestedQty,
                      supplierId: defaultSupplier?.supplierId || '',
                      cost: defaultSupplier?.cost || item.cost
                  };
              }
          }
      });
      setPurchaseOrders(newOrders);
      setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSubmit = () => {
      if (!onUpdateInventory) return;
      
      let count = 0;
      Object.entries(purchaseOrders).forEach(([invId, orderVal]) => {
          const order = orderVal as { quantity: number, supplierId: string, cost: number };
          if (order.quantity > 0) {
              const item = inventory.find(i => i.id === invId);
              if (item) {
                  onUpdateInventory({ ...item, stock: item.stock + order.quantity });
                  count++;
              }
          }
      });
      notify(`Se han reabastecido ${count} items correctamente.`, 'success');
      setIsPurchaseModalOpen(false);
      setPurchaseOrders({});
  };

  const handlePurchaseChange = (itemId: string, field: 'quantity' | 'supplierId', value: any) => {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return;

      setPurchaseOrders(prev => {
          const currentOrder = prev[itemId] || { quantity: 0, supplierId: '', cost: 0 };
          let updates: any = { [field]: value };

          // If supplier changes, update cost
          if (field === 'supplierId') {
              const supplierInfo = item.suppliers?.find(s => s.supplierId === value);
              if (supplierInfo) {
                  updates.cost = supplierInfo.cost;
              }
          }

          return { ...prev, [itemId]: { ...currentOrder, ...updates } };
      });
  };

  // --- HELPERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const objectUrl = URL.createObjectURL(file);
          setFormImageUrl(objectUrl);
      }
  };

  const handleAddIngredient = () => {
    if (inventory.length > 0) {
        setFormIngredients([...formIngredients, { inventoryItemId: inventory[0].id, quantity: 1 }]);
    }
  };

  const updateIngredient = (index: number, field: keyof RecipeItem, value: any) => {
    const updated = [...formIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setFormIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setFormIngredients(formIngredients.filter((_, i) => i !== index));
  };

  const getAreaIcon = (area: ProductionArea) => {
      switch(area) {
          case ProductionArea.KITCHEN: return <ChefHat size={14} className="mr-1"/>;
          case ProductionArea.GRILL: return <Flame size={14} className="mr-1"/>;
          case ProductionArea.BAR: return <Beer size={14} className="mr-1"/>;
      }
  };

  const lowStockItems = inventory.filter(i => i.stock <= i.minStock);
  const trashProductsCount = products.filter(p => !p.isActive).length;
  const trashSuppliersCount = suppliers.filter(s => !s.isActive).length;

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50 pb-24 md:pb-8 relative">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Inventario y Proveedores</h2>
            <p className="text-slate-500">Gestión de menú, stock e insumos</p>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={handleOpenPurchaseModal}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95 relative"
            >
                <ShoppingCart size={18} className="mr-2" />
                Reabastecer
                {lowStockItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center animate-bounce">
                        {lowStockItems.length}
                    </span>
                )}
            </button>
            {viewMode === 'products' && (
                <>
                    <button 
                        onClick={() => setShowProductTrash(!showProductTrash)}
                        className={`px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-transform active:scale-95 border ${
                            showProductTrash 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Ver productos desactivados"
                    >
                        {showProductTrash ? <Package size={18} className="mr-2"/> : <Archive size={18} className="mr-2" />}
                        {showProductTrash ? 'Ver Activos' : `Papelera (${trashProductsCount})`}
                    </button>
                    {!showProductTrash && (
                        <button 
                            onClick={() => handleOpenProductModal()}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95"
                        >
                            <Plus size={18} className="mr-2" /> Nuevo Producto
                        </button>
                    )}
                </>
            )}
            {viewMode === 'suppliers' && (
                <>
                    <button 
                        onClick={() => setShowSupplierTrash(!showSupplierTrash)}
                        className={`px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-transform active:scale-95 border ${
                            showSupplierTrash 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <Archive size={18} className="mr-2" />
                        {showSupplierTrash ? 'Activos' : `Papelera (${trashSuppliersCount})`}
                    </button>
                    {!showSupplierTrash && (
                        <button 
                            onClick={() => handleOpenSupplierModal()}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95"
                        >
                            <Plus size={18} className="mr-2" /> Nuevo Proveedor
                        </button>
                    )}
                </>
            )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6 w-full max-w-2xl">
        {[
            { id: 'products', label: 'Menú (Productos)', icon: <ChefHat size={16}/> },
            { id: 'inventory', label: 'Almacén (Insumos)', icon: <Package size={16}/> },
            { id: 'suppliers', label: 'Proveedores', icon: <Truck size={16}/> },
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => {
                    setViewMode(tab.id as any);
                    if (tab.id !== 'products') setShowProductTrash(false);
                    if (tab.id !== 'suppliers') setShowSupplierTrash(false);
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    viewMode === tab.id 
                    ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
            </button>
        ))}
      </div>

      {/* CONTENT: PRODUCTS (CARD VIEW) */}
      {viewMode === 'products' && (
          <div>
            {showProductTrash && (
                <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 mb-4 rounded-lg">
                    <Archive size={16} className="mr-2" /> Estás viendo la papelera de reciclaje. Restaura los productos para volver a venderlos.
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.filter(p => showProductTrash ? !p.isActive : p.isActive).length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-400">
                        <Package size={48} className="mx-auto mb-4 opacity-30" />
                        <p>{showProductTrash ? 'La papelera está vacía.' : 'No hay productos activos.'}</p>
                    </div>
                ) : (
                    products.filter(p => showProductTrash ? !p.isActive : p.isActive).map(product => (
                        <div key={product.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:border-brand-200 transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={product.imageUrl} 
                                        alt={product.name} 
                                        className={`w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-100 ${!product.isActive && 'grayscale opacity-50'}`}
                                    />
                                    <div>
                                        <h3 className={`font-bold text-slate-800 leading-tight ${!product.isActive && 'line-through text-slate-500'}`}>
                                            {product.name}
                                        </h3>
                                        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {product.isActive ? (
                                        <>
                                            <button 
                                                onClick={() => handleOpenProductModal(product)} 
                                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeactivateProduct(product)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Mover a Papelera"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => handleRestoreProduct(product)}
                                            className="text-emerald-500 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded transition-colors"
                                            title="Restaurar"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                    <span className="text-slate-500 text-sm">Precio</span>
                                    <span className="font-mono font-bold text-lg text-slate-800">${product.price.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 flex items-center">
                                        {getAreaIcon(product.productionArea)} 
                                        <span className="ml-1">{product.productionArea}</span>
                                    </span>
                                </div>

                                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg min-h-[40px]">
                                    {product.ingredients.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {product.ingredients.slice(0, 3).map((ing, idx) => {
                                                const invItem = inventory.find(i => i.id === ing.inventoryItemId);
                                                return (
                                                    <span key={idx} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded flex items-center">
                                                        {ing.quantity} {invItem?.unit} {invItem?.name}
                                                    </span>
                                                )
                                            })}
                                            {product.ingredients.length > 3 && <span className="text-slate-400 pl-1">+{product.ingredients.length - 3} más</span>}
                                        </div>
                                    ) : (
                                        <span className="italic text-slate-400">Sin receta definida</span>
                                    )}
                                </div>
                            </div>
                            
                             {/* Decorative blob */}
                             <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-brand-500 pointer-events-none"></div>
                        </div>
                    ))
                )}
            </div>
          </div>
      )}

      {/* CONTENT: INVENTORY (CARD VIEW) */}
      {viewMode === 'inventory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.length === 0 ? (
                 <div className="col-span-full text-center py-20 text-slate-400">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No hay insumos registrados.</p>
                 </div>
              ) : (
                 inventory.map(item => (
                   <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:border-brand-200 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${item.stock <= item.minStock ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
                                  <Package size={20} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-800 leading-tight">{item.name}</h3>
                                  <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                      Unidad: {item.unit}
                                  </div>
                              </div>
                          </div>
                          {/* Action Buttons - Matching Clients Style */}
                          <div className="flex gap-1">
                              <button 
                                  onClick={() => handleOpenInventoryModal(item)} 
                                  className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                  title="Editar / Gestionar"
                              >
                                  <Edit2 size={18} />
                              </button>
                          </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3 border-t border-slate-50 pt-3 relative z-10">
                           <div>
                              <p className="text-[10px] uppercase text-slate-400 font-bold">Stock Actual</p>
                              <p className={`text-xl font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-slate-800'}`}>
                                  {item.stock}
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] uppercase text-slate-400 font-bold">Costo Prom.</p>
                              <p className="text-xl font-bold text-slate-800">${item.cost.toFixed(2)}</p>
                           </div>
                      </div>

                      <div className="space-y-2 relative z-10">
                           <div className="flex justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded">
                              <span>Min: <strong>{item.minStock}</strong></span>
                              <span>Max: <strong>{item.maxStock}</strong></span>
                           </div>
                           {/* Suppliers chips */}
                           <div className="flex flex-wrap gap-1">
                              {item.suppliers && item.suppliers.length > 0 ? (
                                  item.suppliers.map((s, i) => {
                                      const sName = suppliers.find(sup => sup.id === s.supplierId)?.name.split(' ')[0];
                                      return (
                                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex items-center">
                                             <Truck size={10} className="mr-1"/> {sName}
                                          </span>
                                      )
                                  })
                              ) : (
                                  <span className="text-[10px] text-slate-400 italic">Sin proveedores</span>
                              )}
                           </div>
                      </div>

                       {/* Decorative blob */}
                       <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${item.stock <= item.minStock ? 'bg-red-500' : 'bg-brand-500'}`}></div>
                   </div>
                 ))
              )}
          </div>
      )}

      {/* CONTENT: SUPPLIERS (CARD VIEW) */}
      {viewMode === 'suppliers' && (
          <div>
              {showSupplierTrash && (
                <div className="bg-red-50 p-3 text-red-700 text-sm font-medium flex items-center justify-center border-b border-red-100 mb-4 rounded-lg">
                    <Archive size={16} className="mr-2" /> Papelera de proveedores.
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers.filter(s => showSupplierTrash ? !s.isActive : s.isActive).length === 0 ? (
                      <div className="col-span-full text-center py-20 text-slate-400">
                          <Truck size={48} className="mx-auto mb-4 opacity-30" />
                          <p>{showSupplierTrash ? 'Papelera vacía.' : 'No hay proveedores registrados.'}</p>
                      </div>
                  ) : (
                      suppliers.filter(s => showSupplierTrash ? !s.isActive : s.isActive).map(supplier => (
                          <div key={supplier.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all group relative overflow-hidden ${!supplier.isActive ? 'border-slate-100 opacity-60' : 'border-slate-100 hover:border-brand-200'}`}>
                              <div className="flex justify-between items-start mb-4 relative z-10">
                                  <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                                          <Truck size={20} />
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-slate-800 leading-tight">{supplier.name}</h3>
                                          <div className="flex items-center text-xs text-slate-500 mt-1">
                                              <User size={12} className="mr-1" />
                                              {supplier.contactName}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex gap-1">
                                      {!showSupplierTrash && (
                                        <button 
                                            onClick={() => handleOpenSupplierModal(supplier)} 
                                            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => toggleSupplierStatus(supplier)}
                                        className={`p-2 rounded-lg transition-colors ${showSupplierTrash ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                        title={showSupplierTrash ? "Restaurar" : "Desactivar"}
                                      >
                                          {showSupplierTrash ? <RotateCcw size={18}/> : <Trash2 size={18}/>}
                                      </button>
                                  </div>
                              </div>
                              
                              <div className="space-y-2 text-sm text-slate-600 border-t border-slate-50 pt-3 relative z-10">
                                  <div className="flex items-center">
                                      <Phone size={14} className="mr-2 text-slate-400" />
                                      {supplier.phone}
                                  </div>
                                  <div className="flex items-center">
                                      <Mail size={14} className="mr-2 text-slate-400" />
                                      <span className="truncate">{supplier.email || 'Sin email'}</span>
                                  </div>
                              </div>

                              {/* Decorative blob */}
                              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-brand-500 pointer-events-none"></div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* ... (Modals remain unchanged) ... */}
      {/* Modal - Product Registration/Edit */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-800">{editingProductId ? 'Editar Producto' : 'Registrar Nuevo Producto'}</h3>
                    <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleProductSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2 flex items-center gap-4 border-b pb-4 mb-2">
                            <div className="w-24 h-24 bg-slate-100 rounded-xl border flex items-center justify-center overflow-hidden relative group">
                                {formImageUrl ? (
                                    <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-slate-300" size={32} />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-white text-xs font-bold">Cambiar</span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Foto del Producto</label>
                                <p className="text-xs text-slate-500">Sube una imagen (Simulado) para mostrar en el TPV.</p>
                                <button type="button" className="mt-2 text-sm text-brand-600 font-semibold flex items-center relative">
                                    <Upload size={14} className="mr-1" /> Seleccionar Archivo
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                    />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
                            <input required type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-500" 
                                value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ej. Tacos al Pastor" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Precio ($)</label>
                            <input required type="number" step="0.01" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-500" 
                                value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                            <input 
                                required 
                                list="category-suggestions"
                                type="text" 
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-500" 
                                value={formCategory} 
                                onChange={e => setFormCategory(e.target.value)} 
                                placeholder="Escribe o selecciona..." 
                            />
                            <datalist id="category-suggestions">
                                {existingCategories.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Área de Producción</label>
                            <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-500 bg-white"
                                value={formArea} onChange={(e) => setFormArea(e.target.value as ProductionArea)}>
                                <option value={ProductionArea.KITCHEN}>Cocina</option>
                                <option value={ProductionArea.BAR}>Barra</option>
                                <option value={ProductionArea.GRILL}>Asador</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">El KDS redirigirá el pedido a esta estación.</p>
                        </div>
                    </div>

                    {/* Recipe Management */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-slate-700 flex items-center">
                                <Package size={18} className="mr-2" />
                                Ingredientes (Receta)
                            </h4>
                            <button type="button" onClick={handleAddIngredient} className="text-sm text-brand-600 font-medium hover:text-brand-800 flex items-center">
                                <Plus size={16} className="mr-1" /> Agregar Insumo
                            </button>
                        </div>
                        
                        {formIngredients.length === 0 ? (
                            <div className="text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400 text-sm">
                                No hay ingredientes configurados. El inventario no se descontará al vender.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formIngredients.map((item, index) => (
                                    <div key={index} className="flex items-end gap-3 bg-slate-50 p-3 rounded-lg">
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-slate-500">Insumo</label>
                                            <select 
                                                className="w-full text-sm border rounded p-1 bg-white"
                                                value={item.inventoryItemId}
                                                onChange={(e) => updateIngredient(index, 'inventoryItemId', e.target.value)}
                                            >
                                                {inventory.map(inv => (
                                                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs font-medium text-slate-500">Cantidad</label>
                                            <input 
                                                type="number" step="0.01" 
                                                className="w-full text-sm border rounded p-1"
                                                value={item.quantity}
                                                onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <button type="button" onClick={() => removeIngredient(index)} className="p-2 text-red-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow flex items-center">
                            <Save size={18} className="mr-2" />
                            {editingProductId ? 'Actualizar Producto' : 'Guardar Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL: SUPPLIER ADD/EDIT */}
      {isSupplierModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800">{editingSupplierId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                      <button onClick={() => setIsSupplierModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <form onSubmit={handleSupplierSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Empresa</label>
                          <input required type="text" className="w-full border rounded-lg p-2" value={supplierName} onChange={e => setSupplierName(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contacto Principal</label>
                          <input required type="text" className="w-full border rounded-lg p-2" value={supplierContact} onChange={e => setSupplierContact(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                              <input required type="tel" className="w-full border rounded-lg p-2" value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                              <input type="email" className="w-full border rounded-lg p-2" value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)} />
                          </div>
                      </div>
                      <button type="submit" className="w-full bg-brand-600 text-white font-bold py-2 rounded-lg mt-4 hover:bg-brand-700">Guardar Proveedor</button>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL: INVENTORY ITEM EDIT (MIN/MAX & SUPPLIERS) */}
      {isInventoryItemModalOpen && editingInventoryItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-800">Gestionar: {editingInventoryItem.name}</h3>
                      <button onClick={() => setIsInventoryItemModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <form onSubmit={handleInventoryItemSubmit} className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Stock Mínimo</label>
                              <input required type="number" min="0" className="w-full border rounded-lg p-2 font-mono" 
                                value={invMinStock} onChange={e => setInvMinStock(parseInt(e.target.value))} />
                              <p className="text-[10px] text-slate-400 mt-1">Alerta al bajar de este nivel.</p>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Stock Máximo</label>
                              <input required type="number" min="0" className="w-full border rounded-lg p-2 font-mono" 
                                value={invMaxStock} onChange={e => setInvMaxStock(parseInt(e.target.value))} />
                              <p className="text-[10px] text-slate-400 mt-1">Tope sugerido para compras.</p>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-bold text-slate-700">Proveedores Asignados</label>
                              <button type="button" onClick={handleAddSupplierToItem} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">+ Asignar</button>
                          </div>
                          {invSuppliers.length === 0 ? (
                              <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded text-center">No tiene proveedores asignados.</p>
                          ) : (
                              <div className="space-y-2">
                                  {invSuppliers.map((sup, idx) => (
                                      <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                          <select 
                                            className="flex-1 text-sm border rounded p-1"
                                            value={sup.supplierId}
                                            onChange={(e) => updateItemSupplier(idx, 'supplierId', e.target.value)}
                                          >
                                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                          </select>
                                          <div className="flex items-center w-24">
                                              <span className="text-slate-400 mr-1">$</span>
                                              <input type="number" step="0.01" className="w-full text-sm border rounded p-1" 
                                                value={sup.cost} onChange={(e) => updateItemSupplier(idx, 'cost', parseFloat(e.target.value))} placeholder="Costo"/>
                                          </div>
                                          <button 
                                            type="button" 
                                            onClick={() => updateItemSupplier(idx, 'isPreferred', !sup.isPreferred)}
                                            className={`p-1.5 rounded ${sup.isPreferred ? 'text-yellow-500 bg-yellow-50' : 'text-slate-300 hover:text-yellow-400'}`}
                                            title="Proveedor Preferido"
                                          >
                                              <Tag size={16} fill={sup.isPreferred ? "currentColor" : "none"}/>
                                          </button>
                                          <button type="button" onClick={() => removeItemSupplier(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                          <button type="submit" className="bg-brand-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-700">Guardar Cambios</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* PURCHASE MODAL (Smart Restock) */}
      {isPurchaseModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800">Reabastecer Inventario</h3>
                          <p className="text-xs text-slate-500">Orden de compra inteligente basada en stock máximo.</p>
                      </div>
                      <button onClick={() => setIsPurchaseModalOpen(false)}><X className="text-slate-400 hover:text-slate-700"/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      {Object.keys(purchaseOrders).length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                              <CheckCircle size={48} className="mx-auto text-green-500 mb-2 opacity-50"/>
                              <p>¡Todo en orden! No hay insumos con stock bajo.</p>
                          </div>
                      ) : (
                          <table className="w-full text-sm">
                              <thead>
                                  <tr className="text-slate-500 border-b bg-slate-50">
                                      <th className="text-left pb-2 pl-2">Item</th>
                                      <th className="text-center pb-2">Niveles</th>
                                      <th className="text-left pb-2">Proveedor</th>
                                      <th className="text-right pb-2">Cantidad</th>
                                      <th className="text-right pb-2 pr-2">Costo Est.</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {Object.entries(purchaseOrders).map(([itemId, orderVal]) => {
                                      const order = orderVal as { quantity: number, supplierId: string, cost: number };
                                      const item = inventory.find(i => i.id === itemId);
                                      if (!item) return null;
                                      
                                      const hasSuppliers = item.suppliers && item.suppliers.length > 0;

                                      return (
                                          <tr key={itemId}>
                                              <td className="py-3 pl-2">
                                                  <div className="font-bold text-slate-700">{item.name}</div>
                                                  <div className="text-xs text-slate-400">Actual: {item.stock} {item.unit}</div>
                                              </td>
                                              <td className="py-3 text-center text-xs text-slate-500">
                                                  Min: {item.minStock}<br/>Max: {item.maxStock}
                                              </td>
                                              <td className="py-3">
                                                  {hasSuppliers ? (
                                                      <select 
                                                        className="w-full border rounded p-1.5 text-xs bg-white"
                                                        value={order.supplierId}
                                                        onChange={(e) => handlePurchaseChange(itemId, 'supplierId', e.target.value)}
                                                      >
                                                          {item.suppliers!.map(s => {
                                                              const sName = suppliers.find(sup => sup.id === s.supplierId)?.name || 'Desc.';
                                                              return <option key={s.supplierId} value={s.supplierId}>{sName} (${s.cost})</option>
                                                          })}
                                                      </select>
                                                  ) : (
                                                      <span className="text-red-400 text-xs italic">Sin proveedor</span>
                                                  )}
                                              </td>
                                              <td className="py-3 text-right">
                                                  <input 
                                                      type="number" min="0" className="w-20 border rounded p-1.5 text-right font-mono"
                                                      value={order.quantity}
                                                      onChange={(e) => handlePurchaseChange(itemId, 'quantity', parseFloat(e.target.value))}
                                                  />
                                              </td>
                                              <td className="py-3 text-right pr-2 font-mono text-slate-700">
                                                  ${(order.quantity * order.cost).toFixed(2)}
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      )}
                  </div>

                  <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-between items-center">
                      <div className="text-sm">
                          <span className="text-slate-500">Total Estimado:</span>
                          <span className="ml-2 font-bold text-lg text-slate-900">
                              ${Object.values(purchaseOrders).reduce<number>((acc, orderVal) => {
                                  const o = orderVal as { quantity: number, supplierId: string, cost: number };
                                  return acc + (o.quantity * o.cost);
                              }, 0).toFixed(2)}
                          </span>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancelar</button>
                          <button 
                            onClick={handlePurchaseSubmit}
                            disabled={Object.keys(purchaseOrders).length === 0}
                            className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 flex items-center disabled:opacity-50"
                          >
                              <Truck size={18} className="mr-2" /> Confirmar Orden
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};