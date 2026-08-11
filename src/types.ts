export type Role = 'owner' | 'manager' | 'cashier';

export type PaymentMethod = 'cash' | 'credit' | 'telebirr' | 'cbe_birr' | 'catering';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export type StockStatus = 'ok' | 'warning' | 'low';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAm: string;
  sortOrder: number;
}

export interface Ingredient {
  id: string;
  nameEn: string;
  nameAm: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAm: string;
  price: number;
  recipe: RecipeIngredient[];
  active: boolean;
}

export interface SaleItem {
  menuItemId: string;
  nameEn: string;
  nameAm: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  clientGeneratedId: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentRef: string;
  customerId: string | null;
  createdAt: string;
  synced: SyncStatus;
  cashierName: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment';
  reason: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: { ingredientId: string; quantity: number; unitCost: number }[];
  totalCost: number;
  createdAt: string;
  notes: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  items: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  createdAt: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  type: 'charge' | 'payment' | 'adjustment';
  amount: number;
  balanceAfter: number;
  description: string;
  saleId: string | null;
  createdAt: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  ethiopianDate: string;
  cashSales: number;
  creditSales: number;
  telebirrSales: number;
  cbeBirrSales: number;
  cateringSales: number;
  totalSales: number;
  totalTax: number;
  expenses: { description: string; amount: number }[];
  totalExpenses: number;
  cashInDrawer: number;
  lowStockItems: string[];
  closedBy: string;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
}