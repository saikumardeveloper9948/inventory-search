const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Load inventory data
const inventoryData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8')
);

/**
 * GET /search
 * Query parameters:
 * - q: product name (partial match, case-insensitive)
 * - category: filter by category
 * - minPrice: minimum price
 * - maxPrice: maximum price
 */
app.get('/search', (req, res) => {
  const { q = '', category = '', minPrice = '', maxPrice = '' } = req.query;

  try {
    // Validate price inputs
    const min = minPrice !== '' ? parseFloat(minPrice) : -Infinity;
    const max = maxPrice !== '' ? parseFloat(maxPrice) : Infinity;

    if (isNaN(min) || isNaN(max)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid price range. Please enter valid numbers.',
      });
    }

    if (min > max) {
      return res.status(400).json({
        success: false,
        error: 'minPrice cannot be greater than maxPrice.',
      });
    }

    // Filter results
    const results = inventoryData.filter((item) => {
      // Product name search (case-insensitive, partial match)
      const matchesQuery =
        q === '' ||
        item.product_name.toLowerCase().includes(q.toLowerCase());

      // Category filter
      const matchesCategory =
        category === '' ||
        item.category.toLowerCase() === category.toLowerCase();

      // Price range filter
      const matchesPrice = item.price >= min && item.price <= max;

      return matchesQuery && matchesCategory && matchesPrice;
    });

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /categories
 * Returns list of all unique categories
 */
app.get('/categories', (req, res) => {
  const categories = [...new Set(inventoryData.map((item) => item.category))];
  res.json({
    success: true,
    data: categories.sort(),
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📍 Search endpoint: http://localhost:${PORT}/search`);
});
