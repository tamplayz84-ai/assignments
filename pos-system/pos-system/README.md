# General Store — Web-Based POS System

A complete full-stack Point of Sale system: sell products, generate invoices, manage stock automatically, track customers, and run admin sales/profit reports.

**Stack:** React (Vite + Tailwind) · Node.js/Express · MySQL (Sequelize ORM) · JWT auth

---

## 1. Project Structure

```
pos-system/
├── backend/
│   ├── config/db.js            # Sequelize/MySQL connection
│   ├── models/                 # User, Category, Product, Customer, Sale, SaleItem, StockMovement
│   ├── controllers/            # Business logic per resource
│   ├── routes/                 # Express route definitions
│   ├── middleware/auth.js      # JWT verification + role-based access
│   ├── middleware/errorHandler.js
│   ├── sql/schema.sql          # Raw SQL schema (alternative to Sequelize sync)
│   ├── utils/seedAdmin.js      # Creates the first admin user
│   ├── server.js               # App entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/               # Login, Dashboard, Products, Categories, POSBilling,
    │   │                         # SalesHistory, Inventory, Customers, Reports
    │   ├── components/          # Layout (sidebar), ProtectedRoute
    │   ├── context/AuthContext.jsx
    │   └── api/axios.js          # Axios instance with JWT interceptor
    └── vite.config.js
```

---

## 2. Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally (or a remote instance)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MySQL credentials and a JWT secret
```

Create the database and tables:

```bash
mysql -u root -p < sql/schema.sql
```

Create the first admin login (email: `admin@store.com`, password: `Admin@123`):

```bash
node utils/seedAdmin.js
```

Start the API:

```bash
npm run dev        # nodemon, auto-restart
# or
npm start
```

The API runs at `http://localhost:5000`. Health check: `GET /api/health`.

> **Note:** the Sequelize models are defined to match `sql/schema.sql` exactly (same table/column names, `underscored: true`, `timestamps: false`). You do not need `sequelize.sync()` — just run the SQL file once.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` and talks to the API at `http://localhost:5000/api` (see `src/api/axios.js` — change `baseURL` if you deploy the backend elsewhere).

Log in with the seeded admin account, then use **Products → Add Product** to set initial stock, or register cashier accounts via the `/api/auth/register` endpoint (admin-only).

---

## 3. How Stock Decreases After a Sale (explanation required by assignment)

This is the core billing/inventory logic, all inside `backend/controllers/saleController.js` → `createSale`:

1. The cashier builds a cart on the **POS Billing** page and clicks **Complete Sale**.
2. The frontend sends `POST /api/sales` with the cart items, discount, tax rate, customer, and payment method.
3. The backend opens a **database transaction** so nothing is half-applied if something fails partway through.
4. For **every item in the cart**, it first re-checks the *current* `stock_quantity` in the database (row-locked with `LOCK.UPDATE` to avoid race conditions from two cashiers selling the last unit at once). If any item requests more than what's in stock, the whole sale is rejected — no partial sale, no stock is touched.
5. Once all items pass the stock check, the backend:
   - Creates one row in `sales` (the invoice header — subtotal, discount, tax, total, payment method).
   - Creates one row per product in `sale_items` (quantity and price at time of sale).
   - **Subtracts** the sold quantity from `products.stock_quantity` for each product.
   - Inserts a row in `stock_movements` with `type = 'out'` and the reason `Sale <invoice_no>`, so there's a full audit trail of every stock change.
6. If every step succeeds, the transaction is committed. If anything throws an error, the transaction is rolled back and stock is left untouched.
7. **Refunds/cancellations** (admin-only, `POST /api/sales/:id/refund` or `/cancel`) reverse this exact process: they add the quantity back to `stock_quantity` and log a `type = 'in'` stock movement referencing the refund/cancellation.

This is also how the **low stock alerts** work: `low_stock_limit` on each product is just compared against the live `stock_quantity` — no separate calculation needed, so it's always accurate immediately after a sale.

---

## 4. API Documentation

All endpoints are under `/api`. Except `/auth/login`, every route requires a header:
`Authorization: Bearer <token>` (returned from login).
Routes marked **(admin)** additionally require `role = admin`.

### Auth
| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | Returns `{ token, user }` |
| GET | `/auth/me` | — | Current logged-in user |
| POST | `/auth/register` **(admin)** | `{ name, email, password, role }` | Create a cashier/admin account |

### Categories
| Method | Route | Body |
|---|---|---|
| GET | `/categories` | — |
| GET | `/categories/:id` | — |
| POST | `/categories` **(admin)** | `{ name, description }` |
| PUT | `/categories/:id` **(admin)** | `{ name, description }` |
| DELETE | `/categories/:id` **(admin)** | — |

### Products
| Method | Route | Notes |
|---|---|---|
| GET | `/products?search=&category_id=&low_stock=true` | Search by name/SKU/barcode |
| GET | `/products/:id` | |
| POST | `/products` **(admin)** | `{ name, sku, barcode, category_id, purchase_price, selling_price, stock_quantity, low_stock_limit }` |
| PUT | `/products/:id` **(admin)** | Same fields except `stock_quantity` (use adjust-stock) |
| DELETE | `/products/:id` **(admin)** | |
| POST | `/products/:id/adjust-stock` **(admin)** | `{ quantity, reason }` — positive adds stock, negative removes |

### Customers
| Method | Route | Body |
|---|---|---|
| GET | `/customers?search=` | |
| POST | `/customers` | `{ name, phone, address }` |
| PUT | `/customers/:id` | same |
| DELETE | `/customers/:id` | |

### Sales (POS billing)
| Method | Route | Body / Notes |
|---|---|---|
| POST | `/sales` | `{ customer_id, items: [{product_id, quantity}], discount, tax_rate, payment_method }` — creates invoice, reduces stock |
| GET | `/sales?from=&to=&user_id=&status=` | Sales history |
| GET | `/sales/:id` | Full invoice with items |
| POST | `/sales/:id/refund` **(admin)** | `{ reason }` — restores stock |
| POST | `/sales/:id/cancel` **(admin)** | `{ reason }` — restores stock |

**Example — create a sale:**
```json
POST /api/sales
{
  "customer_id": null,
  "items": [
    { "product_id": 3, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ],
  "discount": 50,
  "tax_rate": 5,
  "payment_method": "cash"
}
```
**Response:**
```json
{
  "id": 12,
  "invoice_no": "INV-20260711-0005",
  "subtotal": 850,
  "discount": 50,
  "tax": 40,
  "total_amount": 840,
  "payment_method": "cash",
  "status": "completed",
  "items": [ { "product_id": 3, "quantity": 2, "unit_price": 300, "total_price": 600 }, ... ]
}
```

### Dashboard
| Method | Route |
|---|---|
| GET | `/dashboard` — today's sales amount, today's order count, total products, low stock count/list, top 5 selling products, 10 most recent sales |

### Reports **(admin only)**
| Method | Route | Notes |
|---|---|---|
| GET | `/reports/sales?period=daily\|weekly\|monthly&from=&to=` | |
| GET | `/reports/product-wise?from=&to=` | Quantity + revenue per product |
| GET | `/reports/profit?from=&to=` | Uses `purchase_price` vs `selling_price` |
| GET | `/reports/low-stock` | |
| GET | `/reports/cashier-wise?from=&to=` | Sales grouped by cashier |
| GET | `/reports/export/csv?from=&to=` | Downloads CSV |
| GET | `/reports/export/excel?from=&to=` | Downloads XLSX |

---

## 5. Security Notes
- Passwords hashed with **bcrypt** (10 rounds) — never stored in plain text.
- All protected routes require a valid JWT (`middleware/auth.js`).
- Admin-only actions (product/category writes, refunds, reports, stock adjustment) enforced server-side via `requireRole('admin')`, not just hidden in the UI.
- All money/stock-changing operations (`createSale`, `refundSale`, `cancelSale`, `adjustStock`) run inside a Sequelize transaction with row locking to prevent overselling under concurrent requests.

## 6. What's Not Included (fill in for submission)
- Screenshots of each page (take these after running the app locally).
- A packaged `.sql` dump with sample seed data (schema is provided; add `INSERT` statements for demo products/categories if your instructor wants sample data).
- Production deployment config (this is set up for local development).
