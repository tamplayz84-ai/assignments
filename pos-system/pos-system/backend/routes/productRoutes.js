const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', requireRole('admin'), productController.create);
router.put('/:id', requireRole('admin'), productController.update);
router.delete('/:id', requireRole('admin'), productController.remove);

// Manual stock adjustment (admin adds/removes stock when inventory arrives)
router.post('/:id/adjust-stock', requireRole('admin'), productController.adjustStock);

module.exports = router;
