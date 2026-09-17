import * as XLSX from 'xlsx';
import { Product, ProductCategory } from '../types';

export interface ExcelImportResult {
  products: Product[];
  totalRowsParsed: number;
  matchedCount: number;
  newCount: number;
  sheetName: string;
  errors: string[];
}

/**
 * Parses an Excel (.xlsx, .xls) file buffer or ArrayBuffer
 * Following user specification:
 * Sheet: 'Produits' (or first sheet)
 * Row 5 to max_row
 * Column 2 (B): Nom / Libellé
 * Column 7 (G): Prix de Vente
 * Column 12 (L): Stock Actuel
 */
export function parseExcelProducts(
  data: ArrayBuffer,
  existingProducts: Product[]
): ExcelImportResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const errors: string[] = [];

  // Find sheet 'Produits' (case insensitive) or take first sheet
  let targetSheetName = workbook.SheetNames.find(
    (name) => name.trim().toLowerCase() === 'produits'
  );

  if (!targetSheetName) {
    // Try finding any sheet containing 'prod'
    targetSheetName = workbook.SheetNames.find((name) =>
      name.toLowerCase().includes('prod')
    );
  }

  if (!targetSheetName) {
    targetSheetName = workbook.SheetNames[0];
  }

  if (!targetSheetName) {
    throw new Error('Aucune feuille trouvée dans le fichier Excel.');
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error(`Impossible de lire la feuille "${targetSheetName}".`);
  }

  // Convert sheet to array of arrays (A1, B1, etc.)
  const rows: (string | number | boolean | null | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  const parsedProducts: Product[] = [];
  let matchedCount = 0;
  let newCount = 0;

  // Row 5 is index 4 in 0-based array
  const startRowIndex = 4;

  // Build a lookup map of existing products by lowercase name and by code
  const existingByName = new Map<string, Product>();
  const existingByCode = new Map<string, Product>();
  for (const prod of existingProducts) {
    existingByName.set(prod.name.trim().toLowerCase(), prod);
    existingByCode.set(prod.code.trim().toLowerCase(), prod);
  }

  for (let r = startRowIndex; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Col 2 (B) is index 1
    const rawName = row[1];
    if (!rawName) continue;

    const name = String(rawName).trim();
    if (!name || name.toLowerCase().includes('total') || name.toLowerCase().includes('somme')) {
      continue;
    }

    // Col 1 (A) is index 0 (Code if present)
    const rawCode = row[0];
    let code = rawCode ? String(rawCode).trim() : '';

    // Col 7 (G) is index 6 (Prix Vente)
    const rawSellPrice = row[6];
    let sellPrice = 0;
    if (typeof rawSellPrice === 'number') {
      sellPrice = Math.round(rawSellPrice);
    } else if (rawSellPrice) {
      const parsed = parseFloat(String(rawSellPrice).replace(/[^\d.,]/g, '').replace(',', '.'));
      sellPrice = isNaN(parsed) ? 0 : Math.round(parsed);
    }

    // Col 12 (L) is index 11 (Stock Actuel)
    const rawStock = row[11];
    let stock = 0;
    if (typeof rawStock === 'number') {
      stock = Math.max(0, Math.round(rawStock));
    } else if (rawStock) {
      const parsed = parseFloat(String(rawStock).replace(/[^\d.,]/g, '').replace(',', '.'));
      stock = isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed));
    }

    // Col 5 (E) or 6 (F): Prix Achat (if available)
    const rawBuyPrice = row[4] ?? row[5];
    let buyPrice = Math.round(sellPrice * 0.75); // sensible default if not found
    if (typeof rawBuyPrice === 'number' && rawBuyPrice > 0) {
      buyPrice = Math.round(rawBuyPrice);
    } else if (rawBuyPrice) {
      const parsed = parseFloat(String(rawBuyPrice).replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) {
        buyPrice = Math.round(parsed);
      }
    }

    // Category detection: check col 3 or col 4, or deduce from name
    const rawCategory = row[2] ?? row[3];
    let category: ProductCategory = 'Alimentation';
    if (rawCategory && typeof rawCategory === 'string') {
      const catStr = rawCategory.trim();
      if (catStr.toLowerCase().includes('pâtis') || catStr.toLowerCase().includes('gateau')) {
        category = 'Pâtisserie';
      } else if (catStr.toLowerCase().includes('mati') || catStr.toLowerCase().includes('premi')) {
        category = 'Matières Premières';
      } else if (catStr.toLowerCase().includes('bois') || catStr.toLowerCase().includes('jus')) {
        category = 'Boissons';
      } else if (catStr.toLowerCase().includes('hyg') || catStr.toLowerCase().includes('entr')) {
        category = 'Entretien & Hygiène';
      } else if (catStr.toLowerCase().includes('div')) {
        category = 'Articles Divers';
      } else {
        category = 'Alimentation';
      }
    } else {
      // Deduce from name
      const lower = name.toLowerCase();
      if (lower.includes('gâteau') || lower.includes('gateau') || lower.includes('galette') || lower.includes('croissant') || lower.includes('madeleine') || lower.includes('pain')) {
        category = 'Pâtisserie';
      } else if (lower.includes('farine') || lower.includes('sucre') || lower.includes('beurre') || lower.includes('margarine') || lower.includes('levure') || lower.includes('arôme') || lower.includes('chocolat')) {
        category = 'Matières Premières';
      } else if (lower.includes('coca') || lower.includes('fanta') || lower.includes('sprite') || lower.includes('youki') || lower.includes('canette') || lower.includes('eau') || lower.includes('boisson') || lower.includes('jus')) {
        category = 'Boissons';
      } else if (lower.includes('savon') || lower.includes('javel') || lower.includes('omo') || lower.includes('détergent') || lower.includes('madar')) {
        category = 'Entretien & Hygiène';
      } else {
        category = 'Alimentation';
      }
    }

    // Match with existing product
    const existing = existingByName.get(name.toLowerCase()) || (code ? existingByCode.get(code.toLowerCase()) : undefined);

    if (existing) {
      matchedCount++;
      parsedProducts.push({
        ...existing,
        name,
        sellPrice: sellPrice > 0 ? sellPrice : existing.sellPrice,
        stock: rawStock !== null && rawStock !== undefined ? stock : existing.stock,
        buyPrice: buyPrice > 0 ? buyPrice : existing.buyPrice,
        category: existing.category || category,
      });
    } else {
      newCount++;
      if (!code) {
        code = `ART-${String(parsedProducts.length + existingProducts.length + 1).padStart(4, '0')}`;
      }
      parsedProducts.push({
        id: parsedProducts.length + existingProducts.length + 1,
        code,
        barcode: `200000000${String(parsedProducts.length + 1).padStart(4, '0')}`,
        name,
        category,
        buyPrice,
        sellPrice: sellPrice > 0 ? sellPrice : Math.round(buyPrice * 1.3),
        stock,
        minStockAlert: 5,
        unit: 'Unité',
      });
    }
  }

  return {
    products: parsedProducts,
    totalRowsParsed: parsedProducts.length,
    matchedCount,
    newCount,
    sheetName: targetSheetName,
    errors,
  };
}

/**
 * Exports current products to a real Excel workbook (.xlsx)
 * matching the user's Excel column format:
 * Row 4: Headers
 * Row 5+: Products
 * Col A (1): Code
 * Col B (2): Nom Produit
 * Col C (3): Catégorie
 * Col E (5): Prix Achat
 * Col G (7): Prix Vente
 * Col L (12): Stock Actuel
 */
export function exportProductsToExcel(
  products: Product[],
  fileName: string = 'Les_Delices_De_Maman_EXPERT_AVEC_MATIERES_PREMIERES.xlsx'
) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare sheet data grid
  const data: (string | number)[][] = [];

  // Title rows
  data.push(['LES DÉLICES DE MAMAN - FICHIER OFFICIEL CAISSE & STOCK']);
  data.push([`Exporté le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`]);
  data.push([]); // Empty row 3

  // Row 4: Headers
  // Col 1=Code, 2=Nom, 3=Catégorie, 4=Unité, 5=Prix Achat, 6=Marge, 7=Prix Vente, 8=Seuil Alerte, 9=Code-Barres, 10=Statut, 11=Valeur Stock, 12=Stock Actuel
  data.push([
    'Code Article (Col A)',
    'Désignation / Nom (Col B)',
    'Catégorie (Col C)',
    'Unité (Col D)',
    'Prix Achat FCFA (Col E)',
    'Marge Bénéficiaire (Col F)',
    'Prix Vente FCFA (Col G)',
    'Seuil Alerte (Col H)',
    'Code-Barres (Col I)',
    'Statut Rayon (Col J)',
    'Valeur Marchande FCFA (Col K)',
    'Stock Actuel (Col L)',
  ]);

  // Row 5+: Product rows
  products.forEach((p) => {
    const margin = p.sellPrice - p.buyPrice;
    const stockVal = p.stock * p.sellPrice;
    const status = p.stock <= 0 ? 'RUPTURE' : p.stock <= p.minStockAlert ? 'ALERTE' : 'DISPONIBLE';

    data.push([
      p.code,                          // Col A (1)
      p.name,                          // Col B (2)
      p.category,                      // Col C (3)
      p.unit,                          // Col D (4)
      p.buyPrice,                      // Col E (5)
      margin,                          // Col F (6)
      p.sellPrice,                     // Col G (7)
      p.minStockAlert,                 // Col H (8)
      p.barcode || '',                 // Col I (9)
      status,                          // Col J (10)
      stockVal,                        // Col K (11)
      p.stock,                         // Col L (12) - Stock Actuel
    ]);
  });

  // Convert to worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for beautiful presentation
  ws['!cols'] = [
    { wch: 14 }, // Code
    { wch: 45 }, // Name
    { wch: 22 }, // Category
    { wch: 12 }, // Unit
    { wch: 16 }, // Buy Price
    { wch: 16 }, // Margin
    { wch: 16 }, // Sell Price
    { wch: 14 }, // Min Alert
    { wch: 16 }, // Barcode
    { wch: 14 }, // Status
    { wch: 20 }, // Valuation
    { wch: 16 }, // Stock Actuel
  ];

  // Append sheet named 'Produits'
  XLSX.utils.book_append_sheet(wb, ws, 'Produits');

  // Trigger download in browser
  XLSX.writeFile(wb, fileName);
}
