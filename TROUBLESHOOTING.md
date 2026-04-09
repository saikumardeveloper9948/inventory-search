# 🐛 Troubleshooting Guide

Comprehensive solutions for common issues encountered during setup, development, and deployment.

---

## Quick Reference

| Problem | Solution | See Section |
|---------|----------|-------------|
| Port already in use | Kill existing process or use different port | [Port Issues](#port-issues) |
| Database won't initialize | Ensure npm run init-db is executed first | [Database Issues](#database-issues) |
| CORS errors | Check backend CORS config | [CORS Errors](#cors-errors) |
| API not responding | Verify backend is running on correct port | [API Issues](#api-issues) |
| Frontend not loading | Check Vite dev server is running | [Frontend Issues](#frontend-issues) |
| Search endpoint not found | Backend running old code; reinitialize database | [Search Issues](#search-issues) |
| Search returns no results | Check category column exists; verify data | [Search Issues](#search-issues) |
| Search is slow | Database indexes missing; reinitialize | [Search Issues](#search-issues) |

---

# Installation & Setup Issues

## Port Issues

### Error: "Port 5000 is in use"

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Causes:**
- Another application using the port
- Previous instance still running
- Firewall blocking port

**Solutions:**

#### Windows

```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Example output:
# TCP    127.0.0.1:5000    0.0.0.0:0    LISTENING    1234

# Kill the process (PID 1234)
taskkill /PID 1234 /F

# Or find by application name
taskkill /IM node.exe /F
```

#### Mac/Linux

```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or more gently
lsof -i :5000
kill -9 <PID>
```

**Alternative: Use Different Port**

```bash
# Windows
set PORT=5002 && npm start

# Mac/Linux
PORT=5002 npm start

# Or modify server.js
const PORT = process.env.PORT || 5002;
```

### Error: "All ports in range already in use"

**Solution:**

```bash
# Find all Node processes
ps aux | grep node

# Kill all Node processes
killall node

# Or restart computer
```

---

## Dependencies Issues

### Error: "Cannot find module 'express'"

```
Error: Cannot find module 'express'
```

**Cause:** Dependencies not installed

**Solution:**

```bash
# Navigate to correct directory
cd backend  # or frontend, database-backend, etc.

# Install dependencies
npm install

# Verify
npm list express
```

### Error: "npm ERR! code ERESOLVE"

```
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
```

**Cause:** Version conflicts

**Solution:**

```bash
# Option 1: Force resolution
npm install --legacy-peer-deps

# Option 2: Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Option 3: Update npm
npm install -g npm@latest
npm install
```

### Error: "gyp ERR! build error"

```
gyp ERR! build error
npm ERR! code ELIFECYCLE
```

**Cause:** Native module compilation failed (usually SQLite on Windows)

**Solution:**

```bash
# Install build tools (Windows)
npm install -g windows-build-tools

# Then retry
npm install

# Or use pre-built binaries
npm install --build-from-source

# For Mac
xcode-select --install
npm install
```

---

# Database Issues (Project B)

## Initialization Problems

### Error: "Database initialization failed"

**Cause:** Database file corrupted or npm run init-db not executed

**Solution:**

```bash
# Ensure you're in database-backend directory
cd database-backend

# Delete old database
rm inventory.db

# Reinitialize
npm run init-db

# Verify database created
ls -la inventory.db
# Should show: -rw-r--r-- ... inventory.db
```

### Error: "SQLITE_CANTOPEN"

```
Error: unable to open database file
```

**Causes:**
- Database file doesn't exist
- Permission denied
- Path incorrect

**Solution:**

```bash
# Check if database exists
ls -la inventory.db

# If not, create it
npm run init-db

# Check permissions (should be 644 or 664)
chmod 664 inventory.db

# Verify path in initDb.js matches actual location
cat initDb.js | grep "inventory.db"
```

### Error: "SQLITE_MISUSE"

```
SQLITE_MISUSE: SQLite connection is not available
```

**Cause:** Database connection closed before queries complete

**Solution:**
This was already fixed in the latest code. If you see this:

```bash
# Ensure you have latest code
git pull

# Reinstall and reinitialize
npm install
npm run init-db
npm start
```

### Error: "UNIQUE constraint failed"

```
Error: UNIQUE constraint failed: suppliers.name
```

**Cause:** Trying to create supplier with duplicate name

**Solution:**

```javascript
// Check if name exists first
app.post('/supplier', async (req, res) => {
  const existing = await db.get(
    'SELECT id FROM suppliers WHERE name = ?',
    [req.body.name]
  );
  
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'Supplier name already exists'
    });
  }
  // ... continue creating supplier
});
```

**On Frontend:**
```javascript
// In modal before submit
try {
  const response = await axios.post('/supplier', data);
  message.success('Supplier created!');
} catch (error) {
  if (error.response?.status === 409) {
    message.error('This supplier name already exists');
  } else {
    message.error(error.response?.data?.error || 'Failed to create supplier');
  }
}
```

### Error: "FOREIGN KEY constraint failed"

```
Error: FOREIGN KEY constraint failed
```

**Cause:** Trying to reference non-existent supplier

**Solution:**

```bash
# Verify supplier exists
sqlite3 inventory.db "SELECT id FROM suppliers WHERE id = 1;"

# If empty, supplier doesn't exist
# Create it first using API:
curl -X POST http://localhost:5001/supplier \
  -H "Content-Type: application/json" \
  -d '{"name": "NewSupplier", "city": "SomeCity"}'
```

---

# API Issues

## Backend Not Responding

### Error: "API not responding" or "Connection refused"

```
Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Checking:**

```bash
# Test with curl
curl http://localhost:5000/health

# Expected response:
# {"status": "OK"}

# If no response, backend is not running
```

**Solutions:**

```bash
# Verify backend is running in correct directory
cd backend
npm start

# Watch for output:
# 🚀 Server running at http://localhost:5000

# Check correct port
ps aux | grep node
# Should show: node server.js, listening on port 5000
```

---

# Search Feature Issues (Project B - Assignment A)

## Search Functionality

### Error: "GET /search endpoint not found" (404)

```
Error: 404 Not Found
Response: "Endpoint not found"
```

**Causes:**
- Backend running old version without search endpoint
- Server process wasn't restarted after code changes
- Database missing category column

**Solution:**

```bash
# Kill old backend process
# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5001 | xargs kill -9

# Reinitialize database with category column
cd database-backend
rm inventory.db
npm run init-db

# Start fresh backend
npm start

# Verify search endpoint works
curl "http://localhost:5001/search"
# Should return: {"success":true,"count":X,"filters":{},"data":[...]}
```

### Error: "Search returns empty results unexpectedly"

```json
{
  "success": true,
  "count": 0,
  "filters": { "q": "mouse" },
  "data": []
}
```

**Causes:**
- Product doesn't exist
- Category filter is too restrictive
- Case sensitivity issue (though code uses LOWER())
- Database not reinitialized with sample data

**Solution:**

```bash
# Verify database has data
curl "http://localhost:5001/inventory"
# Should return many items

# If empty, reinitialize
cd database-backend
rm inventory.db
npm run init-db

# Test with known product (from sample data)
# Sample products: "Wireless Mouse", "USB Keyboard", "Monitor", etc.
curl "http://localhost:5001/search?q=mouse"

# Try without filters
curl "http://localhost:5001/search"
# Should return all 10 inventory items

# Check category dropdown for valid values
curl "http://localhost:5001/inventory" | jq '.[].category'
# Should show: Electronics, Peripherals, Accessories, Display, etc.
```

### Error: "Search is very slow (>1 second)"

```
Search query takes >1000ms to complete
```

**Causes:**
- Database indexes not created
- Old database without indexes
- Query scanning entire table

**Solution:**

```bash
# Verify indexes exist
sqlite3 inventory.db ".indices"
# Should show: idx_category, idx_category_price, idx_price, idx_product_name, etc.

# If missing, reinitialize (indexes are created during init)
cd database-backend
rm inventory.db
npm run init-db

# Benchmark search performance
# With indexes: 5-20ms per search
# Without indexes: 100-500ms per search
time curl "http://localhost:5001/search?q=wireless"

# Check database file size (should include index space)
ls -lh inventory.db
# With indexes: ~50KB, Without: ~25KB
```

### Error: "Invalid price range parameters"

```json
{
  "success": false,
  "error": "Invalid price range"
}
```

**Causes:**
- `minPrice` > `maxPrice`
- Non-numeric price values
- Negative prices

**Solution:**

```bash
# Valid request (ascending order)
curl "http://localhost:5001/search?minPrice=50&maxPrice=300"

# Invalid request (minPrice > maxPrice) - Returns 400
curl "http://localhost:5001/search?minPrice=300&maxPrice=50"

# Check API docs for price range validation
# Requirement: minPrice ≤ maxPrice
# Requirement: prices must be positive numbers
```

### Error: "Category not appearing in dropdown"

**Cause:** Category column doesn't exist in old database

**Solution:**

```bash
# Verify category column exists
sqlite3 inventory.db "PRAGMA table_info(inventory);"
# Should show: category column with type TEXT

# If missing, reinitialize
cd database-backend
rm inventory.db
npm run init-db

# Refresh frontend to see new categories
# Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Error: "Search modal shows 'no filters applied' but data exists"

**Cause:** Category field missing from inventory items during creation

**Solution:**

```bash
# Verify category defaults properly
curl -X POST "http://localhost:5001/inventory" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Test Item",
    "supplier_id": 1,
    "quantity": 10,
    "price": 99
    // Note: category not specified - should default to "Uncategorized"
  }'

# Check response includes category
# Should return: {"success":true,"id":XX,"category":"Uncategorized"}

# Verify existing items have category
curl "http://localhost:5001/inventory" | jq '.[0].category'
```

### Error: "POST /supplier returns 500"

```
Database operation failed
```

**Causes:**
- Database not initialized
- Wrong database path
- Network issue

**Solution:**

```bash
# Ensure database initialized
cd database-backend
npm run init-db

# Verify database exists
ls inventory.db

# Check database accessible
sqlite3 inventory.db ".tables"
# Should show: inventory  suppliers

# Check backend is reading correct path
grep "inventory.db" database-backend/server.js
grep "inventory.db" database-backend/initDb.js
```

### Error: "API returning empty array"

```json
{ "success": true, "count": 0, "data": [] }
```

**Causes:**
- Search filters too restrictive
- Database empty
- Wrong endpoint

**Solution:**

```bash
# Test search with no filters
curl "http://localhost:5000/search"

# Should return all 12 items

# For database, check items exist
curl "http://localhost:5001/inventory"

# If empty, reinitialize database
cd database-backend
npm run init-db
npm start
```

---

# Frontend Issues

## Development Server Not Starting

### Error: "Vite dev server failed to start"

```
Error: listen EADDRINUSE: address already in use :::5173
```

**Solution:**

```bash
# See [Port Issues](#port-issues) section above
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 5180
```

### Error: "Cannot find module './App.css'"

```
✘ [ERROR] [plugin: vite:import-analysis] Failed to parse ...
Could not load ./App.css
```

**Cause:** App.css file missing

**Solution:**

```bash
# Check file exists
ls src/App.css

# If missing, create it
touch src/App.css

# Or restore from repository
git checkout src/App.css
```

### Error: "Failed to resolve Ant Design"

```
Module not found: Error: Can't resolve 'antd'
```

**Cause:** Dependencies not installed

**Solution:**

```bash
npm install
npm run dev

# Verify antd installed
npm list antd
```

### Error: "HMR (Hot Module Reload) not working"

No changes reflecting when file saved

**Solution:**

```bash
# Restart Vite dev server
# Kill process: Ctrl+C
# Restart: npm run dev

# Or clear Vite cache
rm -rf node_modules/.vite
npm run dev

# Check Vite config has correct port
cat vite.config.js | grep port
```

## Frontend Can't Connect to Backend

### Error: "Failed to fetch from http://localhost:5000"

**Cause:** Backend not running or port wrong

**Solution:**

```bash
# Verify backend running
curl http://localhost:5000/health

# If fails, start backend
cd backend && npm start

# Check frontend using correct URL
grep "localhost:5000" frontend/src/App.jsx

# Should be exact: http://localhost:5000
# Not: http://localhost:5001 or missing port
```

### Error: "CORS error in browser console"

```
Access to XMLHttpRequest at 'http://localhost:5000/search'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Cause:** Backend CORS not configured correctly

**Solution:**

```javascript
// In backend/server.js, ensure this line exists:
const cors = require('cors');
app.use(cors());

// If still failing, check CORS config:
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

### Error: "Network tab shows 404"

API endpoint returns 404

**Cause:** Wrong endpoint path or typo

**Solution:**

```bash
# Verify endpoint exists by testing with curl
curl http://localhost:5000/search
curl http://localhost:5000/categories

# In App.jsx, check endpoint exactly:
// Wrong:
axios.get('/api/search')

// Correct:
axios.get('http://localhost:5000/search')
```

---

# State Management & Data Issues

## Search Results Not Updating

**Problem:** Results table stays empty even though API returns data

**Debugging:**

```javascript
// Add logging in App.jsx
const handleSearch = async () => {
  try {
    console.log('Searching with:', filters);
    const response = await axios.get('/search', { params: filters });
    console.log('API Response:', response.data);
    setResults(response.data.data || []);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

**Check Browser Console:**
- Press F12 → Console tab
- Look for `console.log` output
- Verify response.data structure matches expected

**Solution:**

```javascript
// Ensure state updates trigger re-render
const [results, setResults] = useState([]);

// Make sure to update state
setResults(response.data.data);  // Correct

// NOT just assigning to variable
let results = response.data.data; // Wrong - won't re-render
```

## Data Not Persisting (Project B)

**Problem:** Created suppliers/items disappear after restart

**Cause:** Database not saved to disk, or using wrong path

**Solution:**

```bash
# Verify database persists
ls -l database-backend/inventory.db

# Check database path in server.js
grep "inventory.db" database-backend/server.js

# Should be: ./inventory.db (relative path)
# Not: /tmp/inventory.db or other temp location

# After creating data:
npm run init-db
# Suppliers should still exist:
curl http://localhost:5001/suppliers
```

---

# Performance Issues

## Application Running Slowly

### Backend slow

**Debugging:**

```bash
# Add timing logs to server.js
console.time('searchQuery');
// ... search logic
console.timeEnd('searchQuery');

# Should show: searchQuery: 0.5ms
# If > 100ms, optimize needed
```

**Optimization:**

```javascript
// Avoid repeated file reads
let cachedData = null;

app.get('/search', (req, res) => {
  // Load once, cache for performance
  if (!cachedData) {
    cachedData = JSON.parse(fs.readFileSync('data.json'));
  }
  // ... use cachedData
});
```

### Frontend slow

**Check:**

```bash
# Open DevTools → Performance tab
# Record page load
# Look for long tasks > 50ms

# Check component rendering
# Add React DevTools extension
# See which components re-rendering
```

**Optimize:**

```javascript
// Memoize expensive components
import { memo } from 'react';

const ResultsTable = memo(({ data }) => {
  return <Table dataSource={data} />;
});

// Or use useMemo
const sortedResults = useMemo(
  () => results.sort((a, b) => a.price - b.price),
  [results]
);
```

---

# Deployment Issues

## Heroku App Not Starting

```
Application error: An error occurred in the application and your page could not be served.
Please try again in a few moments.
```

**Debugging:**

```bash
heroku logs -a your-app-name --tail
heroku logs -a your-app-name --num=100

# Check logs for actual error
# Common: missing environment variables, wrong port
```

**Solution:**

```bash
# Set environment variables
heroku config:set -a your-app-name NODE_ENV=production

# Restart app
heroku restart -a your-app-name

# View logs again
heroku logs -a your-app-name --tail
```

## Frontend Builds But Doesn't Load

**Problem:** Build succeeds but page shows blank

**Check:**

```bash
# Verify build output
npm run build
# Check dist/ folder exists with files

# Test build locally
npm run preview
# Should load in browser

# Check for console errors
# F12 → Console tab → Look for errors
```

## Database Lost After Deployment

**Cause:** SQLite file not persisted (Heroku causes this)

**Solutions:**

### For Heroku:
```bash
# Heroku kills files between deployments
# Solution: Migrate to PostgreSQL

# Or use Heroku Postgres Add-on:
heroku addons:create heroku-postgresql -a your-app
```

### For AWS/DigitalOcean:
```bash
# Ensure database directory is persistent
# Use EBS volumes or external database

# Or backup database
crontab -e
# Add: 0 2 * * * pg_dump > /backups/db-$(date +\%Y\%m\%d).sql
```

---

# Network & Connectivity

## "Cannot reach localhost"

**Problem:** Localhost works on one machine but not another

**Cause:** Machines/containers are different

**Solution:**

```javascript
// Use 0.0.0.0 to listen on all interfaces
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server at http://${HOST}:${PORT}`);
});
```

## SSL Certificate Errors

```
NET::ERR_CERT_AUTHORITY_INVALID
```

**For Development (self-signed):**

```bash
# Create self-signed cert
openssl req -x509 -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt

# Use in Node server
const https = require('https');
const fs = require('fs');
const app = require('express')();

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}, app).listen(443);
```

**For Production:**

```bash
# Use Let's Encrypt (free)
# On AWS/DigitalOcean:
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Then use certificate in your app
```

---

# Windows-Specific Issues

## "node is not recognized as an internal command"

**Cause:** Node.js not in PATH

**Solution:**

```bash
# Reinstall Node.js
# Download from https://nodejs.org
# Make sure "Add to PATH" is checked during install

# Or manually add to PATH:
# Control Panel → System → Advanced System Settings → Environment Variables
# Add: C:\Program Files\nodejs
```

## "npm ERR! code EWINDOWSCODE"

**Cause:** Script not compatible with Windows

**Solution:**

```bash
# Use cross-platform package
npm install --save-dev cross-env

# In package.json
"scripts": {
  "start": "cross-env NODE_ENV=production node server.js"
}
```

## PowerShell Execution Policy Error

```
PowerShell: File cannot be loaded because running scripts is disabled
```

**Solution:**

```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

# Mac-Specific Issues

## "Port 5000 already in use (Control Center)"

**Cause:** macOS Monterey+ uses port 5000 for Control Center

**Solution:**

```bash
# Use different port
PORT=5002 npm start

# Or disable Control Center port sharing
# Settings → General → AirDrop & Handoff
```

## "xcrun: error: unable to find utility"

**Cause:** Xcode Command Line Tools missing

**Solution:**

```bash
xcode-select --install
```

---

# Linux-Specific Issues

## Port Permission Denied (ports < 1024)

```
Error: listen EACCES: permission denied 127.0.0.1:80
```

**Solution:**

```bash
# Use ports > 1024
PORT=3000 npm start

# Or grant permission (not recommended for security)
sudo setcap cap_net_bind_service=+ep /usr/bin/node

# Or use sudo (not recommended)
sudo npm start
```

---

# General Debugging Tips

### 1. Clear Cache & Reinstall

```bash
# Nuclear option - clears everything
rm -rf node_modules package-lock.json .next dist
npm cache clean --force
npm install
npm start
```

### 2. Check Node/npm Versions

```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 8.x or higher

# Upgrade if needed
npm install -g npm@latest
```

### 3. Use Verbose Logging

```bash
# Enable debug logs
DEBUG=* npm start

# Or for Express
NODE_DEBUG=express npm start
```

### 4. Test API with Postman

```
1. Download Postman: https://www.postman.com
2. Create new request
3. Type: GET
4. URL: http://localhost:5000/search
5. Send
6. Check response in Postman
```

### 5. Browser DevTools

Press `F12` to open DevTools:
- **Network tab**: See all API calls and responses
- **Console tab**: See JavaScript errors
- **Sources tab**: Debug JavaScript
- **Storage tab**: Check localStorage

### 6. VS Code Terminal Integration

```bash
# Use integrated terminal in VS Code
# Ctrl + `

# Run commands directly from editor
# Advantages: Easy switching between terminals, output saving
```

---

# When All Else Fails

### 1. Check Official Docs
- Express: https://expressjs.com
- React: https://react.dev
- Ant Design: https://ant.design
- Vite: https://vitejs.dev
- SQLite: https://www.sqlite.org

### 2. Stack Overflow Search
- Search exact error message
- Filter by date (recent solutions better)
- Look for marked "answered"

### 3. GitHub Issues
- Search project issues
- Look for similar problems
- Post new issue with:
  - Error message
  - Steps to reproduce
  - Node version
  - OS

### 4. Community Support
- Reddit: r/node, r/reactjs, r/webdev
- Discord servers
- Slack communities

---

# Summary

**Most Common Issues & Solutions:**

| Issue | Cause | Quick Fix |
|-------|-------|-----------|
| Port in use | Another app using port | `kill $(lsof -ti:5000)` |
| npm ERR | Dependencies missing | `npm install` |
| API 404 | Wrong endpoint | Check exact URL |
| CORS error | Backend not configured | Add `app.use(cors())` |
| DB missing | npm run init-db not executed | `npm run init-db` |
| Frontend blank | Build failed silently | `npm run build` check output |
| Slow performance | Unoptimized code | Add caching, indexes |
| Deployment fails | Environment vars | Set and verify `process.env` |

**Remember:** 90% of issues have already been solved. Search first!

---

For additional help: Check [SETUP_GUIDE.md](SETUP_GUIDE.md) or [DEPLOYMENT.md](DEPLOYMENT.md).
