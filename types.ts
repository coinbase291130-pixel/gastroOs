
// Enums
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  CASHIER = 'CASHIER',
  DRIVER = 'DRIVER',
  CHEF = 'CHEF', // Cocina
  GRILL_MASTER = 'GRILL_MASTER', // Asador
  WAITER = 'WAITER' // Mesero
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  ON_WAY = 'ON_WAY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ItemStatus {
  PENDING = 'PENDING',
  READY = 'READY'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  QR = 'QR',
  MIXED = 'MIXED'
}

export enum ProductionArea {
  KITCHEN = 'COCINA',
  BAR = 'BARRA',
  GRILL = 'ASADOR'
}

export enum TableStatus {
  AVAILABLE = 'DISPONIBLE',
  OCCUPIED = 'OCUPADA'
}

export enum ExpenseCategory {
  RENT = 'ALQUILER',
  UTILITIES = 'SERVICIOS',
  SALARY = 'NÓMINA',
  MAINTENANCE = 'MANTENIMIENTO',
  INVENTORY = 'COMPRA_EXTRA',
  OTHER = 'OTROS'
}

// Entities

export interface LoyaltyConfig {
  enabled: boolean;
  pointsPerCurrency: number; // Cuantos puntos gana por cada $1
  minRedemptionPoints: number;
  birthdayDiscountPercentage: number; // Nuevo: % de descuento (0-100)
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
  currency: string;
  taxRate: number; // Impuesto global (ej: 0.18 o 0.19)
  modules: {
    delivery: boolean;
    loyalty: boolean;
  };
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  address: string;
  phone?: string;
  isActive: boolean;
  logoUrl?: string; // Nuevo: Logo específico de la sucursal para reportes
}

export interface CashRegister {
  id: string;
  branchId: string;
  name: string; // ej: "Caja Principal", "Caja Bar"
  isOpen: boolean;
  currentUserId?: string; // ID del usuario que la tiene abierta
  currentUser?: string; // Nombre
  isActive: boolean; // Added for logical deletion
}

export interface RegisterSession {
  id: string;
  registerId: string;
  userId: string; // Responsable
  userName: string;
  openingAmount: number;
  closingAmount?: number;
  startTime: Date;
  endTime?: Date;
  totalSales: number; // Ventas acumuladas en esta sesión
}

export interface Table {
  id: string;
  branchId: string;
  name: string; // ej: "Mesa 1"
  status: TableStatus;
  seats: number;
  currentOrderId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string; // Se mantiene por registro, pero login es PIN
  pin: string; // PIN de 4 digitos
  role: Role;
  branchId?: string;
  isActive: boolean; 
}

export interface RecipeItem {
  inventoryItemId: string; // ID del insumo
  quantity: number; // Cantidad requerida
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  price: number;
  cost: number; // Costo calculado o manual para reportes
  category: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  productionArea: ProductionArea; // Nueva clasificación
  ingredients: RecipeItem[]; // Receta
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  isActive: boolean; // Added for logical deletion
}

export interface ItemSupplierInfo {
  supplierId: string;
  cost: number; // Costo que ofrece este proveedor
  isPreferred?: boolean;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  name: string; // Nombre del insumo (ej: Tomate, Harina)
  unit: string; // kg, lt, und
  stock: number;
  minStock: number;
  maxStock: number; // Nuevo: Stock máximo para reabastecimiento inteligente
  cost: number; // Costo promedio o del proveedor preferido
  productId?: string; // Opcional: si el insumo es un producto vendible directo
  suppliers?: ItemSupplierInfo[]; // Lista de proveedores que venden este item
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  address?: string;
  email?: string;
  birthDate?: string; // YYYY-MM-DD
  isActive: boolean; // Added for logical deletion
}

export interface CartItem {
  cartId: string;
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  notes?: string;
  status: ItemStatus; // Nuevo: Estado por item para KDS
}

export interface Order {
  id: string;
  branchId: string;
  tableId?: string; // Vinculación a mesa
  type: OrderType;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  totalCost: number; // Costo total para reportes de ganancia
  paymentMethod?: PaymentMethod;
  customerId?: string;
  createdAt: Date;
  readyAt?: Date; // Hora en que cocina terminó
}

export interface Expense {
  id: string;
  branchId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  registeredBy: string; // User Name
  isActive: boolean; // Added for logical deletion
}