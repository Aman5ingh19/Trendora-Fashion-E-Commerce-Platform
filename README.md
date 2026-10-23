# Trendora — Fashion E-Commerce Platform

A production-grade, full-stack fashion e-commerce application inspired by the shopping experience of **Myntra**, built using the **MEAN stack** (MongoDB, Express.js, Angular 21 with Standalone Components & Signals, Node.js).

---

## 🌟 Key Features

### 🛍️ Customer Storefront Experience
- **Interactive Home Page**: Dynamic editorial banner carousel, live flash sale countdown timer with urgency badges, category spotlights, brand rails, and product showcases.
- **Product Listing Page (PLP)**:
  - Sticky faceted filter sidebar (Gender, Brands, Price Range Slider, Size, Minimum Discount).
  - Search by keyword with instant regex & text matching.
  - Active filter chips with 1-click dismissal and "Clear All".
  - Sorting (Price Low-to-High, Price High-to-Low, Newest, Popularity).
  - Shimmer skeleton loaders and pagination.
- **Product Details Page (PDP)**:
  - Multi-image thumbnail strip with responsive zoom preview.
  - Interactive size selector with real-time stock validation and `<5 left` urgency indicators.
  - Estimated delivery pin code validator.
  - Specifications table and similar product recommendations rail.
- **Cart & Wishlist**:
  - Live price recalculation on the backend (never trusting client prices).
  - Size-picker drawer on wishlist cards to move directly into the shopping bag.
  - Free delivery milestone progress tracker (Free delivery above ₹999).
- **Checkout & Order Management**:
  - Delivery address management with default selection.
  - Cash on Delivery (COD) and Online payment method selection.
  - Atomic stock deduction with rollback to prevent overselling race conditions.
  - Visual order tracking stepper (`Placed` → `Confirmed` → `Shipped` → `Delivered`).
  - Online self-cancellation with immediate atomic inventory restoration.

### 🛡️ Security & Authentication
- **HttpOnly Cookie Authentication**: JWT tokens stored securely inside HttpOnly, SameSite cookies (`trendora_token`), eliminating XSS token theft risks.
- **Role-Based Authorization**: Separate access controls for `customer` and `admin` roles, enforced via Express middleware (`protect`, `authorize`) and Angular functional route guards (`authGuard`, `adminGuard`).
- **Data Protection**: Helmet security headers, CORS origin verification with credentials, Express rate-limiting, and sanitized inputs.

### 📊 Admin Studio Dashboard
- **Executive Metrics (KPIs)**: Total Revenue, Total Orders, Active Catalog Products, Verified Customers, and Low Inventory Alerts (`stock <= 5`).
- **Order Fulfillment Management**: Filter orders by status, inspect itemized customer orders, and update status (`Placed` → `Confirmed` → `Shipped` → `Delivered` → `Cancelled`) with live DB sync.
- **Product Catalog Management**: Add new products, update prices, manage per-size inventory stocks, and delete products.

---

## 🏗️ Technology Architecture

```text
Trendora Platform Architecture:

Frontend (Angular 21 Standalone)            Backend API (Node.js & Express)            Database Layer
--------------------------------            -------------------------------            --------------
Angular Signals & Computed State    <--->   REST API Routes (/api/*)           <--->   MongoDB
Reactive Forms & Validations                JWT HttpOnly Cookie Auth                   (Atlas or In-Memory)
Custom SCSS Design Tokens                   Atomic Inventory Engine ($inc)
Functional Route Guards                     Centralized Error Handler
```

- **Frontend**: Angular 21 (Standalone Components, Signals, Reactive Forms, SCSS, HttpClient).
- **Backend**: Node.js & Express.js (REST architecture, MVC pattern, Helmet, CORS, Cookie-Parser).
- **Database**: MongoDB with Mongoose (with automated fallback to `mongodb-memory-server` and seed data for local dev).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- Optional: Local MongoDB or MongoDB Atlas URI (if not present, an in-memory instance starts automatically).

---

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Environment Configuration

Backend configuration file located at `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/trendora_db
USE_MEMORY_DB_IF_LOCAL_FAILS=true
JWT_SECRET=trendora_super_secret_jwt_key_2026_dev_environment
JWT_EXPIRE=7d
COOKIE_SECRET=trendora-cookie-secret-key-2026
CLIENT_URL=http://localhost:4200
```

> **Note**: If you want to connect to your own **MongoDB Atlas cluster**, replace `MONGO_URI` with your connection string:
> `MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/trendora?retryWrites=true&w=majority`

---

### Step 3: Start the Backend Server

```bash
cd backend
npm start
```
The server will start at **http://localhost:5000**.
On first boot, the system automatically runs `autoSeed.js` to populate:
- 6 Categories (Men, Women, Kids, Footwear, Accessories, Ethnic Wear)
- 11 Fashion Products across categories and sizes
- Default Administrator account

---

### Step 4: Start the Frontend Application

```bash
cd frontend
npm start
```
The storefront application will start at **http://localhost:4200**.

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@trendora.com` | `Admin@Trendora2026!` |
| **Demo Customer** | Register new account or use 1-click test fill on login page | Any valid 6+ char password |

---

## 🧪 Running Automated Tests

### Backend Test Suite (39 Passing Tests)
Runs Node.js native test runner (`node:test`) with Supertest against an isolated in-memory MongoDB:
```bash
cd backend
npm test
```
Covers:
- Auth & Cookie lifecycle (`tests/auth.test.js`)
- Product faceted search & pagination (`tests/products.test.js`)
- Cart & Wishlist persistence (`tests/cart.test.js`)
- Atomic inventory & orders (`tests/orders.test.js`)
- API Health & Error Handler (`tests/health.test.js`)

### Frontend Build & Lint Verification
```bash
cd frontend
npm run build
```

---

## 📬 Postman API Collection

A complete Postman collection is included in the project root:
- File: [Trendora_API.postman_collection.json](Trendora_API.postman_collection.json)
- Import it into Postman to test Auth, Products, Cart, Orders, and Admin endpoints.

---

## 📖 Key API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new customer with HttpOnly cookie.
- `POST /api/auth/login`: Authenticate and issue HttpOnly session cookie.
- `POST /api/auth/logout`: Clear session cookie.
- `GET /api/auth/me`: Get current authenticated user profile.
- `POST /api/auth/addresses`: Add new delivery address.

### Products & Categories (`/api/products`, `/api/categories`)
- `GET /api/categories`: List all categories with product counts.
- `GET /api/products`: Filterable, searchable, and paginated product catalogue.
- `GET /api/products/:id`: Single product details.
- `GET /api/products/:id/related`: Related recommendations.

### Cart & Wishlist (`/api/cart`, `/api/wishlist`)
- `GET /api/cart`: Retrieve user's bag with live price calculation.
- `POST /api/cart/items`: Add in-stock product to bag.
- `PATCH /api/cart/items/:itemId`: Update quantity with stock boundary check.
- `DELETE /api/cart/items/:itemId`: Remove item from bag.
- `GET /api/wishlist`: Retrieve wishlist products.
- `POST /api/wishlist/items`: Toggle product in wishlist.

### Orders (`/api/orders`)
- `POST /api/orders`: Place order with atomic stock deduction and cart reset.
- `GET /api/orders/my`: Get current user's order history.
- `GET /api/orders/:id`: Get order details with status history.
- `PATCH /api/orders/:id/cancel`: Cancel order and restore stock.

### Admin Studio (`/api/admin`)
- `GET /api/admin/dashboard`: Metrics (Revenue, Orders, Products, Customers, Low Stock).
- `GET /api/admin/orders`: List all orders with status filter and pagination.
- `PATCH /api/admin/orders/:id/status`: Update order status with validation.
- `POST /api/admin/products`: Create new product.
- `PUT /api/admin/products/:id`: Update existing product.
- `DELETE /api/admin/products/:id`: Delete product.
