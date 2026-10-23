const Category = require('../models/Category');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

// Helper to generate URL-friendly slug
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
};

// @desc    Get all active categories with optional product counts
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

    // Attach item count to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id, isActive: true });
        return { ...cat, itemCount: count };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID or slug
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let category;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(id);
    } else {
      category = await Category.findOne({ slug: id.toLowerCase() });
    }

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl, gender, subCategories } = req.body;

    if (!name) {
      return next(new AppError('Category name is required', 400));
    }

    const slug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(name);

    const existing = await Category.findOne({ slug });
    if (existing) {
      return next(new AppError('A category with this name or slug already exists', 409));
    }

    const category = await Category.create({
      name,
      slug,
      description,
      imageUrl,
      gender,
      subCategories: Array.isArray(subCategories) ? subCategories : []
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.body.name && !req.body.slug) {
      req.body.slug = generateSlug(req.body.name);
    }

    const category = await Category.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
