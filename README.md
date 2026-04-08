# Inventory Search

A full-stack inventory search application built with Node.js/Express (backend) and React/Vite (frontend), using SQLite for storage.

## Project Overview

Search and filter inventory items across multiple suppliers by product name, category, and price range. The backend exposes REST APIs for managing suppliers, inventory, and searching products.

## How to Run

### Backend

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

The frontend proxies `/api/*` requests to the backend at `http://localhost:3001`.

## API Documentation

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search inventory with optional filters |

**Query Parameters:**
- `q` — partial product name match (case-insensitive)
- `category` — filter by category (`Electronics`, `Industrial`, `Office`, `Hardware`, `Clothing`)
- `minPrice` — minimum price (inclusive)
- `maxPrice` — maximum price (inclusive)

If no filters are provided, all inventory items are returned.

Returns `400` if `minPrice > maxPrice`.

### Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/supplier` | Create a new supplier |

**Request body:** `{ "name": "string", "city": "string" }`

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/inventory` | Create a new inventory item |
| GET  | `/inventory` | List all inventory grouped by supplier |

**POST request body:** `{ "supplier_id": number, "product_name": "string", "category": "string", "quantity": number, "price": number }`

**Validation rules:**
- `supplier_id` must reference an existing supplier
- `quantity` must be >= 0
- `price` must be > 0

**GET response:** Items grouped by supplier, sorted by total value (`quantity × price`) descending.

## Database Schema

### `suppliers`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| name | TEXT | Supplier name |
| city | TEXT | Supplier city |

### `inventory`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| supplier_id | INTEGER FK | References `suppliers.id` |
| product_name | TEXT | Name of the product |
| category | TEXT | Product category |
| quantity | INTEGER | Stock quantity (>= 0) |
| price | REAL | Unit price (> 0) |

## Search Logic

The `/search` endpoint builds a dynamic SQL query:

1. All filters are optional — omitting all returns every item.
2. `q` uses `LIKE '%value%'` with `LOWER()` for case-insensitive partial matching.
3. `category` uses an exact case-insensitive match.
4. `minPrice` / `maxPrice` apply `>=` / `<=` filters on the `price` column.
5. Results include joined supplier information (`supplier_name`, `supplier_city`).

## Why SQLite?

SQLite is a great fit for this project because:
- **Zero configuration** — no server to install or manage.
- **Self-contained** — the entire database lives in a single file.
- **Sufficient performance** — handles thousands of inventory records easily for a search application.
- **better-sqlite3** provides a synchronous, high-performance Node.js interface.

## Performance Improvement Suggestion

For large datasets, add composite indexes on the most frequently filtered columns:

```sql
CREATE INDEX IF NOT EXISTS idx_product_name ON inventory(product_name);
CREATE INDEX IF NOT EXISTS idx_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_category_price ON inventory(category, price);
```

These indexes are already created by `db.js` at startup. For even better `LIKE` search performance on large tables, consider a full-text search index using SQLite's FTS5 extension:

```sql
CREATE VIRTUAL TABLE inventory_fts USING fts5(product_name, content='inventory', content_rowid='id');
```
