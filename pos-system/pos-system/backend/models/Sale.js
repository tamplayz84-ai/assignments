const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoice_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  customer_id: { type: DataTypes.INTEGER },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  tax: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'easypaisa_jazzcash'),
    allowNull: false,
    defaultValue: 'cash',
  },
  status: {
    type: DataTypes.ENUM('completed', 'refunded', 'cancelled'),
    allowNull: false,
    defaultValue: 'completed',
  },
  refund_reason: { type: DataTypes.STRING(255) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'sales',
});

module.exports = Sale;
