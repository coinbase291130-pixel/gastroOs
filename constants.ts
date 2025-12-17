
import { Branch, Company, Product, Role, User, InventoryItem, Customer, ProductionArea, Table, TableStatus, CashRegister, Supplier, Expense, ExpenseCategory, Category } from "./types";

export const MOCK_COMPANY: Company = {
  id: 'c1',
  name: 'GastroChain Intl.',
  taxId: 'US-999888',
  currency: '$',
  taxRate: 0.16, // 16% Default Tax
  modules: { delivery: true, loyalty: true }
};

export const MOCK_BRANCHES: Branch[] = [
  { 
      id: 'b1', 
      companyId: 'c1', 
      name: 'Parrilla Centro', 
      address: 'Calle Principal 123', 
      isActive: true,
      logoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' 
  },
  { 
      id: 'b2', 
      companyId: 'c1', 
      name: 'Bistro Norte', 
      address: 'Av. Alta 456', 
      isActive: true,
      logoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
  },
];

export const MOCK_REGISTERS: CashRegister[] = [
  { id: 'reg1', branchId: 'b1', name: 'Caja Principal', isOpen: false, isActive: true },
  { id: 'reg2', branchId: 'b1', name: 'Caja Terraza', isOpen: false, isActive: true },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Plato Fuerte', isActive: true },
  { id: 'cat2', name: 'Entradas', isActive: true },
  { id: 'cat3', name: 'Bebidas', isActive: true },
  { id: 'cat4', name: 'Postres', isActive: true },
  { id: 'cat5', name: 'Combos', isActive: true },
];

export const MOCK_TABLES: Table[] = [
  { id: 't1', branchId: 'b1', name: 'Mesa 1', status: TableStatus.AVAILABLE, seats: 4 },
  { id: 't2', branchId: 'b1', name: 'Mesa 2', status: TableStatus.OCCUPIED, seats: 2, currentOrderId: 'ord_existing' },
  { id: 't3', branchId: 'b1', name: 'Mesa 3', status: TableStatus.AVAILABLE, seats: 6 },
  { id: 't4', branchId: 'b1', name: 'Barra 1', status: TableStatus.AVAILABLE, seats: 1 },
  { id: 't5', branchId: 'b1', name: 'Barra 2', status: TableStatus.AVAILABLE, seats: 1 },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin Alicia', email: 'admin@gastro.com', pin: '1111', role: Role.COMPANY_ADMIN, isActive: true },
  { id: 'u2', name: 'Cajero Roberto', email: 'bob@gastro.com', pin: '2222', role: Role.CASHIER, branchId: 'b1', isActive: true },
  { id: 'u3', name: 'Chef Carlos', email: 'chef@gastro.com', pin: '3333', role: Role.CHEF, branchId: 'b1', isActive: true },
  { id: 'u4', name: 'Asador Mike', email: 'mike@gastro.com', pin: '4444', role: Role.GRILL_MASTER, branchId: 'b1', isActive: true },
  { id: 'u5', name: 'Mesera Sofia', email: 'sofia@gastro.com', pin: '5555', role: Role.WAITER, branchId: 'b1', isActive: true },
  { id: 'u6', name: 'Barra Elena', email: 'elena@gastro.com', pin: '6666', role: Role.BARTENDER, branchId: 'b1', isActive: true },
];

// Proveedores
export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Carnes del Sur', contactName: 'Mario Bros', phone: '555-9988', email: 'ventas@carnesdelsur.com', isActive: true },
  { id: 's2', name: 'Distribuidora Central', contactName: 'Luigi', phone: '555-7766', email: 'pedidos@central.com', isActive: true },
  { id: 's3', name: 'Panadería La Espiga', contactName: 'Toad', phone: '555-1122', email: 'pan@espiga.com', isActive: true },
];

// Insumos (Materia Prima) - Con Costos y Proveedores
export const MOCK_INVENTORY: InventoryItem[] = [
  { 
    id: 'inv1', branchId: 'b1', name: 'Carne Molida', unit: 'kg', stock: 50, minStock: 10, maxStock: 100, cost: 8.50,
    suppliers: [
        { supplierId: 's1', cost: 8.50, isPreferred: true },
        { supplierId: 's2', cost: 9.00 }
    ],
    isActive: true
  },
  { 
    id: 'inv2', branchId: 'b1', name: 'Pan Hamburguesa', unit: 'und', stock: 100, minStock: 20, maxStock: 200, cost: 0.50,
    suppliers: [
        { supplierId: 's3', cost: 0.50, isPreferred: true },
        { supplierId: 's2', cost: 0.60 }
    ],
    isActive: true
  },
  { 
    id: 'inv3', branchId: 'b1', name: 'Queso Cheddar', unit: 'kg', stock: 20, minStock: 5, maxStock: 40, cost: 12.00,
    suppliers: [
        { supplierId: 's2', cost: 12.00, isPreferred: true }
    ],
    isActive: true
  },
  { 
    id: 'inv4', branchId: 'b1', name: 'Tomate', unit: 'kg', stock: 4, minStock: 5, maxStock: 20, cost: 2.00, // Low Stock Example
    suppliers: [
        { supplierId: 's2', cost: 2.00, isPreferred: true }
    ],
    isActive: true
  },
  { 
    id: 'inv5', branchId: 'b1', name: 'Lata Cola', unit: 'und', stock: 200, minStock: 24, maxStock: 500, productId: 'p4', cost: 0.80,
    suppliers: [
        { supplierId: 's2', cost: 0.80, isPreferred: true }
    ],
    isActive: true
  }, 
];

// Productos - Con Costos Estimados (En app real se calcula sumando ingredientes)
export const MOCK_PRODUCTS: Product[] = [
  { 
    id: 'p1', companyId: 'c1', name: 'Hamburguesa de la Casa', price: 12.00, cost: 4.50, category: 'Plato Fuerte', isActive: true, imageUrl: 'https://picsum.photos/200/200?random=1',
    productionArea: ProductionArea.GRILL,
    ingredients: [
      { inventoryItemId: 'inv1', quantity: 0.2 }, // 200g carne
      { inventoryItemId: 'inv2', quantity: 1 },
      { inventoryItemId: 'inv3', quantity: 0.05 }
    ]
  },
  { 
    id: 'p2', companyId: 'c1', name: 'Pizza Margarita', price: 10.00, cost: 3.00, category: 'Plato Fuerte', isActive: true, imageUrl: 'https://picsum.photos/200/200?random=2', 
    productionArea: ProductionArea.KITCHEN,
    ingredients: [],
    variants: [{id: 'v1', name: 'Grande', priceModifier: 4}] 
  },
  { 
    id: 'p3', companyId: 'c1', name: 'Ensalada César', price: 8.50, cost: 2.50, category: 'Entradas', isActive: true, imageUrl: 'https://picsum.photos/200/200?random=3',
    productionArea: ProductionArea.KITCHEN,
    ingredients: [{ inventoryItemId: 'inv4', quantity: 0.3 }]
  },
  { 
    id: 'p4', companyId: 'c1', name: 'Cola Zero', price: 2.50, cost: 0.80, category: 'Bebidas', isActive: true, imageUrl: 'https://picsum.photos/200/200?random=4',
    productionArea: ProductionArea.BAR,
    ingredients: [{ inventoryItemId: 'inv5', quantity: 1 }]
  },
  { 
    id: 'p5', companyId: 'c1', name: 'Cheesecake', price: 6.00, cost: 1.50, category: 'Postres', isActive: true, imageUrl: 'https://picsum.photos/200/200?random=5',
    productionArea: ProductionArea.KITCHEN,
    ingredients: []
  },
  // Combo Example
  { 
    id: 'p6', companyId: 'c1', name: 'Combo Hamburguesa', price: 13.50, cost: 5.30, category: 'Combos', isActive: true, imageUrl: 'https://picsum.photos/200/200?random=6',
    productionArea: ProductionArea.KITCHEN,
    ingredients: [],
    isCombo: true,
    comboItems: [
        { productId: 'p1', quantity: 1 }, // 1 Hamburguesa
        { productId: 'p4', quantity: 1 }  // 1 Cola
    ]
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'cust1', name: 'Juan Pérez', phone: '555-0101', points: 120, address: 'Av. Los Olivos 10', isActive: true },
  { id: 'cust2', name: 'María Gómez', phone: '555-0202', points: 50, address: 'Calle Robles 22', isActive: true },
];

export const MOCK_EXPENSES: Expense[] = [
    { id: 'exp1', branchId: 'b1', description: 'Pago Alquiler Local', amount: 1500, category: ExpenseCategory.RENT, date: new Date(new Date().setDate(1)), registeredBy: 'Admin Alicia', isActive: true },
    { id: 'exp2', branchId: 'b1', description: 'Factura Luz', amount: 320, category: ExpenseCategory.UTILITIES, date: new Date(new Date().setDate(5)), registeredBy: 'Admin Alicia', isActive: true },
    { id: 'exp3', branchId: 'b1', description: 'Reparación Licuadora', amount: 80, category: ExpenseCategory.MAINTENANCE, date: new Date(), registeredBy: 'Admin Alicia', isActive: true },
];
