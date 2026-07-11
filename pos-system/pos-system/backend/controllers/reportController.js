const { sequelize, Sale, SaleItem, Product, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

function dateRange(period, from, to) {
  const now = new Date();
  let start, end;

  if (from && to) {
    start = new Date(from);
    end = new Date(`${to}T23:59:59`);
    return { start, end };
  }

  if (period === 'daily') {
    start = new Date(now.setHours(0, 0, 0, 0));
    end = new Date();
  } else if (period === 'weekly') {
    start = new Date();
    start.setDate(start.getDate() - 7);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else {
    start = new Date(0);
    end = new Date();
  }
  return { start, end: end || new Date() };
}

// GET /api/reports/sales?period=daily|weekly|monthly&from=&to=
exports.salesReport = async (req, res, next) => {
  try {
    const { period, from, to } = req.query;
    const { start, end } = dateRange(period, from, to);

    const sales = await Sale.findAll({
      where: { created_at: { [Op.between]: [start, end] }, status: 'completed' },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });

    const totalAmount = sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);

    res.json({
      period: period || 'custom',
      from: start,
      to: end,
      total_invoices: sales.length,
      total_amount: totalAmount,
      sales,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/product-wise?from=&to=
exports.productWiseReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { start, end } = dateRange(null, from, to);

    const results = await SaleItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('quantity')), 'total_quantity_sold'],
        [fn('SUM', col('total_price')), 'total_revenue'],
      ],
      include: [
        { model: Product, attributes: ['id', 'name', 'sku'] },
        { model: require('../models').Sale, attributes: [], where: { created_at: { [Op.between]: [start, end] }, status: 'completed' } },
      ],
      group: ['product_id', 'Product.id'],
      order: [[literal('total_revenue'), 'DESC']],
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/profit?from=&to=
exports.profitReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { start, end } = dateRange(null, from, to);

    const items = await SaleItem.findAll({
      include: [
        { model: Product, attributes: ['id', 'name', 'purchase_price', 'selling_price'] },
        { model: require('../models').Sale, attributes: ['id', 'created_at'], where: { created_at: { [Op.between]: [start, end] }, status: 'completed' } },
      ],
    });

    const byProduct = {};
    for (const item of items) {
      const p = item.Product;
      if (!p) continue;
      if (!byProduct[p.id]) {
        byProduct[p.id] = { product_id: p.id, name: p.name, quantity_sold: 0, revenue: 0, cost: 0, profit: 0 };
      }
      const rev = parseFloat(item.total_price);
      const cost = parseFloat(p.purchase_price) * item.quantity;
      byProduct[p.id].quantity_sold += item.quantity;
      byProduct[p.id].revenue += rev;
      byProduct[p.id].cost += cost;
      byProduct[p.id].profit += rev - cost;
    }

    const report = Object.values(byProduct).sort((a, b) => b.profit - a.profit);
    const totals = report.reduce((acc, r) => {
      acc.revenue += r.revenue;
      acc.cost += r.cost;
      acc.profit += r.profit;
      return acc;
    }, { revenue: 0, cost: 0, profit: 0 });

    res.json({ from: start, to: end, totals, products: report });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/low-stock
exports.lowStockReport = async (req, res, next) => {
  try {
    const products = await Product.findAll();
    const lowStock = products.filter((p) => p.stock_quantity <= p.low_stock_limit);
    res.json(lowStock);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/cashier-wise?from=&to=
exports.cashierWiseReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { start, end } = dateRange(null, from, to);

    const results = await Sale.findAll({
      attributes: [
        'user_id',
        [fn('COUNT', col('Sale.id')), 'total_invoices'],
        [fn('SUM', col('total_amount')), 'total_amount'],
      ],
      where: { created_at: { [Op.between]: [start, end] }, status: 'completed' },
      include: [{ model: User, attributes: ['id', 'name'] }],
      group: ['user_id', 'User.id'],
      order: [[literal('total_amount'), 'DESC']],
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/export/csv?from=&to=
exports.exportSalesCsv = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { start, end } = dateRange(null, from, to);

    const sales = await Sale.findAll({
      where: { created_at: { [Op.between]: [start, end] } },
      include: [{ model: User, attributes: ['name'] }],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
    });

    const rows = sales.map((s) => ({
      invoice_no: s.invoice_no,
      date: s.created_at,
      cashier: s.User?.name,
      subtotal: s.subtotal,
      discount: s.discount,
      tax: s.tax,
      total_amount: s.total_amount,
      payment_method: s.payment_method,
      status: s.status,
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`sales_report_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/export/excel?from=&to=
exports.exportSalesExcel = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { start, end } = dateRange(null, from, to);

    const sales = await Sale.findAll({
      where: { created_at: { [Op.between]: [start, end] } },
      include: [{ model: User, attributes: ['name'] }],
      order: [['created_at', 'DESC']],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
      { header: 'Invoice No', key: 'invoice_no', width: 20 },
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Cashier', key: 'cashier', width: 18 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Total', key: 'total_amount', width: 14 },
      { header: 'Payment Method', key: 'payment_method', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    sales.forEach((s) => {
      sheet.addRow({
        invoice_no: s.invoice_no,
        date: s.created_at,
        cashier: s.User?.name,
        subtotal: s.subtotal,
        discount: s.discount,
        tax: s.tax,
        total_amount: s.total_amount,
        payment_method: s.payment_method,
        status: s.status,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
