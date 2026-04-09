# Inventory Search System

A full-stack inventory search application built with **Node.js/Express** (backend) and **React/Vite/Ant Design** (frontend).

## Features

✅ **Product Search** - Case-insensitive partial match on product names  
✅ **Category Filtering** - Filter inventory by category  
✅ **Price Range** - Filter by minimum and maximum price  
✅ **Multiple Filters** - Combine all filters simultaneously  
✅ **No Results State** - Graceful handling when no matches found  
✅ **Error Handling** - Input validation and error messages  

## Project Structure

```
inventory-search/
├── backend/
│   ├── server.js          # Express API server
│   ├── data.json          # Static inventory data
│   ├── package.json       # Backend dependencies
│   └── .gitignore
└── frontend/
    ├── src/
    │   ├── App.jsx        # Main React component
    │   ├── main.jsx       # React entry point
    │   └── index.css      # Global styles
    ├── index.html         # HTML template
    ├── vite.config.js     # Vite configuration
    ├── package.json       # Frontend dependencies
    └── .gitignore
```

## Setup Instructions

### Backend Setup

```bash
cd backend
npm install
npm start
```

Server runs on **http://localhost:5000**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173** (auto-opens in browser)

## API Documentation

### GET /search

Returns filtered inventory items.

**Query Parameters:**
- `q` (string, optional) - Product name partial match (case-insensitive)
- `category` (string, optional) - Filter by exact category
- `minPrice` (number, optional) - Minimum price filter
- `maxPrice` (number, optional) - Maximum price filter

**Example Requests:**

```bash
# All inventory
GET http://localhost:5000/search

# Search by product name
GET http://localhost:5000/search?q=mouse

# Filter by category and price
GET http://localhost:5000/search?category=Electronics&minPrice=50&maxPrice=200

# Combined filters
GET http://localhost:5000/search?q=desk&category=Furniture&minPrice=100&maxPrice=500
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "product_name": "Wireless Mouse",
      "category": "Electronics",
      "price": 29.99,
      "supplier": "TechCorp"
    }
  ]
}
```

### GET /categories

Returns all unique categories in inventory.

**Response:**

```json
{
  "success": true,
  "data": ["Electronics", "Furniture", "Office Supplies"]
}
```

## Search Logic

The search engine implements efficient filtering using a pipeline approach:

1. **Query Normalization** - Converts search input to lowercase
2. **Partial String Matching** - Uses `String.includes()` for flexible product name search
3. **Category Exact Match** - Case-insensitive but exact category matching
4. **Price Range Validation** - Validates min/max values and handles edge cases
5. **Multi-filter Combination** - All filters work together via boolean AND logic

**Edge Cases Handled:**
- Empty search query returns all results
- Invalid price range returns error message
- Price filter uses `-Infinity` and `+Infinity` for missing bounds
- No matches returns empty array with count 0
- Non-numeric price inputs rejected

## Performance Improvements for Large Datasets

### Current Implementation (In-Memory, ~12 items)

For small datasets (< 1,000 items), the current approach is sufficient.

### Recommended Optimizations for Scale (10,000+ items)

#### 1. **Database with Indexing** ⭐ Biggest Impact
```sql
-- PostgreSQL example
CREATE INDEX idx_product_name ON inventory(LOWER(product_name));
CREATE INDEX idx_category ON inventory(category);
CREATE INDEX idx_price ON inventory(price);
CREATE INDEX idx_combined ON inventory(category, price);
```
**Why:** Reduces O(n) scan to O(log n) lookup  
**Impact:** 100-1000x faster for large datasets

#### 2. **Full-Text Search Engine** (Elasticsearch/MeiliSearch)
- Tokenizes product names for better relevance
- Handles typos and fuzzy matching
- Natural language understanding
- **Trade-off:** Added infrastructure complexity

#### 3. **Caching Layer** (Redis)
```javascript
// Cache popular searches for 5 minutes
const cachedResult = await redis.get(`search:${cacheKey}`);
```
**Impact:** Avoids repeated database queries

#### 4. **Pagination** (Already implemented in frontend)
- Return 10-20 items per page instead of all results
- Reduces network payload and rendering time

#### 5. **Query Optimization**
```javascript
// Use limit/offset in SQL before returning results
SELECT * FROM inventory 
WHERE LOWER(product_name) LIKE '%mouse%'
AND category = 'Electronics'
AND price BETWEEN 20 AND 100
LIMIT 20 OFFSET 0;
```
**Impact:** Reduces data transfer from database

#### 6. **Aggregation Pipeline** (For complex analytics)
- Use database-level aggregation instead of application-level
- MongoDB: `$match` → `$group` → `$sort`
- SQL: `GROUP BY` clause

### Recommended Tech Stack for Scale

| Layer | Current | Recommended for 100K+ items |
|-------|---------|-----|
| API | Express | Express + Compression middleware |
| Database | JSON file | PostgreSQL with indexes |
| Search | In-memory filter | Elasticsearch or MeiliSearch |
| Cache | None | Redis |
| Frontend | Pagination (10 items) | Infinite scroll + virtualization |

### Example Optimized Backend (PostgreSQL + Redis)

```javascript
app.get('/search', async (req, res) => {
  const cacheKey = `search:${JSON.stringify(req.query)}`;
  
  // 1. Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  
  // 2. Query indexed database
  const results = await db.query(
    `SELECT * FROM inventory 
     WHERE LOWER(product_name) LIKE $1
     AND category = $2
     AND price BETWEEN $3 AND $4
     LIMIT 20`,
    [q, category, minPrice, maxPrice]
  );
  
  // 3. Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(results));
  
  res.json(results);
});
```

## Edge Cases Tested

| Case | Behavior |
|------|----------|
| Empty search | Returns all inventory (12 items) |
| No matches | Returns empty array with count 0 |
| Invalid price range (min > max) | Returns 400 error |
| Non-numeric price | Returns 400 error |
| Case variations (MoUsE) | Normalizes to lowercase, matches |
| Partial product name (just "mouse") | Matches "Wireless Mouse" |
| Multiple filters together | AND logic applied (all must match) |

## Technology Stack

**Backend:**
- Node.js
- Express 4.18
- CORS enabled
- File-based data storage

**Frontend:**
- React 18
- Vite (build tool)
- Ant Design 5 (UI components)
- Axios (HTTP client)

## Sample Data

12 items across 3 categories:
- **Electronics** (6 items): Mouse, USB-C Cable, Monitor, Keyboard, Headphones, Webcam, Mouse Pad
- **Furniture** (3 items): Office Chair, Standing Desk, Desk Lamp
- **Office Supplies** (2 items): Document Organizer, Notebook Set

Price range: $12.99 - $349.99

## Future Enhancements

- [ ] Add sort options (price, name, newest)
- [ ] Add favorites/wishlist feature
- [ ] Product detail modal with full specifications
- [ ] Advanced filters (supplier, quantity in stock)
- [ ] Search history/suggestions
- [ ] Export results to CSV
- [ ] Dark mode toggle

## License

MIT
