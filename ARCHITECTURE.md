# 🏗️ Architecture & System Design

Complete architectural overview of both inventory management applications.

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER BROWSERS                                │
│    Desktop (Chrome, Firefox, Safari) / Mobile (iOS, Android)     │
└───┬─────────────────────────────┬───────────────────────────────┘
    │                             │
    │ HTTP/REST (JSON)            │ HTTP/REST (JSON)
    │                             │
┌───▼──────────────────┐    ┌─────▼────────────────────────┐
│  PROJECT A           │    │  PROJECT B                   │
│  Search UI           │    │  Database Management UI      │
│  React 18 + Vite     │    │  React 18 + Vite             │
│  Ant Design 5        │    │  Ant Design 5                │
│  Port: 5173          │    │  Port: 5174                  │
│                      │    │                              │
│ ┌──────────────────┐ │    │ ┌──────────────────────────┐ │
│ │ Search Tab       │ │    │ │ Dashboard Tab            │ │
│ │ ├─ Search Input  │ │    │ │ ├─ Stats Cards           │ │
│ │ ├─ Category      │ │    │ │ ├─ Grouped Inventory     │ │
│ │ │   Dropdown     │ │    │ │ └─ Total Value           │ │
│ │ ├─ Price Range   │ │    │ └──────────────────────────┘ │
│ │ └─ Results       │ │    │ ┌──────────────────────────┐ │
│ │    Table         │ │    │ │ Suppliers Tab            │ │
│ └──────────────────┘ │    │ ├─ New Supplier Modal      │ │
│                      │    │ ├─ Suppliers Table         │ │
│                      │    │ └─ Inventory Count         │ │
│                      │    │ └──────────────────────────┘ │
│                      │    │ ┌──────────────────────────┐ │
│                      │    │ │ Inventory Tab            │ │
│                      │    │ ├─ New Item Modal          │ │
│                      │    │ └─ Items Table             │ │
│                      │    │ └──────────────────────────┘ │
└───┬──────────────────┘    └─────┬────────────────────────┘
    │                             │
    │ axios GET/POST JSON         │ axios GET/POST JSON
    │ Parse response              │ Parse response
    │ Update component state      │ Update component state
    │                             │
┌───▼──────────────────┐    ┌─────▼────────────────────────┐
│  PROJECT A           │    │  PROJECT B                   │
│  Search API          │    │  Database API                │
│  Node.js + Express   │    │  Node.js + Express           │
│  Port: 5000          │    │  Port: 5001                  │
│                      │    │                              │
│ ┌──────────────────┐ │    │ ┌──────────────────────────┐ │
│ │ GET /search      │ │    │ │ POST /supplier           │ │
│ │ GET /categories  │ │    │ │ POST /inventory          │ │
│ │ GET /health      │ │    │ │ GET /suppliers           │ │
│ └──────────────────┘ │    │ │ GET /inventory           │ │
│                      │    │ │ GET /inventory-by-       │ │
│ Routes               │    │ │     supplier (⭐complex) │ │
│ ├─ Request parsing  │    │ │                          │ │
│ ├─ Validation       │    │ │ Middleware               │ │
│ ├─ CORS             │    │ │ ├─ CORS policy           │ │
│ └─ Response format  │    │ │ ├─ body-parser JSON      │ │
│                      │    │ │ └─ Error handling        │ │
│ Data Source          │    │ └──────────────────────────┘ │
│ └─ data.json (12 KB) │    │                              │
│    (in-memory)       │    │ Database wrapper (db.js)     │
│                      │    │ ├─ run() - INSERT/UPDATE    │
│                      │    │ ├─ get() - Single row       │
│                      │    │ ├─ all() - Multiple rows    │
│                      │    │ └─ close() - Clean shutdown │
└───┬──────────────────┘    └─────┬────────────────────────┘
    │                             │
    │ (No external data           │ sqlite3 library
    │  connection needed)         │ Native bindings
    │                             │
                            ┌─────▼────────────────────┐
                            │  SQLite Database         │
                            │  inventory.db (50 KB)    │
                            │                          │
                            │ ┌────────────────────┐   │
                            │ │ suppliers table    │   │
                            │ ├─ id (PK)           │   │
                            │ ├─ name (UNIQUE)     │   │
                            │ ├─ city              │   │
                            │ ├─ created_at        │   │
                            │ └─ idx_supplier_name │   │
                            │ └────────────────────┘   │
                            │ ┌────────────────────┐   │
                            │ │ inventory table    │   │
                            │ ├─ id (PK)           │   │
                            │ ├─ supplier_id (FK)  │   │
                            │ ├─ product_name      │   │
                            │ ├─ quantity (≥0)     │   │
                            │ ├─ price (>0)        │   │
                            │ ├─ created_at        │   │
                            │ └─ idx_supplier_id   │   │
                            │ └────────────────────┘   │
                            │                          │
                            │ Relationships            │
                            │ Suppliers ──1──∞── Items │
                            │ ON DELETE CASCADE        │
                            └──────────────────────────┘
```

---

## Request Flow Diagrams

### Project A: Search Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ User Interaction: Enters "mouse", selects "Electronics"    │
│ Selects price range $20-$100, clicks search               │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                            │
│                                                             │
│ 1. handleSearch() in App.jsx                               │
│    ├─ Validate inputs                                      │
│    ├─ Build query params: ?q=mouse&...                     │
│    └─ setLoading(true)                                     │
│                                                             │
│ 2. axios.get('/search', { params })                        │
│    ├─ Add Content-Type header                              │
│    └─ Send request                                         │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP GET /search?q=mouse&category=Electronics
               │ &minPrice=20&maxPrice=100
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Express)                                           │
│                                                             │
│ 1. Express routing: router.get('/search')                  │
│                                                             │
│ 2. req.query parsing:                                      │
│    { q: 'mouse', category: 'Electronics', ... }            │
│                                                             │
│ 3. Validation layer:                                       │
│    ├─ Check q is string                                    │
│    ├─ Check minPrice < maxPrice                            │
│    └─ Validate numbers are numeric                         │
│                                                             │
│ 4. Data processing:                                        │
│    ├─ Load data.json (12 items)                            │
│    ├─ Filter: toLowerCase and includes(q)                  │
│    ├─ Filter: category === category || !category           │
│    ├─ Filter: price >= minPrice && price <= maxPrice       │
│    └─ Combine filters with AND logic                       │
│                                                             │
│ 5. Build response:                                         │
│    {                                                       │
│      success: true,                                        │
│      count: 2,                                             │
│      data: [{ Wireless Mouse, Keyboard }, ...]             │
│    }                                                       │
│                                                             │
│ 6. res.json(results)                                       │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP 200 + JSON body
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                            │
│                                                             │
│ 1. Receive response in .then()                             │
│                                                             │
│ 2. setSearchResults(response.data.data)                     │
│    setLoading(false)                                       │
│                                                             │
│ 3. Trigger re-render with new state                        │
│                                                             │
│ 4. Render <Table> component with 2 rows:                   │
│    ├─ Row 1: Wireless Mouse (Electronics, $29.99)          │
│    └─ Row 2: Keyboard (Electronics, $75.00)                │
│                                                             │
│ 5. User can see results instantly                          │
└─────────────────────────────────────────────────────────────┘
```

### Project B: Create Supplier Workflow

```
┌──────────────────────────────────────────────────┐
│ User Interaction: Clicks "New Supplier"          │
│ Fills in TechCorp + San Francisco                │
│ Clicks OK button                                 │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ FRONTEND (React)                                 │
│                                                  │
│ 1. Modal onOk handler                            │
│    ├─ Validate form (required fields)            │
│    ├─ Form validation passes ✓                   │
│    └─ setFormLoading(true)                       │
│                                                  │
│ 2. axios.post('/supplier', {                     │
│      name: 'TechCorp',                           │
│      city: 'San Francisco'                       │
│    })                                            │
└────────────────┬─────────────────────────────────┘
                 │ HTTP POST
                 │ Content-Type: application/json
                 │ Body: { name, city }
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ BACKEND (Express)                                │
│                                                  │
│ 1. router.post('/supplier')                      │
│                                                  │
│ 2. body-parser middleware:                       │
│    ├─ Parse JSON body                           │
│    └─ req.body = { name, city }                  │
│                                                  │
│ 3. Validation:                                   │
│    ├─ Check name && city exist                   │
│    ├─ Check name is string                       │
│    └─ Trim whitespace                            │
│                                                  │
│ 4. Database layer (db.js):                       │
│    ├─ db.run(                                    │
│    │   'INSERT INTO suppliers (name, city) ...',  │
│    │   [name, city]                              │
│    │ )                                           │
│    │                                             │
│    └─ SQLite executes with parameter binding     │
│                                                  │
│ 5. Constraints checked by SQLite:                │
│    ├─ UNIQUE constraint on name                  │
│    │  → If name exists: FOREIGN KEY error        │
│    │  → Return 400 error                         │
│    └─ If valid: INSERT succeeds, get lastID     │
│                                                  │
│ 6. Response:                                     │
│    {                                             │
│      success: true,                              │
│      message: 'Created successfully',            │
│      id: 5,                                      │
│      supplier: { id: 5, name, city, ... }        │
│    }                                             │
└────────────────┬─────────────────────────────────┘
                 │ HTTP 201 + JSON body
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ FRONTEND (React)                                 │
│                                                  │
│ 1. .then() callback:                             │
│    ├─ message.success('Created!')                │
│    └─ setFormLoading(false)                      │
│                                                  │
│ 2. Close modal:                                  │
│    ├─ setModalVisible(false)                     │
│    └─ Reset form                                 │
│                                                  │
│ 3. Refresh suppliers list:                       │
│    ├─ fetchSuppliers()                           │
│    └─ GET /suppliers API call                    │
│                                                  │
│ 4. Update state with new list including:         │
│    { id: 5, name: 'TechCorp', city: 'SF', ... }  │
│                                                  │
│ 5. Re-render table:                              │
│    ├─ New TechCorp row appears                   │
│    └─ inventory_count: 0 (no items yet)          │
└──────────────────────────────────────────────────┘
```

### Project B: Complex Query (Group by Supplier)

```
User clicks "Dashboard" tab
         ↓
useEffect(() => fetchGroupedData())
         ↓
axios.get('/inventory-by-supplier')
         ↓
─────────────────────────────── BACKEND ─────────────────────────────
         
SQL Query Execution:
```sql
SELECT 
  s.id, s.name, s.city,
  COUNT(i.id) as item_count,
  SUM(i.quantity) as total_quantity,
  CAST(SUM(i.quantity * i.price) AS REAL) as total_value
FROM suppliers s
LEFT JOIN inventory i ON s.id = i.supplier_id
GROUP BY s.id, s.name, s.city
ORDER BY total_value DESC
```

Execution Steps:
1. LEFT JOIN suppliers with inventory
   - TechCorp (1) → [Mouse (qty:150), USB-C (qty:300), Monitor (qty:45)]
   - FurnitureHub (2) → [Office Chair, Standing Desk, Desk Lamp]
   - OfficeMax (3) → [Document Organizer, Notebook Set]
   - ElectroSupply (4) → [Keyboard, Headphones]

2. GROUP BY supplier
   - TechCorp: COUNT=3, SUM(qty)=495, SUM(value)=$67,273.50
   - FurnitureHub: COUNT=3, SUM(qty)=135, SUM(value)=$39,578.97
   - OfficeMax: COUNT=2, SUM(qty)=700, SUM(value)=$20,184.87
   - ElectroSupply: COUNT=2, SUM(qty)=135, SUM(value)=$12,899.88

3. ORDER BY total_value DESC
   - [TechCorp ($67K), FurnitureHub ($39K), OfficeMax ($20K), ElectroSupply ($12K)]

4. Build response structure:
   [{
     supplier: { id: 1, name: "TechCorp", city: "SF" },
     summary: { 
       item_count: 3, 
       total_quantity: 495, 
       total_inventory_value: 67273.50 
     },
     items: [
       { id: 1, product_name: "Wireless Mouse", quantity: 150, price: 29.99, total_value: 4498.50 },
       { id: 2, product_name: "USB-C Cable", quantity: 300, price: 12.99, total_value: 3897.00 },
       { id: 3, product_name: "LED Monitor", quantity: 45, price: 249.99, total_value: 11249.55 }
     ]
   }, ...]
         ↓
─────────────────────────────── FRONTEND ─────────────────────────────
1. Receive grouped data in response
2. setGroupedData(response.data.data)
3. Render with Cards:
   ┌─────────────────────────────┐
   │ TechCorp (San Francisco)    │
   │ Items: 3 | Qty: 495 | $67K  │
   ├─────────────────────────────┤
   │ Product          Qty  Price │
   │ Wireless Mouse   150  $29.99│
   │ USB-C Cable      300  $12.99│
   │ LED Monitor 24"   45 $249.99│
   └─────────────────────────────┘
4. User sees organized supplier inventory view
```

---

## Component Architecture

### Project A: Search UI Components

```
App.jsx (Main Component)
├── Header
│   └─ "Inventory Search System"
├── Tabs
│   └─ SearchTab
│       ├─ <Form> (Ant Design)
│       │  ├─ TextInput: product name
│       │  ├─ Select: category
│       │  ├─ InputNumber: minPrice
│       │  ├─ InputNumber: maxPrice
│       │  └─ Button: Search
│       │
│       ├─ Results Section
│       │  ├─ <Table> (Ant Design)
│       │  │  ├─ Column: Product Name
│       │  │  ├─ Column: Category
│       │  │  ├─ Column: Price
│       │  │  ├─ Column: Supplier
│       │  │  └─ Pagination (10 items/page)
│       │  │
│       │  └─ Empty State (if no results)
│       │     └─ "No products found matching your search"
│       │
│       └─ Alert (if error)
│          └─ "Invalid price range"
│
└─ Footer

CSS: App.css
├─ Layout styles (@media 768px)
├─ Form grid (2 cols on desktop, 1 on mobile)
├─ Table horizontal scroll
├─ Responsive padding/fonts
└─ Button styling
```

### Project B: Database UI Components

```
App.jsx (Main Component)
├─ Header
│  ├─ "Inventory Database Management"
│  └─ Refresh Button
│
├─ Tabs
│  │
│  ├─ DashboardTab
│  │  ├─ StatCards
│  │  │  ├─ Card: Total Suppliers
│  │  │  ├─ Card: Total Items
│  │  │  ├─ Card: Total Inventory Value
│  │  │  └─ Card: Average Item Price
│  │  │
│  │  └─ GroupedInventory
│  │     └─ CollapseCard per supplier
│  │        ├─ TechCorp (3 items, $67K)
│  │        │  └─ NestedTable with items
│  │        ├─ FurnitureHub (3 items, $39K)
│  │        │  └─ NestedTable with items
│  │        └─ OfficeMax (2 items, $20K)
│  │           └─ NestedTable with items
│  │
│  ├─ SuppliersTab
│  │  ├─ Button: "Add New Supplier"
│  │  │  └─ Modal (SupplierForm)
│  │  │     ├─ Input: Name
│  │  │     ├─ Input: City
│  │  │     └─ Button: OK / Cancel
│  │  │
│  │  └─ <Table>
│  │     ├─ Column: ID
│  │     ├─ Column: Name
│  │     ├─ Column: City
│  │     └─ Column: Inventory Count
│  │
│  ├─ InventoryTab
│  │  ├─ Button: "Add New Item"
│  │  │  └─ Modal (InventoryForm)
│  │  │     ├─ Select: Supplier
│  │  │     ├─ Input: Product Name
│  │  │     ├─ InputNumber: Quantity
│  │  │     ├─ InputNumber: Price
│  │  │     └─ Button: OK / Cancel
│  │  │
│  │  └─ <Table> (with horizontal scroll on mobile)
│  │     ├─ Column: ID
│  │     ├─ Column: Supplier
│  │     ├─ Column: Product
│  │     ├─ Column: Quantity
│  │     ├─ Column: Price
│  │     └─ Column: Total Value
│  │
│  └─ AnalyticsTab
│     ├─ Filter: By Supplier
│     ├─ Chart: Inventory Value by Supplier
│     └─ Rankings: Top suppliers by value
│
└─ Footer

CSS: App.css
├─ Layout styles (@media 768px)
├─ StatCards grid (1-4 cols responsive)
├─ Table horizontal scroll (table-only, not card)
├─ Sticky header (z-index: 15)
├─ Form inputs (compact on mobile)
├─ Modal responsive (95% width on mobile)
└─ Tab styling (11px font on mobile)
```

---

## Data Flow Diagram

### Search Flow (Project A)

```
    User Input                Query Objects            HTTP Request
         │                          │                         │
    "mouse"          ────────>   { q: 'mouse' }    ────────>  GET /search?q=mouse
    "Electronics"    ────────>   { category: '' }  ────────>  &category=Electronics
    $50-$200         ────────>   { min: 50 }       ────────>  &minPrice=50
                                  { max: 200 }                 &maxPrice=200
         │                          │                         │
         └──────────────────────────┴─────────────────────────┘
                                    │
                                    ▼
                          Express Server (5000)
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
            Load data.json               Filter Pipeline
            (12 items in RAM)            
                    │                     │
                    │                     ├─→ toLowerCase(q)
                    │                     ├─→ .includes() match
                    │                     ├─→ category filter
                    │                     └─→ price range filter
                    │                     │
                    │                     ▼
                    │               Filtered Results
                    │               [Mouse, Keyboard]
                    │               (count: 2)
                    │                     │
                    └─────────┬───────────┘
                              │
                         Build Response
                    {
                      success: true,
                      count: 2,
                      data: [...]
                    }
                              │
                              ▼
                    HTTP 200 + JSON body
                              │
                              ▼
                        React Component
                              │
                          setState()
                              │
                          Render <Table>
                              │
                              ▼
                          User sees
                          results
```

### Database Insert Flow (Project B)

```
     User Input              Form Data             HTTP Request
         │                       │                     │
    "TechCorp"      ────────>  { name: 'TechCorp' }  POST /supplier
    "San Francisco" ────────>  { city: 'SF' }      ──────→
         │                       │                     │
         └───────────────────────┴─────────────────────┘
                                 │
                                 ▼
                       Express Server (5001)
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
                    ▼                          ▼
            Parse JSON body        Validation Layer
            (body-parser)          
                    │               ├─→ Check required fields
                    │               ├─→ Check string type
                    │               ├─→ Trim whitespace
                    │               └─→ Name uniqueness?
                    │               
                    │               (validation passes)
                    │                          │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                          Database Layer (db.js)
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
                    ▼                          ▼
            Prepare SQL           SQLite3
            "INSERT INTO       Parameter Binding
            suppliers ..."        (prevents SQL injection)
                    │                          │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                        SQLite Constraint Check
                                 │
                    ┌────────────┴──────────────┐
                    │                           │
                    ▼                           ▼
        UNIQUE constraint           FOREIGN KEY check
        name = 'TechCorp'?          (no refs yet)
            │                           │
            ✓ Pass (new name)           ✓ Pass
            │                           │
            └────────────┬──────────────┘
                         │
                         ▼
              INSERT row into database
              AUTOINCREMENT id = 5
                         │
                         ▼
            Return lastID = 5
                         │
                         ▼
            Build Success Response
                {
                  success: true,
                  id: 5,
                  supplier: { id: 5, name, city }
                }
                         │
                         ▼
              HTTP 201 + JSON body
                         │
                         ▼
            React Component .then()
                         │
                    setState()
                         │
                Close modal + Refresh list
                         │
                         ▼
              New supplier appears
              in suppliers table
```

---

## Error Handling Architecture

### Project A (Search)

```
API Error Handling:
├─ Invalid query params (non-numeric price)
│  └─ Return 400 Bad Request { success: false, error: "..." }
│
├─ minPrice > maxPrice
│  └─ Return 400 Bad Request
│
└─ Unexpected errors
   └─ Return 500 Server Error

Frontend Error Handling:
├─ Network error (no internet)
│  └─ Show alert: "Connection failed"
│
├─ Bad response status
│  └─ Show alert: "Search failed, try again"
│
├─ Parse error
│  └─ Log to console, show "Something went wrong"
│
└─ Validation error
   └─ Disable search button, show inline error
```

### Project B (Database)

```
API Error Handling:
├─ Validation errors (missing fields)
│  └─ Return 400 { success: false, error: "Name is required" }
│
├─ Constraint violations
│  ├─ UNIQUE violation (duplicate supplier name)
│  │  └─ Return 409 { success: false, error: "Name already exists" }
│  │
│  └─ FOREIGN KEY violation
│     └─ Return 409 { success: false, error: "Supplier not found" }
│
├─ Check constraint violation
│  ├─ quantity < 0
│  │  └─ Return 400 { success: false, error: "Quantity cannot be negative" }
│  │
│  └─ price <= 0
│     └─ Return 400 { success: false, error: "Price must be positive" }
│
└─ Database errors
   └─ Return 500 Server Error

Frontend Error Handling:
├─ API errors
│  └─ message.error(response.data.error)
│
├─ Network error
│  └─ message.error("Failed to connect to server")
│
├─ Form validation
│  └─ Form.validateFields() before submit
│
├─ Modal form
│  └─ Show error within modal, don't close
│
└─ Table fetch failures
   └─ Show empty state, offer refresh button
```

---

## Database Schema & Relationships

### Project B: SQLite Design

```
┌─────────────────────────────┐
│       SUPPLIERS TABLE       │
├─────────────────────────────┤
│ id (INTEGER, PK)            │  Auto-increment
│ name (TEXT, UNIQUE)         │  Format: "TechCorp"
│ city (TEXT)                 │  Format: "San Francisco"
│ created_at (DATETIME)       │  Default: CURRENT_TIMESTAMP
│                             │
│ Indexes:                    │
│ ├─ PRIMARY KEY (id)         │  Fast lookup by ID
│ └─ UNIQUE (name)            │  Prevents duplicates
│                             │
│ Constraints:                │
│ ├─ NOT NULL (name, city)    │  Required fields
│ └─ name MUST BE UNIQUE      │  Business rule
└─────────────────────────────┘
          │
          │ 1──────∞
          │ Foreign Key
          │
          ▼
┌─────────────────────────────┐
│      INVENTORY TABLE        │
├─────────────────────────────┤
│ id (INTEGER, PK)            │  Auto-increment
│ supplier_id (INTEGER, FK)   │  Ref: suppliers.id
│ product_name (TEXT, NOT NULL)│  Format: "Wireless Mouse"
│ category (TEXT)             │  Default: "Uncategorized"
│ quantity (INTEGER)          │  Check: >= 0
│ price (REAL)                │  Check: > 0
│ created_at (DATETIME)       │  Default: CURRENT_TIMESTAMP
│                             │
│ Indexes:                    │
│ ├─ PRIMARY KEY (id)         │  Fast lookup by ID
│ ├─ idx_supplier_id          │  Fast ForeignKey lookups
│ ├─ idx_product_name         │  Fast product search (LIKE)
│ ├─ idx_category             │  Fast category filtering
│ ├─ idx_price                │  Fast price range queries
│ ├─ idx_category_price       │  Composite for combined filters
│ └─ idx_supplier_price       │  Composite for supplier analysis
│                             │
│ Constraints:                │
│ ├─ FOREIGN KEY (supplier_id)│  Must exist in suppliers
│ │  ON DELETE CASCADE        │  Delete items if supplier deleted
│ ├─ CHECK (quantity >= 0)    │  Database-level validation
│ └─ CHECK (price > 0)        │  Database-level validation
└─────────────────────────────┘

Relationship Semantics:
- One supplier can have many items
- Deleting supplier CASCADE deletes all items
- Cannot create item without valid supplier
- Database enforces all rules
```

---

## Performance Characteristics

### Project A (In-Memory Search)

```
Dataset Size: 12 items
Search Operation:
  1. Load data.json: ~0.1ms
  2. Filter loop: O(n) = ~0.05ms
  3. Build response: ~0.05ms
  ─────────────
  Total: ~0.2ms (negligible)

Memory Usage:
  - Node process: ~20MB base
  - data.json: 2KB
  - In-memory data: ~5KB
  ─────────────
  Total: ~25MB

Bottleneck
: None (CPU-bound operation, instant on modern hardware)
```

### Project B (Database)

```
Dataset Size: 10 items
Simple Query (GET /inventory):
  SQL: SELECT ... JOIN suppliers ...
  Time: ~0.5ms (with scan)
  
With Index (indexed lookup):
  SQL: WHERE supplier_id = ? (indexed)
  Time: ~0.1ms (B-tree lookup)
  
Complex Query (GROUP BY):
  SQL: SELECT ... GROUP BY ... ORDER BY ...
  Time: ~1ms (full scan + aggregation)
  
Memory Usage:
  - Node process: ~30MB base
  - SQLite pool: ~5MB
  - Database file: 50KB
  ─────────────
  Total: ~35MB

Bottleneck: SQLite full table scans above 10,000 rows
Solution: Add indexes, migrate to PostgreSQL
```

---

## Technology Decisions

### Why React + Vite?

```
React:
  ✅ Component reusability
  ✅ State management clarity
  ✅ Excellent for CRUD UIs
  ✅ Large ecosystem
  ✅ Industry standard

Vite (over Webpack):
  ✅ 10x faster development server
  ✅ Native ES modules
  ✅ Instant HMR (hot module reload)
  ✅ Minimal config
```

### Why Express (over other frameworks)?

```
Express:
  ✅ Minimal, unopinionated framework
  ✅ Perfect for REST APIs
  ✅ Easy middleware pattern
  ✅ Mature (10+ years)
  ✅ Job market demand

Alternatives considered:
  ✗ Fastify (newer, but overkill for this size)
  ✗ Hapi (too heavyweight)
  ✗ Koa (requires generators, less familiar)
```

### Why SQLite (Project B)?

```
SQLite:
  ✅ Zero configuration
  ✅ File-based (easy backups)
  ✅ ACID transactions
  ✅ Native relationships (FK)
  ✅ Single file, no server

Alternatives considered:
  ✗ MongoDB (document DB, unnecessary for relational data)
  ✗ PostgreSQL (needs server, overkill for demo)
  ✗ MySQL (needs server)
  ✓ MongoDB trade-offs: less schema enforcement, more RAM
```

### Why Ant Design (UI)?

```
Ant Design:
  ✅ Professional component library
  ✅ Mobile responsive built-in
  ✅ Enterprise-grade
  ✅ Excellent form handling
  ✅ Dark mode support

Alternatives considered:
  ✗ Material-UI (good but heavier)
  ✗ Bootstrap (older patterns)
  ✗ Tailwind CSS (utility-first, more coding)
```

---

## Scalability Path

### For 10,000 Items

```
Changes needed:
├─ Database: SQLite → PostgreSQL
├─ Caching: Add Redis layer
├─ Search: In-memory → Elasticsearch
├─ Pagination: Implement limit/offset
└─ Frontend: Add virtual scrolling

Estimated load time increase:
└─ Simple query: ~1ms → ~10ms (acceptable)
```

### For 100,000+ Items

```
Full stack upgrade:
├─ Database: PostgreSQL (read replicas)
├─ Cache: Redis (distributed cache)
├─ Search: Elasticsearch/MeiliSearch
├─ API: Express + compression middleware
├─ Frontend: React Query (client-side caching)
├─ CDN: Cloudflare (static assets)
├─ Monitoring: DataDog/NewRelic
└─ Load Balancer: nginx

Architecture becomes:
User → CDN → LB → API Servers → PostgreSQL
           → Redis cache
           → Elasticsearch
```

---

## Deployment Architecture

### Development (Local)

```
localhost:5000 (backend) ← → localhost:5173 (frontend A)
localhost:5001 (backend) ← → localhost:5174 (frontend B)
```

### Production (Cloud)

```
SSL Certificate
  │
  ↓
Load Balancer (nginx)
  │
  ├─→ API Server 1 (Node:5000)
  ├─→ API Server 2 (Node:5000)
  └─→ API Server 3 (Node:5000)
  │
  ├─→ PostgreSQL (primary) ← Replication → (standby)
  │
  ├─→ Redis Cache Cluster
  │
  └─→ Frontend CDN
      (static assets cached globally)
```

---

This architecture document provides a complete view of system design, data flows, and scalability options for both applications.
