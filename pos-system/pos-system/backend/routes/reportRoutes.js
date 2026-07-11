const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);
router.use(requireRole('admin')); // all reports are admin-only

router.get('/sales', reportController.salesReport);
router.get('/product-wise', reportController.productWiseReport);
router.get('/profit', reportController.profitReport);
router.get('/low-stock', reportController.lowStockReport);
router.get('/cashier-wise', reportController.cashierWiseReport);
router.get('/export/csv', reportController.exportSalesCsv);
router.get('/export/excel', reportController.exportSalesExcel);

module.exports = router;
