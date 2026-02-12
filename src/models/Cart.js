const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: String,
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId
  },
  variantName: String,
  variantValue: String,
  unit: String,
  unitValue: Number,
  discount: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  appliedCoupon: {
    code: String,
    discount: Number
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

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  // Calculate total items
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  
  // Calculate tax (5% of subtotal)
  this.tax = this.subtotal * 0.05;
  
  // Calculate total
  this.total = this.subtotal + this.tax + this.deliveryFee - this.discount;
  
  next();
});

// Instance method to group items by shop
cartSchema.methods.getItemsByShop = function() {
  const shopGroups = {};
  
  this.items.forEach(item => {
    const shopId = item.shopId.toString();
    if (!shopGroups[shopId]) {
      shopGroups[shopId] = {
        shopId: item.shopId,
        items: [],
        subtotal: 0
      };
    }
    shopGroups[shopId].items.push(item);
    shopGroups[shopId].subtotal += item.finalPrice * item.quantity;
  });
  
  return Object.values(shopGroups);
};

module.exports = mongoose.model('Cart', cartSchema);
