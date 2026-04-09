# 🚀 Deployment Guide

Production deployment strategies for both inventory management applications.

---

## Deployment Overview

Both applications can be deployed to various cloud platforms. This guide covers:

1. **Heroku** (Easiest, free tier available)
2. **AWS EC2** (Full control, more setup)
3. **Vercel** (Frontend + Backend, fastest modern approach) ⭐ **RECOMMENDED**
4. **DigitalOcean** (Simple VPS option)
5. **Docker** (Containerized approach)

---

# 🚀 Vercel Deployment (Recommended for Project B)

## Why Vercel?

✅ **Easy Setup** - Git-based deployment, no CLI learning curve  
✅ **Fast Build** - Next.js-optimized, instant deployments  
✅ **Serverless** - No server management  
✅ **Generous Free Tier** - Unlimited projects, 100GB bandwidth  
✅ **Automatic HTTPS** - SSL included  
✅ **Preview Deployments** - Every branch gets live preview URL  

## Deployment Architecture

```
GitHub Repository
    ↓
Vercel (Frontend + Backend as Serverless Functions)
    ↓
    ├─ React/Vite Frontend → CDN
    ├─ Node.js API → Serverless Functions
    └─ PostgreSQL Database → Vercel Postgres
```

## Prerequisites

- GitHub account with repository pushed
- Vercel account: https://vercel.com/signup
- Project B code in Git repository

## Step 1: Deploy Frontend to Vercel

### 1.1 Create Vercel Project

```bash
# Option A: CLI (Easiest)
npm i -g vercel
cd database-frontend
vercel

# Follow prompts:
# Project name: inventory-database-ui
# Framework: Vite
# Root directory: ./
# Deploy: Yes

# Output will show frontend URL:
# ✅ Production: https://inventory-database-ui.vercel.app
```

### 1.2 Or Deploy via GitHub

```bash
# Push to GitHub
git push origin main

# Go to https://vercel.com/new
# Select "Import Git Repository"
# Choose: inventory-search
# Configure:
#   - Framework: Vite
#   - Root Directory: database-frontend
#   - Environment Variables: (see section below)
# Deploy
```

### 1.3 Frontend Environment Variables

In Vercel Dashboard:
```
Settings → Environment Variables → Add
```

```bash
VITE_API_URL=https://your-backend-api.vercel.app
```

Update `database-frontend/src/App.jsx`:

```javascript
// Replace hardcoded localhost with env variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// In axios calls:
axios.get(`${API_BASE}/inventory`)
axios.get(`${API_BASE}/search?q=${query}`)
```

## Step 2: Deploy Backend to Vercel (Serverless Functions)

⚠️ **Important:** Vercel serverless has **no persistent storage**. SQLite files are deleted after request completes.

### Option A: Use Vercel Postgres (Recommended)

**Backend Refactoring Required**

1. **Replace SQLite with PostgreSQL:**

```bash
cd database-backend
npm install pg dotenv
```

2. **Update database connection in server.js:**

```javascript
// OLD (SQLite):
// const sqlite3 = require('sqlite3');
// const db = new sqlite3.Database('inventory.db');

// NEW (PostgreSQL):
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = {
  all: async (sql, params) => {
    const res = await pool.query(sql, params);
    return res.rows;
  },
  get: async (sql, params) => {
    const res = await pool.query(sql, params);
    return res.rows[0];
  },
  run: async (sql, params) => {
    return await pool.query(sql, params);
  }
};
```

3. **Create `api/index.js` for Vercel serverless:**

```javascript
// api/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Import all routes from server.js
const setupRoutes = require('../database-backend/server');
setupRoutes(app);

export default app;
```

4. **Update vercel.json:**

```json
{
  "buildCommand": "cd database-backend && npm install",
  "env": {
    "DATABASE_URL": "@database_url"
  },
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

5. **Deploy:**

```bash
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string

vercel deploy
```

### Option B: Keep Backend on Railway (Easier - No Code Changes)

Don't want to refactor? Keep Node/Express/SQLite separate:

**Deploy Backend to Railway.app:**

```bash
# 1. Sign up at https://railway.app
# 2. Create new project
# 3. Connect GitHub repository
# 4. Select database-backend folder
# 5. Add SQLite persistence (set root directory for persistent files)
# 6. Deploy

# Result: https://your-app.railway.app (backend URL)
```

Then update frontend env variables to point to Railway backend:

```
VITE_API_URL=https://your-app.railway.app
```

**This is simpler** - no code changes needed, just deploy as-is.

## Step 3: Environment Variables

### Frontend (.env.production)

```bash
VITE_API_URL=https://inventory-api.vercel.app
```

### Backend (Vercel Secrets)

In Vercel Dashboard → Settings → Environment Variables:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host/dbname
CORS_ORIGIN=https://inventory-database-ui.vercel.app
```

## Step 4: Configure CORS

Update `database-backend/server.js`:

```javascript
const cors = require('cors');
const API_URL = process.env.VITE_API_URL || 'http://localhost:5174';

app.use(cors({
  origin: API_URL,
  credentials: true
}));
```

## Step 5: Verify Deployment

### Test Frontend

```bash
# Visit https://inventory-database-ui.vercel.app
# Should load React app
```

### Test Backend

```bash
# Test API endpoint
curl "https://inventory-api.vercel.app/health"
# Response: {"status":"OK"}

# Test search
curl "https://inventory-api.vercel.app/search?q=mouse"
```

### Test Full Integration

```bash
# In browser: https://inventory-database-ui.vercel.app
# Create supplier → Should hit backend API
# Search inventory → Should return results
# Check DevTools Network tab for API calls to correct URL
```

## Troubleshooting Vercel Deployment

### Issue: Frontend loads but API calls fail

```
Error: CORS error or 404
```

**Solution:**
1. Check VITE_API_URL environment variable is set
2. Verify backend is deployed and `/health` endpoint works
3. Update CORS origin in backend to match frontend URL

### Issue: Serverless function timeout

```
Error: 504 Gateway Timeout
```

**Solution:**
1. Increase function timeout in vercel.json (max 60s on Pro)
2. Optimize database queries
3. Add caching for search queries

### Issue: Database connection fails

```
Error: connect ECONNREFUSED or connection pool error
```

**Solution:**
1. Verify DATABASE_URL environment variable is correct
2. Check PostgreSQL server is running (if Option A)
3. Ensure IP whitelist includes Vercel's servers

## Deployment Checklist

### Frontend
- [ ] GitHub repository updated with database-frontend code
- [ ] VITE_API_URL environment variable set
- [ ] Vercel project created and deployed
- [ ] Preview URL working: https://inventory-database-ui.vercel.app

### Backend
- [ ] Database configured (PostgreSQL or SQLite on Railway)
- [ ] Environment variables set (DATABASE_URL, CORS_ORIGIN)
- [ ] API deployed and `/health` endpoint responds
- [ ] CORS configured for frontend URL

### Integration
- [ ] Frontend loads successfully
- [ ] API calls from frontend hit correct backend URL
- [ ] Create/Read/Update/Delete operations work
- [ ] Search feature returns results
- [ ] Category dropdown populated correctly

## Cost Estimate

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel Frontend | ✅ Unlimited | Free |
| Vercel Serverless | ✅ 100 GB bandwidth | Free → $0.50/GB |
| Vercel Postgres | ✅ 3 projects | $35/month |
| Railway Backend | ✅ $5/month credit | + Electricity |
| Railway Postgres | ✅ $5/month credit | + Electricity |

**Recommendation:** Railway for both backend + database is cheapest ($5-10/month stable pricing)

---

## Project B (Database-Focused) Deployment Notes

### Pre-Deployment Checklist

Before deploying Project B, ensure:

✅ **Search Feature**
- GET /search endpoint implemented in server.js
- Category column added to inventory table
- Database indexes created for performance

✅ **Database Migration**
- All 7 performance indexes are created during initialization
- Category column defaults to "Uncategorized"
- Foreign key constraints enabled (CASCADE delete)

✅ **Performance Optimization**
- Run `npm run init-db` to create indexes
- Verify index creation: `sqlite3 inventory.db ".indices"`
- Expected query time: 5-20ms (with indexes) vs 100-500ms (without)

### Database Deployment Strategy

**Option 1: Initialize on First Startup (Recommended)**

```bash
# In package.json scripts
"scripts": {
  "start": "npm run init-db && node server.js",
  "init-db": "node initDb.js"
}

# On deployment, database initializes automatically with:
# - Complete schema (suppliers + inventory tables)
# - All 7 performance indexes
# - Sample data for testing
```

**Option 2: Pre-Build Database**

```bash
# Locally create database.db
npm run init-db

# Include in deployment
# This is faster but requires binary file in git
# Not recommended for cloud deployments
```

### Search Feature Deployment

The new search feature includes:

**API Endpoint:** `GET /search`
- Query Parameters: `q` (product name), `category`, `minPrice`, `maxPrice`
- Performance: Optimized with indexes (10-50x faster)
- Security: Parameterized queries prevent SQL injection

**Deployment Checklist:**
1. Ensure server.js has search endpoint (lines 662-735)
2. Database includes category column
3. All 7 indexes created:
   - `idx_product_name` - For product searches
   - `idx_category` - For category filtering
   - `idx_price` - For price filtering
   - `idx_category_price` - Composite index for combined filters
   - `idx_supplier_price` - For supplier analysis

**Post-Deployment Verification:**

```bash
# Test search endpoint
curl "https://deployed-api.com/search?q=wireless"

# Verify index performance
# Should complete in <100ms even with large datasets

# Test combined filters
curl "https://deployed-api.com/search?category=Electronics&minPrice=50&maxPrice=200"
```

### Database File Location

**Development:**
- Location: `database-backend/inventory.db`
- Size: ~50KB (with indexes)
- Recreated on each `npm run init-db`

**Production:**
- Location: `/app/data/inventory.db` (Heroku) or `/opt/app/data/inventory.db` (DigitalOcean)
- Configuration: Set in server.js connection string
- Backup: Enable automatic backups in cloud platform

### Scaling Considerations

**Current Performance Characteristics:**

| Metric | Value |
|--------|-------|
| Max Records (Optimal) | 100,000 |
| Avg Query Time | 5-20ms |
| Index Storage Overhead | 25KB → 50KB |
| Memory Usage | ~10MB |

**If Exceeding Capacity:**

1. Migrate to PostgreSQL (RDS on AWS)
2. Add read replicas for search queries
3. Implement caching layer (Redis)
4. Archive old data to separate table

### Environment Variables (Project B)

```bash
# database-backend/.env.production
PORT=5001
NODE_ENV=production
DB_PATH=/app/data/inventory.db
CORS_ORIGIN=https://inventory-database-ui.herokuapp.com
```

### Database Backup Strategy

**On Heroku:**
```bash
# No built-in database, use add-on
heroku addons:create heroku-postgresql

# Or manually backup SQLite
npm run backup-db

# Creates: inventory-backup-$(date +%Y%m%d).db
```

**On DigitalOcean:**
```bash
# Copy database file regularly
0 2 * * * cp /opt/app/data/inventory.db /backups/inventory-$(date +\%Y\%m\%d).db
```

### Rollback Procedure

If search feature causes issues:

```bash
# Rollback to previous backend
git revert <commit-hash>

# Redeploy
git push heroku main

# Database automatically reinitializes
# Category column is backwards compatible
```

---

# Option 1: Heroku (Recommended for Beginners)

## Why Heroku?

✅ Easiest deployment process  
✅ Free tier available (with limitations)  
✅ Automatic SSL/HTTPS  
✅ No server management  
✅ Git-based deployment  

## Prerequisites

- Heroku account: https://signup.heroku.com
- Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
- Git repository

## Step-by-Step Deployment

### 1. Install Heroku CLI

```bash
# Windows/Mac/Linux
# Download from: https://devcenter.heroku.com/articles/heroku-cli
heroku --version
```

### 2. Login to Heroku

```bash
heroku login
# Opens browser to authenticate
```

### 3. Create Heroku Apps

```bash
# Create app for Project A Backend
heroku create inventory-search-api-a

# Create app for Project A Frontend
heroku create inventory-search-ui-a

# Create app for Project B Backend
heroku create inventory-database-api

# Create app for Project B Frontend
heroku create inventory-database-ui
```

### 4. Configure Environment Variables

```bash
# For Project A Backend
heroku config:set -a inventory-search-api-a \
  NODE_ENV=production \
  PORT=5000

# For Project B Backend
heroku config:set -a inventory-database-api \
  NODE_ENV=production \
  PORT=5001 \
  DATABASE_URL=/app/data/inventory.db
```

### 5. Deploy Backend Applications

#### Project A Backend

```bash
# From project root
cd backend

# Add Heroku remote
heroku git:remote -a inventory-search-api-a

# Deploy
git push heroku main
```

#### Project B Backend

```bash
cd ../database-backend

heroku git:remote -a inventory-database-api

git push heroku main
```

### 6. Deploy Frontend Applications

#### Project A Frontend

```bash
cd ../frontend

# Add build configuration for Vite
echo "npm run build" > Procfile

heroku git:remote -a inventory-search-ui-a

git push heroku main
```

#### Project B Frontend

```bash
cd ../database-frontend

echo "npm run build" > Procfile

heroku git:remote -a inventory-database-ui

git push heroku main
```

### 7. View Application

```bash
# Open in browser
heroku open -a inventory-search-api-a

# View logs
heroku logs -a inventory-search-api-a --tail
```

## Heroku Environment Variables

Create `.env.production`:

```bash
# backend/.env.production
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://inventory-search-ui-a.herokuapp.com

# database-backend/.env.production
NODE_ENV=production
PORT=5001
DATABASE_URL=/app/data/inventory.db
CORS_ORIGIN=https://inventory-database-ui.herokuapp.com
```

## Update Frontend URLs

Update API endpoints in React to use Heroku URLs:

```javascript
// frontend/src/App.jsx
const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://inventory-search-api-a.herokuapp.com'
  : 'http://localhost:5000';

// Replace all axios calls
axios.get(`${API_BASE}/search?q=${searchTerm}`)
```

## Heroku Cost

| Tier | Price | Suitable For |
|---|---|---|
| Free | $0/month | Testing only (sleeps after 30 min) |
| Hobby | $7/month | Light projects (always on) |
| Standard | $25+/month | Production apps |

---

# Option 2: AWS EC2

## Why AWS EC2?

✅ Scalable infrastructure  
✅ Full server control  
✅ Pay-per-use model  
✅ Industry standard  
✗ More setup required  

## Prerequisites

- AWS account: https://aws.amazon.com
- EC2 instance with Ubuntu 20.04 LTS
- Security group allowing ports 80, 443, 5000, 5001

## Step-by-Step Deployment

### 1. Launch EC2 Instance

```bash
# AWS Console → EC2 → Launch Instance
# Choose: Ubuntu 20.04 LTS, t3.micro (free tier eligible)
# Configure security: Allow SSH (22), HTTP (80), HTTPS (443)
```

### 2. Connect to Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-instance-ip
```

### 3. Install Node.js

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### 4. Clone Repository

```bash
# Install Git
sudo apt install -y git

# Clone
git clone https://github.com/your-username/inventory-search.git
cd inventory-search
```

### 5. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../database-backend && npm install
cd ../database-frontend && npm install
```

### 6. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Start applications with PM2
cd ~/inventory-search/backend
pm2 start server.js --name "search-api"

cd ../database-backend
npm run init-db
pm2 start server.js --name "database-api"

# Save PM2 config
pm2 save

# Auto-start on reboot
pm2 startup
```

### 7. Install Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/default
```

Paste this configuration:

```nginx
upstream search_api {
    server localhost:5000;
}

upstream database_api {
    server localhost:5001;
}

upstream search_ui {
    server localhost:3000;
}

upstream database_ui {
    server localhost:3001;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;

    # Project A API
    location /api/search {
        proxy_pass http://search_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Project B API
    location /api/database {
        proxy_pass http://database_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Project A UI
    location / {
        proxy_pass http://search_ui;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Test Nginx config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 8. Enable HTTPS (SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### 9. Monitor Logs

```bash
# PM2 logs
pm2 logs

# System logs
tail -f /var/log/syslog

# Nginx logs
tail -f /var/log/nginx/error.log
```

## AWS EC2 Cost

| Instance Type | Price/month | Suitable |
|---|---|---|
| t3.micro | $9.50 | Dev/Test |
| t3.small | $19 | Light production |
| t3.medium | $38 | Production |

---

# Option 3: Vercel (Frontend Only)

## Why Vercel?

✅ Optimized for React  
✅ Automatic deployments from Git  
✅ Free tier generous  
✅ Lightning-fast global CDN  

## Step-by-Step

### 1. Sign Up

Visit https://vercel.com/signup

### 2. Deploy Project A Frontend

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variable
vercel env add VITE_API_URL https://your-backend-api.com
```

### 3. Deploy Project B Frontend

```bash
cd ../database-frontend

vercel --prod
```

### 4. Update Backend URLs

```javascript
// frontend/src/App.jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
```

## Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

---

# Option 4: DigitalOcean App Platform

## Why DigitalOcean?

✅ $5-12/month simple pricing  
✅ Docker-ready  
✅ One-click WordPress/Ruby/Node  
✅ Good documentation  

## Deployment

```bash
# 1. Create DigitalOcean account
# 2. App Platform → Create App
# 3. Connect GitHub repository
# 4. Configure:
#    - Backend: Node.js service
#    - Frontend: Static site (Vite build)
# 5. Deploy
```

---

# Option 5: Docker Containerization

## Why Docker?

✅ Consistent environment across machines  
✅ Easy scaling  
✅ Some platforms require it  
✓ Slight learning curve  

## Dockerize Backend (Project A)

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
```

Create `backend/.dockerignore`:

```
node_modules
npm-debug.log
.git
.gitignore
```

Build and run:

```bash
cd backend

# Build image
docker build -t inventory-search-api .

# Run container
docker run -p 5000:5000 inventory-search-api

# Or with environment
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  inventory-search-api
```

## Docker Compose (All Services)

Create `docker-compose.yml` at root:

```yaml
version: '3.8'

services:
  search-api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000

  search-ui:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - search-api

  database-api:
    build: ./database-backend
    ports:
      - "5001:5001"
    environment:
      NODE_ENV: production
      PORT: 5001
      DATABASE_URL: /app/data/inventory.db
    volumes:
      - db-data:/app/data

  database-ui:
    build: ./database-frontend
    ports:
      - "3001:3001"
    depends_on:
      - database-api

volumes:
  db-data:
```

Run all services:

```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

# Production Checklist

## Security

- [ ] Enable HTTPS/SSL
- [ ] Add rate limiting
- [ ] Implement authentication (JWT)
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Configure CORS properly
- [ ] Add CSRF protection
- [ ] Regular security updates

## Performance

- [ ] Enable gzip compression
- [ ] Add CDN for static assets
- [ ] Implement caching headers
- [ ] Database indexes created
- [ ] Connection pooling enabled
- [ ] Load testing completed

## Monitoring

- [ ] Error tracking (Sentry, DataDog)
- [ ] Log aggregation (ELK, CloudWatch)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Alerting configured
- [ ] Backup strategy

## Database (Project B)

- [ ] Regular backups automated
- [ ] Replication configured
- [ ] Encryption at rest
- [ ] Encryption in transit (SSL)
- [ ] Disaster recovery plan

## DevOps

- [ ] CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Automated tests
- [ ] Staging environment
- [ ] Rollback procedure documented
- [ ] Deployment runbook

---

# Environment Variables for Production

### Project A Backend

```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
RATE_LIMIT=100
RATE_WINDOW=60
```

### Project B Backend

```bash
NODE_ENV=production
PORT=5001
DATABASE_URL=/data/inventory.db
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
BACKUP_ENABLED=true
BACKUP_INTERVAL=86400
```

### Frontend Env

```bash
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME="Inventory System"
VITE_ENVIRONMENT=production
```

---

# Post-Deployment Verification

```bash
# Test endpoints
curl https://yourdomain.com/api/health

# Monitor logs
ssh user@server 'tail -f /var/log/application.log'

# Check performance
curl -I https://yourdomain.com
# Should see: < HTTP/2 200

# Test database
curl https://yourdomain.com/api/suppliers
# Should see: { "success": true, ... }

# Monitor usage
# Visit monitoring dashboard (DataDog, New Relic, etc.)
```

---

# Cost Comparison (Monthly)

| Platform | Minimum Cost | Notes |
|---|---|---|
| Heroku | $7 | Free tier sleeps |
| AWS EC2 | $9.50 | t3.micro free tier |
| Vercel | $0 | Frontend only, generous free tier |
| DigitalOcean | $5 | Shared resources |
| Self-hosted | $0-∞ | Depends on infrastructure |

---

# Migration and Scaling

### Single Server → Distributed

```
Single EC2 → Multiple EC2 instances
                    ↓
            Load Balancer (ELB)
                    ↓
        [Server 1] [Server 2] [Server 3]
                    ↓
        PostgreSQL (RDS)
                    ↓
        Redis Cache (ElastiCache)
```

### Database Migration (SQLite → PostgreSQL)

```bash
# Export SQLite
sqlite3 inventory.db ".mode csv" \
  "SELECT * FROM suppliers;" > suppliers.csv

# Import to PostgreSQL
psql -d inventory_db -c \
  "COPY suppliers FROM STDIN CSV;" < suppliers.csv
```

---

# Troubleshooting Deployment

### Application won't start

```bash
# Check logs
heroku logs -a app-name --tail

# or

ssh user@server
pm2 logs app-name
```

### Database connection failing

```bash
# Verify credentials
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### High memory usage

```bash
# Increase Node heap
NODE_OPTIONS=--max-old-space-size=4096 npm start

# or in PM2
pm2 start app.js --node-args="--max-old-space-size=4096"
```

### API timeouts

```bash
# Increase timeout in Nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

---

## Summary

**Recommended for:**
- **Learning:** Local development + Heroku free tier
- **Small Business:** AWS EC2 t3.micro + manually managed
- **Startup:** DigitalOcean App Platform
- **Enterprise:** AWS with full stack (ELB, RDS, ElastiCache)

Both applications are **production-ready** and can be deployed to any Node.js-compatible platform.

For questions, refer to specific cloud provider documentation or [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
