import React, { useState } from 'react';
import {
  Truck,
  PlusCircle,
  FileText,
  DollarSign,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Purchase, Product } from '../types';
import { formatFCFA } from '../services/storage';

interface PurchasesManagerProps {
  purchases: Purchase[];
  products: Product[];
  onAddPurchase: (purchase: Omit<Purchase, 'id'>, updateStockProductCode?: string) => void;
  onDeletePurchase: (purchaseId: string) => void;
}

export const PurchasesManager: React.FC<PurchasesManagerProps> = ({
  purchases,
  products,
  onAddPurchase,
  onDeletePurchase,
}) => {
  const [supplier, setSupplier] = useState('');
  const [productName, setProductName] = useState('');
  const [selectedProductCode, setSelectedProductCode] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [totalCost, setTotalCost] = useState<number | ''>('');
  const [category, setCategory] = useState('Matières Premières');
  const [notes, setNotes] = useState('');
  const [autoReplenishStock, setAutoReplenishStock] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // When a catalog item is picked from dropdown, autofill name & suggested cost
  const handleSelectExistingProduct = (code: string) => {
    setSelectedProductCode(code);
    if (!code) return;
    const found = products.find((p) => p.code === code);
    if (found) {
      setProductName(found.name);
      setCategory(found.category);
      if (quantity > 0) {
        setTotalCost(found.buyPrice * quantity);
      }
    }
  };

  const handleQuantityChange = (qty: number) => {
    setQuantity(qty);
    if (selectedProductCode) {
      const found = products.find((p) => p.code === selectedProductCode);
      if (found && qty > 0) {
        setTotalCost(found.buyPrice * qty);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim() || !productName.trim() || !totalCost || quantity <= 0) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onAddPurchase(
      {
        date: dateStr,
        supplier: supplier.trim(),
        productName: productName.trim(),
        productCode: selectedProductCode || undefined,
        quantity,
        totalCost: Number(totalCost),
        category,
        notes: notes.trim() || undefined,
      },
      autoReplenishStock && selectedProductCode ? selectedProductCode : undefined
    );

    setSuccessMsg(`Achat de ${formatFCFA(Number(totalCost))} enregistré avec succès !`);
    setTimeout(() => setSuccessMsg(null), 4000);

    // Reset form
    setSupplier('');
    setProductName('');
    setSelectedProductCode('');
    setQuantity(1);
    setTotalCost('');
    setNotes('');
  };

  const totalSpent = purchases.reduce((acc, p) => acc + p.totalCost, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#f5e8e8] text-[#722f37] border border-[#ebd8d8] flex items-center justify-center shrink-0">
            <Truck className="h-6 w-6 text-[#722f37]" />
          </div>
          <div>
            <div className="text-xs text-[#8a7577] font-semibold">Total Achats & Matières</div>
            <div className="text-xl font-black text-[#722f37] font-serif">{formatFCFA(totalSpent)}</div>
            <div className="text-[11px] text-[#8a7577]">{purchases.length} arrivages enregistrés</div>
          </div>
        </div>

        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs flex items-center gap-3.5 md:col-span-2">
          <div className="h-12 w-12 rounded-2xl bg-[#fbf0e4] text-[#a05a18] border border-[#f5dfca] flex items-center justify-center shrink-0">
            <DollarSign className="h-6 w-6 text-[#d4a373]" />
          </div>
          <div>
            <div className="text-xs text-[#8a7577] font-semibold">Calcul Précis des Bénéfices Réels</div>
            <p className="text-xs text-[#5c4749] leading-relaxed mt-0.5">
              Vos arrivages réels (sacs de farine 25kg, sucre 50kg, seaux de margarine, bidons d'huile 10L/25L, œufs) 
              sont décomptés avec précision pour vous donner la rentabilité nette exacte de "Les Délices de Maman".
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Purchase Form */}
        <div className="lg:col-span-5 bg-[#fdfbfb] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#f0e6e6] pb-3 mb-3.5">
            <PlusCircle className="h-5 w-5 text-[#722f37]" />
            <h3 className="font-bold text-sm text-[#722f37] font-serif">
              Enregistrer un Arrivage ou Dépense
            </h3>
          </div>

          {successMsg && (
            <div className="mb-3.5 p-2.5 bg-[#edf4ed] border border-[#bcd7bc] text-[#2d6a4f] rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#2d6a4f] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {/* Quick picker from catalog */}
            <div>
              <label className="block font-bold text-[#722f37] mb-1">
                Lier à un article réel du catalogue (Optionnel) :
              </label>
              <select
                value={selectedProductCode}
                onChange={(e) => handleSelectExistingProduct(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] font-medium text-[#2c2627] cursor-pointer"
              >
                <option value="">-- Saisie libre ou sélectionner un article --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code} - {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#722f37] mb-1">
                Fournisseur / Dépôt :
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Dépôt Farine, Marché Central, Ferme avicole..."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full p-2.5 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627] bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-[#722f37] mb-1">
                Désignation de la Matière / Marchandise :
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Farine de Blé 25kg, Bidon Huile 10L, Œufs..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2.5 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627] bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#722f37] mb-1">Quantité :</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627] bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#722f37] mb-1">
                  Coût Total Payé (FCFA) :
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Ex: 18000"
                  value={totalCost}
                  onChange={(e) =>
                    setTotalCost(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full p-2.5 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] font-bold text-[#722f37] bg-white"
                />
              </div>
            </div>

            {selectedProductCode && (
              <div className="p-2.5 bg-[#f7ebeb] border border-[#ecd5d5] rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReplenishStock}
                    onChange={(e) => setAutoReplenishStock(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#722f37]"
                  />
                  <span className="font-bold text-[#722f37]">
                    Réapprovisionner le stock immédiatement (+{quantity} unités)
                  </span>
                </label>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#722f37] mb-1">
                Notes ou N° Facture (Optionnel) :
              </label>
              <input
                type="text"
                placeholder="Ex: Facture #F-102, Payé par Wave ou espèces"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627] bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#722f37] hover:bg-[#853740] text-white font-bold rounded-2xl transition shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer border border-[#8f3e48]"
            >
              <PlusCircle className="h-4 w-4 text-[#d4a373]" />
              <span>Enregistrer la Dépense</span>
            </button>
          </form>
        </div>

        {/* Purchases History Table */}
        <div className="lg:col-span-7 bg-[#fdfbfb] rounded-2xl border border-[#f0e6e6] shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-[#f0e6e6] bg-[#fcf6f6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#722f37]" />
              <h4 className="font-bold text-sm text-[#722f37] font-serif">
                Historique des Dépenses de Matières
              </h4>
            </div>
            <span className="text-xs font-semibold text-[#8a7577]">
              {purchases.length} enregistrements
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fcf6f6] text-[#722f37] font-bold border-b border-[#f0e6e6] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Fournisseur</th>
                  <th className="py-2.5 px-3">Article</th>
                  <th className="py-2.5 px-3 text-center">Qté</th>
                  <th className="py-2.5 px-3 text-right">Coût Total</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2e6e6] bg-white">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-[#fcf8f8] transition">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#8a7577] whitespace-nowrap">
                      {pur.date}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#2c2627] max-w-[140px] truncate">
                      {pur.supplier}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#2c2627]">
                      <div>{pur.productName}</div>
                      {pur.productCode && (
                        <span className="text-[10px] font-mono text-[#722f37] bg-[#f7ebeb] px-1.5 py-0.5 rounded-md font-bold">
                          {pur.productCode}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#2c2627]">
                      {pur.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-[#722f37] whitespace-nowrap">
                      {formatFCFA(pur.totalCost)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer cette dépense de ${formatFCFA(pur.totalCost)} ?`)) {
                            onDeletePurchase(pur.id);
                          }
                        }}
                        className="p-1.5 text-[#b89fa1] hover:text-[#b3261e] hover:bg-[#fae1e1] rounded-xl transition cursor-pointer"
                        title="Supprimer la dépense"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {purchases.length === 0 && (
              <div className="p-8 text-center text-[#8a7577]">
                <Truck className="h-10 w-10 mx-auto text-[#d4a373] mb-2 stroke-1" />
                <p className="font-bold text-sm text-[#722f37]">Aucun achat enregistré pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
