-- POS System Database Schema (MySQL)
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS pos_system;
USE pos_system;

-- ==========================
-- USERS
-- ==========================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,          -- bcrypt hashed
  role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- CATEGORIES
-- ==========================
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- PRODUCTS
-- ==========================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  barcode VARCHAR(50) UNIQUE,
  category_id INT,
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_limit INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ==========================
-- CUSTOMERS
-- ==========================
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- SALES (Invoice header)
-- ==========================
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(30) NOT NULL UNIQUE,
  customer_id INT,
  user_id INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method ENUM('cash', 'card', 'easypaisa_jazzcash') NOT NULL DEFAULT 'cash',
  status ENUM('completed', 'refunded', 'cancelled') NOT NULL DEFAULT 'completed',
  refund_reason VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==========================
-- SALE ITEMS
-- ==========================
CREATE TABLE sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ==========================
-- STOCK MOVEMENTS (audit trail)
-- ==========================
CREATE TABLE stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('in', 'out') NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);

-- Seed an admin user (password: Admin@123 -> bcrypt hash below)
-- Generate your own hash via bcrypt; this is just a placeholder example.
-- INSERT INTO users (name, email, password, role) VALUES
-- ('Admin', 'admin@store.com', '$2b$10$replace_with_real_bcrypt_hash', 'admin');
