const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'inventory.db');
const db = new sqlite3.Database(dbPath);

let tablesCreated = 0;
let suppliersInserted = 0;

db.serialize(() => {
  // Create Suppliers table
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating suppliers table:', err);
    tablesCreated++;
  });

  // Create Inventory table
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT DEFAULT 'Uncategorized',
      quantity INTEGER NOT NULL CHECK(quantity >= 0),
      price REAL NOT NULL CHECK(price > 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating inventory table:', err);
    tablesCreated++;
  });

  // Create indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_supplier_id ON inventory(supplier_id)`, (err) => {
    if (err) console.error('Error creating index:', err);
  });
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_supplier_name ON suppliers(name)`, (err) => {
    if (err) console.error('Error creating index:', err);
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_product_name ON inventory(product_name)`, (err) => {
    if (err) console.error('Error creating index:', err);
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_category ON inventory(category)`, (err) => {
    if (err) console.error('Error creating index:', err);
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_price ON inventory(price)`, (err) => {
    if (err) console.error('Error creating index:', err);
  });

  // Insert sample suppliers
  const suppliers = [
    { name: 'TechCorp', city: 'San Francisco' },
    { name: 'FurnitureHub', city: 'Los Angeles' },
    { name: 'OfficeMax', city: 'New York' },
    { name: 'ElectroSupply', city: 'Chicago' },
  ];

  suppliers.forEach((supplier) => {
    db.run(
      `INSERT OR IGNORE INTO suppliers (name, city) VALUES (?, ?)`,
      [supplier.name, supplier.city],
      function(err) {
        if (err) console.error('Error inserting supplier:', err);
        suppliersInserted++;
      }
    );
  });
});

// Wait for initial setup, then insert inventory
setTimeout(() => {
  const inventoryData = [
    { supplier_id: 1, product_name: 'Wireless Mouse', quantity: 150, price: 29.99 },
    { supplier_id: 1, product_name: 'USB-C Cable', quantity: 300, price: 12.99 },
    { supplier_id: 1, product_name: 'LED Monitor 24"', quantity: 45, price: 249.99 },
    { supplier_id: 2, product_name: 'Office Chair', quantity: 30, price: 199.99 },
    { supplier_id: 2, product_name: 'Standing Desk', quantity: 20, price: 349.99 },
    { supplier_id: 2, product_name: 'Desk Lamp', quantity: 85, price: 45.99 },
    { supplier_id: 3, product_name: 'Document Organizer', quantity: 200, price: 24.99 },
    { supplier_id: 3, product_name: 'Notebook Set', quantity: 500, price: 15.99 },
    { supplier_id: 4, product_name: 'Mechanical Keyboard', quantity: 60, price: 89.99 },
    { supplier_id: 4, product_name: 'Wireless Headphones', quantity: 75, price: 79.99 },
  ];

  let itemsInserted = 0;

  inventoryData.forEach((item) => {
    db.run(
      `INSERT INTO inventory (supplier_id, product_name, quantity, price) 
       VALUES (?, ?, ?, ?)`,
      [item.supplier_id, item.product_name, item.quantity, item.price],
      function(err) {
        if (err) console.error('Error inserting inventory:', err);
        itemsInserted++;

        // Close DB when all items are inserted
        if (itemsInserted === inventoryData.length) {
          db.close((err) => {
            if (err) console.error('Error closing database:', err);
            else console.log('✅ Database initialized with sample data');
          });
        }
      }
    );
  });
}, 1000);
