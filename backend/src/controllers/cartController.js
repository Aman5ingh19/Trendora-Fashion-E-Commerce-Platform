const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

// Revalidates prices, sizes, and stock against live Product collection
const formatAndRecalculateCart = async (cart) => {
  let subtotal = 0;
  let originalTotal = 0;
  let totalItemsCount = 0;
  const verifiedItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product).lean();

    // If product was deleted or deactivated, skip it
    if (!product || !product.isActive) {
      continue;
    }

    // Find stock for selected size
    const sizeObj = (product.sizes || []).find((s) => s.size === item.size);
    const availableStock = sizeObj ? sizeObj.stock : 0;
    const isAvailable = availableStock >= item.quantity;

    // Use current live database price
    const currentPrice = product.price;
    const originalPrice = product.originalPrice || product.price;

    item.price = currentPrice;

    if (isAvailable) {
      subtotal += currentPrice * item.quantity;
      originalTotal += originalPrice * item.quantity;
      totalItemsCount += item.quantity;
    }

    verifiedItems.push({
      _id: item._id,
      product: {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        images: product.images,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: product.discountPercentage,
        sizes: product.sizes
      },
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: currentPrice,
      isAvailable,
      availableStock
    });
  }

  // Free delivery threshold: ₹999
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 99;
  const discountTotal = Math.max(0, originalTotal - subtotal);
  const grandTotal = subtotal + deliveryFee;

  return {
    _id: cart._id,
    user: cart.user,
    items: verifiedItems,
    itemCount: totalItemsCount,
    subtotal,
    originalTotal,
    discountTotal,
    deliveryFee,
    grandTotal
  };
};

// @desc    Get user's persistent cart with live price & inventory revalidation
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const formattedCart = await formatAndRecalculateCart(cart);

    res.status(200).json({
      success: true,
      cart: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addItemToCart = async (req, res, next) => {
  try {
    const { productId, size, quantity = 1, color = 'Default' } = req.body;

    if (!productId || !size) {
      return next(new AppError('Product ID and size are required', 400));
    }

    const qty = Math.max(1, parseInt(quantity, 10));

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return next(new AppError('Product not found or is no longer available', 404));
    }

    // Verify size and inventory
    const sizeConfig = (product.sizes || []).find((s) => s.size === size);
    if (!sizeConfig) {
      return next(new AppError(`Size "${size}" is not available for this product`, 400));
    }

    if (sizeConfig.stock < qty) {
      return next(
        new AppError(
          `Insufficient inventory: Only ${sizeConfig.stock} items remaining in size ${size}`,
          400
        )
      );
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item with exact product and size already exists in user's cart
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > sizeConfig.stock) {
        return next(
          new AppError(
            `Cannot add more items. Maximum available stock in size ${size} is ${sizeConfig.stock}`,
            400
          )
        );
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = product.price;
    } else {
      cart.items.push({
        product: product._id,
        size,
        color: color || product.colors?.[0] || 'Default',
        quantity: qty,
        price: product.price
      });
    }

    await cart.save();
    const formattedCart = await formatAndRecalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Item added to bag',
      cart: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of item in cart
// @route   PATCH /api/cart/items/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return next(new AppError('Quantity must be at least 1', 400));
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return next(new AppError('Item not found in cart', 404));
    }

    // Validate available stock
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      return next(new AppError('Product is no longer available', 400));
    }

    const sizeObj = (product.sizes || []).find((s) => s.size === item.size);
    if (!sizeObj || sizeObj.stock < qty) {
      return next(
        new AppError(
          `Insufficient stock. Only ${sizeObj ? sizeObj.stock : 0} items available in size ${item.size}`,
          400
        )
      );
    }

    item.quantity = qty;
    item.price = product.price;

    await cart.save();
    const formattedCart = await formatAndRecalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    await cart.save();
    const formattedCart = await formatAndRecalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from bag',
      cart: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all items in cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: {
        items: [],
        subtotal: 0,
        originalTotal: 0,
        discountTotal: 0,
        deliveryFee: 0,
        grandTotal: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate checkout inventory and price calculations
// @route   POST /api/cart/validate-checkout
// @access  Private
exports.validateCheckout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Your cart is empty. Please add items to proceed.', 400));
    }

    const formattedCart = await formatAndRecalculateCart(cart);

    // Ensure all items are in stock
    const unavailableItems = formattedCart.items.filter((i) => !i.isAvailable);
    if (unavailableItems.length > 0) {
      return next(
        new AppError(
          `Some items in your cart are no longer available in the requested quantity. Please review your bag.`,
          400
        )
      );
    }

    res.status(200).json({
      success: true,
      message: 'Checkout validation passed',
      summary: {
        subtotal: formattedCart.subtotal,
        originalTotal: formattedCart.originalTotal,
        discountTotal: formattedCart.discountTotal,
        deliveryFee: formattedCart.deliveryFee,
        grandTotal: formattedCart.grandTotal,
        itemsCount: formattedCart.itemCount,
        items: formattedCart.items
      }
    });
  } catch (error) {
    next(error);
  }
};
