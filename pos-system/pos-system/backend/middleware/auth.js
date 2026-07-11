const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifies the JWT sent in the Authorization header (Bearer token)
function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
  }
}

// Restrict a route to specific roles, e.g. requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. You do not have access to this resource.' });
    }
    next();
  };
}

module.exports = { protect, requireRole };
