const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../inventory.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity >= 0),
    price REAL NOT NULL CHECK(price > 0),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE INDEX IF NOT EXISTS idx_product_name ON inventory(product_name);
  CREATE INDEX IF NOT EXISTS idx_category ON inventory(category);
`);

const seedData = () => {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM suppliers').get();
  if (count.cnt > 0) return;

  const insertSupplier = db.prepare('INSERT INTO suppliers (name, city) VALUES (?, ?)');
  const insertInventory = db.prepare(
    'INSERT INTO inventory (supplier_id, product_name, category, quantity, price) VALUES (?, ?, ?, ?, ?)'
  );

  const suppliers = db.transaction(() => {
    const s1 = insertSupplier.run('TechSupply Co', 'San Francisco');
    const s2 = insertSupplier.run('Global Parts', 'Chicago');
    const s3 = insertSupplier.run('Electronics Hub', 'Austin');
    const s4 = insertSupplier.run('Industrial Goods', 'Detroit');
    const s5 = insertSupplier.run('Prime Stock', 'Seattle');
    return [s1.lastInsertRowid, s2.lastInsertRowid, s3.lastInsertRowid, s4.lastInsertRowid, s5.lastInsertRowid];
  })();

  db.transaction(() => {
    const [s1, s2, s3, s4, s5] = suppliers;
    insertInventory.run(s1, 'Laptop Pro 15',       'Electronics', 50,  1299.99);
    insertInventory.run(s1, 'Wireless Mouse',       'Electronics', 200, 29.99);
    insertInventory.run(s1, 'USB-C Hub',            'Electronics', 150, 49.99);
    insertInventory.run(s2, 'Steel Bolt Set',       'Hardware',    500, 12.99);
    insertInventory.run(s2, 'Pipe Wrench',          'Hardware',    80,  34.99);
    insertInventory.run(s2, 'Office Chair',         'Office',      60,  249.99);
    insertInventory.run(s3, '4K Monitor',           'Electronics', 75,  499.99);
    insertInventory.run(s3, 'Mechanical Keyboard',  'Electronics', 120, 89.99);
    insertInventory.run(s3, 'Webcam HD',            'Electronics', 90,  69.99);
    insertInventory.run(s4, 'Safety Gloves',        'Industrial',  300, 15.99);
    insertInventory.run(s4, 'Hard Hat',             'Industrial',  200, 24.99);
    insertInventory.run(s4, 'Reflective Vest',      'Clothing',    180, 19.99);
    insertInventory.run(s5, 'Standing Desk',        'Office',      40,  599.99);
    insertInventory.run(s5, 'Ergonomic Footrest',   'Office',      100, 39.99);
    insertInventory.run(s5, 'Winter Jacket',        'Clothing',    70,  129.99);
  })();
};

seedData();

module.exports = db;
