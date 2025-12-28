const jwt = require('jsonwebtoken');

// Mock admin token for demonstration purposes
// In production, use a proper authentication system
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'autonomous-dropshipping-admin';

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  // For development, we'll allow requests without token
  // In production, implement proper JWT validation
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'autonomous-dropshipping-secret', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  } else {
    // For development, just pass through
    next();
  }
};

// Middleware to authenticate admin access
const authenticateAdmin = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Admin token required' });
    }

    if (token !== ADMIN_TOKEN) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }
  }
  // For development, just pass through
  next();
};

module.exports = {
  authenticateToken,
  authenticateAdmin
};