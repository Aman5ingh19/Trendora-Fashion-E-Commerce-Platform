const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getAllOrders,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardMetrics);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
