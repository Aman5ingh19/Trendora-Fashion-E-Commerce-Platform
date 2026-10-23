# 👗 Trendora — Fashion E-Commerce Platform

[![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A production-grade, full-stack fashion e-commerce web application inspired by the shopping experience of **Myntra**, built using the **MEAN stack** (MongoDB, Express.js, Angular 21 with Standalone Components & Signals, Node.js).

---

## 📑 Table of Contents
- [🌟 Key Highlights & Features](#-key-highlights--features)
- [🏗️ System Architecture](#️-system-architecture)
- [📁 Project Directory Structure](#-project-directory-structure)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [🔑 Default User Accounts](#-default-user-accounts)
- [🛡️ Security & Authentication Model](#️-security--authentication-model)
- [🛍️ End-to-End User Journeys](#️-end-to-end-user-journeys)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [📬 Postman API Collection](#-postman-api-collection)
- [📖 Complete REST API Documentation](#-complete-rest-api-documentation)
- [🌐 Production Deployment Guide](#-production-deployment-guide)
- [👨‍💻 Author & Contributing](#-author--contributing)

---

## 🌟 Key Highlights & Features

### 🛍️ Customer Storefront Experience
- **Interactive Home Editorial**: Auto-rotating promotional hero carousel, live flash sale countdown timer with urgency badges, category spotlights, brand rails, and product showcases.
- **Product Listing Page (PLP)**:
  - Sticky faceted filter sidebar (Gender, Brands, Price Range slider, Sizes, Minimum Discounts).
  - Search by keyword with instant regex and case-insensitive matching.
  - Active filter chips with 1-click dismissal and "Clear All".
  - Multi-criteria sorting (Price: Low to High, Price: High to Low, Newest, Popularity).
  - Shimmer skeleton loaders and pagination.
- **Product Details Page (PDP)**:
  - Multi-image thumbnail gallery with interactive zoom preview.
  - Interactive size selector with real-time stock validation and `<5 left` urgency alerts.
  - Pin code delivery availability checker.
  - Specifications table and similar product recommendations rail.
- **Shopping Bag & Wishlist**:
  - Live server-side price recalculation (never trusting client prices).
  - Size-picker drawer on wishlist cards to move directly into the shopping bag.
  - Free delivery milestone progress tracker (Free delivery above ₹999).
- **Checkout & Order Management**:
  - Delivery address management with default selection.
  - Cash on Delivery (COD) and Online payment method selection.
  - Atomic stock deduction with rollback to prevent overselling race conditions.
  - Visual order tracking stepper (`Placed` → `Confirmed` → `Shipped` → `Delivered`).
  - Online self-cancellation with immediate atomic inventory restoration.

### 📊 Admin Studio Dashboard (`/admin`)
- **Executive Metrics (KPIs)**: Total Revenue, Total Orders, Active Catalog Products, Verified Customers, and Low Inventory Alerts (`stock <= 5`).
- **Order Fulfillment Management**: Filter orders by status, inspect itemized customer orders, and update status (`Placed` → `Confirmed` → `Shipped` → `Delivered` → `Cancelled`) with live DB sync.
- **Product Catalog Management**: Add new products, update prices, manage per-size inventory stocks, and delete products with modal forms.

---

## 🏗️ System Architecture

```text
+-------------------------------------------------------------------------+
|                       ANGULAR 21 FRONTEND SPA                           |
|  - Standalone Components & Angular Router with Functional Route Guards  |
|  - Reactive Signals & Computed Properties for High-Performance State    |
|  - Reactive Forms with Deep Validation & Toast Feedback Notifications   |
|  - Pure SCSS Design System (Outfit + Plus Jakarta Sans + Material Icons)|
+------------------------------------+------------------------------------+
                                     |
                                     | REST API (JSON / HTTP)
                                     | HttpOnly Secure Cookies
                                     v
+------------------------------------+------------------------------------+
|                       NODE.JS & EXPRESS BACKEND                         |
|  - RESTful MVC Architecture with Centralized Error Handling Middleware  |
|  - Helmet HTTP Headers, CORS Credentials Verification, Express RateLimit|
|  - JWT Authentication via HttpOnly Cookie (trendora_token)              |
|  - Role-Based Access Control (RBAC: 'customer' vs 'admin')              |
|  - Atomic Inventory Stock Deductions ($inc with $gte Guard)             |
+------------------------------------+------------------------------------+
                                     |
                                     | Mongoose ODM
                                     v
+------------------------------------+------------------------------------+
|                         DATABASE LAYER                                  |
|  - MongoDB (Atlas Cloud Cluster OR Local MongoDB)                       |
|  - Automatic Fallback to In-Memory MongoDB Server (Zero-Config Dev)     |
|  - Auto-Seeding Engine on First Boot (Categories, Products, Root Admin) |
+-------------------------------------------------------------------------+
```

---

## 📁 Project Directory Structure

```text
Trendora-Fashion-E-Commerce-Platform/
├── .gitignore                          # Root git ignore (protects .env, node_modules, dist)
├── README.md                           # Master project documentation
├── Trendora_API.postman_collection.json # Complete Postman API testing suite
│
├── backend/                            # Node.js & Express REST API Server
│   ├── .env.example                    # Environment variable template
│   ├── package.json                    # Backend dependencies & test scripts
│   ├── src/
│   │   ├── server.js                   # Server boot & cluster entry point
│   │   ├── app.js                      # Express middleware, CORS, route registry
│   │   ├── config/
│   │   │   ├── db.js                   # Mongoose connection & in-memory fallback
│   │   │   └── autoSeed.js             # Initial boot catalog & admin seeder
│   │   ├── controllers/
│   │   │   ├── authController.js       # Register, login, cookies, addresses
│   │   │   ├── productController.js    # Filtered products, PDP, related items
│   │   │   ├── categoryController.js   # Category listings & counts
│   │   │   ├── cartController.js       # Server bag sync & stock validation
│   │   │   ├── wishlistController.js   # Wishlist toggle & item sync
│   │   │   ├── orderController.js      # Atomic order placement & cancellation
│   │   │   └── adminController.js      # KPI metrics, status updater, product CRUD
│   │   ├── middleware/
│   │   │   ├── auth.js                 # protect (cookie JWT) & authorize('admin')
│   │   │   └── errorHandler.js         # Centralized status & error handler
│   │   ├── models/
│   │   │   ├── User.js                 # Users & embedded addresses
│   │   │   ├── Product.js              # Products, sizes & inventory stocks
│   │   │   ├── Category.js             # Categories & slugs
│   │   │   ├── Cart.js                 # Cart items & timestamps
│   │   │   ├── Wishlist.js             # Wishlist items
│   │   │   └── Order.js                # Order items, shipping snapshot, status history
│   │   └── routes/                     # Modular Express REST route definitions
│   └── tests/                          # Automated integration test suites
│       ├── auth.test.js                # Auth, registration & cookie lifecycle
│       ├── products.test.js            # Faceted search, filtering & PDP
│       ├── cart.test.js                # Bag persistence & stock limits
│       ├── orders.test.js              # Atomic order placement & admin actions
│       └── health.test.js              # Healthcheck & 404 handler
│
└── frontend/                           # Angular 21 Standalone Application
    ├── angular.json                    # Angular CLI & build budgets configuration
    ├── package.json                    # Frontend dependencies
    └── src/
        ├── index.html                  # HTML entry point with Google Fonts
        ├── styles.scss                 # Luxury fashion design system tokens
        ├── environments/               # Dev & prod API endpoint configurations
        └── app/
            ├── app.config.ts           # Standalone providers & router config
            ├── app.routes.ts           # Route registry with functional guards
            ├── core/
            │   ├── guards/             # authGuard, adminGuard
            │   ├── models/             # Product, Order, User, Dashboard TypeScript models
            │   └── services/           # AuthService, ProductService, CartService, OrderService, ToastService
            ├── features/
            │   ├── home/               # Editorial carousel, flash sale countdown, category spotlights
            │   ├── products/           # Faceted filter sidebar, search, product card grid
            │   ├── product-details/    # Gallery, size selector, delivery validator
            │   ├── cart/               # Bag items, quantity selector, price summary
            │   ├── wishlist/           # Saved items with quick size picker
            │   ├── checkout/           # Address management, COD selection, place order
            │   ├── orders/             # My orders history & tracking stepper details
            │   ├── auth/               # Login & Registration reactive forms
            │   └── admin/              # Executive KPI dashboard, order fulfillment, product manager
            └── shared/components/      # Reusable Navbar, ProductCard, Footer, Toast
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Aman5ingh19/Trendora-Fashion-E-Commerce-Platform.git
cd Trendora-Fashion-E-Commerce-Platform
```

---

### Step 2: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 3: Configure Environment Variables
A default `.env` file is prepared in `backend/.env`. You can also create it from the example:
```bash
cd backend
cp .env.example .env
```

Default `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/trendora_db
USE_MEMORY_DB_IF_LOCAL_FAILS=true
JWT_SECRET=trendora_super_secret_jwt_key_fashion_2026_dev_environment
JWT_EXPIRE=7d
COOKIE_SECRET=trendora-cookie-secret-key-2026
CLIENT_URL=http://localhost:4200
```

> **Zero-Config In-Memory Database**: If you do not have a local MongoDB daemon running, the backend will **automatically spin up an in-memory MongoDB instance** (`mongodb-memory-server`) and seed initial catalog data automatically!
>
> **Connecting MongoDB Atlas**: To use cloud MongoDB Atlas, simply set:
> `MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/trendora?retryWrites=true&w=majority`

---

### Step 4: Run the Development Servers

#### Terminal 1 — Backend API
```bash
cd backend
npm start
```
*API runs at: **http://localhost:5000***

#### Terminal 2 — Frontend Storefront
```bash
cd frontend
npm start
```
*Storefront runs at: **http://localhost:4200***

---

## 🔑 Default User Accounts

The auto-seeder populates the initial database with default accounts:

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Administrator** | `admin@trendora.com` | `Admin@Trendora2026!` | Full access to storefront + Admin Studio Dashboard (`/admin`), product CRUD, and order fulfillment status controls. |
| **Demo Customer** | Any newly registered account or 1-click test fill on login page | Any valid 6+ char password | Storefront browsing, cart, wishlist, address book, checkout, and order history. |

---

## 🛡️ Security & Authentication Model

1. **HttpOnly Cookie Tokens**:
   - Authentication tokens (`trendora_token`) are delivered and stored via `HttpOnly`, `SameSite: Lax` cookies.
   - JavaScript running in the browser cannot access the token, making it immune to token theft via XSS vulnerabilities.
2. **Bcrypt Password Encryption**:
   - All passwords undergo cryptographic salting and hashing with 10 salt rounds before persistence.
3. **Role-Based Access Control (RBAC)**:
   - Backend routes are guarded by `protect` and `authorize('admin')` middleware.
   - Frontend routes are guarded by functional Angular route guards (`authGuard` and `adminGuard`).
4. **Helmet Security Headers & CORS**:
   - Helmet sets secure HTTP headers (`X-Frame-Options`, `X-Content-Type-Options`, `Cross-Origin-Resource-Policy`).
   - CORS strictly validates allowed origins (`http://localhost:4200`) and enforces `credentials: true`.
5. **Rate Limiting**:
   - General endpoints are protected by `express-rate-limit` (1,000 requests per 15 minutes window).

---

## 🛍️ End-to-End User Journeys

```mermaid
flowchart LR
    A[Browse Home / PLP] --> B[Filter by Brand / Size / Price]
    B --> C[View Product Details PDP]
    C --> D[Select Size & Add to Bag]
    D --> E[Inspect Cart & Free Shipping Bar]
    E --> F[Proceed to Checkout]
    F --> G{Is User Logged In?}
    G -- No --> H[Login / Register]
    H --> I[Select Delivery Address]
    G -- Yes --> I
    I --> J[Choose Payment COD / Online]
    J --> K[Place Order Atomic Stock Deduction]
    K --> L[Order Success & Visual Tracking Stepper]
    L --> M[Admin Studio: Update Status Confirmed/Shipped/Delivered]
```

---

## 🧪 Testing & Quality Assurance

### 1. Backend Automated Test Suite
Trendora features **39 passing automated tests** using Node.js's native test runner (`node:test`) and Supertest against an isolated in-memory MongoDB:
```bash
cd backend
npm test
```

Test coverage breakdown:
- `tests/health.test.js`: Healthcheck endpoint and centralized 404 handler.
- `tests/auth.test.js`: Registration, duplicate email rejection, bcrypt login, HttpOnly cookie issuance, `/api/auth/me`, logout.
- `tests/products.test.js`: Faceted aggregations, brand filtering, price sorting, keyword search, PDP retrieval, related items.
- `tests/cart.test.js`: Authenticated bag sync, out-of-stock rejection, stock limit validation, wishlist toggle.
- `tests/orders.test.js`: Order placement with COD, atomic stock reduction, cart reset, inventory rollback on concurrency failure, customer order retrieval, cancellation with stock restoration, and admin KPI metrics & status updates.

### 2. Frontend Production Build Verification
```bash
cd frontend
npm run build
```
Builds the standalone Angular production bundle with **0 errors and 0 warnings**.

---

## 📬 Postman API Collection

A complete Postman collection is located in the root repository:
- **File**: [`Trendora_API.postman_collection.json`](Trendora_API.postman_collection.json)

### How to use:
1. Open **Postman**.
2. Click **Import** → Choose `Trendora_API.postman_collection.json`.
3. Set the `baseUrl` variable to `http://localhost:5000`.
4. Run requests in sequence to test authentication, product browsing, cart manipulation, order placement, and admin fulfillment.

---

## 📖 Complete REST API Documentation

### 1. Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new customer account and set HttpOnly cookie. |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and issue HttpOnly session cookie. |
| `POST` | `/api/auth/logout` | Public | Clear session cookie and end session. |
| `GET` | `/api/auth/me` | Private | Retrieve current authenticated user profile & addresses. |
| `POST` | `/api/auth/addresses` | Private | Add a new delivery address to the user's address book. |

### 2. Products & Categories (`/api/products`, `/api/categories`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List all categories with product counts. |
| `GET` | `/api/products` | Public | Query products with facets (`brand`, `gender`, `size`, `price`, `search`, `page`, `limit`). |
| `GET` | `/api/products/:id` | Public | Retrieve single product details with populated category. |
| `GET` | `/api/products/:id/related` | Public | Retrieve related recommendations excluding target product. |

### 3. Cart & Wishlist (`/api/cart`, `/api/wishlist`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/cart` | Private | Retrieve user's bag with live price and discount recalculation. |
| `POST` | `/api/cart/items` | Private | Add an in-stock product and size to the user's bag. |
| `PATCH` | `/api/cart/items/:itemId` | Private | Update item quantity with remaining stock boundary checks. |
| `DELETE` | `/api/cart/items/:itemId` | Private | Remove an item from the shopping bag. |
| `GET` | `/api/wishlist` | Private | Retrieve user's populated wishlist items. |
| `POST` | `/api/wishlist/items` | Private | Toggle a product in the user's wishlist. |

### 4. Orders & Fulfillment (`/api/orders`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders` | Private | Place order with atomic stock deduction and empty user cart. |
| `GET` | `/api/orders/my` | Private | Retrieve authenticated customer's order history. |
| `GET` | `/api/orders/:id` | Private | Retrieve detailed order receipt with status history. |
| `PATCH` | `/api/orders/:id/cancel` | Private | Cancel order and atomically restore reserved inventory stock. |

### 5. Admin Management Studio (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin Only | Aggregated KPI metrics (Revenue, Orders, Products, Customers, Low Stock). |
| `GET` | `/api/admin/orders` | Admin Only | List all customer orders with status filters and pagination. |
| `PATCH` | `/api/admin/orders/:id/status` | Admin Only | Transition order status (`Placed` → `Confirmed` → `Shipped` → `Delivered` → `Cancelled`). |
| `POST` | `/api/admin/products` | Admin Only | Create a new fashion product in the catalog. |
| `PUT` | `/api/admin/products/:id` | Admin Only | Update an existing product's details and per-size stock. |
| `DELETE` | `/api/admin/products/:id` | Admin Only | Delete a product from the catalog. |

---

## 🌐 Production Deployment Guide

### 🚀 1. Deploy Backend to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `Aman5ingh19/Trendora-Fashion-E-Commerce-Platform`.
3. Configure the service settings:
   - **Name**: `trendora-api` (or your preferred name)
   - **Region**: Choose the closest region to you (e.g., Singapore, Frankfurt, Oregon)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables** under the Environment tab:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://potterharry5143_db_user:lqwoHbwoTpEMlnuB@cluster0.vbtvr4g.mongodb.net/trendora_db?retryWrites=true&w=majority&appName=Cluster0` |
   | `USE_MEMORY_DB_IF_LOCAL_FAILS` | `false` |
   | `JWT_SECRET` | `trendora_super_secret_jwt_key_fashion_2026_change_in_production` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `COOKIE_SECRET` | `trendora_cookie_secret_key_random_hash` |
   | `CLIENT_URL` | `https://your-frontend-app.vercel.app` *(update once Vercel deploys)* |
5. Click **Deploy Web Service**. Once deployed, copy your Render URL (e.g. `https://trendora-api.onrender.com`).

---

### ⚡ 2. Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Import your GitHub repository: `Aman5ingh19/Trendora-Fashion-E-Commerce-Platform`.
3. In the project setup screen:
   - **Root Directory**: Click edit and choose `frontend`.
   - **Framework Preset**: `Angular`.
   - **Build Command**: `npm run build` (or leave default).
   - **Output Directory**: `dist/frontend/browser`.
4. Update `frontend/src/environments/environment.prod.ts` with your live Render backend URL:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://trendora-api.onrender.com/api' // Replace with your Render URL
   };
   ```
5. Click **Deploy**. Vercel will automatically build the standalone Angular application and route all SPA routes via `vercel.json`.
6. Once deployed, copy your Vercel URL and paste it into the `CLIENT_URL` environment variable in your Render backend settings!

---

## 👨‍💻 Author & Contributing

Built with ❤️ by **Aman Singh**.
- **GitHub**: [@Aman5ingh19](https://github.com/Aman5ingh19)
- **Repository**: [Trendora-Fashion-E-Commerce-Platform](https://github.com/Aman5ingh19/Trendora-Fashion-E-Commerce-Platform)

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
