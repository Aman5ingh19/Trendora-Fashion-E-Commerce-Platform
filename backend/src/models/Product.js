const mongoose = require('mongoose');

const productSizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    brand: {
      type: String,
      required: [true, 'Product brand is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required']
    },
    subCategory: {
      type: String,
      trim: true,
      default: ''
    },
    gender: {
      type: String,
      enum: ['Men', 'Women', 'Kids', 'Unisex'],
      default: 'Unisex'
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Price cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price cannot be negative']
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    images: {
      type: [String],
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'A product must have at least one image'
      }
    },
    sizes: {
      type: [productSizeSchema],
      default: []
    },
    colors: {
      type: [String],
      default: []
    },
    rating: {
      average: {
        type: Number,
        default: 4.2,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isTrending: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save calculation of discount percentage
productSchema.pre('save', function (next) {
  if (this.originalPrice && this.price && this.originalPrice > this.price) {
    this.discountPercentage = Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  } else {
    this.discountPercentage = 0;
  }
  next();
});

// Full-text search index
productSchema.index({
  name: 'text',
  brand: 'text',
  description: 'text',
  subCategory: 'text'
});

// Query optimization indexes
productSchema.index({ category: 1, gender: 1, price: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ discountPercentage: -1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
