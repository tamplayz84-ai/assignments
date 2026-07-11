const sequelize = require('../config/db');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Customer = require('./Customer');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const StockMovement = require('./StockMovement');

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// Product <-> StockMovement
Product.hasMany(StockMovement, { foreignKey: 'product_id', onDelete: 'CASCADE' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id' });

// Customer <-> Sale
Customer.hasMany(Sale, { foreignKey: 'customer_id', onDelete: 'SET NULL' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id' });

// User (cashier) <-> Sale
User.hasMany(Sale, { foreignKey: 'user_id' });
Sale.belongsTo(User, { foreignKey: 'user_id' });

// Sale <-> SaleItem
Sale.hasMany(SaleItem, { foreignKey: 'sale_id', onDelete: 'CASCADE', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });

// Product <-> SaleItem
Product.hasMany(SaleItem, { foreignKey: 'product_id' });
SaleItem.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Customer,
  Sale,
  SaleItem,
  StockMovement,
};
