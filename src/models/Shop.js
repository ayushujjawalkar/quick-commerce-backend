const mongoose = require('mongoose');

const shopTimingSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  closeTime: {
    type: String, // Format: "HH:MM"
    required: true
  }
});

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  address: {
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    landmark: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  shopImages: [String],
  shopLogo: String,
  categories: [{
    type: String,
    enum: ['grocery', 'pharmacy', 'electronics', 'fashion', 'food', 'books', 'home', 'beauty', 'sports', 'other']
  }],
  timings: [shopTimingSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
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
  deliveryRadius: {
    type: Number, // in kilometers
    default: 5
  },
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  estimatedDeliveryTime: {
    type: Number, // in minutes
    default: 30
  },
  gstNumber: String,
  fssaiNumber: String, // For food-related shops
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
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

// Create geospatial index for location-based queries
shopSchema.index({ location: '2dsphere' });

// Compound indexes for better query performance
shopSchema.index({ ownerId: 1, isActive: 1 });
shopSchema.index({ isActive: 1, isVerified: 1 });
shopSchema.index({ categories: 1 });

module.exports = mongoose.model('Shop', shopSchema);
