// const mongoose = require('mongoose');

// const deliveryPartnerSchema = new mongoose.Schema({
//   firebaseUid: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   phone: {
//     type: String,
//     required: true,
//   },
//   profileImage: {
//     type: String,
//   },
//   vehicleType: {
//     type: String,
//     enum: ['bike', 'scooter', 'bicycle', 'car'],
//     required: true,
//   },
//   vehicleNumber: {
//     type: String,
//     required: true,
//   },
//   drivingLicense: {
//     type: String,
//     required: true,
//   },
//   aadharNumber: {
//     type: String,
//     required: true,
//   },
//   currentLocation: {
//     type: {
//       type: String,
//       enum: ['Point'],
//       default: 'Point',
//     },
//     coordinates: {
//       type: [Number], // [longitude, latitude]
//       default: [0, 0],
//     },
//   },
//   lastLocationUpdate: {
//     type: Date,
//     default: Date.now,
//   },
//   isAvailable: {
//     type: Boolean,
//     default: true,
//   },
//   isOnline: {
//     type: Boolean,
//     default: false,
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
//   rating: {
//     average: {
//       type: Number,
//       default: 0,
//     },
//     count: {
//       type: Number,
//       default: 0,
//     },
//   },
//   totalDeliveries: {
//     type: Number,
//     default: 0,
//   },
//   completedDeliveries: {
//     type: Number,
//     default: 0,
//   },
//   cancelledDeliveries: {
//     type: Number,
//     default: 0,
//   },
//   earnings: {
//     today: {
//       type: Number,
//       default: 0,
//     },
//     thisWeek: {
//       type: Number,
//       default: 0,
//     },
//     thisMonth: {
//       type: Number,
//       default: 0,
//     },
//     total: {
//       type: Number,
//       default: 0,
//     },
//   },
//   documents: {
//     license: String,
//     aadhar: String,
//     vehicle: String,
//   },
//   isActive: {
//     type: Boolean,
//     default: true,
//   },
//   isDeleted: {
//     type: Boolean,
//     default: false,
//   },
// }, {
//   timestamps: true,
// });

// // Create geospatial index for location-based queries
// deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
// deliveryPartnerSchema.index({ isAvailable: 1, isOnline: 1, isVerified: 1 });

// module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);



const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'bicycle', 'van'],
    default: 'bike'
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  drivingLicense: {
    type: String,
    required: true
  },
  aadharNumber: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false // Admin must verify them
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  lastLocationUpdate: {
    type: Date,
    default: Date.now
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  completedDeliveries: {
    type: Number,
    default: 0
  },
  earnings: {
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create index for geo-spatial queries (finding nearby partners)
deliveryPartnerSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);