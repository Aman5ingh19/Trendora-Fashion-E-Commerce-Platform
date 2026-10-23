const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * @desc    Create new order with atomic stock deduction and cart reset
 * @route   POST /api/orders
 * @access  Private (Customer & Admin)
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'COD' } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.pincode || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required'
      });
    }

    // 1. Fetch user's cart with product details
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add items before checking out.'
      });
    }

    // 2. Pre-validate all products and requested quantities
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: 'An item in your cart is no longer available'
        });
      }

      const sizeOption = item.product.sizes.find(s => s.size === item.size);
      if (!sizeOption || sizeOption.stock < item.quantity) {
        const available = sizeOption ? sizeOption.stock : 0;
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.name}" in size ${item.size}. Available: ${available}`
        });
      }
    }

    // 3. Atomically deduct inventory with rollback on any failure
    const deductedItems = [];
    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          'sizes.size': item.size,
          'sizes.stock': { $gte: item.quantity }
        },
        {
          $inc: { 'sizes.$.stock': -item.quantity }
        },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback already deducted items
        for (const deducted of deductedItems) {
          await Product.updateOne(
            { _id: deducted.productId, 'sizes.size': deducted.size },
            { $inc: { 'sizes.$.stock': deducted.quantity } }
          );
        }

        return res.status(400).json({
          success: false,
          message: `Stock changed during checkout for "${item.product.name}" (${item.size}). Please try again.`
        });
      }

      deductedItems.push({
        productId: item.product._id,
        size: item.size,
        quantity: item.quantity
      });
    }

    // 4. Calculate prices on the backend (never trust client prices)
    const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const deliveryFee = subtotal >= 999 ? 0 : 99;
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0] || '',
      brand: item.product.brand || 'Trendora',
      size: item.size,
      price: item.product.price,
      quantity: item.quantity
    }));

    // 5. Create Order
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        pincode: shippingAddress.pincode,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Completed',
      pricing: {
        subtotal,
        deliveryFee,
        discount,
        total
      },
      orderStatus: 'Placed',
      statusHistory: [
        {
          status: 'Placed',
          changedAt: new Date(),
          comment: 'Order placed successfully'
        }
      ]
    });

    // 6. Clear user cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's order history
 * @route   GET /api/orders/my
 * @access  Private
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name images brand slug');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order details by ID
 * @route   GET /api/orders/:id
 * @access  Private (Owner or Admin)
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images brand slug');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify ownership or admin privileges
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an order and restore product stock
 * @route   PATCH /api/orders/:id/cancel
 * @access  Private (Owner or Admin)
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify authorization
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this order'
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    if (['Shipped', 'Delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Orders with status "${order.orderStatus}" cannot be cancelled online`
      });
    }

    // Restore inventory atomically
    for (const item of order.orderItems) {
      await Product.updateOne(
        { _id: item.product, 'sizes.size': item.size },
        { $inc: { 'sizes.$.stock': item.quantity } }
      );
    }

    // Update order status
    order.orderStatus = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      changedAt: new Date(),
      comment: req.body.reason || 'Cancelled by customer'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order has been successfully cancelled and stock restored',
      order
    });
  } catch (error) {
    next(error);
  }
};
