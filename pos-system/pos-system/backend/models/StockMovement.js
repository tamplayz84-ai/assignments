const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('in', 'out'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.STRING(255) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'stock_movements',
});

module.exports = StockMovement;
