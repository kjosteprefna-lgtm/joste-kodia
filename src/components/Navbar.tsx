import React from 'react';
import {
  Store,
  Boxes,
  Truck,
  BarChart3,
  Smartphone,
  Download,
  RotateCcw,
  Sparkles,
  Heart,
  FileSpreadsheet,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type TabType = 'pos' | 'stocks' | 'purchases' | 'dashboard' | 'guide';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lowStockCount: number;
  onResetData: () => void;
  onOpenExcelModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  onResetData,
  onOpenExcelModal,
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();

  return (
    <header className="bg-[#722f37] text-white shadow-md sticky top-0 z-40 border-b border-[#8f3e48]">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#e5b98f] via-[#d4a373] to-[#b37f4e] flex items-center justify-center text-[#551d24] shadow-sm shrink-0 border border-[#f5dfca]">
            <Heart className="h-5 w-5 fill-[#722f37] text-[#722f37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#fff8f8] leading-tight font-serif">
                Les Délices de Maman
              </h1>
              <span className="bg-[#5a1f26] border border-[#d4a373]/50 text-[#edd2b8] text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                CAISSE PRO
              </span>
            </div>
            <p className="text-[11px] text-[#edd2b8]/90 font-medium">
              Données Réelles Excel • Caisse Tactile & Stock • Bénéfices Nets FCFA
            </p>
          </div>
        </div>

        {/* Action buttons & Utilities */}
        <div className="flex items-center gap-2">
          {/* Excel In-App Sync Button */}
          <button
            onClick={onOpenExcelModal}
            className="flex items-center gap-1.5 bg-[#5a1f26] hover:bg-[#4d1920] text-[#f7e8db] text-xs font-bold px-3 py-1.5 rounded-xl transition border border-[#d4a373]/60 cursor-pointer shadow-2xs"
            title="Importer ou exporter le fichier Excel directement dans l'application"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#d4a373]" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#e5b98f] to-[#d4a373] hover:from-[#ecc49d] hover:to-[#dfaf7f] text-[#551d24] font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm active:scale-95 transition cursor-pointer"
              title="Installer l'application sur votre smartphone Android"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Installer l'App</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <span className="hidden sm:inline-block text-[10px] bg-[#5a1f26] text-[#edd2b8] px-2.5 py-1 rounded-xl border border-[#d4a373]/30">
              iOS : Partager &gt; Sur l'écran d'accueil
            </span>
          )}

          {/* Guide Android & Python Modal */}
          <button
            onClick={() => setActiveTab('guide')}
            className="flex items-center gap-1.5 bg-[#5a1f26] hover:bg-[#4d1920] text-[#f7e8db] text-xs px-3 py-1.5 rounded-xl transition border border-[#d4a373]/40 cursor-pointer"
            title="Code Source Python Flask & Guide Android"
          >
            <Smartphone className="h-3.5 w-3.5 text-[#d4a373]" />
            <span className="hidden sm:inline">Guide Android & Python</span>
          </button>

          {/* Reset database to authentic 80 real items */}
          <button
            onClick={() => {
              if (
                confirm(
                  'Réinitialiser immédiatement aux 80 articles réels extraits de votre Excel (œufs, huile, riz, farines, sucre, etc.) ?'
                )
              ) {
                onResetData();
              }
            }}
            className="p-2 text-[#edd2b8] hover:text-white hover:bg-[#5a1f26] rounded-xl transition border border-transparent hover:border-[#8f3e48] cursor-pointer"
            title="Recharger le catalogue authentique Excel (80 articles réels)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <nav className="flex space-x-1.5 sm:space-x-2 overflow-x-auto py-1.5 no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-[#fdfbfb] text-[#722f37] shadow-sm border border-[#f0e6e6]'
                : 'text-[#edd2b8] hover:bg-[#5a1f26]/80 hover:text-white'
            }`}
          >
            <Store className={`h-4 w-4 ${activeTab === 'pos' ? 'text-[#722f37]' : 'text-[#d4a373]'}`} />
            <span>Caisse Tactile</span>
          </button>

          <button
            onClick={() => setActiveTab('stocks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'stocks'
                ? 'bg-[#fdfbfb] text-[#722f37] shadow-sm border border-[#f0e6e6]'
                : 'text-[#edd2b8] hover:bg-[#5a1f26]/80 hover:text-white'
            }`}
          >
            <Boxes className={`h-4 w-4 ${activeTab === 'stocks' ? 'text-[#722f37]' : 'text-[#d4a373]'}`} />
            <span>Catalogue Réel (80 Articles)</span>
            {lowStockCount > 0 && (
              <span className="ml-1 bg-[#d4a373] text-[#551d24] text-[10px] px-2 py-0.5 rounded-full font-black">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-[#fdfbfb] text-[#722f37] shadow-sm border border-[#f0e6e6]'
                : 'text-[#edd2b8] hover:bg-[#5a1f26]/80 hover:text-white'
            }`}
          >
            <Truck className={`h-4 w-4 ${activeTab === 'purchases' ? 'text-[#722f37]' : 'text-[#d4a373]'}`} />
            <span>Achats & Matières Premières</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#fdfbfb] text-[#722f37] shadow-sm border border-[#f0e6e6]'
                : 'text-[#edd2b8] hover:bg-[#5a1f26]/80 hover:text-white'
            }`}
          >
            <BarChart3 className={`h-4 w-4 ${activeTab === 'dashboard' ? 'text-[#722f37]' : 'text-[#d4a373]'}`} />
            <span>Bénéfices & Rapports Financiers</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
