const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.get('/', saleController.getAll);
router.get('/:id', saleController.getById);
router.post('/', saleController.createSale); // cashier creates invoice from POS screen

// Admin-only actions
router.post('/:id/refund', requireRole('admin'), saleController.refundSale);
router.post('/:id/cancel', requireRole('admin'), saleController.cancelSale);

module.exports = router;
