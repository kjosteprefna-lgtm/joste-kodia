import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Database,
  Eye,
} from 'lucide-react';
import { Product } from '../types';
import { parseExcelProducts, exportProductsToExcel, ExcelImportResult } from '../services/excelSync';
import { formatFCFA } from '../services/storage';

interface ExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyProducts: (newProducts: Product[]) => void;
}

export const ExcelSyncModal: React.FC<ExcelSyncModalProps> = ({
  isOpen,
  onClose,
  products,
  onApplyProducts,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ExcelImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelProducts(buffer, products);

      if (result.products.length === 0) {
        throw new Error(
          "Aucun article trouvé à partir de la ligne 5 dans la feuille 'Produits'. Vérifiez que le nom de l'article se trouve bien dans la colonne B (colonne 2)."
        );
      }

      setParseResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Erreur de lecture du fichier Excel : ${msg}`);
      setParseResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Merge & Update Stocks and Prices
  const handleApplyUpdate = () => {
    if (!parseResult) return;

    // Create a map of incoming products by code or lowercase name
    const incomingMap = new Map<string, Product>();
    parseResult.products.forEach((p) => {
      incomingMap.set(p.name.trim().toLowerCase(), p);
      if (p.code) incomingMap.set(p.code.trim().toLowerCase(), p);
    });

    // Update existing products
    const updated = products.map((currentProd) => {
      const match =
        incomingMap.get(currentProd.name.trim().toLowerCase()) ||
        incomingMap.get(currentProd.code.trim().toLowerCase());
      if (match) {
        return {
          ...currentProd,
          sellPrice: match.sellPrice > 0 ? match.sellPrice : currentProd.sellPrice,
          stock: match.stock,
          buyPrice: match.buyPrice > 0 ? match.buyPrice : currentProd.buyPrice,
        };
      }
      return currentProd;
    });

    // Add any completely new products found in Excel
    const currentNames = new Set(products.map((p) => p.name.trim().toLowerCase()));
    const brandNew: Product[] = [];
    parseResult.products.forEach((incoming) => {
      if (!currentNames.has(incoming.name.trim().toLowerCase())) {
        brandNew.push(incoming);
      }
    });

    const finalProductsList = [...updated, ...brandNew];
    onApplyProducts(finalProductsList);
    setSuccessMsg(
      `Synchronisation réussie ! ${parseResult.products.length} articles mis à jour directement dans l'application.`
    );
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  // Full Replacement with Excel file
  const handleApplyFullReplace = () => {
    if (!parseResult) return;
    onApplyProducts(parseResult.products);
    setSuccessMsg(
      `Catalogue intégral rechargé avec succès depuis Excel (${parseResult.products.length} articles).`
    );
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  // Export current application database to exact Excel format
  const handleExport = () => {
    exportProductsToExcel(
      products,
      'Les_Delices_De_Maman_EXPERT_AVEC_MATIERES_PREMIERES.xlsx'
    );
    setSuccessMsg('Fichier Excel exporté et téléchargé avec succès !');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-[#f0e6e6] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#722f37] px-5 py-3.5 text-white border-b border-[#8f3e48]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#e5b98f] to-[#d4a373] text-[#551d24] flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide font-serif">
                Synchronisation Excel Directe (Tout dans l'Application)
              </h3>
              <p className="text-[11px] text-[#edd2b8]">
                Lecture automatique de la feuille <strong>Produits</strong> • Ligne 5+ • Col B (Nom), Col G (Prix), Col L (Stock)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#edd2b8] hover:bg-[#5a1f26] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#2c2627]">
          {/* Success Notification */}
          {successMsg && (
            <div className="p-3 bg-[#edf4ed] border border-[#c3dec4] text-[#2d6a4f] rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Notification */}
          {errorMsg && (
            <div className="p-3 bg-[#fdf2f2] border border-[#f5c6cb] text-[#722f37] rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-[#722f37]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
              dragActive
                ? 'border-[#722f37] bg-[#f7ebeb]'
                : 'border-[#ebdada] bg-[#fcf6f6] hover:bg-[#fbf2f2] hover:border-[#d4a373]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-2xl bg-white border border-[#ebdada] text-[#722f37] flex items-center justify-center shadow-xs">
              {isLoading ? (
                <RefreshCw className="h-6 w-6 text-[#722f37] animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6 text-[#722f37]" />
              )}
            </div>

            <div>
              <p className="font-bold text-sm text-[#722f37] font-serif">
                {fileName ? `Fichier sélectionné : ${fileName}` : 'Sélectionnez ou Glissez votre fichier Excel (.xlsx)'}
              </p>
              <p className="text-[11px] text-[#8a7577] mt-0.5">
                Compatible avec <strong>Les_Delices_De_Maman_EXPERT_AVEC_MATIERES_PREMIERES.xlsx</strong>
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#e8d8d8] rounded-xl text-[11px] font-bold text-[#722f37] shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#d4a373]" />
              Parcourir sur ce téléphone / ordinateur
            </div>
          </div>

          {/* Export Button Card */}
          <div className="p-3.5 bg-[#fdfbfb] border border-[#ebdada] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-bold text-[#722f37] font-serif text-sm flex items-center gap-1.5">
                <Download className="h-4 w-4 text-[#d4a373]" /> Exporter le Fichier Excel à jour (.xlsx)
              </span>
              <p className="text-[11px] text-[#8a7577]">
                Générez le fichier Excel avec les ventes déduites et vos {products.length} articles réels en colonne L.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#722f37] hover:bg-[#853740] text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer border border-[#8f3e48]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#d4a373]" />
              Télécharger l'Excel
            </button>
          </div>

          {/* Preview Section if File Loaded */}
          {parseResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-[#ebdada] pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#722f37] font-serif text-sm flex items-center gap-1">
                    <Eye className="h-4 w-4 text-[#722f37]" /> Prévisualisation des Données Extraites
                  </span>
                  <span className="bg-[#f7ebeb] text-[#722f37] font-bold px-2 py-0.5 rounded-full text-[10px] border border-[#ebdada]">
                    Feuille : {parseResult.sheetName}
                  </span>
                </div>
                <span className="font-bold text-[#2c2627]">
                  {parseResult.totalRowsParsed} articles détectés
                </span>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto max-h-56 border border-[#ebdada] rounded-xl bg-white">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-[#fcf6f6] border-b border-[#ebdada] text-[#722f37] font-bold">
                    <tr>
                      <th className="py-2 px-3">Ligne</th>
                      <th className="py-2 px-3">Col B : Article</th>
                      <th className="py-2 px-3">Catégorie</th>
                      <th className="py-2 px-3 text-right">Col G : Prix Vente</th>
                      <th className="py-2 px-3 text-right">Col L : Stock Actuel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0e6e6]">
                    {parseResult.products.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#fcf6f6]">
                        <td className="py-1.5 px-3 text-[#8a7577] font-mono">Row {5 + idx}</td>
                        <td className="py-1.5 px-3 font-bold text-[#2c2627]">{p.name}</td>
                        <td className="py-1.5 px-3 text-[#8a7577]">{p.category}</td>
                        <td className="py-1.5 px-3 text-right font-extrabold text-[#722f37]">
                          {formatFCFA(p.sellPrice)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-black text-[#551d24]">
                          <span className="bg-[#f7ebeb] text-[#722f37] px-1.5 py-0.5 rounded font-mono font-bold">
                            {p.stock} {p.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons to Apply */}
              <div className="p-3 bg-[#fcf6f6] border border-[#ebdada] rounded-2xl flex flex-col sm:flex-row gap-2.5 justify-end">
                <button
                  onClick={handleApplyUpdate}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#722f37] hover:bg-[#853740] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer border border-[#8f3e48]"
                >
                  <RefreshCw className="h-4 w-4 text-[#d4a373]" />
                  <span>Synchroniser & Mettre à jour les stocks et prix</span>
                </button>

                <button
                  onClick={handleApplyFullReplace}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-[#f5e8e8] text-[#722f37] border border-[#e8d8d8] rounded-xl font-bold text-xs cursor-pointer"
                >
                  <Database className="h-4 w-4 text-[#722f37]" />
                  <span>Remplacer tout le catalogue par ce fichier</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#fcf6f6] border-t border-[#f0e6e6] flex items-center justify-between">
          <span className="text-[11px] text-[#8a7577] hidden sm:inline">
            100% exécuté localement dans l'application • Aucune connexion requise
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-[#5c4749] bg-white border border-[#ebdada] rounded-xl hover:bg-[#f7ebeb] cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
