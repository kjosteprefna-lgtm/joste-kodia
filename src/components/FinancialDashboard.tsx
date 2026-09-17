import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Receipt,
  Download,
  Eye,
  Award,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Sale, BusinessSummary, Product, Purchase } from '../types';
import { formatFCFA, exportDatabaseBackup } from '../services/storage';
import { ReceiptModal } from './ReceiptModal';

interface FinancialDashboardProps {
  summary: BusinessSummary;
  sales: Sale[];
  purchases: Purchase[];
  products: Product[];
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  summary,
  sales,
  purchases,
  products,
}) => {
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Top selling products ranking
  const topProducts = useMemo(() => {
    const itemMap: Record<string, { name: string; count: number; totalRev: number; totalProf: number }> = {};

    sales.forEach((s) => {
      s.items.forEach((item) => {
        if (!itemMap[item.productCode]) {
          itemMap[item.productCode] = {
            name: item.productName,
            count: 0,
            totalRev: 0,
            totalProf: 0,
          };
        }
        itemMap[item.productCode].count += item.quantity;
        itemMap[item.productCode].totalRev += item.totalAmount;
        itemMap[item.productCode].totalProf += item.profit;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.totalProf - a.totalProf)
      .slice(0, 5);
  }, [sales]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {
      ESPECES: 0,
      WAVE_MOBILE: 0,
      ORANGE_MONEY: 0,
      AUTRE: 0,
    };

    sales.forEach((s) => {
      if (map[s.paymentMethod] !== undefined) {
        map[s.paymentMethod] += s.totalAmount;
      } else {
        map['AUTRE'] += s.totalAmount;
      }
    });

    return map;
  }, [sales]);

  const averageBasket = summary.salesCount > 0 ? Math.round(summary.totalSales / summary.salesCount) : 0;

  return (
    <div className="space-y-4">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Chiffre d'Affaires */}
        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs border-l-4 border-l-[#722f37]">
          <div className="flex items-center justify-between text-[#8a7577] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#722f37]">Chiffre d'Affaires</span>
            <DollarSign className="h-4 w-4 text-[#722f37]" />
          </div>
          <div className="text-2xl font-black text-[#722f37] font-serif">
            {formatFCFA(summary.totalSales)}
          </div>
          <div className="text-[11px] text-[#8a7577] mt-1">
            {summary.salesCount} ventes encaissées
          </div>
        </div>

        {/* Bénéfice Net Total */}
        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs border-l-4 border-l-[#d4a373]">
          <div className="flex items-center justify-between text-[#8a7577] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8c5929]">Bénéfice Net Total</span>
            <TrendingUp className="h-4 w-4 text-[#d4a373]" />
          </div>
          <div className="text-2xl font-black text-[#2c2627] font-serif">
            {formatFCFA(summary.totalProfit)}
          </div>
          <div className="text-[11px] text-[#8a7577] mt-1">
            Gain net direct sur ventes
          </div>
        </div>

        {/* Achats & Dépenses */}
        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs border-l-4 border-l-[#a05a18]">
          <div className="flex items-center justify-between text-[#8a7577] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a05a18]">Dépenses Matières</span>
            <ShoppingCart className="h-4 w-4 text-[#a05a18]" />
          </div>
          <div className="text-2xl font-black text-[#7d481b] font-serif">
            {formatFCFA(summary.totalPurchases)}
          </div>
          <div className="text-[11px] text-[#8a7577] mt-1">
            Farines, œufs, beurre, etc.
          </div>
        </div>

        {/* Taux de Marge */}
        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs border-l-4 border-l-[#8c3a44]">
          <div className="flex items-center justify-between text-[#8a7577] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#722f37]">Marge Nette</span>
            <Percent className="h-4 w-4 text-[#722f37]" />
          </div>
          <div className="text-2xl font-black text-[#722f37] font-serif">
            {summary.netMarginPercentage}%
          </div>
          <div className="text-[11px] text-[#8a7577] mt-1">
            Panier moyen : {formatFCFA(averageBasket)}
          </div>
        </div>
      </div>

      {/* Secondary Analytical Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top 5 Most Profitable Articles */}
        <div className="bg-[#fdfbfb] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#f0e6e6] pb-2.5 mb-3">
            <Award className="h-4 w-4 text-[#d4a373]" />
            <h4 className="font-bold text-sm text-[#722f37] font-serif">Top Articles les Plus Rentables</h4>
          </div>

          <div className="space-y-2.5">
            {topProducts.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#fcf6f6] border border-[#f0e6e6]"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-[#2c2627] truncate">
                    #{index + 1}. {item.name}
                  </div>
                  <div className="text-[11px] text-[#8a7577] mt-0.5">
                    {item.count} vendus • CA : {formatFCFA(item.totalRev)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-[#722f37]">
                    +{formatFCFA(item.totalProf)}
                  </span>
                  <div className="text-[10px] text-[#8a7577]">gain net</div>
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <p className="text-xs text-[#8a7577] text-center py-6">
                Aucune vente pour le moment
              </p>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-[#fdfbfb] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#f0e6e6] pb-2.5 mb-3">
            <CreditCard className="h-4 w-4 text-[#722f37]" />
            <h4 className="font-bold text-sm text-[#722f37] font-serif">Répartition des Encaissements</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#f7ebeb] border border-[#eddada] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-[#722f37]" />
                <span className="font-bold text-[#551d24]">Espèces (Cash)</span>
              </div>
              <span className="font-black text-[#722f37] font-serif text-sm">
                {formatFCFA(paymentBreakdown.ESPECES || 0)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#f0f8ff] border border-[#d6ebff] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-[#0077b6]" />
                <span className="font-bold text-[#023e8a]">Wave / MoMo</span>
              </div>
              <span className="font-black text-[#0077b6] font-serif text-sm">
                {formatFCFA(paymentBreakdown.WAVE_MOBILE || 0)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#fff8f0] border border-[#fed7aa] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#ea580c]" />
                <span className="font-bold text-[#9a3412]">Orange Money / Autres</span>
              </div>
              <span className="font-black text-[#c2410c] font-serif text-sm">
                {formatFCFA((paymentBreakdown.ORANGE_MONEY || 0) + (paymentBreakdown.AUTRE || 0))}
              </span>
            </div>

            <div className="pt-2 border-t border-[#f0e6e6] flex justify-between text-[#8a7577] font-semibold">
              <span>Total Réglé :</span>
              <span className="text-[#722f37] font-black font-serif">{formatFCFA(summary.totalSales)}</span>
            </div>
          </div>
        </div>

        {/* Data Backup & Security Card */}
        <div className="bg-[#fdfbfb] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#f0e6e6] pb-2.5 mb-3">
              <Download className="h-4 w-4 text-[#722f37]" />
              <h4 className="font-bold text-sm text-[#722f37] font-serif">Sauvegarde & Sécurité Hors-Ligne</h4>
            </div>

            <p className="text-xs text-[#5c4749] leading-relaxed mb-4">
              Toutes les données de ventes, achats et stocks de vos 80 articles sont conservées localement dans votre
              appareil pour un fonctionnement 100% hors-ligne. Vous pouvez exporter une sauvegarde
              complète en un clic.
            </p>
          </div>

          <button
            onClick={() => exportDatabaseBackup(products, sales, purchases)}
            className="w-full py-3 px-3 bg-[#722f37] hover:bg-[#853740] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer border border-[#8f3e48]"
          >
            <Download className="h-4 w-4 text-[#d4a373]" />
            <span>Télécharger Sauvegarde Complète (JSON)</span>
          </button>
        </div>
      </div>

      {/* Detailed Sales History Table */}
      <div className="bg-[#fdfbfb] rounded-2xl border border-[#f0e6e6] shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#f0e6e6] bg-[#fcf6f6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#722f37]" />
            <h4 className="font-bold text-sm text-[#722f37] font-serif">
              Journal des Ventes & Reçus Délices de Maman
            </h4>
          </div>
          <span className="text-xs text-[#8a7577] font-semibold">
            {sales.length} transactions au total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fcf6f6] text-[#722f37] font-bold border-b border-[#f0e6e6] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">N° Ticket</th>
                <th className="py-2.5 px-3">Date & Heure</th>
                <th className="py-2.5 px-3">Articles Vendus</th>
                <th className="py-2.5 px-3">Mode Règlement</th>
                <th className="py-2.5 px-3 text-right">Total Encaissé</th>
                <th className="py-2.5 px-3 text-right">Bénéfice Net</th>
                <th className="py-2.5 px-3 text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2e6e6] bg-white">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#fcf8f8] transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#722f37]">
                    #{sale.ticketNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#8a7577] whitespace-nowrap">
                    {sale.date}
                  </td>
                  <td className="py-2.5 px-3 text-[#2c2627] max-w-xs">
                    <div className="truncate font-medium">
                      {sale.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f7ebeb] text-[#722f37]">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-[#2c2627]">
                    {formatFCFA(sale.totalAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-[#722f37]">
                    +{formatFCFA(sale.totalProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#f7ebeb] text-[#722f37] hover:bg-[#ecd8d8] font-bold text-[11px] transition cursor-pointer"
                    >
                      <Eye className="h-3 w-3 text-[#d4a373]" /> Reçu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sales.length === 0 && (
            <div className="p-8 text-center text-[#8a7577]">
              <Receipt className="h-10 w-10 mx-auto text-[#d4a373] mb-2 stroke-1" />
              <p className="font-bold text-sm text-[#722f37]">Aucune vente enregistrée pour le moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal for viewing past sales */}
      <ReceiptModal
        isOpen={selectedSaleForReceipt !== null}
        onClose={() => setSelectedSaleForReceipt(null)}
        sale={selectedSaleForReceipt}
      />
    </div>
  );
};
