import { Product, Sale, Purchase, BusinessSummary } from '../types';
import { INITIAL_PRODUCTS, INITIAL_PURCHASES, INITIAL_SALES } from '../data/initialProducts';

const STORAGE_KEYS = {
  PRODUCTS: 'delices_maman_products_v2_real',
  SALES: 'delices_maman_sales_v2_real',
  PURCHASES: 'delices_maman_purchases_v2_real',
  APP_SETTINGS: 'delices_maman_settings_v2',
};

// Web Audio synthesizer for tactile sound feedback (Barcode beep and Cash register chime)
class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playScanBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Ignore audio errors
    }
  }

  playCashRegisterChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // High ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second higher ding
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain2.gain.setValueAtTime(0.2, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } catch {
      // Ignore audio errors
    }
  }
}

export const sound = new SoundEffects();

export function loadProducts(): Product[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch (err) {
    console.error('Error loading products from storage:', err);
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products to storage:', err);
  }
}

export function resetToRealCatalog(): Product[] {
  try {
    saveProducts(INITIAL_PRODUCTS);
    return [...INITIAL_PRODUCTS];
  } catch (err) {
    console.error('Error resetting catalog:', err);
    return [...INITIAL_PRODUCTS];
  }
}

export function loadSales(): Sale[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!data) {
      saveSales(INITIAL_SALES);
      return INITIAL_SALES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_SALES;
  } catch (err) {
    console.error('Error loading sales from storage:', err);
    return INITIAL_SALES;
  }
}

export function saveSales(sales: Sale[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (err) {
    console.error('Error saving sales to storage:', err);
  }
}

export function loadPurchases(): Purchase[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (!data) {
      savePurchases(INITIAL_PURCHASES);
      return INITIAL_PURCHASES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_PURCHASES;
  } catch (err) {
    console.error('Error loading purchases from storage:', err);
    return INITIAL_PURCHASES;
  }
}

export function savePurchases(purchases: Purchase[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  } catch (err) {
    console.error('Error saving purchases to storage:', err);
  }
}

export function calculateSummary(products: Product[], sales: Sale[], purchases: Purchase[]): BusinessSummary {
  const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.totalProfit, 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + p.totalCost, 0);
  const salesCount = sales.length;

  const netMarginPercentage = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

  const totalInventoryValueBuy = products.reduce((acc, p) => acc + p.buyPrice * p.stock, 0);
  const totalInventoryValueSell = products.reduce((acc, p) => acc + p.sellPrice * p.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStockAlert).length;

  return {
    totalSales,
    totalProfit,
    totalPurchases,
    salesCount,
    netMarginPercentage,
    totalInventoryValueBuy,
    totalInventoryValueSell,
    lowStockCount
  };
}

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount) + ' FCFA';
}

export function exportDatabaseBackup(products: Product[], sales: Sale[], purchases: Purchase[]): void {
  const backup = {
    appName: "Les Délices de Maman (POS)",
    version: "2.0.0",
    exportedAt: new Date().toISOString(),
    products,
    sales,
    purchases
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `delices_maman_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportInventoryCSV(products: Product[]): void {
  const headers = ['Code', 'Code_Barres', 'Article', 'Categorie', 'Prix_Achat_FCFA', 'Prix_Vente_FCFA', 'Stock', 'Seuil_Alerte', 'Unite'];
  const rows = products.map(p => [
    `"${p.code}"`,
    `"${p.barcode || ''}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.category}"`,
    p.buyPrice,
    p.sellPrice,
    p.stock,
    p.minStockAlert,
    `"${p.unit}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventaire_delices_maman_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
