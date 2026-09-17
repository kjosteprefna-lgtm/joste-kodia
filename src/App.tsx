/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  loadProducts,
  saveProducts,
  loadSales,
  saveSales,
  loadPurchases,
  savePurchases,
  calculateSummary,
} from './services/storage';
import { Product, Sale, Purchase, CartItem, PaymentMethod } from './types';
import { INITIAL_PRODUCTS, INITIAL_PURCHASES, INITIAL_SALES } from './data/initialProducts';
import { Navbar, TabType } from './components/Navbar';
import { PosTerminal } from './components/PosTerminal';
import { StockManagement } from './components/StockManagement';
import { PurchasesManager } from './components/PurchasesManager';
import { FinancialDashboard } from './components/FinancialDashboard';
import { AndroidPythonGuideModal } from './components/AndroidPythonGuideModal';
import { ExcelSyncModal } from './components/ExcelSyncModal';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    setProducts(loadProducts());
    setSales(loadSales());
    setPurchases(loadPurchases());

    // Online/Offline status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync tab with guide
  useEffect(() => {
    if (activeTab === 'guide') {
      setIsGuideOpen(true);
    }
  }, [activeTab]);

  const summary = calculateSummary(products, sales, purchases);

  // Complete a Sale from POS
  const handleCompleteSale = (saleData: {
    items: CartItem[];
    totalAmount: number;
    totalProfit: number;
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    changeReturned?: number;
  }): Sale => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newTicketNumber = String(1000 + sales.length + 1);

    const saleItems = saleData.items.map((i) => ({
      productCode: i.product.code,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: i.product.sellPrice,
      buyPrice: i.product.buyPrice,
      totalAmount: i.product.sellPrice * i.quantity,
      profit: (i.product.sellPrice - i.product.buyPrice) * i.quantity,
    }));

    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      ticketNumber: newTicketNumber,
      date: dateStr,
      items: saleItems,
      totalAmount: saleData.totalAmount,
      totalProfit: saleData.totalProfit,
      paymentMethod: saleData.paymentMethod,
      amountReceived: saleData.amountReceived,
      changeReturned: saleData.changeReturned,
      cashierName: 'Caisse Maman',
    };

    // Deduct stock for each sold product
    const updatedProducts = products.map((prod) => {
      const sold = saleData.items.find((i) => i.product.id === prod.id);
      if (sold) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - sold.quantity),
        };
      }
      return prod;
    });

    const updatedSales = [newSale, ...sales];

    setProducts(updatedProducts);
    setSales(updatedSales);

    saveProducts(updatedProducts);
    saveSales(updatedSales);

    return newSale;
  };

  // Add a Purchase / Expense
  const handleAddPurchase = (
    purchaseData: Omit<Purchase, 'id'>,
    updateStockProductCode?: string
  ) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `PUR-${Date.now()}`,
    };

    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);

    // If linked to an existing raw material, replenish stock
    if (updateStockProductCode) {
      const updatedProducts = products.map((prod) => {
        if (prod.code === updateStockProductCode) {
          return {
            ...prod,
            stock: prod.stock + purchaseData.quantity,
          };
        }
        return prod;
      });
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }
  };

  const handleDeletePurchase = (purchaseId: string) => {
    const updated = purchases.filter((p) => p.id !== purchaseId);
    setPurchases(updated);
    savePurchases(updated);
  };

  // Product CRUD
  const handleUpdateProduct = (updatedProd: Product) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    saveProducts(updated);
  };

  const handleAddProduct = (newProdData: Omit<Product, 'id'>) => {
    const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    const newProduct: Product = {
      ...newProdData,
      id: nextId,
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    saveProducts(updated);
  };

  const handleDeleteProduct = (productId: number) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
  };

  // Reset database back to default initial state
  const handleResetData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setPurchases(INITIAL_PURCHASES);
    saveProducts(INITIAL_PRODUCTS);
    saveSales(INITIAL_SALES);
    savePurchases(INITIAL_PURCHASES);
  };

  return (
    <div className="min-h-screen bg-[#fdfbfb] text-[#2c2627] flex flex-col selection:bg-[#edd2b8] selection:text-[#551d24]">
      {/* Offline Status Bar */}
      {!isOnline && (
        <div className="bg-[#a05a18] text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5 text-[#f5dfca]" />
          <span>Mode Hors-Ligne Actif — Vos ventes et stocks sont enregistrés localement sur l'appareil.</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab === 'guide' ? 'pos' : activeTab}
        setActiveTab={(tab) => {
          if (tab === 'guide') {
            setIsGuideOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        lowStockCount={summary.lowStockCount}
        onResetData={handleResetData}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
      />

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4">
        {activeTab === 'pos' && (
          <PosTerminal products={products} onCompleteSale={handleCompleteSale} />
        )}

        {activeTab === 'stocks' && (
          <StockManagement
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
          />
        )}

        {activeTab === 'purchases' && (
          <PurchasesManager
            purchases={purchases}
            products={products}
            onAddPurchase={handleAddPurchase}
            onDeletePurchase={handleDeletePurchase}
          />
        )}

        {activeTab === 'dashboard' && (
          <FinancialDashboard
            summary={summary}
            sales={sales}
            purchases={purchases}
            products={products}
          />
        )}
      </main>

      {/* Excel Sync Modal (In-App Excel Import/Export) */}
      <ExcelSyncModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        products={products}
        onApplyProducts={(updatedList) => {
          setProducts(updatedList);
          saveProducts(updatedList);
        }}
      />

      {/* Android & Python Guide Modal */}
      <AndroidPythonGuideModal
        isOpen={isGuideOpen}
        onClose={() => {
          setIsGuideOpen(false);
          if (activeTab === 'guide') {
            setActiveTab('pos');
          }
        }}
      />
    </div>
  );
}
