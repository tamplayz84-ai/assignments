const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', requireRole('admin'), categoryController.create);
router.put('/:id', requireRole('admin'), categoryController.update);
router.delete('/:id', requireRole('admin'), categoryController.remove);

module.exports = router;
