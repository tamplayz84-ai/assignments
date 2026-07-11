const { sequelize, Sale, SaleItem, Product, Customer, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// GET /api/dashboard
exports.getSummary = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysSales = await Sale.findAll({
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
        status: 'completed',
      },
    });

    const todaySalesAmount = todaysSales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const todayOrdersCount = todaysSales.length;

    const totalProducts = await Product.count();

    const allProducts = await Product.findAll();
    const lowStockProducts = allProducts.filter((p) => p.stock_quantity <= p.low_stock_limit);

    // Top selling products (all-time, by quantity sold)
    const topProducts = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('quantity')), 'total_quantity_sold'],
        [fn('SUM', col('total_price')), 'total_revenue'],
      ],
      include: [{ model: Product, attributes: ['id', 'name', 'sku'] }],
      group: ['product_id', 'Product.id'],
      order: [[literal('total_quantity_sold'), 'DESC']],
      limit: 5,
    });

    const recentSales = await Sale.findAll({
      include: [
        { model: Customer, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    res.json({
      today_sales_amount: todaySalesAmount,
      today_orders_count: todayOrdersCount,
      total_products: totalProducts,
      low_stock_count: lowStockProducts.length,
      low_stock_products: lowStockProducts,
      top_selling_products: topProducts,
      recent_sales: recentSales,
    });
  } catch (err) {
    next(err);
  }
};
