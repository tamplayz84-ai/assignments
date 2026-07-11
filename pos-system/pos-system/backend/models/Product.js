const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  sku: { type: DataTypes.STRING(50), unique: true },
  barcode: { type: DataTypes.STRING(50), unique: true },
  category_id: { type: DataTypes.INTEGER },
  purchase_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  selling_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  stock_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  low_stock_limit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'products',
});

module.exports = Product;
