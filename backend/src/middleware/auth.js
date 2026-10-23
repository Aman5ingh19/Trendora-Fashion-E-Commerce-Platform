const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

// Protect routes - verify JWT token from HttpOnly cookie or Authorization header
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check HttpOnly cookie first (secure standard)
    if (req.cookies && req.cookies.trendora_token) {
      token = req.cookies.trendora_token;
    }
    // 2. Check Authorization header fallback (for Postman/mobile apps)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to access this resource.', 401)
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'trendora_super_secret_jwt_key_fashion_2026'
    );

    // Verify user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid authentication token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    next(error);
  }
};

// Restrict access to specific roles (e.g., 'admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('Access denied: You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
