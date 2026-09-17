import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, Sparkles, Volume2, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { sound } from '../services/storage';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned,
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartedRef = useRef(false);

  // Stop scanner utility
  const stopScanner = async () => {
    if (scannerRef.current && isStartedRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      isStartedRef.current = false;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedResult(null);
      setScannerError(null);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const startScanner = async () => {
      try {
        setScannerError(null);
        setIsScanning(true);

        const html5QrCode = new Html5Qrcode('barcode-reader-container');
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            sound.playScanBeep();
            setScannedResult(decodedText);
            
            // Check if product matches by code or barcode
            const found = products.find(
              p => p.code.toLowerCase() === decodedText.toLowerCase() ||
                   (p.barcode && p.barcode.toLowerCase() === decodedText.toLowerCase())
            );

            if (found) {
              onProductScanned(found);
              // Brief vibration if supported
              if ('vibrate' in navigator) {
                navigator.vibrate([80, 40, 80]);
              }
              setTimeout(() => {
                onClose();
              }, 400);
            } else {
              setScannerError(`Code scanné : "${decodedText}" (Non répertorié dans les 80 articles)`);
            }
          },
          () => {
            // Frame scan without code - normal loop
          }
        );

        isStartedRef.current = true;
      } catch (err: unknown) {
        console.warn('Scanner init failed, camera might be restricted in iframe:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setScannerError(
          `Accès caméra non disponible (${errMsg.slice(0, 60)}...). Utilisez la saisie directe ou le test rapide ci-dessous !`
        );
        setIsScanning(false);
      }
    };

    // Small delay to ensure DOM element exists
    timeoutId = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Sample quick test barcodes to test instant scan
  const testArticles = products.slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#f0e6e6] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#722f37] px-4 py-3 text-white border-b border-[#8f3e48]">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#d4a373]" />
            <div>
              <h3 className="text-base font-bold tracking-tight font-serif">Scan Caméra de Codes-Barres</h3>
              <p className="text-xs text-[#edd2b8]">Visez le code-barres de l'article</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#edd2b8] hover:bg-[#5a1f26] transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="relative bg-[#1a1415] flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
          <div id="barcode-reader-container" className="w-full max-w-[340px] aspect-square overflow-hidden" />

          {/* Scanner Overlay Box when scanning */}
          {isScanning && !scannerError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-36 border-2 border-dashed border-[#d4a373]/90 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(212,163,115,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-[#d4a373]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-[#d4a373]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-[#d4a373]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-[#d4a373]" />
                <div className="w-full h-0.5 bg-[#d4a373] animate-pulse shadow-[0_0_12px_#d4a373]" />
              </div>
            </div>
          )}

          {scannerError && (
            <div className="absolute inset-0 bg-[#2c1d1f]/95 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="h-10 w-10 text-[#d4a373] mb-2" />
              <p className="text-xs text-[#fdfbfb] font-medium leading-relaxed max-w-xs">{scannerError}</p>
              <button
                onClick={() => {
                  setScannerError(null);
                  setIsScanning(true);
                }}
                className="mt-3 flex items-center gap-2 rounded-xl bg-[#722f37] px-4 py-2 text-xs font-bold text-white hover:bg-[#853740] cursor-pointer border border-[#8f3e48]"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#d4a373]" /> Réessayer la caméra
              </button>
            </div>
          )}
        </div>

        {/* Scan Status & Quick Test Simulation */}
        <div className="p-4 bg-[#fcf6f6] border-t border-[#f0e6e6] overflow-y-auto">
          {scannedResult && (
            <div className="mb-3 p-2.5 rounded-xl bg-[#f7ebeb] border border-[#ebd8d8] text-xs text-[#722f37] flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-[#722f37] shrink-0" />
              <span>Dernier code scanné : <strong>{scannedResult}</strong></span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#722f37] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#d4a373]" /> Test rapide en 1 clic :
            </span>
            <span className="text-[11px] text-[#8a7577]">Simulation instantanée</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {testArticles.map((prod) => (
              <button
                key={prod.id}
                onClick={() => {
                  sound.playScanBeep();
                  onProductScanned(prod);
                  onClose();
                }}
                className="text-left px-3 py-2 rounded-xl bg-white border border-[#ebdada] hover:border-[#722f37] hover:bg-[#f7ebeb] transition group text-xs cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-[#2c2627] truncate group-hover:text-[#722f37]">{prod.name}</div>
                <div className="flex justify-between items-center text-[10px] text-[#8a7577] mt-0.5">
                  <span className="font-mono bg-[#fcf6f6] px-1 py-0.5 rounded text-[#722f37] font-semibold">{prod.code}</span>
                  <span className="font-extrabold text-[#722f37]">{prod.sellPrice} F</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#fcf6f6] border-t border-[#f0e6e6] flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-[#5c4749] bg-white border border-[#ebdada] rounded-xl hover:bg-[#f7ebeb] cursor-pointer"
          >
            Fermer le scanner
          </button>
        </div>
      </div>
    </div>
  );
};
