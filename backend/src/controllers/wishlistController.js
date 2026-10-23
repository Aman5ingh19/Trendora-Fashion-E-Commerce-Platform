const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Filter out inactive products
    const activeProducts = (wishlist.products || []).filter((p) => p && p.isActive);

    res.status(200).json({
      success: true,
      count: activeProducts.length,
      products: activeProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/items
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return next(new AppError('Product ID is required', 400));
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return next(new AppError('Product not found or unavailable', 404));
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    // Check if product already exists
    const exists = wishlist.products.some((id) => id.toString() === productId);
    if (!exists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const updated = await Wishlist.findById(wishlist._id).populate('products');

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      count: updated.products.length,
      products: updated.products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/items/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return next(new AppError('Wishlist not found', 404));
    }

    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
    await wishlist.save();

    const updated = await Wishlist.findById(wishlist._id).populate('products');

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: updated.products.length,
      products: updated.products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move item from wishlist to cart
// @route   POST /api/wishlist/move-to-cart
// @access  Private
exports.moveToCart = async (req, res, next) => {
  try {
    const { productId, size } = req.body;

    if (!productId || !size) {
      return next(new AppError('Product ID and size are required', 400));
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return next(new AppError('Product not found', 404));
    }

    // Verify stock
    const sizeConfig = (product.sizes || []).find((s) => s.size === size);
    if (!sizeConfig || sizeConfig.stock < 1) {
      return next(new AppError(`Size ${size} is out of stock`, 400));
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += 1;
    } else {
      cart.items.push({
        product: product._id,
        size,
        color: product.colors?.[0] || 'Default',
        quantity: 1,
        price: product.price
      });
    }

    await cart.save();

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Item moved to shopping bag successfully'
    });
  } catch (error) {
    next(error);
  }
};
