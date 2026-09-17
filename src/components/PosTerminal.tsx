import React, { useState, useMemo } from 'react';
import {
  Search,
  Camera,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  AlertTriangle,
  Banknote,
  Smartphone,
  CreditCard,
  RotateCcw,
  Barcode as BarcodeIcon,
  Package,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, CartItem, ProductCategory, PaymentMethod, Sale } from '../types';
import { formatFCFA, sound } from '../services/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ReceiptModal } from './ReceiptModal';

interface PosTerminalProps {
  products: Product[];
  onCompleteSale: (saleData: {
    items: CartItem[];
    totalAmount: number;
    totalProfit: number;
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    changeReturned?: number;
  }) => Sale;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ products, onCompleteSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Toutes');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECES');
  const [amountReceivedStr, setAmountReceivedStr] = useState<string>('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [barcodeAlert, setBarcodeAlert] = useState<string | null>(null);

  const categories: ProductCategory[] = [
    'Toutes',
    'Pâtisserie',
    'Alimentation',
    'Boissons',
    'Matières Premières',
    'Entretien & Hygiène',
    'Articles Divers',
  ];

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'Toutes' || prod.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        prod.code.toLowerCase().includes(query) ||
        (prod.barcode && prod.barcode.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const totalCartAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.sellPrice * item.quantity, 0);
  }, [cart]);

  const totalCartProfit = useMemo(() => {
    return cart.reduce(
      (acc, item) => acc + (item.product.sellPrice - item.product.buyPrice) * item.quantity,
      0
    );
  }, [cart]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const amountReceivedNum = parseFloat(amountReceivedStr) || 0;
  const changeReturned =
    paymentMethod === 'ESPECES' && amountReceivedNum >= totalCartAmount
      ? amountReceivedNum - totalCartAmount
      : 0;

  // Add product to cart
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.stock <= 0) {
      setBarcodeAlert(`Attention : "${product.name}" est actuellement en rupture de stock.`);
      setTimeout(() => setBarcodeAlert(null), 3000);
      return;
    }

    sound.playScanBeep();
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantityToAdd, product.stock);
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevCart, { product, quantity: quantityToAdd }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item; // Stock cap
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountReceivedStr('');
  };

  // Manual Barcode submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = products.find(
      (p) =>
        p.code.toLowerCase() === code.toLowerCase() ||
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase())
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
      setBarcodeAlert(null);
    } else {
      setBarcodeAlert(`Code "${code}" introuvable dans le catalogue des 80 articles réels.`);
      setTimeout(() => setBarcodeAlert(null), 4000);
    }
  };

  // Checkout and validate sale
  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'ESPECES' && amountReceivedStr && amountReceivedNum < totalCartAmount) {
      setBarcodeAlert('Le montant en espèces remis est inférieur au total à payer.');
      return;
    }

    const saleResult = onCompleteSale({
      items: cart,
      totalAmount: totalCartAmount,
      totalProfit: totalCartProfit,
      paymentMethod,
      amountReceived: paymentMethod === 'ESPECES' ? amountReceivedNum || totalCartAmount : totalCartAmount,
      changeReturned,
    });

    sound.playCashRegisterChime();

    // Celebratory confetti in Bordeaux and Rose Gold
    try {
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#722f37', '#d4a373', '#e5b98f', '#ffffff'],
      });
    } catch {
      // Ignore confetti fallback
    }

    setLastSale(saleResult);
    setIsReceiptOpen(true);
    setCart([]);
    setAmountReceivedStr('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT COLUMN: Catalog & Product Tiles */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fdfbfb] rounded-2xl shadow-xs border border-[#f0e6e6] overflow-hidden">
        {/* Top Search & Filter Bar */}
        <div className="p-3 border-b border-[#f0e6e6] bg-[#fcf6f6] space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9c8285]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un article (ex: Œufs, Gâteau, Huile, Riz, Panzani, Coca)..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-[#e8d8d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#722f37] focus:border-transparent text-[#2c2627] placeholder:text-[#a89597] transition"
              />
            </div>

            {/* Quick Barcode Scanner Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-2 bg-[#722f37] text-[#fdfbfb] hover:bg-[#853740] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold active:scale-95 transition shadow-xs shrink-0 cursor-pointer border border-[#8f3e48]"
              title="Scanner avec la caméra du smartphone"
            >
              <Camera className="h-4 w-4 text-[#d4a373]" />
              <span>Scan Caméra</span>
            </button>
          </div>

          {/* Barcode / Reference Manual Input */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9c8285]" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan douchette ou code direct (ex: ART-0001, 123456797)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#e8d8d8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#722f37] font-mono text-[#2c2627]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#f5e8e8] hover:bg-[#edd8d8] text-[#722f37] text-xs font-bold rounded-xl transition cursor-pointer border border-[#e4d0d0]"
            >
              Ajouter
            </button>
          </form>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#722f37] text-white shadow-xs border border-[#8f3e48]'
                      : 'bg-[#f5ecec] text-[#722f37] hover:bg-[#ebdada] border border-[#ecd9d9]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alert notification if scan/stock error */}
        {barcodeAlert && (
          <div className="mx-3 mt-2.5 p-2.5 bg-[#fbf2e9] border border-[#e5be98] text-[#7d481b] rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 text-[#c27c32] shrink-0" />
            <span>{barcodeAlert}</span>
          </div>
        )}

        {/* Grid of Product Tiles */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
              const cartItem = cart.find((i) => i.product.id === product.id);

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className={`relative text-left p-3 rounded-2xl border flex flex-col justify-between transition-all select-none group cursor-pointer ${
                    isOutOfStock
                      ? 'bg-[#f7f4f4] border-[#ebdcdc] opacity-60 cursor-not-allowed'
                      : 'bg-[#fcf6f6] border-[#f0e4e4] hover:border-[#d4a373] hover:shadow-md hover:bg-white active:scale-98'
                  }`}
                >
                  {/* Category & Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold text-[#722f37] bg-[#f7ebeb] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {product.category.slice(0, 14)}
                      </span>
                      <span className="text-[10px] font-mono text-[#8a7577]">
                        {product.code}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-[#2c2627] line-clamp-2 leading-snug group-hover:text-[#722f37] transition-colors">
                      {product.name}
                    </h4>
                  </div>

                  {/* Pricing & Stock Status */}
                  <div className="mt-2.5 pt-2 border-t border-[#f2e5e5] flex items-end justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-[#722f37]">
                        {formatFCFA(product.sellPrice)}
                      </div>
                      <div className="text-[10px] text-[#8a7577]">
                        Marge : +{product.sellPrice - product.buyPrice} F
                      </div>
                    </div>

                    {/* Stock pill */}
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOutOfStock
                            ? 'bg-[#fae1e1] text-[#b3261e]'
                            : isLowStock
                            ? 'bg-[#fbf0e4] text-[#a05a18]'
                            : 'bg-[#edf4ed] text-[#2d6a4f]'
                        }`}
                      >
                        {isOutOfStock ? 'Rupture' : `Stk: ${product.stock}`}
                      </span>
                    </div>
                  </div>

                  {/* Quantity In Cart indicator bubble */}
                  {cartItem && (
                    <div className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-[#d4a373] text-[#551d24] rounded-full flex items-center justify-center text-xs font-black shadow-sm border-2 border-white">
                      {cartItem.quantity}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-[#8a7577]">
              <Package className="h-12 w-12 mb-2 stroke-1 text-[#d4a373]" />
              <p className="text-sm font-semibold">Aucun article ne correspond à votre recherche</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Toutes');
                }}
                className="mt-2 text-xs text-[#722f37] font-bold hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-2.5 bg-[#fcf6f6] border-t border-[#f0e6e6] text-xs text-[#8a7577] flex justify-between items-center px-4">
          <span className="font-medium">{filteredProducts.length} articles affichés sur 80 réels</span>
          <span className="text-[11px] text-[#722f37] font-semibold">Touchez un article pour l'ajouter au panier</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Tactile Cart & Payment Checkout */}
      <div className="w-full lg:w-96 bg-[#fdfbfb] rounded-2xl shadow-xs border border-[#f0e6e6] flex flex-col overflow-hidden">
        {/* Cart Header */}
        <div className="p-3.5 bg-[#722f37] text-white flex items-center justify-between border-b border-[#8f3e48]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#d4a373]" />
            <h3 className="font-bold text-sm tracking-wide text-[#fff8f8]">Panier En Cours</h3>
            {totalItemCount > 0 && (
              <span className="bg-[#d4a373] text-[#551d24] text-xs px-2 py-0.5 rounded-full font-black">
                {totalItemCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-[#edd2b8] hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Vider
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto divide-y divide-[#f2e6e6] min-h-[160px] max-h-[35vh] lg:max-h-none bg-white">
          {cart.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-[#9c8285] text-center p-4">
              <ShoppingCart className="h-10 w-10 text-[#d8bebf] mb-2 stroke-1" />
              <p className="text-xs font-semibold text-[#722f37]">Votre panier est vide</p>
              <p className="text-[11px] text-[#8a7577] mt-1">
                Touchez un produit à gauche ou scannez un code-barres pour encaisser.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-[#2c2627] truncate">
                    {item.product.name}
                  </h5>
                  <div className="text-[11px] text-[#8a7577] flex items-center gap-2 mt-0.5">
                    <span>{item.product.sellPrice} F</span>
                    <span>•</span>
                    <span className="text-[#722f37] font-bold">
                      Total : {item.product.sellPrice * item.quantity} F
                    </span>
                  </div>
                </div>

                {/* Tactile + and - quantity controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="h-7 w-7 rounded-xl bg-[#f5ecec] hover:bg-[#ebdada] text-[#722f37] flex items-center justify-center active:scale-95 transition cursor-pointer"
                    aria-label="Diminuer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-[#2c2627]">
                    {item.quantity}
                  </span>
                  <button
                    disabled={item.quantity >= item.product.stock}
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="h-7 w-7 rounded-xl bg-[#f5ecec] hover:bg-[#ebdada] text-[#722f37] flex items-center justify-center active:scale-95 transition disabled:opacity-30 cursor-pointer"
                    aria-label="Augmenter"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="h-7 w-7 rounded-xl text-[#b89fa1] hover:text-[#b3261e] hover:bg-[#fcebeb] flex items-center justify-center transition ml-1 cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Payment Form */}
        <div className="p-3.5 bg-[#fcf6f6] border-t border-[#f0e6e6] space-y-3">
          {/* Subtotal & Profit preview */}
          <div className="bg-white p-3 rounded-2xl border border-[#f0e6e6] shadow-xs space-y-1">
            <div className="flex justify-between items-center text-xs text-[#8a7577]">
              <span>Bénéfice net estimé :</span>
              <span className="font-bold text-[#722f37]">+{formatFCFA(totalCartProfit)}</span>
            </div>
            <div className="flex justify-between items-center text-base sm:text-lg font-black text-[#2c2627] pt-1 border-t border-[#f5e8e8]">
              <span>TOTAL À PAYER :</span>
              <span className="text-[#722f37] font-serif">{formatFCFA(totalCartAmount)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#722f37] uppercase mb-1.5 tracking-wider">
              Mode de Règlement :
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('ESPECES')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                  paymentMethod === 'ESPECES'
                    ? 'border-[#722f37] bg-[#f7ebeb] text-[#722f37] font-bold shadow-xs'
                    : 'border-[#ebdada] bg-white text-[#5c4749] hover:bg-[#fcf6f6]'
                }`}
              >
                <Banknote className="h-4 w-4 mb-0.5 text-[#722f37]" />
                <span>Espèces</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('WAVE_MOBILE')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                  paymentMethod === 'WAVE_MOBILE'
                    ? 'border-[#722f37] bg-[#f7ebeb] text-[#722f37] font-bold shadow-xs'
                    : 'border-[#ebdada] bg-white text-[#5c4749] hover:bg-[#fcf6f6]'
                }`}
              >
                <Smartphone className="h-4 w-4 mb-0.5 text-[#00a8e8]" />
                <span>Wave / MoMo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ORANGE_MONEY')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                  paymentMethod === 'ORANGE_MONEY'
                    ? 'border-[#722f37] bg-[#f7ebeb] text-[#722f37] font-bold shadow-xs'
                    : 'border-[#ebdada] bg-white text-[#5c4749] hover:bg-[#fcf6f6]'
                }`}
              >
                <CreditCard className="h-4 w-4 mb-0.5 text-[#ff7900]" />
                <span>Orange / Autre</span>
              </button>
            </div>
          </div>

          {/* Cash input & change calculator if Cash selected */}
          {paymentMethod === 'ESPECES' && totalCartAmount > 0 && (
            <div className="space-y-2 bg-white p-2.5 rounded-xl border border-[#f0e6e6] text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#5c4749]">Espèces Reçues :</span>
                <input
                  type="number"
                  value={amountReceivedStr}
                  onChange={(e) => setAmountReceivedStr(e.target.value)}
                  placeholder={`Ex: ${totalCartAmount}`}
                  className="w-28 text-right px-2.5 py-1 border border-[#e8d8d8] rounded-lg text-xs font-bold text-[#2c2627] focus:outline-none focus:ring-1 focus:ring-[#722f37]"
                />
              </div>

              {/* Quick Cash preset pills */}
              <div className="flex gap-1 justify-end pt-1">
                {[500, 1000, 2000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountReceivedStr(String(preset))}
                    className="px-2 py-0.5 text-[10px] bg-[#fcf6f6] hover:bg-[#f5e8e8] text-[#722f37] rounded-lg font-bold border border-[#eddada] cursor-pointer"
                  >
                    {preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>

              {amountReceivedNum > 0 && (
                <div className="flex justify-between items-center pt-1.5 border-t border-[#f5e8e8] font-bold">
                  <span className="text-[#5c4749]">Monnaie à rendre :</span>
                  <span
                    className={`text-sm ${
                      changeReturned >= 0 ? 'text-[#2d6a4f]' : 'text-[#b3261e]'
                    }`}
                  >
                    {changeReturned >= 0
                      ? formatFCFA(changeReturned)
                      : `Manque ${formatFCFA(Math.abs(changeReturned))}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Main Encaisser Button */}
          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-3.5 px-4 bg-[#722f37] hover:bg-[#853740] active:scale-98 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-[#8f3e48]"
          >
            <Check className="h-5 w-5 text-[#d4a373]" />
            <span>Valider la Vente & Encaisser ({formatFCFA(totalCartAmount)})</span>
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onProductScanned={(prod) => {
          addToCart(prod);
        }}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={lastSale}
      />
    </div>
  );
};
