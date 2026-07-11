const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', protect, authController.me);

// Registering new users (cashiers/admins) is restricted to existing admins.
router.post('/register', protect, requireRole('admin'), authController.register);

module.exports = router;
