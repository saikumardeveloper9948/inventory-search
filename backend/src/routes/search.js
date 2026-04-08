const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  if (minPrice !== undefined && maxPrice !== undefined) {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      return res.status(400).json({ error: 'minPrice must be less than or equal to maxPrice' });
    }
  }

  let sql = `
    SELECT i.id, i.product_name, i.category, i.quantity, i.price,
           s.id AS supplier_id, s.name AS supplier_name, s.city AS supplier_city
    FROM inventory i
    JOIN suppliers s ON i.supplier_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (q && q.trim() !== '') {
    sql += ' AND LOWER(i.product_name) LIKE ?';
    params.push(`%${q.trim().toLowerCase()}%`);
  }

  if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
    sql += ' AND LOWER(i.category) = ?';
    params.push(category.trim().toLowerCase());
  }

  if (minPrice !== undefined && minPrice !== '') {
    const min = parseFloat(minPrice);
    if (isNaN(min)) return res.status(400).json({ error: 'Invalid minPrice' });
    sql += ' AND i.price >= ?';
    params.push(min);
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    const max = parseFloat(maxPrice);
    if (isNaN(max)) return res.status(400).json({ error: 'Invalid maxPrice' });
    sql += ' AND i.price <= ?';
    params.push(max);
  }

  sql += ' ORDER BY i.product_name ASC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

module.exports = router;
