import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Sale } from '../types';
import { formatFCFA } from '../services/storage';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const paymentLabelMap: Record<string, string> = {
    ESPECES: 'Espèces (Cash)',
    WAVE_MOBILE: 'Wave Mobile Money',
    MTN_MOMO: 'MTN MoMo',
    ORANGE_MONEY: 'Orange Money',
    MOOV_MONEY: 'Moov Money',
    AIRTEL_MONEY: 'Airtel Money',
    CARTE: 'Carte Bancaire',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-[#f0e6e6] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between bg-[#722f37] px-4 py-3 text-white border-b border-[#8f3e48]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#d4a373]" />
            <span className="font-bold text-sm font-serif">Vente Encaissée avec Succès</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#edd2b8] hover:bg-[#5a1f26] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Style */}
        <div id="thermal-receipt" className="p-5 font-mono text-xs text-[#2c2627] bg-[#fffdfa] overflow-y-auto border-b border-dashed border-[#d8c4c4]">
          <div className="text-center mb-3">
            <div className="text-base font-black tracking-wider text-[#722f37] font-serif">LES DÉLICES DE MAMAN</div>
            <div className="text-[11px] text-[#8a7577]">Pâtisserie - Alimentation - Boissons</div>
            <div className="text-[10px] text-[#8a7577] mt-0.5">Tél / Mobile Money : (+225) 07 00 00 00 00</div>
            <div className="my-2 border-b border-dashed border-[#d8c4c4]" />
            <div className="flex justify-between text-[11px] font-semibold text-[#5c4749]">
              <span>TICKET : #{sale.ticketNumber}</span>
              <span>{sale.date}</span>
            </div>
            <div className="text-[10px] text-[#8a7577] text-left mt-0.5">Caisse : {sale.cashierName || 'Caisse Principale'}</div>
          </div>

          <div className="my-2 border-b border-dashed border-[#d8c4c4]" />

          {/* Table of items */}
          <div className="space-y-1.5 py-1">
            <div className="grid grid-cols-12 font-bold text-[11px] text-[#722f37] border-b border-[#ebdada] pb-1">
              <span className="col-span-6">ARTICLE</span>
              <span className="col-span-2 text-center">QTÉ</span>
              <span className="col-span-4 text-right">TOTAL</span>
            </div>

            {sale.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-[11px] py-0.5">
                <span className="col-span-6 truncate font-medium text-[#2c2627]">{item.productName}</span>
                <span className="col-span-2 text-center text-[#8a7577]">x{item.quantity}</span>
                <span className="col-span-4 text-right font-bold text-[#722f37]">{item.totalAmount} F</span>
              </div>
            ))}
          </div>

          <div className="my-2 border-b-2 border-[#722f37]" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-base font-black text-[#722f37] pt-1 font-serif">
              <span>TOTAL PAYÉ :</span>
              <span>{formatFCFA(sale.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-[#8a7577] pt-1">
              <span>Mode de règlement :</span>
              <span className="font-bold text-[#5c4749]">{paymentLabelMap[sale.paymentMethod] || sale.paymentMethod}</span>
            </div>

            {sale.amountReceived !== undefined && (
              <div className="flex justify-between text-[#8a7577]">
                <span>Espèces reçues :</span>
                <span className="font-medium text-[#2c2627]">{formatFCFA(sale.amountReceived)}</span>
              </div>
            )}

            {sale.changeReturned !== undefined && sale.changeReturned > 0 && (
              <div className="flex justify-between text-[#2d6a4f] font-bold bg-[#edf4ed] px-1.5 py-0.5 rounded">
                <span>Monnaie rendue :</span>
                <span>{formatFCFA(sale.changeReturned)}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-[#8a7577] pt-1">
              <span>Bénéfice net estimé :</span>
              <span className="text-[#722f37] font-bold">+{formatFCFA(sale.totalProfit)}</span>
            </div>
          </div>

          <div className="my-3 border-b border-dashed border-[#d8c4c4]" />

          <div className="text-center text-[10px] text-[#8a7577] space-y-0.5">
            <p className="font-bold text-[#722f37]">Merci de votre confiance et à très bientôt !</p>
            <p>Les Délices de Maman — Authenticité, Fraîcheur & Amour</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-[#fcf6f6] flex gap-2 border-t border-[#f0e6e6]">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#722f37] hover:bg-[#853740] px-3 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer border border-[#8f3e48]"
          >
            <Printer className="h-4 w-4 text-[#d4a373]" />
            Imprimer le Ticket
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#f5ecec] hover:bg-[#ebdada] px-3 py-2.5 text-xs font-bold text-[#722f37] transition cursor-pointer border border-[#eddada]"
          >
            Nouvelle Vente
          </button>
        </div>
      </div>
    </div>
  );
};
