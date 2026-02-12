const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  comparePrice: Number, // Original price for discount display
  sku: String,
  stock: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  subCategory: String,
  brand: String,
  images: [String],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: {
    type: Number, // Original price for discount display
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: String,
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'packet', 'box'],
    default: 'piece'
  },
  unitValue: {
    type: Number,
    default: 1
  },
  variants: [variantSchema],
  hasVariants: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  nutritionalInfo: {
    calories: Number,
    protein: String,
    carbs: String,
    fat: String,
    ingredients: [String]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      default: 0,
      min: 0
    },
    startDate: Date,
    endDate: Date
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  maxOrderQuantity: {
    type: Number,
    default: 100
  },
  expiryDate: Date,
  manufacturingDate: Date,
  isPerishable: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ shopId: 1, isAvailable: 1 });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ isFeatured: 1, isAvailable: 1 });

// Virtual for calculated discount price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount && this.discount.value > 0) {
    if (this.discount.type === 'percentage') {
      return this.price - (this.price * this.discount.value / 100);
    } else {
      return this.price - this.discount.value;
    }
  }
  return this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
