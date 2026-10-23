const express = require('express');
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  validateCheckout
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// All cart operations are private to the authenticated user
router.use(protect);

router.get('/', getCart);
router.post('/items', addItemToCart);
router.patch('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);
router.delete('/', clearCart);
router.post('/validate-checkout', validateCheckout);

module.exports = router;
