const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { supplier_id, product_name, category, quantity, price } = req.body;

  if (!supplier_id || isNaN(parseInt(supplier_id))) {
    return res.status(400).json({ error: 'supplier_id is required and must be a number' });
  }
  const supplier = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(parseInt(supplier_id));
  if (!supplier) {
    return res.status(400).json({ error: `Supplier with id ${supplier_id} does not exist` });
  }

  if (!product_name || typeof product_name !== 'string' || product_name.trim() === '') {
    return res.status(400).json({ error: 'product_name is required and must be a non-empty string' });
  }

  const validCategories = ['Electronics', 'Industrial', 'Office', 'Hardware', 'Clothing'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty < 0) {
    return res.status(400).json({ error: 'quantity must be a non-negative integer' });
  }

  const prc = parseFloat(price);
  if (isNaN(prc) || prc <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }

  const result = db
    .prepare('INSERT INTO inventory (supplier_id, product_name, category, quantity, price) VALUES (?, ?, ?, ?, ?)')
    .run(parseInt(supplier_id), product_name.trim(), category, qty, prc);

  const item = db
    .prepare(`
      SELECT i.*, s.name AS supplier_name, s.city AS supplier_city
      FROM inventory i JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = ?
    `)
    .get(result.lastInsertRowid);

  res.status(201).json(item);
});

router.get('/', (req, res) => {
  const rows = db
    .prepare(`
      SELECT
        s.id AS supplier_id,
        s.name AS supplier_name,
        s.city AS supplier_city,
        SUM(i.quantity * i.price) AS total_value,
        JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', i.id,
            'product_name', i.product_name,
            'category', i.category,
            'quantity', i.quantity,
            'price', i.price
          )
        ) AS items
      FROM inventory i
      JOIN suppliers s ON i.supplier_id = s.id
      GROUP BY s.id
      ORDER BY total_value DESC
    `)
    .all();

  const result = rows.map((row) => ({
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name,
    supplier_city: row.supplier_city,
    total_value: Math.round(row.total_value * 100) / 100,
    items: JSON.parse(row.items),
  }));

  res.json(result);
});

module.exports = router;
