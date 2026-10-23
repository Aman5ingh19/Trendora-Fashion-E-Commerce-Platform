const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected account routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

module.exports = router;
