const { Product, Category, StockMovement } = require('../models');
const { Op } = require('sequelize');

// GET /api/products?search=&category_id=&low_stock=true
exports.getAll = async (req, res, next) => {
  try {
    const { search, category_id, low_stock } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } },
      ];
    }
    if (category_id) where.category_id = category_id;

    let products = await Product.findAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });

    if (low_stock === 'true') {
      products = products.filter((p) => p.stock_quantity <= p.low_stock_limit);
    }

    res.json(products);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['id', 'name'] }],
    });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      name, sku, barcode, category_id,
      purchase_price, selling_price, stock_quantity, low_stock_limit,
    } = req.body;

    if (!name || selling_price === undefined) {
      return res.status(400).json({ message: 'name and selling_price are required.' });
    }

    const product = await Product.create({
      name, sku, barcode, category_id,
      purchase_price: purchase_price || 0,
      selling_price,
      stock_quantity: stock_quantity || 0,
      low_stock_limit: low_stock_limit || 5,
    });

    // Log initial stock as a stock-in movement, if any
    if (stock_quantity && stock_quantity > 0) {
      await StockMovement.create({
        product_id: product.id,
        type: 'in',
        quantity: stock_quantity,
        reason: 'Initial stock on product creation',
      });
    }

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const {
      name, sku, barcode, category_id,
      purchase_price, selling_price, low_stock_limit,
    } = req.body;

    // Stock quantity is intentionally NOT editable here directly.
    // Use the dedicated stock-adjustment endpoint so stock_movements stays accurate.
    await product.update({
      name, sku, barcode, category_id, purchase_price, selling_price, low_stock_limit,
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    await product.destroy();
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/products/:id/adjust-stock  { quantity, reason }
// Admin manually adds stock when new inventory arrives.
exports.adjustStock = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const { quantity, reason } = req.body;
    const qty = parseInt(quantity, 10);

    if (!qty || qty === 0) {
      return res.status(400).json({ message: 'quantity must be a non-zero number.' });
    }

    const type = qty > 0 ? 'in' : 'out';
    const absQty = Math.abs(qty);

    if (type === 'out' && product.stock_quantity < absQty) {
      return res.status(400).json({ message: 'Cannot remove more stock than currently available.' });
    }

    product.stock_quantity += qty;
    await product.save();

    await StockMovement.create({
      product_id: product.id,
      type,
      quantity: absQty,
      reason: reason || 'Manual stock adjustment',
    });

    res.json({ message: 'Stock updated.', product });
  } catch (err) {
    next(err);
  }
};
