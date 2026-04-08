const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { name, city } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required and must be a non-empty string' });
  }
  if (!city || typeof city !== 'string' || city.trim() === '') {
    return res.status(400).json({ error: 'city is required and must be a non-empty string' });
  }

  const result = db.prepare('INSERT INTO suppliers (name, city) VALUES (?, ?)').run(name.trim(), city.trim());
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(supplier);
});

module.exports = router;
