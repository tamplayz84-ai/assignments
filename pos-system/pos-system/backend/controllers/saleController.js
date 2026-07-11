const { sequelize, Sale, SaleItem, Product, StockMovement, Customer, User } = require('../models');
const { Op } = require('sequelize');

// Generates a simple sequential invoice number like INV-20260711-0001
async function generateInvoiceNo() {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Sale.count({
    where: {
      created_at: {
        [Op.gte]: new Date(today.setHours(0, 0, 0, 0)),
      },
    },
  });
  const seq = String(countToday + 1).padStart(4, '0');
  return `INV-${datePart}-${seq}`;
}

// POST /api/sales
// body: { customer_id, items: [{ product_id, quantity }], discount, tax_rate, payment_method }
exports.createSale = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, items, discount = 0, tax_rate = 0, payment_method } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'At least one item is required.' });
    }
    if (!['cash', 'card', 'easypaisa_jazzcash'].includes(payment_method)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid payment_method.' });
    }

    let subtotal = 0;
    const preparedItems = [];

    // Step 1: validate stock availability for every item BEFORE making any changes
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });

      if (!product) {
        await t.rollback();
        return res.status(404).json({ message: `Product id ${item.product_id} not found.` });
      }
      if (!item.quantity || item.quantity <= 0) {
        await t.rollback();
        return res.status(400).json({ message: `Invalid quantity for product ${product.name}.` });
      }
      if (product.stock_quantity < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}.`,
        });
      }

      const unitPrice = parseFloat(product.selling_price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      preparedItems.push({ product, quantity: item.quantity, unitPrice, totalPrice });
    }

    const discountAmount = parseFloat(discount) || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (parseFloat(tax_rate) || 0) / 100;
    const totalAmount = taxableAmount + taxAmount;

    const invoice_no = await generateInvoiceNo();

    // Step 2: create the sale header
    const sale = await Sale.create({
      invoice_no,
      customer_id: customer_id || null,
      user_id: req.user.id,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total_amount: totalAmount,
      payment_method,
      status: 'completed',
    }, { transaction: t });

    // Step 3: create sale items, reduce stock, log stock movements
    for (const pi of preparedItems) {
      await SaleItem.create({
        sale_id: sale.id,
        product_id: pi.product.id,
        quantity: pi.quantity,
        unit_price: pi.unitPrice,
        total_price: pi.totalPrice,
      }, { transaction: t });

      pi.product.stock_quantity -= pi.quantity;
      await pi.product.save({ transaction: t });

      await StockMovement.create({
        product_id: pi.product.id,
        type: 'out',
        quantity: pi.quantity,
        reason: `Sale ${invoice_no}`,
      }, { transaction: t });
    }

    await t.commit();

    const fullSale = await Sale.findByPk(sale.id, {
      include: [
        { model: SaleItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'sku'] }] },
        { model: Customer },
        { model: User, attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(fullSale);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// GET /api/sales?from=&to=&user_id=&status=
exports.getAll = async (req, res, next) => {
  try {
    const { from, to, user_id, status } = req.query;
    const where = {};

    if (from && to) {
      where.created_at = { [Op.between]: [new Date(from), new Date(`${to}T23:59:59`)] };
    }
    if (user_id) where.user_id = user_id;
    if (status) where.status = status;

    const sales = await Sale.findAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone'] },
        { model: User, attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(sales);
  } catch (err) {
    next(err);
  }
};

// GET /api/sales/:id
exports.getById = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: SaleItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'sku'] }] },
        { model: Customer },
        { model: User, attributes: ['id', 'name'] },
      ],
    });
    if (!sale) return res.status(404).json({ message: 'Sale not found.' });
    res.json(sale);
  } catch (err) {
    next(err);
  }
};

// POST /api/sales/:id/refund   { reason }
// Admin-only (enforced in route). Restores stock and marks sale as refunded.
exports.refundSale = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [{ model: SaleItem, as: 'items' }],
      transaction: t,
    });
    if (!sale) {
      await t.rollback();
      return res.status(404).json({ message: 'Sale not found.' });
    }
    if (sale.status !== 'completed') {
      await t.rollback();
      return res.status(400).json({ message: `Sale is already ${sale.status}.` });
    }

    const { reason } = req.body;
    if (!reason) {
      await t.rollback();
      return res.status(400).json({ message: 'A refund reason is required.' });
    }

    for (const item of sale.items) {
      const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (product) {
        product.stock_quantity += item.quantity;
        await product.save({ transaction: t });

        await StockMovement.create({
          product_id: product.id,
          type: 'in',
          quantity: item.quantity,
          reason: `Refund of ${sale.invoice_no}`,
        }, { transaction: t });
      }
    }

    sale.status = 'refunded';
    sale.refund_reason = reason;
    await sale.save({ transaction: t });

    await t.commit();
    res.json({ message: 'Sale refunded and stock restored.', sale });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// POST /api/sales/:id/cancel   { reason }
// For sales that should be voided without necessarily restoring stock display logic identical to refund here.
exports.cancelSale = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [{ model: SaleItem, as: 'items' }],
      transaction: t,
    });
    if (!sale) {
      await t.rollback();
      return res.status(404).json({ message: 'Sale not found.' });
    }
    if (sale.status !== 'completed') {
      await t.rollback();
      return res.status(400).json({ message: `Sale is already ${sale.status}.` });
    }

    const { reason } = req.body;
    if (!reason) {
      await t.rollback();
      return res.status(400).json({ message: 'A cancellation reason is required.' });
    }

    for (const item of sale.items) {
      const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (product) {
        product.stock_quantity += item.quantity;
        await product.save({ transaction: t });

        await StockMovement.create({
          product_id: product.id,
          type: 'in',
          quantity: item.quantity,
          reason: `Cancellation of ${sale.invoice_no}`,
        }, { transaction: t });
      }
    }

    sale.status = 'cancelled';
    sale.refund_reason = reason;
    await sale.save({ transaction: t });

    await t.commit();
    res.json({ message: 'Sale cancelled and stock restored.', sale });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
