const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'lionmarket.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) return reject(error);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

async function initDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK(price > 0),
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    image TEXT,
    phone TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const rows = await all('SELECT COUNT(*) AS count FROM products');
  if (rows[0].count > 0) return;

  const phone = String(process.env.WHATSAPP_NUMBER || '237656342696').replace(/\D/g, '');
  const seedProducts = [
    ['Smartphone Android', 75000, 'Téléphones', 'Yaoundé', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600', phone, 'Smartphone neuf pour usage quotidien.'],
    ['Ordinateur portable', 185000, 'Informatique', 'Douala', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600', phone, 'Ordinateur portable pour travail et étude.'],
    ['Chaussures tendance', 15000, 'Mode', 'Bafoussam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', phone, 'Chaussures modernes et confortables.'],
    ['Montre élégante', 12000, 'Mode', 'Yaoundé', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', phone, 'Montre classique pour un look chic.'],
    ['Canapé confortable', 150000, 'Maison', 'Douala', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', phone, 'Canapé confortable pour le salon.'],
    ['Service de nettoyage', 25000, 'Services', 'Yaoundé', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600', phone, 'Nettoyage professionnel pour maison et bureau.']
  ];

  for (const product of seedProducts) {
    await run('INSERT INTO products (name, price, category, city, image, phone, description) VALUES (?, ?, ?, ?, ?, ?, ?)', product);
  }
}

async function getProducts() {
  return all('SELECT id, name, price, category, city, image, phone, description FROM products ORDER BY id DESC');
}

async function addProduct(product) {
  const result = await run(
    'INSERT INTO products (name, price, category, city, image, phone, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [product.name, product.price, product.category, product.city, product.image, product.phone, product.description]
  );
  return { id: result.lastID, ...product };
}

module.exports = { initDatabase, getProducts, addProduct };
