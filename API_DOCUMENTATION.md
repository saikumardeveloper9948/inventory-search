# 📡 Complete API Documentation

Comprehensive reference for all REST API endpoints in both projects.

---

## Base URLs

| Project | Service | URL |
|---|---|---|
| **A** | Backend API | http://localhost:5000 |
| **B** | Backend API | http://localhost:5001 |

---

# Project A: Search API

## Overview

Search API provides a fast, flexible way to query inventory with multiple filter options.

**Base URL:** `http://localhost:5000`

**Response Format:** JSON

**Error Handling:** Standard HTTP status codes + error messages

---

## GET /search

Search and filter inventory items.

### Request

```http
GET /search?q=mouse&category=Electronics&minPrice=10&maxPrice=100
Host: localhost:5000
```

### Parameters

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `q` | string | No | Product name (partial match, case-insensitive) | `mouse` |
| `category` | string | No | Category exact match | `Electronics` |
| `minPrice` | number | No | Minimum price filter | `10` |
| `maxPrice` | number | No | Maximum price filter | `100` |

### Response

**Success (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "product_name": "Wireless Mouse",
      "category": "Electronics",
      "price": 29.99,
      "supplier": "TechCorp"
    },
    {
      "id": 8,
      "product_name": "Mechanical Keyboard",
      "category": "Electronics",
      "price": 89.99,
      "supplier": "ElectroSupply"
    }
  ]
}
```

**Error (400 - Invalid Parameters):**
```json
{
  "success": false,
  "error": "Invalid price range: minPrice must be less than maxPrice"
}
```

**Error (500 - Server Error):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Examples

#### Search by Product Name

**Request:**
```bash
curl "http://localhost:5000/search?q=mouse"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "product_name": "Wireless Mouse",
      "category": "Electronics",
      "price": 29.99,
      "supplier": "TechCorp"
    },
    {
      "id": 6,
      "product_name": "Mouse Pad",
      "category": "Electronics",
      "price": 12.99,
      "supplier": "TechCorp"
    }
  ]
}
```

#### Filter by Category

**Request:**
```bash
curl "http://localhost:5000/search?category=Furniture"
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 7,
      "product_name": "Office Chair",
      "category": "Furniture",
      "price": 199.99,
      "supplier": "FurnitureHub"
    },
    {
      "id": 8,
      "product_name": "Standing Desk",
      "category": "Furniture",
      "price": 349.99,
      "supplier": "FurnitureHub"
    },
    {
      "id": 9,
      "product_name": "Desk Lamp",
      "category": "Furniture",
      "price": 45.99,
      "supplier": "FurnitureHub"
    }
  ]
}
```

#### Price Range Filter

**Request:**
```bash
curl "http://localhost:5000/search?minPrice=50&maxPrice=300"
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 3,
      "product_name": "LED Monitor 24\"",
      "category": "Electronics",
      "price": 249.99,
      "supplier": "TechCorp"
    },
    {
      "id": 7,
      "product_name": "Office Chair",
      "category": "Furniture",
      "price": 199.99,
      "supplier": "FurnitureHub"
    },
    {
      "id": 8,
      "product_name": "Standing Desk",
      "category": "Furniture",
      "price": 349.99,
      "supplier": "FurnitureHub"
    }
  ]
}
```

#### Combined Filters

**Request:**
```bash
curl "http://localhost:5000/search?q=desk&category=Furniture&minPrice=100&maxPrice=500"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 8,
      "product_name": "Standing Desk",
      "category": "Furniture",
      "price": 349.99,
      "supplier": "FurnitureHub"
    },
    {
      "id": 9,
      "product_name": "Desk Lamp",
      "category": "Furniture",
      "price": 45.99,
      "supplier": "FurnitureHub"
    }
  ]
}
```

#### Get All Items

**Request:**
```bash
curl "http://localhost:5000/search"
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [ /* all 12 items */ ]
}
```

### Status Codes

| Code | Meaning | When |
|---|---|---|
| 200 | OK | Request successful, results returned |
| 400 | Bad Request | Invalid parameters, minPrice > maxPrice |
| 500 | Server Error | Unexpected error loading data |

### Notes

- All filters use AND logic (all must match)
- Search is case-insensitive
- Partial product name matching supported
- Empty search returns all items
- No items match returns count: 0

---

## GET /categories

Get all unique categories for filtering.

### Request

```http
GET /categories
Host: localhost:5000
```

### Parameters

None

### Response

**Success (200):**
```json
{
  "success": true,
  "data": [
    "Electronics",
    "Furniture",
    "Office Supplies"
  ]
}
```

### Example

**Request:**
```bash
curl http://localhost:5000/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    "Electronics",
    "Furniture",
    "Office Supplies"
  ]
}
```

### Status Codes

| Code | Meaning |
|---|---|
| 200 | OK - Categories returned |
| 500 | Server Error |

### Use Cases

- Populate category dropdown filter
- Display category statistics
- Validate category input

---

## GET /health

Health check endpoint.

### Request

```http
GET /health
Host: localhost:5000
```

### Response

```json
{
  "status": "OK",
  "uptime": 3600
}
```

### Example

```bash
curl http://localhost:5000/health
```

---

# Project B: Database API

## Overview

Complete REST API for supplier and inventory management with CRUD operations.

**Base URL:** `http://localhost:5001`

**Authentication:** None (demo purposes)

**Rate Limiting:** None

---

## POST /supplier

Create a new supplier.

### Request

```http
POST /supplier
Host: localhost:5001
Content-Type: application/json

{
  "name": "NewTech",
  "city": "San Francisco"
}
```

### Body Parameters

| Parameter | Type | Required | Constraints | Example |
|---|---|---|---|---|
| `name` | string | Yes | Non-empty, unique | `"TechCorp"` |
| `city` | string | Yes | Non-empty | `"San Francisco"` |

### Response

**Success (201):**
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "id": 5,
  "supplier": {
    "id": 5,
    "name": "NewTech",
    "city": "San Francisco"
  }
}
```

**Error (400 - Missing Fields):**
```json
{
  "success": false,
  "error": "Name and city are required"
}
```

**Error (409 - Duplicate Name):**
```json
{
  "success": false,
  "error": "A supplier with this name already exists"
}
```

### Example

**Request:**
```bash
curl -X POST http://localhost:5001/supplier \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CloudSoft",
    "city": "Seattle"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "id": 5,
  "supplier": {
    "id": 5,
    "name": "CloudSoft",
    "city": "Seattle"
  }
}
```

### Validation

- ✓ Name must be non-empty string
- ✓ City must be non-empty string
- ✓ Name must be unique (database UNIQUE constraint)
- ✓ Whitespace trimmed automatically

### Status Codes

| Code | Meaning |
|---|---|
| 201 | Created successfully |
| 400 | Bad request - missing/invalid fields |
| 409 | Conflict - duplicate name |
| 500 | Server error |

---

## POST /inventory

Create inventory item linked to supplier.

### Request

```http
POST /inventory
Host: localhost:5001
Content-Type: application/json

{
  "supplier_id": 1,
  "product_name": "Wireless Mouse",
  "quantity": 150,
  "price": 29.99
}
```

### Body Parameters

| Parameter | Type | Required | Constraints | Example |
|---|---|---|---|---|
| `supplier_id` | number | Yes | Must exist in suppliers | `1` |
| `product_name` | string | Yes | Non-empty | `"Wireless Mouse"` |
| `quantity` | number | Yes | Integer, ≥ 0 | `150` |
| `price` | number | Yes | > 0 | `29.99` |

### Response

**Success (201):**
```json
{
  "success": true,
  "message": "Inventory item created successfully",
  "id": 11,
  "item": {
    "id": 11,
    "supplier_id": 1,
    "product_name": "Wireless Mouse",
    "quantity": 150,
    "price": 29.99
  }
}
```

**Error (400 - Invalid Data):**
```json
{
  "success": false,
  "error": "Quantity must be >= 0"
}
```

**Error (409 - Missing Supplier):**
```json
{
  "success": false,
  "error": "Supplier with ID 999 does not exist"
}
```

### Example

**Request:**
```bash
curl -X POST http://localhost:5001/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": 1,
    "product_name": "USB-C Hub",
    "quantity": 200,
    "price": 19.99
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory item created successfully",
  "id": 11,
  "item": {
    "id": 11,
    "supplier_id": 1,
    "product_name": "USB-C Hub",
    "quantity": 200,
    "price": 19.99
  }
}
```

### Validation

Database enforces:
- ✓ `supplier_id` must exist (FOREIGN KEY constraint)
- ✓ `quantity` must be ≥ 0 (CHECK constraint)
- ✓ `price` must be > 0 (CHECK constraint)

### Status Codes

| Code | Meaning |
|---|---|
| 201 | Created successfully |
| 400 | Bad request - validation failed |
| 409 | Conflict - invalid supplier or constraint violation |
| 500 | Server error |

---

## GET /inventory

Get all inventory items with supplier information.

### Request

```http
GET /inventory
Host: localhost:5001
```

### Parameters

None (future: pagination with limit/offset)

### Response

**Success (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "supplier_id": 1,
      "product_name": "Wireless Mouse",
      "quantity": 150,
      "price": 29.99,
      "supplier_name": "TechCorp",
      "supplier_city": "San Francisco",
      "total_value": 4498.50
    }
  ]
}
```

### Example

**Request:**
```bash
curl http://localhost:5001/inventory
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "supplier_id": 1,
      "product_name": "Wireless Mouse",
      "quantity": 150,
      "price": 29.99,
      "supplier_name": "TechCorp",
      "supplier_city": "San Francisco",
      "total_value": 4498.50
    },
    {
      "id": 2,
      "supplier_id": 1,
      "product_name": "USB-C Cable",
      "quantity": 300,
      "price": 12.99,
      "supplier_name": "TechCorp",
      "supplier_city": "San Francisco",
      "total_value": 3897.00
    }
  ]
}
```

### Response Fields

- **id**: Item ID
- **supplier_id**: Link to supplier
- **product_name**: Product name
- **quantity**: Stock quantity
- **price**: Unit price
- **supplier_name**: Name of supplier (JOINed)
- **supplier_city**: City of supplier (JOINed)
- **total_value**: Calculated as quantity × price

### Status Codes

| Code | Meaning |
|---|---|
| 200 | OK - Items returned |
| 500 | Server error |

---

## GET /search 🔍 **NEW FEATURE**

Search and filter inventory items with multiple criteria.

### Request

```http
GET /search?q=mouse&category=Electronics&minPrice=10&maxPrice=100
Host: localhost:5001
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `q` | string | No | Product name (partial match, case-insensitive) | `wireless` |
| `category` | string | No | Filter by category (partial match) | `Electronics` |
| `minPrice` | number | No | Minimum price threshold | `10` |
| `maxPrice` | number | No | Maximum price threshold | `100` |

### Response

**Success (200):**
```json
{
  "success": true,
  "count": 2,
  "filters": {
    "searchTerm": "mouse",
    "category": "Electronics",
    "priceRange": {
      "min": 10,
      "max": 100
    }
  },
  "data": [
    {
      "id": 1,
      "supplier_id": 1,
      "product_name": "Wireless Mouse",
      "category": "Electronics",
      "quantity": 150,
      "price": 29.99,
      "supplier_name": "TechCorp",
      "supplier_city": "San Francisco",
      "total_value": 4498.5
    },
    {
      "id": 5,
      "supplier_id": 2,
      "product_name": "Gaming Mouse Pro",
      "category": "Electronics",
      "quantity": 80,
      "price": 89.99,
      "supplier_name": "OfficeMax",
      "supplier_city": "Los Angeles",
      "total_value": 7199.2
    }
  ]
}
```

**Error (400) - Invalid Price Range:**
```json
{
  "success": false,
  "error": "Invalid price range"
}
```

**Error (500) - Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Status Codes

| Code | Description |
|---|---|
| 200 | OK - Search results returned |
| 400 | Bad Request - Invalid price range (min > max) |
| 500 | Internal Server Error |

### Examples

**Search by product name:**
```bash
curl "http://localhost:5001/search?q=mouse"
```

**Filter by category:**
```bash
curl "http://localhost:5001/search?category=Electronics"
```

**Price range search:**
```bash
curl "http://localhost:5001/search?minPrice=20&maxPrice=500"
```

**Combined filters:**
```bash
curl "http://localhost:5001/search?q=wireless&category=Electronics&minPrice=20&maxPrice=200"
```

**Get all items (no filters):**
```bash
curl "http://localhost:5001/search"
```

### Implementation Details

**Key Features:**
- ✅ Case-insensitive product name matching with LIKE wildcards
- ✅ Partial category matching
- ✅ Price range filtering with validation
- ✅ Multiple concurrent filters
- ✅ Parameterized queries (SQL injection safe)

**Query Strategy:**
```sql
SELECT 
  i.id, i.supplier_id, i.product_name, i.category, i.quantity, i.price,
  s.name as supplier_name, s.city as supplier_city,
  (i.quantity * i.price) as total_value
FROM inventory i
JOIN suppliers s ON i.supplier_id = s.id
WHERE LOWER(i.product_name) LIKE LOWER(?)
  AND LOWER(i.category) LIKE LOWER(?)
  AND i.price >= minPrice
  AND i.price <= maxPrice
ORDER BY i.id
```

### Edge Cases Handled

- ✅ Empty search query → returns all results
- ✅ Invalid price range (min > max) → returns 400 error
- ✅ No matches found → returns empty array with count = 0
- ✅ Special characters in search → safely escaped by prepared statements

---

## GET /inventory-by-supplier ⭐ **Complex Query**

Get inventory grouped by supplier with aggregated statistics.

### Request

```http
GET /inventory-by-supplier
Host: localhost:5001
```

### Parameters

None

### Response

**Success (200):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "supplier": {
        "id": 1,
        "name": "TechCorp",
        "city": "San Francisco"
      },
      "summary": {
        "item_count": 3,
        "total_quantity": 495,
        "total_inventory_value": 67273.50
      },
      "items": [
        {
          "id": 1,
          "product_name": "Wireless Mouse",
          "quantity": 150,
          "price": 29.99,
          "total_value": 4498.50
        },
        {
          "id": 2,
          "product_name": "USB-C Cable",
          "quantity": 300,
          "price": 12.99,
          "total_value": 3897.00
        },
        {
          "id": 3,
          "product_name": "LED Monitor 24\"",
          "quantity": 45,
          "price": 249.99,
          "total_value": 11249.55
        }
      ]
    },
    {
      "supplier": {
        "id": 2,
        "name": "FurnitureHub",
        "city": "Los Angeles"
      },
      "summary": {
        "item_count": 3,
        "total_quantity": 135,
        "total_inventory_value": 39578.97
      },
      "items": [ /* ... */ ]
    }
  ]
}
```

### Example

**Request:**
```bash
curl http://localhost:5001/inventory-by-supplier
```

**Response:** (See above)

### Response Structure

Each supplier object contains:

**supplier:**
- `id`: Supplier ID
- `name`: Supplier name
- `city`: City

**summary:**
- `item_count`: Number of items from supplier
- `total_quantity`: Sum of all quantities
- `total_inventory_value`: Sum of (quantity × price)

**items[]:**
- Array of inventory items with:
  - `id`: Item ID
  - `product_name`: Product name
  - `quantity`: Quantity
  - `price`: Unit price
  - `total_value`: Calculated value

### Sorting

Results are sorted by **total_inventory_value** in **descending order** (highest value first).

### Use Cases

- Dashboard analytics
- Supplier performance ranking
- Inventory value analysis
- Buyer inventory view

### Status Codes

| Code | Meaning |
|---|---|
| 200 | OK - Grouped data returned |
| 500 | Server error |

---

## GET /suppliers

Get all suppliers with inventory counts.

### Request

```http
GET /suppliers
Host: localhost:5001
```

### Parameters

None

### Response

**Success (200):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": 1,
      "name": "TechCorp",
      "city": "San Francisco",
      "inventory_count": 3
    },
    {
      "id": 2,
      "name": "FurnitureHub",
      "city": "Los Angeles",
      "inventory_count": 3
    },
    {
      "id": 3,
      "name": "OfficeMax",
      "city": "New York",
      "inventory_count": 2
    },
    {
      "id": 4,
      "name": "ElectroSupply",
      "city": "Chicago",
      "inventory_count": 2
    }
  ]
}
```

### Example

**Request:**
```bash
curl http://localhost:5001/suppliers
```

**Response:** (See above)

### Response Fields

- **id**: Supplier ID
- **name**: Supplier name
- **city**: City
- **inventory_count**: Number of items this supplier offers

### Status Codes

| Code | Meaning |
|---|---|
| 200 | OK - Suppliers returned |
| 500 | Server error |

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Scenarios

| Scenario | Status | Error Message |
|---|---|---|
| Missing required field | 400 | "Name and city are required" |
| Invalid data type | 400 | "Price must be a number" |
| Out of range value | 400 | "Quantity must be >= 0" |
| Duplicate name | 409 | "A supplier with this name already exists" |
| Foreign key violation | 409 | "Supplier with ID 999 does not exist" |
| Server error | 500 | "Internal server error" |

### Best Practices

1. **Always check `success` field** before processing data
2. **Read error message** for user feedback
3. **Respect status codes** for appropriate handling
4. **Validate client-side** before sending requests
5. **Implement retry logic** for 5xx errors only

---

## API Testing with cURL

### Basic GET

```bash
curl http://localhost:5001/suppliers
```

### GET with Parameters (Project A)

```bash
curl "http://localhost:5000/search?q=mouse&category=Electronics"
```

### POST with Body

```bash
curl -X POST http://localhost:5001/supplier \
  -H "Content-Type: application/json" \
  -d '{"name": "NewCorp", "city": "Boston"}'
```

### Pretty Print JSON (Mac/Linux)

```bash
curl -s http://localhost:5001/suppliers | jq '.'
```

### Windows (PowerShell)

```powershell
$response = Invoke-RestMethod -Uri http://localhost:5001/suppliers
$response | ConvertTo-Json -Depth 10
```

---

## Rate Limiting & Performance

**Current Status:** No rate limiting implemented

**For Production:**
- Implement rate limiting (100 requests/minute per IP)
- Add request timeouts (30 seconds)
- Consider caching for frequently accessed endpoints

---

## API Versioning

**Current Version:** v1 (implicit)

**Future:** Consider adding `/api/v2/` routes for backward compatibility

---

## CORS Configuration

**Enabled:** Cross-Origin Resource Sharing enabled for all routes

**Allowed Origins:** 
- Development: `http://localhost:5173`, `http://localhost:5174`
- Production: Configure via environment variables

---

## Authentication & Authorization

**Current Status:** None (demo application)

**For Production:**
- Implement JWT token authentication
- Add role-based access control (supplier vs buyer)
- Secure sensitive endpoints with middleware

---

## Summary Table

### Project A Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/search` | Search with filters |
| GET | `/categories` | Get categories |
| GET | `/health` | Health check |

### Project B Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/supplier` | Create supplier |
| POST | `/inventory` | Create inventory item |
| GET | `/suppliers` | Get all suppliers |
| GET | `/inventory` | Get all items |
| GET | `/inventory-by-supplier` | Group by supplier (⭐ complex) |
| GET | `/health` | Health check |

---

This documentation provides complete API reference for integration with other applications or testing frameworks.
