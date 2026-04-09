const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('./db');

const app = express();
const PORT = 5001; // Different port from Assignment A

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize database
const db = new Database();

/**
 * POST /supplier
 * Create a new supplier
 * Body: { name, city }
 */
app.post('/supplier', async (req, res) => {
  try {
    const { name, city } = req.body;

    // Validation
    if (!name || !city) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, city',
      });
    }

    if (name.trim() === '' || city.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Name and city cannot be empty',
      });
    }

    // Insert supplier
    const result = await db.run(
      `INSERT INTO suppliers (name, city) VALUES (?, ?)`,
      [name.trim(), city.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      id: result.id,
      supplier: { id: result.id, name, city },
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: `Supplier "${req.body.name}" already exists`,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /inventory
 * Create a new inventory item
 * Body: { supplier_id, product_name, category, quantity, price }
 */
app.post('/inventory', async (req, res) => {
  try {
    const { supplier_id, product_name, category = 'Uncategorized', quantity, price } = req.body;

    // Validation
    if (!supplier_id || !product_name || quantity === undefined || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: supplier_id, product_name, quantity, price',
      });
    }

    // Validate supplier exists
    const supplier = await db.get(`SELECT id FROM suppliers WHERE id = ?`, [
      supplier_id,
    ]);

    if (!supplier) {
      return res.status(400).json({
        success: false,
        error: `Supplier with ID ${supplier_id} does not exist`,
      });
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a non-negative integer',
      });
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive number',
      });
    }

    // Validate product name
    if (product_name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Product name cannot be empty',
      });
    }

    // Insert inventory
    const result = await db.run(
      `INSERT INTO inventory (supplier_id, product_name, category, quantity, price) 
       VALUES (?, ?, ?, ?, ?)`,
      [supplier_id, product_name.trim(), category.trim() || 'Uncategorized', qty, priceNum]
    );

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      id: result.id,
      item: {
        id: result.id,
        supplier_id,
        product_name,
        category,
        quantity: qty,
        price: priceNum,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /inventory
 * Get all inventory items with supplier information
 */
app.get('/inventory', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT 
        i.id,
        i.supplier_id,
        i.product_name,
        i.quantity,
        i.price,
        s.name as supplier_name,
        s.city as supplier_city,
        (i.quantity * i.price) as total_value
      FROM inventory i
      JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY i.id
    `);

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /inventory-by-supplier
 * Get all inventory grouped by supplier, sorted by total inventory value
 * This is the required complex query
 */
app.get('/inventory-by-supplier', async (req, res) => {
  try {
    const suppliers = await db.all(`
      SELECT 
        s.id,
        s.name,
        s.city,
        COUNT(i.id) as item_count,
        COALESCE(SUM(i.quantity), 0) as total_quantity,
        COALESCE(SUM(i.quantity * i.price), 0) as total_inventory_value
      FROM suppliers s
      LEFT JOIN inventory i ON s.id = i.supplier_id
      GROUP BY s.id, s.name, s.city
      ORDER BY total_inventory_value DESC
    `);

    // Get detailed items for each supplier
    const result = await Promise.all(
      suppliers.map(async (supplier) => {
        const items = await db.all(
          `SELECT id, product_name, quantity, price, (quantity * price) as total_value 
           FROM inventory WHERE supplier_id = ? 
           ORDER BY total_value DESC`,
          [supplier.id]
        );

        return {
          supplier: {
            id: supplier.id,
            name: supplier.name,
            city: supplier.city,
          },
          summary: {
            item_count: supplier.item_count,
            total_quantity: supplier.total_quantity,
            total_inventory_value: parseFloat(supplier.total_inventory_value.toFixed(2)),
          },
          items,
        };
      })
    );

    res.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /suppliers
 * Get all suppliers
 */
app.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await db.all(`
      SELECT 
        s.id,
        s.name,
        s.city,
        COUNT(i.id) as inventory_count
      FROM suppliers s
      LEFT JOIN inventory i ON s.id = i.supplier_id
      GROUP BY s.id, s.name, s.city
      ORDER BY s.name
    `);

    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /supplier/:id
 * Update supplier information
 * Body: { name, city }
 */
app.put('/supplier/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city } = req.body;

    // Validation
    if (!name || !city) {
      return res.status(400).json({
        success: false,
        error: 'Name and city are required',
      });
    }

    if (name.trim() === '' || city.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Name and city cannot be empty',
      });
    }

    // Check if supplier exists
    const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: `Supplier with ID ${id} not found`,
      });
    }

    // Update supplier
    await db.run(
      `UPDATE suppliers SET name = ?, city = ? WHERE id = ?`,
      [name.trim(), city.trim(), id]
    );

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      supplier: { id, name: name.trim(), city: city.trim() },
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: `Supplier name "${req.body.name}" already exists`,
      });
    }
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /supplier/:id
 * Delete supplier (cascade deletes all inventory items)
 */
app.delete('/supplier/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier exists
    const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: `Supplier with ID ${id} not found`,
      });
    }

    // Count items before deletion
    const itemsResult = await db.get(
      'SELECT COUNT(*) as count FROM inventory WHERE supplier_id = ?',
      [id]
    );
    const itemsDeleted = itemsResult.count;

    // Delete supplier (cascade delete via foreign key)
    await db.run('DELETE FROM suppliers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
      deletedSupplier: supplier,
      itemsDeleted: itemsDeleted,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /inventory/:id
 * Update inventory item
 * Body: { supplier_id, product_name, category, quantity, price }
 */
app.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_id, product_name, category = 'Uncategorized', quantity, price } = req.body;

    // Check if item exists
    const item = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: `Inventory item with ID ${id} not found`,
      });
    }

    // Validation
    if (!supplier_id || !product_name || quantity === undefined || !price) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: supplier_id, product_name, quantity, price',
      });
    }

    // Validate supplier exists
    const supplier = await db.get('SELECT id FROM suppliers WHERE id = ?', [
      supplier_id,
    ]);
    if (!supplier) {
      return res.status(400).json({
        success: false,
        error: `Supplier with ID ${supplier_id} does not exist`,
      });
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a non-negative integer',
      });
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive number',
      });
    }

    // Validate product name
    if (product_name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Product name cannot be empty',
      });
    }

    // Update inventory
    await db.run(
      `UPDATE inventory SET supplier_id = ?, product_name = ?, category = ?, quantity = ?, price = ? WHERE id = ?`,
      [supplier_id, product_name.trim(), category.trim() || 'Uncategorized', qty, priceNum, id]
    );

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      item: {
        id,
        supplier_id,
        product_name: product_name.trim(),
        category: category.trim() || 'Uncategorized',
        quantity: qty,
        price: priceNum,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /inventory/:id
 * Delete inventory item
 */
app.delete('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const item = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: `Inventory item with ID ${id} not found`,
      });
    }

    // Delete item
    await db.run('DELETE FROM inventory WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
      deletedItem: item,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /export/csv
 * Export inventory data to CSV format
 */
app.get('/export/csv', async (req, res) => {
  try {
    // Fetch all inventory with supplier info
    const items = await db.all(`
      SELECT 
        i.id,
        s.name as supplier_name,
        s.city as supplier_city,
        i.product_name,
        i.quantity,
        i.price,
        (i.quantity * i.price) as total_value
      FROM inventory i
      JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY s.name, i.product_name
    `);

    // Build CSV header
    const headers = ['ID', 'Supplier', 'City', 'Product', 'Quantity', 'Price', 'Total Value'];
    const csvContent = [
      headers.join(','),
      ...items.map(item =>
        [
          item.id,
          `"${item.supplier_name}"`,
          `"${item.supplier_city}"`,
          `"${item.product_name}"`,
          item.quantity,
          item.price.toFixed(2),
          item.total_value.toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    // Add summary
    const totalValue = items.reduce((sum, item) => sum + item.total_value, 0);
    const summary = `\n\nSummary\nTotal Items,${items.length}\nTotal Value,$${totalValue.toFixed(2)}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-export.csv"');
    res.send(csvContent + summary);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export CSV',
    });
  }
});

/**
 * GET /analytics
 * Get analytics data for dashboard charts
 */
app.get('/analytics', async (req, res) => {
  try {
    // Top suppliers by value
    const topSuppliers = await db.all(`
      SELECT 
        s.id,
        s.name,
        COUNT(i.id) as item_count,
        SUM(i.quantity) as total_quantity,
        SUM(i.quantity * i.price) as total_value
      FROM suppliers s
      LEFT JOIN inventory i ON s.id = i.supplier_id
      GROUP BY s.id, s.name
      ORDER BY total_value DESC
      LIMIT 5
    `);

    // Inventory by price range
    const priceRanges = await db.all(`
      SELECT 
        CASE 
          WHEN price < 20 THEN '$0-20'
          WHEN price < 50 THEN '$20-50'
          WHEN price < 100 THEN '$50-100'
          WHEN price < 500 THEN '$100-500'
          ELSE '$500+'
        END as price_range,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM inventory
      GROUP BY price_range
      ORDER BY CASE 
        WHEN price < 20 THEN 1
        WHEN price < 50 THEN 2
        WHEN price < 100 THEN 3
        WHEN price < 500 THEN 4
        ELSE 5
      END
    `);

    // Stock levels
    const stockLevels = await db.all(`
      SELECT 
        CASE 
          WHEN quantity = 0 THEN 'Out of Stock'
          WHEN quantity < 50 THEN 'Low Stock'
          WHEN quantity < 200 THEN 'Medium Stock'
          ELSE 'High Stock'
        END as level,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM inventory
      GROUP BY level
    `);

    // Overall stats
    const stats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM suppliers) as total_suppliers,
        (SELECT COUNT(*) FROM inventory) as total_items,
        (SELECT SUM(quantity) FROM inventory) as total_quantity,
        (SELECT SUM(quantity * price) FROM inventory) as total_value,
        (SELECT AVG(price) FROM inventory) as avg_price,
        (SELECT AVG(quantity) FROM inventory) as avg_quantity
    `);

    res.json({
      success: true,
      data: {
        stats: {
          totalSuppliers: stats.total_suppliers || 0,
          totalItems: stats.total_items || 0,
          totalQuantity: stats.total_quantity || 0,
          totalValue: parseFloat((stats.total_value || 0).toFixed(2)),
          avgPrice: stats.avg_price ? parseFloat(stats.avg_price.toFixed(2)) : 0,
          avgQuantity: stats.avg_quantity ? parseFloat(stats.avg_quantity.toFixed(2)) : 0,
        },
        topSuppliers: topSuppliers.map(s => ({
          ...s,
          total_value: parseFloat((s.total_value || 0).toFixed(2)),
        })),
        priceRanges,
        stockLevels,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

/**
 * GET /search
 * Search inventory with filters
 * Query params: q (product name), category, minPrice, maxPrice
 */
app.get('/search', async (req, res) => {
  try {
    const { q = '', category = '', minPrice = 0, maxPrice = Infinity } = req.query;

    // Parse price filters
    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || Infinity;

    // Validate price range
    if (min < 0 || max < 0 || min > max) {
      return res.status(400).json({
        success: false,
        error: 'Invalid price range',
      });
    }

    // Build dynamic query based on filters
    let query = `
      SELECT 
        i.id,
        i.supplier_id,
        i.product_name,
        i.category,
        i.quantity,
        i.price,
        s.name as supplier_name,
        s.city as supplier_city,
        (i.quantity * i.price) as total_value
      FROM inventory i
      JOIN suppliers s ON i.supplier_id = s.id
      WHERE 1=1
    `;
    
    const params = [];

    // Add product name filter (case-insensitive)
    if (q.trim()) {
      query += ` AND LOWER(i.product_name) LIKE LOWER(?)`;
      params.push(`%${q.trim()}%`);
    }

    // Add category filter
    if (category.trim()) {
      query += ` AND LOWER(i.category) LIKE LOWER(?)`;
      params.push(`%${category.trim()}%`);
    }

    // Add price range filters
    if (min > 0) {
      query += ` AND i.price >= ?`;
      params.push(min);
    }

    if (max < Infinity) {
      query += ` AND i.price <= ?`;
      params.push(max);
    }

    query += ` ORDER BY i.id`;

    const results = await db.all(query, params);

    res.json({
      success: true,
      count: results.length,
      filters: {
        searchTerm: q,
        category: category,
        priceRange: { min, max },
      },
      data: results,
    });
  } catch (error) {
    console.error('Error searching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
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
  console.log(`🚀 Database Server running at http://localhost:${PORT}`);
  console.log(`📍 API endpoints:`);
  console.log(`   POST http://localhost:${PORT}/supplier`);
  console.log(`   POST http://localhost:${PORT}/inventory`);
  console.log(`   GET  http://localhost:${PORT}/inventory`);
  console.log(`   GET  http://localhost:${PORT}/inventory-by-supplier`);
  console.log(`   GET  http://localhost:${PORT}/suppliers`);
});
