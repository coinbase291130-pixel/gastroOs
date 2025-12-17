
import React, { useState, useMemo } from 'react';
import { InventoryItem, Product, ProductionArea, RecipeItem, Supplier, ItemSupplierInfo, ComboItem, Category } from '../types';
import { Package, Plus, X, Save, ChefHat, Flame, Beer, Edit, Trash2, RefreshCw, Upload, Image as ImageIcon, ShoppingCart, TrendingDown, Truck, Tag, Users, Archive, RotateCcw, AlertTriangle, Phone, Mail, User, Layers, CheckCircle, Edit2, Search } from 'lucide-react';
import { useNotification } from './NotificationContext';

interface InventoryViewProps {
  products: Product[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  categories: Category[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onAddInventory?: (item: InventoryItem) => void;
  onUpdateInventory?: (item: InventoryItem) => void;
  onAddSupplier?: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
    products, inventory, suppliers, categories,
    onAddProduct, onUpdateProduct, onAddInventory, onUpdateInventory,
    onAddSupplier, onUpdateSupplier
}) => {
  const { notify, confirm } = useNotification();
  const [viewMode, setViewMode] = useState<'products' | 'inventory' | 'suppliers'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showProductTrash, setShowProductTrash] = useState(false);
  const [showSupplierTrash, setShowSupplierTrash] = useState(false);
  const [showInventoryTrash, setShowInventoryTrash] = useState(false);
  
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
  const [formComboItems, setFormComboItems] = useState<ComboItem[]>([]);
  const [formIsCombo, setFormIsCombo] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState<string>('');

  // Supplier Form State
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  // Inventory Item Form State
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [invName, setInvName] = useState('');
  const [invUnit, setInvUnit] = useState('');
  const [invStock, setInvStock] = useState(0);
  const [invCost, setInvCost] = useState(0);
  const [invMinStock, setInvMinStock] = useState(0);
  const [invMaxStock, setInvMaxStock] = useState(0);
  const [invSuppliers, setInvSuppliers] = useState<ItemSupplierInfo[]>([]);

  const [purchaseOrders, setPurchaseOrders] = useState<Record<string, { quantity: number, supplierId: string, cost: number }>>({});

  // --- FILTER LOGIC ---
  const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showProductTrash ? !p.isActive : p.isActive;
      return matchesSearch && matchesStatus;
  });

  const filteredInventory = inventory.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showInventoryTrash ? !i.isActive : i.isActive;
      return matchesSearch && matchesStatus;
  });

  const filteredSuppliers = suppliers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showSupplierTrash ? !s.isActive : s.isActive;
      return matchesSearch && matchesStatus;
  });
  
  const handleOpenProductModal = (product?: Product) => {
      if (product) {
          setEditingProductId(product.id);
          setFormName(product.name);
          setFormPrice(product.price.toString());
          setFormCategory(product.category);
          setFormArea(product.productionArea);
          setFormIngredients(product.ingredients || []);
          setFormComboItems(product.comboItems || []);
          setFormIsCombo(!!product.isCombo);
          setFormImageUrl(product.imageUrl || '');
      } else {
          setEditingProductId(null);
          setFormName('');
          setFormPrice('');
          setFormCategory('');
          setFormArea(ProductionArea.KITCHEN);
          setFormIngredients([]);
          setFormComboItems([]);
          setFormIsCombo(false);
          setFormImageUrl('');
      }
      setIsProductModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate cost based on type
    let calculatedCost = 0;
    if (formIsCombo) {
        calculatedCost = formComboItems.reduce((sum, item) => {
            const p = products.find(prod => prod.id === item.productId);
            return sum + (p ? p.cost * item.quantity : 0);
        }, 0);
    } else {
        // Cost calc for standard product could be implemented here based on inventory costs
        // For now we keep the existing logic or default to 0 if new
        calculatedCost = editingProductId ? (products.find(p=>p.id === editingProductId)?.cost || 0) : 0;
    }

    const productData: Product = {
        id: editingProductId || Math.random().toString(36).substr(2, 9),
        companyId: 'c1',
        name: formName,
        price: parseFloat(formPrice),
        category: formCategory,
        productionArea: formArea,
        ingredients: formIsCombo ? [] : formIngredients,
        comboItems: formIsCombo ? formComboItems : [],
        isCombo: formIsCombo,
        isActive: true, 
        imageUrl: formImageUrl || `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
        cost: calculatedCost
    };

    if (editingProductId) {
        const original = products.find(p => p.id === editingProductId);
        if (original) productData.isActive = original.isActive;
        onUpdateProduct(productData);
    } else {
        onAddProduct(productData);
    }
    setIsProductModalOpen(false);
  };

  const handleDeactivateProduct = async (product: Product) => {
      const confirmed = await confirm({
          title: 'Desactivar Producto',
          message: `¿Mover "${product.name}" a la papelera? Dejará de aparecer en el TPV.`,
          type: 'warning',
          confirmText: 'Mover a Papelera'
      });
      
      if (confirmed) {
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
          isActive: true
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

  const toggleSupplierStatus = async (supplier: Supplier) => {
      if (onUpdateSupplier) {
          if (supplier.isActive) {
              const confirmed = await confirm({
                  title: 'Desactivar Proveedor',
                  message: '¿Estás seguro de desactivar este proveedor? Se moverá a la papelera.',
                  type: 'warning'
              });
              
              if (confirmed) {
                  onUpdateSupplier({ ...supplier, isActive: false });
                  notify('Proveedor desactivado.', 'info');
              }
          } else {
              onUpdateSupplier({ ...supplier, isActive: true });
              notify('Proveedor reactivado.', 'success');
          }
      }
  };

  // --- INVENTORY ITEM HANDLERS ---
  const handleOpenInventoryModal = (item?: InventoryItem) => {
      if (item) {
          setEditingInventoryItem(item);
          setInvName(item.name);
          setInvUnit(item.unit);
          setInvStock(item.stock);
          setInvCost(item.cost);
          setInvMinStock(item.minStock);
          setInvMaxStock(item.maxStock || item.minStock * 2);
          setInvSuppliers(item.suppliers || []);
      } else {
          setEditingInventoryItem(null);
          setInvName('');
          setInvUnit('');
          setInvStock(0);
          setInvCost(0);
          setInvMinStock(0);
          setInvMaxStock(0);
          setInvSuppliers([]);
      }
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
      
      let avgCost = invCost;
      const preferred = invSuppliers.find(s => s.isPreferred);
      if (preferred) avgCost = preferred.cost;
      else if (invSuppliers.length > 0) avgCost = invSuppliers[0].cost;

      if (editingInventoryItem && onUpdateInventory) {
          onUpdateInventory({
              ...editingInventoryItem,
              name: invName,
              unit: invUnit,
              stock: invStock, // Usually stock is adjusted via purchase, but direct edit allowed here
              minStock: invMinStock,
              maxStock: invMaxStock,
              suppliers: invSuppliers,
              cost: avgCost
          });
      } else if (onAddInventory) {
          onAddInventory({
              id: Math.random().toString(36).substr(2, 9),
              branchId: 'b1', // Default
              name: invName,
              unit: invUnit,
              stock: invStock,
              minStock: invMinStock,
              maxStock: invMaxStock,
              suppliers: invSuppliers,
              cost: avgCost,
              isActive: true
          });
      }
      setIsInventoryItemModalOpen(false);
  };

  const toggleInventoryStatus = async (item: InventoryItem) => {
      if (onUpdateInventory) {
          if (item.isActive) {
              const confirmed = await confirm({
                  title: 'Desactivar Insumo',
                  message: `¿Mover "${item.name}" a la papelera?`,
                  type: 'warning',
                  confirmText: 'Mover a Papelera'
              });
              
              if (confirmed) {
                  onUpdateInventory({ ...item, isActive: false });
                  notify('Insumo movido a papelera.', 'info');
              }
          } else {
              onUpdateInventory({ ...item, isActive: true });
              notify('Insumo reactivado.', 'success');
          }
      }
  };

  const handleOpenPurchaseModal = () => {
      const newOrders: Record<string, { quantity: number, supplierId: string, cost: number }> = {};
      inventory.forEach(item => {
          if (item.isActive && item.stock <= item.minStock + (item.minStock * 0.2)) {
              const suggestedQty = Math.max(0, (item.maxStock || item.minStock * 2) - item.stock);
              const defaultSupplier = item.suppliers?.find(s => s.isPreferred) || item.suppliers?.find(Boolean);
              
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
                  onUpdateInventory({ ...item, stock: item.stock + order.quantity, cost: order.cost }); // Update cost based on latest purchase
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

          if (field === 'supplierId') {
              const supplierInfo = item.suppliers?.find(s => s.supplierId === value);
              if (supplierInfo) {
                  updates.cost = supplierInfo.cost;
              }
          }

          return { ...prev, [itemId]: { ...currentOrder, ...updates } };
      });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const objectUrl = URL.createObjectURL(file);
          setFormImageUrl(objectUrl);
      }
  };

  // Recipe/Combo helpers
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

  const handleAddComboItem = () => {
      if (products.length > 0) {
          // Prevent adding itself if editing
          const availableProducts = editingProductId ? products.filter(p => p.id !== editingProductId) : products;
          if (availableProducts.length > 0) {
              setFormComboItems([...formComboItems, { productId: availableProducts[0].id, quantity: 1 }]);
          }
      }
  };

  const updateComboItem = (index: number, field: keyof ComboItem, value: any) => {
      const updated = [...formComboItems];
      updated[index] = { ...updated[index], [field]: value };
      setFormComboItems(updated);
  };

  const removeComboItem = (index: number) => {
      setFormComboItems(formComboItems.filter((_, i) => i !== index));
  };

  const getAreaIcon = (area: ProductionArea) => {
      switch(area) {
          case ProductionArea.KITCHEN: return <ChefHat size={14} className="mr-1"/>;
          case ProductionArea.GRILL: return <Flame size={14} className="mr-1"/>;
          case ProductionArea.BAR: return <Beer size={14} className="mr-1"/>;
      }
  };

  const lowStockItems = inventory.filter(i => i.isActive && i.stock <= i.minStock);
  const trashProductsCount = products.filter(p => !p.isActive).length;
  const trashSuppliersCount = suppliers.filter(s => !s.isActive).length;
  const trashInventoryCount = inventory.filter(i => !i.isActive).length;

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50 pb-24 md:pb-8 relative">
       {/* ... Header and Tabs (kept same as before) ... */}
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
            {/* ... other view buttons ... */}
            {viewMode === 'products' && (
                <>
                    <button onClick={() => setShowProductTrash(!showProductTrash)} className={`px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-transform active:scale-95 border ${showProductTrash ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{showProductTrash ? <Package size={18} className="mr-2"/> : <Archive size={18} className="mr-2" />}{showProductTrash ? 'Ver Activos' : `Papelera (${trashProductsCount})`}</button>
                    {!showProductTrash && <button onClick={() => handleOpenProductModal()} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95"><Plus size={18} className="mr-2" /> Nuevo Producto</button>}
                </>
            )}
            {viewMode === 'inventory' && (
                <>
                    <button onClick={() => setShowInventoryTrash(!showInventoryTrash)} className={`px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-transform active:scale-95 border ${showInventoryTrash ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{showInventoryTrash ? <Package size={18} className="mr-2"/> : <Archive size={18} className="mr-2" />}{showInventoryTrash ? 'Activos' : `Papelera (${trashInventoryCount})`}</button>
                    {!showInventoryTrash && <button onClick={() => handleOpenInventoryModal()} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95"><Plus size={18} className="mr-2" /> Nuevo Insumo</button>}
                </>
            )}
             {viewMode === 'suppliers' && (
                <>
                    <button onClick={() => setShowSupplierTrash(!showSupplierTrash)} className={`px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-transform active:scale-95 border ${showSupplierTrash ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><Archive size={18} className="mr-2" />{showSupplierTrash ? 'Activos' : `Papelera (${trashSuppliersCount})`}</button>
                    {!showSupplierTrash && <button onClick={() => handleOpenSupplierModal()} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95"><Plus size={18} className="mr-2" /> Nuevo Proveedor</button>}
                </>
            )}
        </div>
      </div>

       <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6 w-full max-w-2xl">
        {[ { id: 'products', label: 'Menú (Productos)', icon: <ChefHat size={16}/> }, { id: 'inventory', label: 'Almacén (Insumos)', icon: <Package size={16}/> }, { id: 'suppliers', label: 'Proveedores', icon: <Truck size={16}/> } ].map(tab => (
            <button key={tab.id} onClick={() => { setViewMode(tab.id as any); setSearchTerm(''); if (tab.id !== 'products') setShowProductTrash(false); if (tab.id !== 'inventory') setShowInventoryTrash(false); if (tab.id !== 'suppliers') setShowSupplierTrash(false); }} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === tab.id ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>{tab.icon} <span className="hidden sm:inline">{tab.label}</span></button>
        ))}
      </div>

      <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input type="text" placeholder={viewMode === 'products' ? "Buscar producto..." : viewMode === 'inventory' ? "Buscar insumo..." : "Buscar proveedor..."} className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      
      {/* PRODUCTS VIEW */}
      {viewMode === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:border-brand-200 transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <img src={product.imageUrl} alt={product.name} className={`w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-100 ${!product.isActive && 'grayscale opacity-50'}`} />
                                    <div>
                                        <h3 className={`font-bold text-slate-800 leading-tight ${!product.isActive && 'line-through text-slate-500'}`}>{product.name}</h3>
                                        <div className="flex gap-1 mt-1">
                                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{product.category}</span>
                                            {product.isCombo && <span className="text-xs text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">COMBO</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {product.isActive ? (
                                        <>
                                            <button onClick={() => handleOpenProductModal(product)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeactivateProduct(product)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Mover a Papelera"><Trash2 size={18} /></button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleRestoreProduct(product)} className="text-emerald-500 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded transition-colors" title="Restaurar"><RotateCcw size={16} /></button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                    <span className="text-slate-500 text-sm">Precio</span>
                                    <span className="font-mono font-bold text-lg text-slate-800">${product.price.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 flex items-center">{getAreaIcon(product.productionArea)} <span className="ml-1">{product.productionArea}</span></span>
                                </div>

                                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg min-h-[40px]">
                                    {product.isCombo && product.comboItems ? (
                                        <div className="flex flex-wrap gap-1">
                                            {product.comboItems.map((ci, idx) => {
                                                const subP = products.find(p => p.id === ci.productId);
                                                return (<span key={idx} className="bg-brand-100 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded flex items-center font-medium">{ci.quantity}x {subP?.name}</span>);
                                            })}
                                        </div>
                                    ) : product.ingredients.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {product.ingredients.slice(0, 3).map((ing, idx) => {
                                                const invItem = inventory.find(i => i.id === ing.inventoryItemId);
                                                return (<span key={idx} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded flex items-center">{ing.quantity} {invItem?.unit} {invItem?.name}</span>);
                                            })}
                                            {product.ingredients.length > 3 && <span className="text-slate-400 pl-1">+{product.ingredients.length - 3} más</span>}
                                        </div>
                                    ) : (
                                        <span className="italic text-slate-400">Sin receta definida</span>
                                    )}
                                </div>
                            </div>
                             <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-brand-500 pointer-events-none"></div>
                        </div>
              ))}
              {filteredProducts.length === 0 && <div className="col-span-full text-center py-20 text-slate-400"><ChefHat size={48} className="mx-auto mb-4 opacity-30" /><p>{showProductTrash ? 'La papelera está vacía.' : 'No se encontraron productos.'}</p></div>}
          </div>
      )}
      
      {/* INVENTORY VIEW */}
      {viewMode === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.length === 0 ? (
                 <div className="col-span-full text-center py-20 text-slate-400"><Package size={48} className="mx-auto mb-4 opacity-30" /><p>{showInventoryTrash ? 'La papelera está vacía.' : 'No se encontraron insumos.'}</p></div>
              ) : (
                 filteredInventory.map(item => (
                   <div key={item.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all group relative overflow-hidden ${!item.isActive ? 'border-slate-100 opacity-60' : 'border-slate-100 hover:border-brand-200'}`}>
                      <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${item.stock <= item.minStock && item.isActive ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand-600'}`}><Package size={20} /></div>
                              <div><h3 className="font-bold text-slate-800 leading-tight">{item.name}</h3><div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">Unidad: {item.unit}</div></div>
                          </div>
                          <div className="flex gap-1">
                              {!showInventoryTrash && <button onClick={() => handleOpenInventoryModal(item)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar / Gestionar"><Edit2 size={18} /></button>}
                              <button onClick={() => toggleInventoryStatus(item)} className={`p-2 rounded-lg transition-colors ${showInventoryTrash ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} title={showInventoryTrash ? "Restaurar" : "Desactivar"}>{showInventoryTrash ? <RotateCcw size={18}/> : <Trash2 size={18}/>}</button>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 border-t border-slate-50 pt-3 relative z-10">
                           <div><p className="text-[10px] uppercase text-slate-400 font-bold">Stock Actual</p><p className={`text-xl font-bold ${item.stock <= item.minStock && item.isActive ? 'text-red-600' : 'text-slate-800'}`}>{item.stock}</p></div>
                           <div className="text-right"><p className="text-[10px] uppercase text-slate-400 font-bold">Costo Prom.</p><p className="text-xl font-bold text-slate-800">${item.cost.toFixed(2)}</p></div>
                      </div>
                      <div className="space-y-2 relative z-10">
                           <div className="flex justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded"><span>Min: <strong>{item.minStock}</strong></span><span>Max: <strong>{item.maxStock}</strong></span></div>
                           <div className="flex flex-wrap gap-1">
                              {item.suppliers && item.suppliers.length > 0 ? (
                                  item.suppliers.map((s, i) => {
                                      const sName = suppliers.find(sup => sup.id === s.supplierId)?.name.split(' ')[0];
                                      return (<span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex items-center"><Truck size={10} className="mr-1"/> {sName}</span>)
                                  })
                              ) : (<span className="text-[10px] text-slate-400 italic">Sin proveedores</span>)}
                           </div>
                      </div>
                       <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none ${item.stock <= item.minStock && item.isActive ? 'bg-red-500' : 'bg-brand-500'}`}></div>
                   </div>
                 ))
              )}
          </div>
      )}

      {/* SUPPLIERS VIEW */}
      {viewMode === 'suppliers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSuppliers.length === 0 ? (
                      <div className="col-span-full text-center py-20 text-slate-400"><Truck size={48} className="mx-auto mb-4 opacity-30" /><p>{showSupplierTrash ? 'Papelera vacía.' : 'No se encontraron proveedores.'}</p></div>
                  ) : (
                      filteredSuppliers.map(supplier => (
                          <div key={supplier.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all group relative overflow-hidden ${!supplier.isActive ? 'border-slate-100 opacity-60' : 'border-slate-100 hover:border-brand-200'}`}>
                              <div className="flex justify-between items-start mb-4 relative z-10">
                                  <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold"><Truck size={20} /></div>
                                      <div><h3 className="font-bold text-slate-800 leading-tight">{supplier.name}</h3><div className="flex items-center text-xs text-slate-500 mt-1"><User size={12} className="mr-1" />{supplier.contactName}</div></div>
                                  </div>
                                  <div className="flex gap-1">
                                      {!showSupplierTrash && (<button onClick={() => handleOpenSupplierModal(supplier)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>)}
                                      <button onClick={() => toggleSupplierStatus(supplier)} className={`p-2 rounded-lg transition-colors ${showSupplierTrash ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} title={showSupplierTrash ? "Restaurar" : "Desactivar"}>{showSupplierTrash ? <RotateCcw size={18}/> : <Trash2 size={18}/>}</button>
                                  </div>
                              </div>
                              <div className="space-y-2 text-sm text-slate-600 border-t border-slate-50 pt-3 relative z-10">
                                  <div className="flex items-center"><Phone size={14} className="mr-2 text-slate-400" />{supplier.phone}</div>
                                  <div className="flex items-center"><Mail size={14} className="mr-2 text-slate-400" /><span className="truncate">{supplier.email || 'Sin email'}</span></div>
                              </div>
                              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-brand-500 pointer-events-none"></div>
                          </div>
                      ))
                  )}
              </div>
      )}

      {/* --- MODALS --- */}

      {/* PRODUCT MODAL (Updated for Combos) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-800">{editingProductId ? 'Editar Producto' : 'Registrar Nuevo Producto'}</h3>
                    <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
                </div>
                <form onSubmit={handleProductSubmit} className="p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="col-span-1 md:col-span-2 flex items-center gap-4 border-b pb-4 mb-2">
                            <div className="w-24 h-24 bg-slate-100 rounded-xl border flex items-center justify-center overflow-hidden relative group">
                                {formImageUrl ? <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={32} />}
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                {/* Fixed event handler syntax by adding arrow function */}
                                <input required type="text" className="w-full border rounded-lg p-2" value={formName} onChange={(e) => setFormName(e.target.value)} />
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Precio ($)</label>
                            {/* Fixed event handler syntax by adding arrow function */}
                            <input required type="number" step="0.01" className="w-full border rounded-lg p-2" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                            {/* Fixed event handler syntax by adding arrow function */}
                            <select required className="w-full border rounded-lg p-2 bg-white" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {categories.filter(c => c.isActive).map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Área</label>
                            {/* Fixed event handler syntax by adding arrow function */}
                            <select className="w-full border rounded-lg p-2" value={formArea} onChange={(e) => setFormArea(e.target.value as any)}>
                                <option value={ProductionArea.KITCHEN}>Cocina</option>
                                <option value={ProductionArea.BAR}>Barra</option>
                                <option value={ProductionArea.GRILL}>Asador</option>
                            </select>
                         </div>
                     </div>

                     {/* COMBO TOGGLE */}
                     <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                         {/* Fixed event handler syntax by adding arrow function */}
                         <input type="checkbox" id="isCombo" checked={formIsCombo} onChange={(e) => setFormIsCombo(e.target.checked)} className="w-5 h-5 text-brand-600 rounded" />
                         <label htmlFor="isCombo" className="font-bold text-slate-700">Este producto es un Combo</label>
                     </div>

                     {/* INGREDIENTS OR COMBO ITEMS */}
                     <div className="space-y-3">
                         <div className="flex justify-between items-center">
                             <h4 className="font-bold text-slate-800">{formIsCombo ? 'Productos del Combo' : 'Receta / Insumos'}</h4>
                             <button type="button" onClick={formIsCombo ? handleAddComboItem : handleAddIngredient} className="text-sm text-brand-600 font-bold flex items-center hover:underline">
                                 <Plus size={16} className="mr-1"/> {formIsCombo ? 'Agregar Producto' : 'Agregar Insumo'}
                             </button>
                         </div>
                         
                         {formIsCombo ? (
                             // COMBO ITEMS LIST
                             formComboItems.length === 0 ? <p className="text-sm text-slate-400 italic">No hay productos en este combo.</p> :
                             formComboItems.map((item, idx) => (
                                 <div key={idx} className="flex gap-2 items-center bg-brand-50 p-2 rounded-lg">
                                     {/* Fixed event handler syntax by adding arrow function */}
                                     <select required className="flex-1 border rounded p-1 text-sm" value={item.productId} onChange={(e) => updateComboItem(idx, 'productId', e.target.value)}>
                                         {products.filter(p => p.id !== editingProductId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                     </select>
                                     {/* Fixed event handler syntax by adding arrow function */}
                                     <input type="number" min="1" className="w-20 border rounded p-1 text-sm text-center" value={item.quantity} onChange={(e) => updateComboItem(idx, 'quantity', parseInt(e.target.value))} />
                                     <button type="button" onClick={() => removeComboItem(idx)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={16}/></button>
                                 </div>
                             ))
                         ) : (
                             // INGREDIENTS LIST
                             formIngredients.length === 0 ? <p className="text-sm text-slate-400 italic">No hay ingredientes definidos.</p> :
                             formIngredients.map((ing, idx) => {
                                 const invItem = inventory.find(i => i.id === ing.inventoryItemId);
                                 return (
                                     <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg">
                                         {/* Fixed event handler syntax by adding arrow function */}
                                         <select required className="flex-1 border rounded p-1 text-sm" value={ing.inventoryItemId} onChange={(e) => updateIngredient(idx, 'inventoryItemId', e.target.value)}>
                                             {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                                         </select>
                                         {/* Fixed event handler syntax by adding arrow function */}
                                         <input type="number" step="0.01" className="w-20 border rounded p-1 text-sm text-center" value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value))} />
                                         <span className="text-xs text-slate-500 w-10">{invItem?.unit}</span>
                                         <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={16}/></button>
                                     </div>
                                 )
                             })
                         )}
                     </div>

                     <div className="pt-4 border-t flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow flex items-center">
                            <Save size={18} className="mr-2" /> {editingProductId ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
              </div>
        </div>
      )}
      
      {/* ... Supplier Modal ... */}
      {isSupplierModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
               {/* ... */}
                <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800">{editingSupplierId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                      <button onClick={() => setIsSupplierModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSupplierSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                          {/* Fixed event handler syntax by adding arrow function */}
                          <input required type="text" className="w-full border rounded-lg p-2" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contacto</label>
                          {/* Fixed event handler syntax by adding arrow function */}
                          <input required type="text" className="w-full border rounded-lg p-2" value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                              {/* Fixed event handler syntax by adding arrow function */}
                              <input required type="tel" className="w-full border rounded-lg p-2" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                              {/* Fixed event handler syntax by adding arrow function */}
                              <input type="email" className="w-full border rounded-lg p-2" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} />
                          </div>
                      </div>
                      <button type="submit" className="w-full bg-brand-600 text-white font-bold py-2 rounded-lg mt-4 hover:bg-brand-700">Guardar</button>
                  </form>
              </div>
          </div>
      )}

      {/* ... Inventory Item Modal ... */}
      {isInventoryItemModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              {/* ... */}
               <div className="bg-white rounded-2xl w-full max-lg shadow-xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-800">{editingInventoryItem ? `Gestionar: ${editingInventoryItem.name}` : 'Nuevo Insumo'}</h3>
                      <button onClick={() => setIsInventoryItemModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleInventoryItemSubmit} className="p-6 space-y-6">
                       
                       {/* Fields for New Item */}
                       <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
                               <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Insumo</label>
                               {/* Fixed event handler syntax by adding arrow function */}
                               <input required type="text" className="w-full border rounded-lg p-2" value={invName} onChange={(e) => setInvName(e.target.value)} />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de Medida</label>
                               {/* Fixed event handler syntax by adding arrow function */}
                               <input required type="text" className="w-full border rounded-lg p-2" value={invUnit} onChange={(e) => setInvUnit(e.target.value)} placeholder="kg, lt, und" />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Costo Base ($)</label>
                               {/* Fixed event handler syntax by adding arrow function */}
                               <input required type="number" step="0.01" className="w-full border rounded-lg p-2" value={invCost} onChange={(e) => setInvCost(parseFloat(e.target.value))} />
                           </div>
                           {!editingInventoryItem && (
                               <div className="col-span-2">
                                   <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial</label>
                                   {/* Fixed event handler syntax by adding arrow function */}
                                   <input required type="number" className="w-full border rounded-lg p-2" value={invStock} onChange={(e) => setInvStock(parseFloat(e.target.value))} />
                               </div>
                           )}
                       </div>

                       <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Stock Minimo</label>
                              {/* Fixed event handler syntax by adding arrow function */}
                              <input required type="number" className="w-full border rounded-lg p-2" value={invMinStock} onChange={(e) => setInvMinStock(parseInt(e.target.value))} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Stock Maximo</label>
                              {/* Fixed event handler syntax by adding arrow function */}
                              <input required type="number" className="w-full border rounded-lg p-2" value={invMaxStock} onChange={(e) => setInvMaxStock(parseInt(e.target.value))} />
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                           <div className="flex justify-between items-center">
                               <h4 className="font-bold text-slate-700 text-sm">Proveedores Autorizados</h4>
                               <button type="button" onClick={handleAddSupplierToItem} className="text-xs text-brand-600 font-bold hover:underline">Agregar Proveedor</button>
                           </div>
                           {invSuppliers.map((s, idx) => (
                               <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-100">
                                   {/* Fixed event handler syntax by adding arrow function */}
                                   <select className="flex-1 border rounded p-1 text-sm bg-white" value={s.supplierId} onChange={(e) => updateItemSupplier(idx, 'supplierId', e.target.value)}>
                                       {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                                   </select>
                                   <div className="flex items-center">
                                       <span className="text-xs text-slate-400 mr-1">$</span>
                                       {/* Fixed event handler syntax by adding arrow function */}
                                       <input type="number" step="0.01" className="w-20 border rounded p-1 text-sm" value={s.cost} onChange={(e) => updateItemSupplier(idx, 'cost', parseFloat(e.target.value))} placeholder="Costo" />
                                   </div>
                                   <div className="flex items-center" title="Proveedor Preferido">
                                       <input type="radio" name="preferred" checked={s.isPreferred} onChange={() => {
                                           const updated = invSuppliers.map((x, i) => ({ ...x, isPreferred: i === idx }));
                                           setInvSuppliers(updated);
                                       }} className="accent-brand-600 w-4 h-4"/>
                                   </div>
                                   <button type="button" onClick={() => removeItemSupplier(idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                               </div>
                           ))}
                       </div>

                       <div className="flex justify-end pt-4 border-t">
                          <button type="submit" className="bg-brand-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-700">Guardar Cambios</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
       {/* PURCHASE MODAL (Updated for Multiple Suppliers) */}
       {isPurchaseModalOpen && (
           <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                     <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                          <h3 className="text-xl font-bold">Reabastecer Inventario</h3>
                          <button onClick={() => setIsPurchaseModalOpen(false)}><X/></button>
                     </div>
                     <div className="p-6 overflow-y-auto flex-1">
                           <table className="w-full text-sm">
                              <thead>
                                  <tr className="text-slate-500 border-b">
                                      <th className="text-left pb-2 w-1/3">Item</th>
                                      <th className="text-left pb-2 w-1/3">Proveedor</th>
                                      <th className="text-center pb-2 w-20">Cant.</th>
                                      <th className="text-right pb-2 w-24">Costo Unit.</th>
                                      <th className="text-right pb-2 w-24">Total</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {/* Fix unknown property access by casting each val in the map */}
                                  {Object.entries(purchaseOrders).map(([id, val]) => {
                                      const o = val as { quantity: number, supplierId: string, cost: number };
                                      const item = inventory.find(i => i.id === id);
                                      if (!item) return null;
                                      return (
                                          <tr key={id} className="hover:bg-slate-50">
                                              <td className="py-3 font-medium text-slate-800">{item.name}</td>
                                              <td className="py-3">
                                                  {item.suppliers && item.suppliers.length > 0 ? (
                                                      <select 
                                                        className="w-full border rounded p-1.5 text-sm bg-white"
                                                        value={o.supplierId}
                                                        onChange={(e) => handlePurchaseChange(id, 'supplierId', e.target.value)}
                                                      >
                                                          {item.suppliers.map((s, idx) => {
                                                              const sName = suppliers.find(sup => sup.id === s.supplierId)?.name;
                                                              return <option key={idx} value={s.supplierId}>{sName} - ${s.cost}</option>
                                                          })}
                                                      </select>
                                                  ) : (
                                                      <span className="text-red-500 text-xs italic">Sin proveedores</span>
                                                  )}
                                              </td>
                                              <td className="py-3 text-center">
                                                  <input 
                                                    type="number" 
                                                    min="0" 
                                                    className="w-20 border rounded p-1.5 text-center font-bold"
                                                    value={o.quantity}
                                                    onChange={(e) => handlePurchaseChange(id, 'quantity', parseInt(e.target.value))}
                                                  />
                                              </td>
                                              <td className="py-3 text-right text-slate-500">${o.cost.toFixed(2)}</td>
                                              <td className="py-3 text-right font-bold text-slate-800">${(o.quantity * o.cost).toFixed(2)}</td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                           </table>
                     </div>
                     <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-between items-center">
                          <div className="text-sm text-slate-500">
                              Total Estimado: <span className="font-bold text-xl text-slate-800 ml-2">
                                  {/* Fix unknown property access in reduce by specifying sum as number and typing Object.values result */}
                                  ${(Object.values(purchaseOrders) as Array<{ quantity: number, cost: number }>).reduce((sum: number, o) => sum + (o.quantity * o.cost), 0).toFixed(2)}
                              </span>
                          </div>
                          <div className="flex gap-3">
                              <button onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
                              <button onClick={handlePurchaseSubmit} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg">Confirmar Compra</button>
                          </div>
                     </div>
                </div>
           </div>
       )}

    </div>
  );
};
