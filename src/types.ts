export type ProductCategory =
  | 'Toutes'
  | 'Pâtisserie'
  | 'Alimentation'
  | 'Boissons'
  | 'Matières Premières'
  | 'Entretien & Hygiène'
  | 'Articles Divers';

export interface Product {
  id: number;
  code: string;
  barcode?: string;
  name: string;
  category: ProductCategory;
  buyPrice: number;   // Prix d'achat unitaire (FCFA)
  sellPrice: number;  // Prix de vente unitaire (FCFA)
  stock: number;      // Quantité en stock
  minStockAlert: number;
  unit: string;       // Unité: 'Unité', 'Sac 25kg', 'Bouteille', etc.
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  buyPrice: number;
  totalAmount: number;
  profit: number;
}

export type PaymentMethod = 'ESPECES' | 'WAVE_MOBILE' | 'MTN_MOMO' | 'ORANGE_MONEY' | 'MOOV_MONEY' | 'AIRTEL_MONEY' | 'CARTE';

export interface Sale {
  id: string;
  ticketNumber: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  changeReturned?: number;
  cashierName?: string;
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  productName: string;
  productCode?: string;
  quantity: number;
  totalCost: number;
  unitCost?: number;
  category?: string;
  notes?: string;
}

export interface BusinessSummary {
  totalSales: number;
  totalProfit: number;
  totalPurchases: number;
  salesCount: number;
  netMarginPercentage: number;
  totalInventoryValueBuy: number;
  totalInventoryValueSell: number;
  lowStockCount: number;
}
