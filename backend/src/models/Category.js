const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    description: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    gender: {
      type: String,
      enum: ['Men', 'Women', 'Kids', 'Unisex', 'Home & Living', 'Beauty', 'All'],
      default: 'All'
    },
    subCategories: {
      type: [String],
      default: []
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

// Indexes
categorySchema.index({ gender: 1 });

module.exports = mongoose.model('Category', categorySchema);
