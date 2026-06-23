export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  category: string;
  unit: string;
  minStock: number;
  maxStock: number;
  currentStock: number;
  unitPrice: number;
  supplierId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
  reference?: string;
  supplierId?: string;
  supplierName?: string;
  performedBy: string;
  performedByName: string;
  notes?: string;
  createdAt: Date;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalMovements: number;
  recentMovements: StockMovement[];
}
