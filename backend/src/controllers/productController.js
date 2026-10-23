const Product = require('../models/Product');
const Category = require('../models/Category');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all products with searching, filtering, sorting and pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      subCategory,
      gender,
      brand,
      size,
      color,
      minPrice,
      maxPrice,
      minDiscount,
      isFeatured,
      isTrending,
      tag,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = { isActive: true };

    // 1. Search filter (text index or regex fallback)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { subCategory: searchRegex },
        { description: searchRegex }
      ];
    }

    // 2. Category filter (supports ObjectId or category slug/name)
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const foundCategory = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }]
        });
        if (foundCategory) {
          query.category = foundCategory._id;
        } else {
          // If category was passed by name/slug like 'Men' or 'Women', also check gender field
          query.$or = [
            { gender: new RegExp(`^${category}$`, 'i') },
            { subCategory: new RegExp(category, 'i') }
          ];
        }
      }
    }

    // 3. Gender filter
    if (gender) {
      query.gender = new RegExp(`^${gender}$`, 'i');
    }

    // 4. SubCategory filter
    if (subCategory) {
      query.subCategory = new RegExp(`^${subCategory}$`, 'i');
    }

    // 5. Brand filter (supports comma-separated list: Puma,Nike,Levis)
    if (brand) {
      const brandsList = brand.split(',').map((b) => new RegExp(`^${b.trim()}$`, 'i'));
      query.brand = { $in: brandsList };
    }

    // 6. Size filter (only in-stock sizes)
    if (size) {
      const sizesList = size.split(',').map((s) => s.trim());
      query.sizes = {
        $elemMatch: {
          size: { $in: sizesList },
          stock: { $gt: 0 }
        }
      };
    }

    // 7. Color filter
    if (color) {
      const colorsList = color.split(',').map((c) => new RegExp(`^${c.trim()}$`, 'i'));
      query.colors = { $in: colorsList };
    }

    // 8. Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 9. Discount percentage filter
    if (minDiscount) {
      query.discountPercentage = { $gte: Number(minDiscount) };
    }

    // 10. Boolean tags / flags
    if (isFeatured === 'true') query.isFeatured = true;
    if (isTrending === 'true' || tag === 'trending') query.isTrending = true;
    if (tag === 'flash-sale') query.discountPercentage = { $gte: 50 };

    // 11. Sorting options
    let sortOption = { isFeatured: -1, isTrending: -1, createdAt: -1 };
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption = { price: 1 };
          break;
        case 'price-desc':
          sortOption = { price: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'discount':
          sortOption = { discountPercentage: -1 };
          break;
        case 'rating':
        case 'popularity':
          sortOption = { 'rating.average': -1, 'rating.count': -1 };
          break;
        case 'featured':
        default:
          sortOption = { isFeatured: -1, isTrending: -1, createdAt: -1 };
          break;
      }
    }

    // 12. Pagination setup
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Execute product query and total count
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug gender')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Aggregate available brands, sizes, and colors for current query filter sidebar
    const filterAggregation = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          brands: { $addToSet: '$brand' },
          allSizes: { $push: '$sizes.size' },
          colors: { $push: '$colors' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    const availableBrands = filterAggregation[0]?.brands?.sort() || [];
    const flattenedSizes = (filterAggregation[0]?.allSizes || []).flat();
    const availableSizes = [...new Set(flattenedSizes)].filter(Boolean);
    const flattenedColors = (filterAggregation[0]?.colors || []).flat();
    const availableColors = [...new Set(flattenedColors)].filter(Boolean);
    const priceRange = {
      min: filterAggregation[0]?.minPrice || 0,
      max: filterAggregation[0]?.maxPrice || 10000
    };

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      filters: {
        availableBrands,
        availableSizes,
        availableColors,
        priceRange
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError('Invalid product ID format', 400));
    }

    const product = await Product.findById(id).populate('category', 'name slug gender');

    if (!product || !product.isActive) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related products for a given product
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentProduct = await Product.findById(id);

    if (!currentProduct) {
      return next(new AppError('Product not found', 404));
    }

    // Find products in the same category or gender, excluding current product
    const related = await Product.find({
      _id: { $ne: id },
      isActive: true,
      $or: [
        { category: currentProduct.category },
        { gender: currentProduct.gender },
        { brand: currentProduct.brand }
      ]
    })
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      count: related.length,
      data: related
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      description,
      category,
      subCategory,
      gender,
      originalPrice,
      price,
      images,
      sizes,
      colors,
      isFeatured,
      isTrending
    } = req.body;

    if (!name || !brand || !description || !category || !price) {
      return next(new AppError('Please provide all required product fields', 400));
    }

    const product = await Product.create({
      name,
      brand,
      description,
      category,
      subCategory,
      gender,
      originalPrice: originalPrice || price,
      price,
      images: Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'],
      sizes: Array.isArray(sizes) ? sizes : [{ size: 'FreeSize', stock: 10 }],
      colors: Array.isArray(colors) ? colors : ['Default'],
      isFeatured: Boolean(isFeatured),
      isTrending: Boolean(isTrending)
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    let product = await Product.findById(id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Auto-update discount percentage if prices change
    if (req.body.originalPrice || req.body.price) {
      const orig = req.body.originalPrice || product.originalPrice;
      const cur = req.body.price || product.price;
      if (orig > cur) {
        req.body.discountPercentage = Math.round(((orig - cur) / orig) * 100);
      } else {
        req.body.discountPercentage = 0;
      }
    }

    product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).populate('category', 'name slug gender');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product (soft delete)
// @route   DELETE /api/products/:id
// @access  Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
