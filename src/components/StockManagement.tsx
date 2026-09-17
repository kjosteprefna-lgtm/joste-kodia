import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  AlertTriangle,
  Edit2,
  Trash2,
  Check,
  X,
  TrendingUp,
  Boxes,
  Barcode,
  ArrowUpDown,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { formatFCFA, exportInventoryCSV } from '../services/storage';

interface StockManagementProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onDeleteProduct: (productId: number) => void;
  onOpenExcelModal?: () => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  products,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onOpenExcelModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Toutes');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'sellPrice'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    category: 'Pâtisserie' as ProductCategory,
    buyPrice: 100,
    sellPrice: 150,
    stock: 20,
    minStockAlert: 5,
    unit: 'Unité',
  });

  const categories: ProductCategory[] = [
    'Toutes',
    'Pâtisserie',
    'Alimentation',
    'Boissons',
    'Matières Premières',
    'Entretien & Hygiène',
    'Articles Divers',
  ];

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchCat = selectedCategory === 'Toutes' || p.category === selectedCategory;
        const query = searchQuery.trim().toLowerCase();
        const matchQuery =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query));
        const matchLow = !onlyLowStock || p.stock <= p.minStockAlert;
        return matchCat && matchQuery && matchLow;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortBy === 'stock') cmp = a.stock - b.stock;
        else if (sortBy === 'sellPrice') cmp = a.sellPrice - b.sellPrice;
        return sortAsc ? cmp : -cmp;
      });
  }, [products, selectedCategory, searchQuery, onlyLowStock, sortBy, sortAsc]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert).length;
  }, [products]);

  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  const totalValuationSell = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.sellPrice, 0);
  }, [products]);

  // Open modal for new product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    const nextCodeNum = products.length + 1;
    const formattedCode = `ART-${String(nextCodeNum).padStart(4, '0')}`;
    setFormData({
      code: formattedCode,
      barcode: `200000000${String(nextCodeNum).padStart(4, '0')}`,
      name: '',
      category: 'Pâtisserie',
      buyPrice: 100,
      sellPrice: 150,
      stock: 25,
      minStockAlert: 5,
      unit: 'Unité',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      barcode: p.barcode || '',
      name: p.name,
      category: p.category,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
    });
    setIsModalOpen(true);
  };

  // Quick increment/decrement
  const handleAdjustStock = (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stock + delta);
    onUpdateProduct({ ...p, stock: newStock });
  };

  // Form Submit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...formData,
      });
    } else {
      onAddProduct({
        ...formData,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Overview KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#f5e8e8] text-[#722f37] border border-[#ebd8d8] flex items-center justify-center shrink-0">
            <Boxes className="h-6 w-6 text-[#722f37]" />
          </div>
          <div>
            <div className="text-xs text-[#8a7577] font-semibold">Articles au Catalogue Réel</div>
            <div className="text-xl font-black text-[#722f37] font-serif">{products.length} articles</div>
            <div className="text-[11px] text-[#8a7577]">En stock total : {totalStockUnits} unités</div>
          </div>
        </div>

        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#fbf0e4] text-[#a05a18] border border-[#f5dfca] flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-[#a05a18]" />
          </div>
          <div>
            <div className="text-xs text-[#8a7577] font-semibold">Alertes Stock Bas</div>
            <div className="text-xl font-black text-[#a05a18] font-serif">{lowStockCount} articles</div>
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className="text-[11px] font-bold text-[#722f37] hover:underline cursor-pointer"
            >
              {onlyLowStock ? 'Afficher tout le catalogue' : 'Filtrer uniquement les alertes'}
            </button>
          </div>
        </div>

        <div className="bg-[#fcf6f6] p-4 rounded-2xl border border-[#f0e6e6] shadow-xs flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#f9f2eb] text-[#8c5929] border border-[#e8d5c4] flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6 text-[#d4a373]" />
          </div>
          <div>
            <div className="text-xs text-[#8a7577] font-semibold">Valeur Marchande (Vente)</div>
            <div className="text-xl font-black text-[#2c2627] font-serif">{formatFCFA(totalValuationSell)}</div>
            <div className="text-[11px] text-[#8a7577]">Potentiel du stock en rayon</div>
          </div>
        </div>
      </div>

      {/* Main Stock Table Container */}
      <div className="bg-[#fdfbfb] rounded-2xl border border-[#f0e6e6] shadow-xs overflow-hidden flex flex-col">
        {/* Controls Bar */}
        <div className="p-3.5 border-b border-[#f0e6e6] bg-[#fcf6f6] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9c8285]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par nom (ex: Œufs, Farine, Huile), code ou code-barres..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-[#e8d8d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#722f37] text-[#2c2627] placeholder:text-[#a89597] transition"
              />
            </div>

            {/* Category selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory)}
              className="px-3 py-2 text-xs bg-white border border-[#e8d8d8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#722f37] font-bold text-[#722f37] cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {onOpenExcelModal && (
              <button
                onClick={onOpenExcelModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#551d24] bg-gradient-to-r from-[#f7e4d2] to-[#ebd2ba] hover:from-[#faecd9] hover:to-[#dfc5aa] border border-[#d4a373] rounded-xl transition shadow-2xs cursor-pointer"
                title="Synchroniser ou exporter directement avec votre fichier Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#722f37]" />
                <span>Excel (.xlsx)</span>
              </button>
            )}

            <button
              onClick={() => exportInventoryCSV(products)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#722f37] bg-white border border-[#e8d8d8] rounded-xl hover:bg-[#fcf6f6] transition shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#d4a373]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#722f37] hover:bg-[#853740] rounded-xl transition shadow-xs cursor-pointer border border-[#8f3e48]"
            >
              <Plus className="h-4 w-4 text-[#d4a373]" />
              <span>Nouvel Article</span>
            </button>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {onlyLowStock && (
          <div className="bg-[#fbf0e4] px-4 py-2.5 border-b border-[#f5dfca] text-xs text-[#7d481b] flex justify-between items-center">
            <span className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-[#c27c32]" /> Affichage filtré : uniquement les articles à réapprovisionner.
            </span>
            <button
              onClick={() => setOnlyLowStock(false)}
              className="font-bold underline hover:text-[#551d24] cursor-pointer"
            >
              Voir tous les articles
            </button>
          </div>
        )}

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fcf6f6] text-[#722f37] font-bold border-b border-[#f0e6e6] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5">Code / Réf</th>
                <th
                  onClick={() => {
                    if (sortBy === 'name') setSortAsc(!sortAsc);
                    else {
                      setSortBy('name');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-3.5 cursor-pointer hover:text-[#551d24]"
                >
                  <div className="flex items-center gap-1">
                    Article <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5">Catégorie</th>
                <th className="py-3 px-3.5 text-right">Prix Achat</th>
                <th
                  onClick={() => {
                    if (sortBy === 'sellPrice') setSortAsc(!sortAsc);
                    else {
                      setSortBy('sellPrice');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-[#551d24]"
                >
                  <div className="flex items-center justify-end gap-1">
                    Prix Vente <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'stock') setSortAsc(!sortAsc);
                    else {
                      setSortBy('stock');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-3.5 text-center cursor-pointer hover:text-[#551d24]"
                >
                  <div className="flex items-center justify-center gap-1">
                    Stock Actuel <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">Ajustement Rapide</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2e6e6] bg-white">
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const isLow = prod.stock > 0 && prod.stock <= prod.minStockAlert;

                return (
                  <tr
                    key={prod.id}
                    className={`hover:bg-[#fcf8f8] transition ${
                      isOutOfStock ? 'bg-[#faeded]' : isLow ? 'bg-[#fbf4eb]' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 font-mono text-[11px] text-[#5c4749]">
                      <div className="font-bold text-[#722f37]">{prod.code}</div>
                      {prod.barcode && (
                        <div className="text-[10px] text-[#8a7577] flex items-center gap-1">
                          <Barcode className="h-3 w-3 inline text-[#d4a373]" /> {prod.barcode}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5 font-bold text-[#2c2627] max-w-xs">
                      <div>{prod.name}</div>
                      <span className="text-[10px] text-[#8a7577] font-normal">
                        Unité : {prod.unit}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="bg-[#f7ebeb] text-[#722f37] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-right text-[#5c4749]">
                      {formatFCFA(prod.buyPrice)}
                    </td>

                    <td className="py-3 px-3.5 text-right font-extrabold text-[#722f37]">
                      {formatFCFA(prod.sellPrice)}
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          isOutOfStock
                            ? 'bg-[#fae1e1] text-[#b3261e]'
                            : isLow
                            ? 'bg-[#fbf0e4] text-[#a05a18]'
                            : 'bg-[#edf4ed] text-[#2d6a4f]'
                        }`}
                      >
                        {isOutOfStock && <AlertTriangle className="h-3 w-3" />}
                        {prod.stock} {prod.unit}
                      </span>
                    </td>

                    {/* Fast tactile +/- buttons for quick inventory adjustments */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="inline-flex items-center gap-1 bg-[#fcf6f6] border border-[#f0e4e4] p-0.5 rounded-xl">
                        <button
                          onClick={() => handleAdjustStock(prod, -1)}
                          disabled={prod.stock <= 0}
                          className="h-6 w-6 rounded-lg bg-white hover:bg-[#f5e8e8] text-[#722f37] font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer shadow-2xs"
                          title="-1"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(prod, 1)}
                          className="h-6 w-6 rounded-lg bg-white hover:bg-[#f5e8e8] text-[#722f37] font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                          title="+1"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(prod, 5)}
                          className="px-2 h-6 rounded-lg bg-[#f7ebeb] hover:bg-[#ebd8d8] text-[#722f37] font-bold text-[10px] flex items-center justify-center cursor-pointer"
                          title="+5"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleAdjustStock(prod, 25)}
                          className="px-2 h-6 rounded-lg bg-[#ebd8d8] hover:bg-[#dfc5c5] text-[#551d24] font-black text-[10px] flex items-center justify-center cursor-pointer"
                          title="+25"
                        >
                          +25
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 text-[#8a7577] hover:text-[#722f37] hover:bg-[#f7ebeb] rounded-xl transition cursor-pointer"
                          title="Modifier l'article"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Confirmer la suppression de "${prod.name}" du catalogue ?`)) {
                              onDeleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 text-[#b89fa1] hover:text-[#b3261e] hover:bg-[#fae1e1] rounded-xl transition cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-[#8a7577]">
              <Boxes className="h-10 w-10 mx-auto text-[#d4a373] mb-2 stroke-1" />
              <p className="font-bold text-sm text-[#722f37]">Aucun produit ne correspond à ces critères</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#fcf6f6] border-t border-[#f0e6e6] text-xs text-[#8a7577] flex justify-between items-center px-4">
          <span className="font-medium">{filteredProducts.length} articles affichés sur 80 réels</span>
          <span className="text-[#722f37] font-semibold">Modifications sauvegardées automatiquement en local</span>
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#f0e6e6] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between bg-[#722f37] px-5 py-3.5 text-white border-b border-[#8f3e48]">
              <h3 className="font-bold text-sm font-serif">
                {editingProduct ? 'Modifier l\'Article du Catalogue' : 'Ajouter un Nouvel Article au Catalogue'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-[#edd2b8] hover:bg-[#5a1f26] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#722f37] mb-1">Code Interne :</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 border border-[#e8d8d8] rounded-xl font-mono focus:ring-1 focus:ring-[#722f37] text-[#2c2627]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#722f37] mb-1">Code-Barres EAN :</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Ex: 2000000000018"
                    className="w-full p-2 border border-[#e8d8d8] rounded-xl font-mono focus:ring-1 focus:ring-[#722f37] text-[#2c2627]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#722f37] mb-1">Nom de l'Article :</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Gâteau Fait Maison, Œufs frais..."
                  className="w-full p-2 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#722f37] mb-1">Catégorie :</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ProductCategory })
                    }
                    className="w-full p-2 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627] font-medium"
                  >
                    {categories.filter((c) => c !== 'Toutes').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#722f37] mb-1">Unité de Vente :</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Ex: Unité, Litre, Sac 25kg..."
                    className="w-full p-2 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#722f37] mb-1">Prix d'Achat (FCFA) :</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.buyPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, buyPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#722f37] mb-1">Prix de Vente (FCFA) :</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sellPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#722f37] mb-1">Stock Initial :</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#722f37] mb-1">Seuil Alerte Stock :</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockAlert: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full p-2 border border-[#e8d8d8] rounded-xl focus:ring-1 focus:ring-[#722f37] text-[#2c2627]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#f0e6e6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#e8d8d8] rounded-xl text-[#5c4749] hover:bg-[#fcf6f6] font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#722f37] hover:bg-[#853740] text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer border border-[#8f3e48]"
                >
                  <Check className="h-4 w-4 text-[#d4a373]" />
                  <span>Enregistrer l'Article</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
