import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  Download,
  Terminal,
  DollarSign,
  X,
  Sparkles,
} from 'lucide-react';

interface AndroidPythonGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidPythonGuideModal: React.FC<AndroidPythonGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonCode = `from flask import Flask, render_template_string, request, redirect, url_for, jsonify
import sqlite3
import datetime

app = Flask(__name__)
DB_NAME = "delices_maman.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Table Produits
    cursor.execute('''CREATE TABLE IF NOT EXISTS products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        code TEXT UNIQUE,
                        name TEXT,
                        category TEXT,
                        buy_price REAL,
                        sell_price REAL,
                        stock REAL
                    )''')
    # Table Ventes
    cursor.execute('''CREATE TABLE IF NOT EXISTS sales (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT,
                        product_code TEXT,
                        product_name TEXT,
                        quantity REAL,
                        unit_price REAL,
                        total_amount REAL,
                        profit REAL
                    )''')
    # Table Achats (Dépenses / Matières premières)
    cursor.execute('''CREATE TABLE IF NOT EXISTS purchases (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT,
                        supplier TEXT,
                        product_name TEXT,
                        quantity REAL,
                        total_cost REAL
                    )''')
    conn.commit()
    
    # Remplissage avec les données réelles de "Les Délices de Maman"
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        real_products = [
            ("ART-0001", "Gâteau Fait Maison", "Pâtisserie", 100, 150, 45),
            ("ART-0002", "Galette Fait Maison", "Pâtisserie", 100, 150, 40),
            ("ART-0003", "Œufs Frais (Plaquette)", "Alimentation", 2100, 2500, 18),
            ("ART-0004", "Farine de Blé Supérieure (Sac 25 kg)", "Matières Premières", 18500, 22000, 5),
            ("ART-0005", "Sucre Blanc en Poudre (Sac 50 kg)", "Matières Premières", 34000, 39000, 3),
            ("ART-0006", "Huile Végétale Raffinée (Bidon 10L)", "Alimentation", 11000, 13500, 8),
            ("ART-0007", "Riz Parfumé Qualité Supérieure (Sac 25 kg)", "Alimentation", 17500, 21000, 7),
            ("ART-0008", "Margarine / Beurre Pâtissier (Seau 10 kg)", "Matières Premières", 12500, 16000, 4),
            ("ART-0009", "Pâtes Alimentaires Panzani 500g", "Alimentation", 450, 600, 50),
            ("ART-0010", "Canette Coca-Cola 33cl", "Boissons", 400, 500, 36),
        ]
        cursor.executemany("INSERT OR IGNORE INTO products (code, name, category, buy_price, sell_price, stock) VALUES (?, ?, ?, ?, ?, ?)", real_products)
        conn.commit()
    conn.close()

# Interface Graphique Mobile / Web intégrée
TEMPLATE = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Les Délices de Maman - Caisse & Stock</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fdfbfb; margin: 0; padding: 0; color: #2c2627; }
        header { background: #722f37; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; border-bottom: 2px solid #d4a373; }
        .container { padding: 15px; max-width: 600px; margin: auto; }
        .card { background: #fcf6f6; padding: 15px; margin-bottom: 15px; border-radius: 12px; border: 1px solid #f0e6e6; }
        h2 { font-size: 16px; color: #722f37; margin-top: 0; border-bottom: 1px solid #ebdada; padding-bottom: 8px; }
        .btn { display: block; width: 100%; background: #722f37; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; text-align: center; text-decoration: none; margin-top: 10px; }
        .btn:hover { background: #853740; }
        input, select { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #e8d8d8; border-radius: 8px; box-sizing: border-box; background: white; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .stat-box { background: #f7ebeb; padding: 12px; border-radius: 8px; text-align: center; border-left: 4px solid #722f37; }
        .stat-box h3 { margin: 0; font-size: 13px; color: #722f37; }
        .stat-box p { margin: 5px 0 0; font-size: 18px; font-weight: bold; color: #2c2627; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; background: white; }
        th, td { border: 1px solid #f0e6e6; padding: 8px; text-align: left; }
        th { background-color: #f7ebeb; color: #722f37; }
    </style>
</head>
<body>
    <header>Les Délices de Maman (Caisse & Stock)</header>
    <div class="container">
        <div class="card">
            <h2>Situation Financière Réelle</h2>
            <div class="stats-grid">
                <div class="stat-box">
                    <h3>Chiffre d'Affaires</h3>
                    <p>{{ total_sales }} FCFA</p>
                </div>
                <div class="stat-box">
                    <h3>Bénéfice Net</h3>
                    <p>{{ total_profit }} FCFA</p>
                </div>
            </div>
        </div>
        <div class="card">
            <h2>Encaisser une Vente</h2>
            <form action="/sell" method="POST">
                <select name="product_code" required>
                    {% for p in products %}
                    <option value="{{ p[1] }}">{{ p[2] }} ({{ p[5] }} F) - Stock: {{ p[6] }}</option>
                    {% endfor %}
                </select>
                <input type="number" name="quantity" min="1" value="1" placeholder="Quantité" required>
                <button type="submit" class="btn">Valider la Vente & Encaisser</button>
            </form>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    init_db()
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM products ORDER BY name ASC")
    products = c.fetchall()
    c.execute("SELECT COALESCE(SUM(total_amount), 0), COALESCE(SUM(profit), 0) FROM sales")
    total_sales, total_profit = c.fetchone()
    conn.close()
    return render_template_string(TEMPLATE, products=products, total_sales=int(total_sales), total_profit=int(total_profit))

@app.route('/sell', methods=['POST'])
def sell():
    p_code = request.form['product_code']
    qty = float(request.form['quantity'])
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT name, buy_price, sell_price, stock FROM products WHERE code = ?", (p_code,))
    item = c.fetchone()
    if item and item[3] >= qty:
        name, buy_p, sell_p, cur_stk = item
        total = sell_p * qty
        profit = (sell_p - buy_p) * qty
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        c.execute("INSERT INTO sales (date, product_code, product_name, quantity, unit_price, total_amount, profit) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  (now, p_code, name, qty, sell_p, total, profit))
        c.execute("UPDATE products SET stock = stock - ? WHERE code = ?", (qty, p_code))
        conn.commit()
    conn.close()
    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    print("Application 'Les Délices de Maman' démarrée sur http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPyFile = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delices_maman_app.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#f0e6e6] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#722f37] px-5 py-3.5 text-white border-b border-[#8f3e48]">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-[#d4a373]" />
            <h3 className="font-bold text-sm tracking-wide font-serif">
              Guide Déploiement Smartphone Android & Script Python
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#edd2b8] hover:bg-[#5a1f26] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#2c2627]">
          {/* Method 1: PWA Instant Install (Best for Smartphone) */}
          <div className="p-4 rounded-2xl bg-[#fcf6f6] border border-[#f0e6e6]">
            <div className="flex items-center gap-2 font-bold text-[#722f37] text-sm mb-1.5 font-serif">
              <span className="flex h-5 w-5 rounded-full bg-[#722f37] text-white text-[10px] items-center justify-center font-sans">
                1
              </span>
              Solution Recommandée : Installation Directe sur Smartphone (PWA)
            </div>
            <p className="leading-relaxed text-[#5c4749]">
              Votre application est prête à l'emploi. Sur Chrome mobile Android : appuyez sur{' '}
              <strong>"Installer l'Application"</strong> ou le menu du navigateur (3 points &gt; <em>Ajouter à l'écran d'accueil</em>).
              L'icône s'ajoute sur votre téléphone et fonctionne 100% hors-ligne comme une application APK native !
            </p>
          </div>

          {/* Method 2: Pydroid 3 (Local execution on Android) */}
          <div className="p-4 rounded-2xl bg-[#fdfbfb] border border-[#ebdada]">
            <div className="flex items-center gap-2 font-bold text-[#722f37] text-sm mb-1.5 font-serif">
              <span className="flex h-5 w-5 rounded-full bg-[#722f37] text-white text-[10px] items-center justify-center font-sans">
                2
              </span>
              Option Pydroid 3 (Exécution Python locale directe sur Android)
            </div>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[#5c4749] leading-relaxed">
              <li>Installez l'application gratuite <strong>Pydroid 3</strong> sur le Play Store.</li>
              <li>Dans le menu PIP de Pydroid 3, installez Flask : <code className="bg-[#f7ebeb] text-[#722f37] px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">pip install flask</code></li>
              <li>Collez le script Python ci-dessous dans un fichier <code className="bg-[#f7ebeb] text-[#722f37] px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">app.py</code> et appuyez sur Play.</li>
              <li>Ouvrez votre navigateur à l'adresse <code className="bg-[#edf4ed] text-[#2d6a4f] px-1.5 py-0.5 rounded font-mono font-bold">http://127.0.0.1:5000</code>.</li>
            </ol>
          </div>

          {/* Commercialization Model */}
          <div className="p-4 rounded-2xl bg-[#fbf0e4] border border-[#f5dfca]">
            <div className="flex items-center gap-2 font-bold text-[#8c5929] text-sm mb-1.5 font-serif">
              <DollarSign className="h-4 w-4 text-[#d4a373]" />
              Modèle Commercial & Vente aux Boutiques (2 500 - 3 500 FCFA)
            </div>
            <p className="leading-relaxed text-[#7d481b]">
              Vous pouvez déployer ou installer cette caisse tactile chez vos confrères commerçants et facturer
              un abonnement ou des frais d'installation réglables par <strong>Wave, MTN MoMo ou Orange Money</strong>.
            </p>
          </div>

          {/* Python Flask Source Code app.py */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#722f37] flex items-center gap-1.5 font-serif text-sm">
                <Terminal className="h-4 w-4 text-[#722f37]" /> Script Python & SQLite (delices_maman.py)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPyFile}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-[#e8d8d8] text-[#5c4749] rounded-xl text-[11px] font-bold hover:bg-[#fcf6f6] transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-[#d4a373]" /> Télécharger .py
                </button>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3.5 py-1 bg-[#722f37] hover:bg-[#853740] text-white rounded-xl text-[11px] font-bold transition shadow-xs cursor-pointer border border-[#8f3e48]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-[#d4a373]" /> : <Copy className="h-3.5 w-3.5 text-[#d4a373]" />}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>

            <pre className="p-3 bg-[#1a1415] text-[#f7d6ba] rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-64 border border-[#382628]">
              {pythonCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#fcf6f6] border-t border-[#f0e6e6] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#5c4749] bg-white border border-[#ebdada] rounded-xl hover:bg-[#f7ebeb] cursor-pointer"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
