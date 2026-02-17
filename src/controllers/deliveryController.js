// const DeliveryPartner = require('../models/DeliveryPartner');
// const Order = require('../models/Order');
// const AppError = require('../utils/appError');
// const catchAsync = require('../utils/catchAsync');

// // Register delivery partner
// exports.registerDeliveryPartner = catchAsync(async (req, res, next) => {
//   const {
//     firebaseUid,
//     name,
//     email,
//     phone,
//     vehicleType,
//     vehicleNumber,
//     drivingLicense,
//     aadharNumber,
//   } = req.body;

//   const partner = await DeliveryPartner.create({
//     firebaseUid,
//     name,
//     email,
//     phone,
//     vehicleType,
//     vehicleNumber,
//     drivingLicense,
//     aadharNumber,
//   });

//   res.status(201).json({
//     success: true,
//     data: partner,
//   });
// });

// // Get delivery partner profile
// exports.getProfile = catchAsync(async (req, res, next) => {
//   const partner = await DeliveryPartner.findOne({ 
//     firebaseUid: req.user.firebaseUid 
//   });

//   if (!partner) {
//     return next(new AppError('Delivery partner not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: partner,
//   });
// });

// // Update delivery partner profile
// exports.updateProfile = catchAsync(async (req, res, next) => {
//   const allowedFields = ['name', 'phone', 'vehicleType', 'vehicleNumber', 'profileImage'];
//   const updates = {};

//   Object.keys(req.body).forEach((key) => {
//     if (allowedFields.includes(key)) {
//       updates[key] = req.body[key];
//     }
//   });

//   const partner = await DeliveryPartner.findOneAndUpdate(
//     { firebaseUid: req.user.firebaseUid },
//     updates,
//     { new: true, runValidators: true }
//   );

//   if (!partner) {
//     return next(new AppError('Delivery partner not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: partner,
//   });
// });

// // Update location (real-time tracking)
// exports.updateLocation = catchAsync(async (req, res, next) => {
//   const { latitude, longitude } = req.body;

//   if (!latitude || !longitude) {
//     return next(new AppError('Please provide latitude and longitude', 400));
//   }

//   const partner = await DeliveryPartner.findOneAndUpdate(
//     { firebaseUid: req.user.firebaseUid },
//     {
//       currentLocation: {
//         type: 'Point',
//         coordinates: [longitude, latitude],
//       },
//       lastLocationUpdate: Date.now(),
//     },
//     { new: true }
//   );

//   if (!partner) {
//     return next(new AppError('Delivery partner not found', 404));
//   }

//   // If partner has active delivery, update order location too
//   const activeOrder = await Order.findOne({
//     deliveryPartner: partner._id,
//     orderStatus: { $in: ['picked_up', 'out_for_delivery'] },
//   });

//   if (activeOrder) {
//     activeOrder.deliveryPartnerLocation = {
//       type: 'Point',
//       coordinates: [longitude, latitude],
//     };
//     await activeOrder.save();
//   }

//   res.status(200).json({
//     success: true,
//     data: {
//       location: partner.currentLocation,
//       lastUpdate: partner.lastLocationUpdate,
//     },
//   });
// });

// // Toggle availability
// exports.toggleAvailability = catchAsync(async (req, res, next) => {
//   const partner = await DeliveryPartner.findOne({ 
//     firebaseUid: req.user.firebaseUid 
//   });

//   if (!partner) {
//     return next(new AppError('Delivery partner not found', 404));
//   }

//   partner.isAvailable = !partner.isAvailable;
//   partner.isOnline = partner.isAvailable;
//   await partner.save();

//   res.status(200).json({
//     success: true,
//     data: {
//       isAvailable: partner.isAvailable,
//       isOnline: partner.isOnline,
//     },
//   });
// });

// // Get available orders for pickup
// exports.getAvailableOrders = catchAsync(async (req, res, next) => {
//   const partner = await DeliveryPartner.findOne({ 
//     firebaseUid: req.user.firebaseUid 
//   });

//   if (!partner) {
//     return next(new AppError('Delivery partner not found', 404));
//   }

//   if (!partner.isVerified) {
//     return next(new AppError('Your account is not verified yet', 403));
//   }

//   // Find orders ready for pickup near the partner
//   const orders = await Order.find({
//     orderStatus: 'ready_for_pickup',
//     deliveryPartner: null,
//   })
//     .populate('shop', 'name address location contactNumber')
//     .populate('customer', 'name phone')
//     .sort({ createdAt: -1 })
//     .limit(20);

//   res.status(200).json({
//     success: true,
//     results: orders.length,
//     data: orders,
//   });
// });

// // Accept order for delivery
// exports.acceptOrder = catchAsync(async (req, res, next) => {
//   const { orderId } = req.params;

//   const partner = await DeliveryPartner.findOne({ 
//     firebaseUid: req.user.firebaseUid 
//   });

//   if (!partner) {
//     return next(new AppError('Delivery partner not found', 404));
//   }

//   if (!partner.isVerified) {
//     return next(new AppError('Your account is not verified yet', 403));
//   }

//   if (!partner.isAvailable) {
//     return next(new AppError('You are not available for deliveries', 400));
//   }

//   const order = await Order.findById(orderId);

//   if (!order) {
//     return next(new AppError('Order not found', 404));
//   }

//   if (order.orderStatus !== 'ready_for_pickup') {
//     return next(new AppError('This order is not available for pickup', 400));
//   }

//   if (order.deliveryPartner) {
//     return next(new AppError('This order is already assigned', 400));
//   }

//   // Assign order to partner
//   order.deliveryPartner = partner._id;
//   order.deliveryPartnerName = partner.name;
//   order.deliveryPartnerPhone = partner.phone;
//   order.orderStatus = 'assigned_to_delivery';
//   order.assignedAt = Date.now();
//   order.deliveryPartnerLocation = partner.currentLocation;

//   await order.save();

//   // Update partner stats
//   partner.isAvailable = false; // Mark as busy
//   partner.totalDeliveries += 1;
//   await partner.save();

//   res.status(200).json({
//     success: true,
//     data: order,
//   });
// });

// // Mark order as picked up
// exports.pickupOrder = catchAsync(async (req, res, next) => {
//   const { orderId } = req.params;

//   const partner = await DeliveryPartner.findOne({ 
//     firebaseUid: req.user.firebaseUid 
//   });

//   const order = await Order.findById(orderId);

//   if (!order) {
//     return next(new AppError('Order not found', 404));
//   }

//   if (order.deliveryPartner.toString() !== partner._id.toString()) {
//     return next(new AppError('This order is not assigned to you', 403));
//   }

//   if (order.orderStatus !== 'assigned_to_delivery') {
//     return next(new AppError('Invalid order status', 400));
//   }

//   order.orderStatus = 'picked_up';
//   order.pickedUpAt = Date.now();
  
//   await order.save();

//   res.status(200).json({
//     success: true,
//     data: order,
//   });
// });

// // Mark as out for delivery
// exports.startDelivery = catchAsync(async (req, res, next) => {
//   const { orderId } = req.params;

//   const partner = await DeliveryPartner.findOne({ 
//     firebaseUid: req.user.firebaseUid 
//   });

//   const order = await Order.findById(orderId);

//   if (!order) {
//     return next(new AppError('Order not found', 404));
//   }

//   if (order.deliveryPartner.toString() !== partner._id.toString()) {
//     return next(new AppError('This order is not assigned to you', 403));
//   }

//   order.orderStatus = 'out_for_delivery';
//   await order.save();

//   res.status(200).json({
//     success: true,
//     data: order,
//   });
// });

// // Complete delivery
// exports.completeDelivery = catchAsync(async (req, res, next) => {
//   const { orderId } = req.params;

//   const partner = await DeliveryPartner.findOne({ 
//     firebaseUid: req.user.firebaseUid 
//   });

//   const order = await Order.findById(orderId);

//   if (!order) {
//     return next(new AppError('Order not found', 404));
//   }

//   if (order.deliveryPartner.toString() !== partner._id.toString()) {
//     return next(new AppError('This order is not assigned to you', 403));
//   }

//   order.orderStatus = 'delivered';
//   order.actualDeliveryTime = Date.now();
//   await order.save();

//   // Update partner stats
//   partner.completedDeliveries += 1;
//   partner.isAvailable = true; // Available for next delivery
  
//   const deliveryFee = order.deliveryFee || 30;
//   partner.earnings.today += deliveryFee;
//   partner.earnings.thisWeek += deliveryFee;
//   partner.earnings.thisMonth += deliveryFee;
//   partner.earnings.total += deliveryFee;

//   await partner.save();

//   res.status(200).json({
//     success: true,
//     data: order,
//   });
// });

// // Get my active deliveries
// exports.getMyDeliveries = catchAsync(async (req, res, next) => {
//   const partner = await DeliveryPartner.findOne({ 
//     firebaseUid: req.user.firebaseUid 
//   });

//   const { status } = req.query;

//   const query = {
//     deliveryPartner: partner._id,
//   };

//   if (status === 'active') {
//     query.orderStatus = { $in: ['assigned_to_delivery', 'picked_up', 'out_for_delivery'] };
//   } else if (status === 'completed') {
//     query.orderStatus = 'delivered';
//   }

//   const orders = await Order.find(query)
//     .populate('shop', 'name address contactNumber')
//     .populate('customer', 'name phone')
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     results: orders.length,
//     data: orders,
//   });
// });

// // Admin: Get all delivery partners
// exports.getAllDeliveryPartners = catchAsync(async (req, res, next) => {
//   const { page = 1, limit = 20, search, isVerified, isAvailable } = req.query;

//   const query = { isDeleted: false };

//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: 'i' } },
//       { phone: { $regex: search, $options: 'i' } },
//       { email: { $regex: search, $options: 'i' } },
//     ];
//   }

//   if (isVerified !== undefined) {
//     query.isVerified = isVerified === 'true';
//   }

//   if (isAvailable !== undefined) {
//     query.isAvailable = isAvailable === 'true';
//   }

//   const partners = await DeliveryPartner.find(query)
//     .sort({ createdAt: -1 })
//     .limit(limit * 1)
//     .skip((page - 1) * limit);

//   const count = await DeliveryPartner.countDocuments(query);

//   res.status(200).json({
//     success: true,
//     results: partners.length,
//     data: partners,
//     pagination: {
//       currentPage: page,
//       totalPages: Math.ceil(count / limit),
//       totalResults: count,
//     },
//   });
// });

// // Admin: Verify delivery partner
// exports.verifyDeliveryPartner = catchAsync(async (req, res, next) => {
//   const { partnerId } = req.params;

//   const partner = await DeliveryPartner.findById(partnerId);

//   if (!partner) {
//     return next(new AppError('Delivery partner not found', 404));
//   }

//   partner.isVerified = !partner.isVerified;
//   await partner.save();

//   res.status(200).json({
//     success: true,
//     data: partner,
//   });
// });

// // Manager: Assign order to delivery partner
// exports.assignOrderToPartner = catchAsync(async (req, res, next) => {
//   const { orderId, partnerId } = req.body;

//   const partner = await DeliveryPartner.findById(partnerId);
//   const order = await Order.findById(orderId);

//   if (!partner) {
//     return next(new AppError('Delivery partner not found', 404));
//   }

//   if (!order) {
//     return next(new AppError('Order not found', 404));
//   }

//   if (!partner.isVerified) {
//     return next(new AppError('Delivery partner is not verified', 400));
//   }

//   if (!partner.isAvailable) {
//     return next(new AppError('Delivery partner is not available', 400));
//   }

//   order.deliveryPartner = partner._id;
//   order.deliveryPartnerName = partner.name;
//   order.deliveryPartnerPhone = partner.phone;
//   order.orderStatus = 'assigned_to_delivery';
//   order.assignedAt = Date.now();
//   order.deliveryPartnerLocation = partner.currentLocation;

//   await order.save();

//   partner.isAvailable = false;
//   partner.totalDeliveries += 1;
//   await partner.save();

//   res.status(200).json({
//     success: true,
//     data: order,
//   });
// });

// module.exports = exports;




const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const { AppError } = require('../middleware/errorHandler'); // ✅ Fixed path
const { asyncHandler } = require('../middleware/errorHandler'); // ✅ Using consistent handler

// Register delivery partner
exports.registerDeliveryPartner = asyncHandler(async (req, res, next) => {
  const {
    firebaseUid,
    name,
    email,
    phone,
    vehicleType,
    vehicleNumber,
    drivingLicense,
    aadharNumber,
  } = req.body;

  const partner = await DeliveryPartner.create({
    firebaseUid,
    name,
    email,
    phone,
    vehicleType,
    vehicleNumber,
    drivingLicense,
    aadharNumber,
  });

  res.status(201).json({
    success: true,
    data: partner,
  });
});

// Get delivery partner profile
exports.getProfile = asyncHandler(async (req, res, next) => {
  // Assuming req.user is set by auth middleware
  // If your auth uses firebaseUid, keep this. If it uses _id, change to findById(req.user._id)
  const partner = await DeliveryPartner.findOne({ 
    firebaseUid: req.user.firebaseUid || req.user.uid // Fallback for flexibility
  });

  if (!partner) {
    throw new AppError('Delivery partner profile not found', 404);
  }

  res.status(200).json({
    success: true,
    data: partner,
  });
});

// Update delivery partner profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'phone', 'vehicleType', 'vehicleNumber', 'profileImage'];
  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const partner = await DeliveryPartner.findOneAndUpdate(
    { firebaseUid: req.user.firebaseUid },
    updates,
    { new: true, runValidators: true }
  );

  if (!partner) {
    throw new AppError('Delivery partner not found', 404);
  }

  res.status(200).json({
    success: true,
    data: partner,
  });
});

// Update location (Real-time tracking with Socket.io)
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    throw new AppError('Please provide latitude and longitude', 400);
  }

  const partner = await DeliveryPartner.findOneAndUpdate(
    { firebaseUid: req.user.firebaseUid },
    {
      currentLocation: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      lastLocationUpdate: Date.now(),
    },
    { new: true }
  );

  if (!partner) {
    throw new AppError('Delivery partner not found', 404);
  }

  // Find active order to update its tracking location
  const activeOrder = await Order.findOne({
    deliveryPartner: partner._id,
    orderStatus: { $in: ['picked_up', 'out_for_delivery'] },
  });

  if (activeOrder) {
    activeOrder.deliveryPartnerLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
    await activeOrder.save();

    // ✅ SOCKET EMIT: Notify Customer Room
    if (global.io) {
      global.io.to(activeOrder._id.toString()).emit('receive_location', {
        latitude,
        longitude,
        orderId: activeOrder._id
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      location: partner.currentLocation,
      lastUpdate: partner.lastLocationUpdate,
    },
  });
});

// Toggle availability
exports.toggleAvailability = asyncHandler(async (req, res, next) => {
  const partner = await DeliveryPartner.findOne({ 
    firebaseUid: req.user.firebaseUid 
  });

  if (!partner) {
    throw new AppError('Delivery partner not found', 404);
  }

  partner.isAvailable = !partner.isAvailable;
  partner.isOnline = partner.isAvailable;
  await partner.save();

  res.status(200).json({
    success: true,
    data: {
      isAvailable: partner.isAvailable,
      isOnline: partner.isOnline,
    },
  });
});

// Get available orders for pickup
exports.getAvailableOrders = asyncHandler(async (req, res, next) => {
  const partner = await DeliveryPartner.findOne({ 
    firebaseUid: req.user.firebaseUid 
  });

  if (!partner) throw new AppError('Delivery partner not found', 404);
  if (!partner.isVerified) throw new AppError('Your account is not verified yet', 403);

  // Find orders ready for pickup 
  // You can add geo-spatial query here to find orders only near the partner
  const orders = await Order.find({
    orderStatus: 'ready_for_pickup',
    deliveryPartner: null,
  })
    .populate('shopId', 'name address location contactNumber') // Ensure field matches schema (shopId)
    // .populate('userId', 'name phone') // Usually don't show customer info until accepted
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({
    success: true,
    results: orders.length,
    data: orders,
  });
});

// Accept order for delivery
exports.acceptOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  const partner = await DeliveryPartner.findOne({ 
    firebaseUid: req.user.firebaseUid 
  });

  if (!partner) throw new AppError('Delivery partner not found', 404);
  if (!partner.isVerified) throw new AppError('Your account is not verified yet', 403);
  // if (!partner.isAvailable) throw new AppError('You are not available for deliveries', 400);

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  if (order.orderStatus !== 'ready_for_pickup') {
    throw new AppError('This order is not available for pickup', 400);
  }

  if (order.deliveryPartner) {
    throw new AppError('This order is already assigned', 400);
  }

  // Assign order to partner
  order.deliveryPartner = partner._id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerPhone = partner.phone;
  order.orderStatus = 'assigned_to_delivery';
  order.assignedAt = Date.now();
  order.deliveryPartnerLocation = partner.currentLocation;

  await order.save();

  // Update partner stats
  partner.isAvailable = false; // Mark as busy
  partner.totalDeliveries += 1;
  await partner.save();

  // ✅ SOCKET EMIT: Notify Admin/Shop/Customer
  if (global.io) {
    global.io.to(orderId).emit('order_status_updated', {
      orderId,
      status: 'assigned_to_delivery',
      partnerName: partner.name
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// Mark order as picked up
exports.pickupOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  const partner = await DeliveryPartner.findOne({ 
    firebaseUid: req.user.firebaseUid 
  });

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  if (order.deliveryPartner.toString() !== partner._id.toString()) {
    throw new AppError('This order is not assigned to you', 403);
  }

  order.orderStatus = 'picked_up';
  order.pickedUpAt = Date.now();
  
  await order.save();

  // ✅ SOCKET EMIT
  if (global.io) {
    global.io.to(orderId).emit('order_status_updated', {
      orderId,
      status: 'picked_up'
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// Mark as out for delivery
exports.startDelivery = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  const partner = await DeliveryPartner.findOne({ 
    firebaseUid: req.user.firebaseUid 
  });

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  if (order.deliveryPartner.toString() !== partner._id.toString()) {
    throw new AppError('This order is not assigned to you', 403);
  }

  order.orderStatus = 'out_for_delivery';
  await order.save();

  // ✅ SOCKET EMIT
  if (global.io) {
    global.io.to(orderId).emit('order_status_updated', {
      orderId,
      status: 'out_for_delivery'
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// Complete delivery
exports.completeDelivery = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  const partner = await DeliveryPartner.findOne({ 
    firebaseUid: req.user.firebaseUid 
  });

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  if (order.deliveryPartner.toString() !== partner._id.toString()) {
    throw new AppError('This order is not assigned to you', 403);
  }

  order.orderStatus = 'delivered';
  order.actualDeliveryTime = Date.now();
  order.paymentStatus = 'paid'; // Assume paid upon delivery (COD logic)
  await order.save();

  // Update partner stats
  partner.completedDeliveries += 1;
  partner.isAvailable = true; // Available for next delivery
  
  // Calculate Earnings (Simple logic, can be expanded)
  const deliveryFee = order.pricing?.deliveryFee || 30; // Use pricing object
  
  // Ensure earnings object exists
  if (!partner.earnings) partner.earnings = { today: 0, thisWeek: 0, thisMonth: 0, total: 0 };
  
  partner.earnings.today += deliveryFee;
  partner.earnings.thisWeek += deliveryFee;
  partner.earnings.thisMonth += deliveryFee;
  partner.earnings.total += deliveryFee;

  await partner.save();

  // ✅ SOCKET EMIT
  if (global.io) {
    global.io.to(orderId).emit('order_status_updated', {
      orderId,
      status: 'delivered'
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// Get my active deliveries
exports.getMyDeliveries = asyncHandler(async (req, res, next) => {
  const partner = await DeliveryPartner.findOne({ 
    firebaseUid: req.user.firebaseUid 
  });

  if (!partner) throw new AppError('Delivery partner not found', 404);

  const { status } = req.query;

  const query = {
    deliveryPartner: partner._id,
  };

  if (status === 'active') {
    query.orderStatus = { $in: ['assigned_to_delivery', 'picked_up', 'out_for_delivery'] };
  } else if (status === 'completed') {
    query.orderStatus = 'delivered';
  }

  const orders = await Order.find(query)
    .populate('shopId', 'name address contactNumber')
    .populate('userId', 'name phone')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    results: orders.length,
    data: orders,
  });
});

// Admin: Get all delivery partners
exports.getAllDeliveryPartners = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, search, isVerified, isAvailable } = req.query;

  const query = { isDeleted: false }; // Ensure soft delete check exists in schema

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (isVerified !== undefined) {
    query.isVerified = isVerified === 'true';
  }

  if (isAvailable !== undefined) {
    query.isAvailable = isAvailable === 'true';
  }

  const partners = await DeliveryPartner.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await DeliveryPartner.countDocuments(query);

  res.status(200).json({
    success: true,
    results: partners.length,
    data: partners,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
      totalResults: count,
    },
  });
});

// Admin: Verify delivery partner
exports.verifyDeliveryPartner = asyncHandler(async (req, res, next) => {
  const { partnerId } = req.params;

  const partner = await DeliveryPartner.findById(partnerId);

  if (!partner) {
    throw new AppError('Delivery partner not found', 404);
  }

  partner.isVerified = !partner.isVerified;
  await partner.save();

  res.status(200).json({
    success: true,
    data: partner,
  });
});

// Manager: Assign order to delivery partner
exports.assignOrderToPartner = asyncHandler(async (req, res, next) => {
  const { orderId, partnerId } = req.body;

  const partner = await DeliveryPartner.findById(partnerId);
  const order = await Order.findById(orderId);

  if (!partner) throw new AppError('Delivery partner not found', 404);
  if (!order) throw new AppError('Order not found', 404);
  if (!partner.isVerified) throw new AppError('Delivery partner is not verified', 400);
  // if (!partner.isAvailable) throw new AppError('Delivery partner is not available', 400);

  order.deliveryPartner = partner._id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerPhone = partner.phone;
  order.orderStatus = 'assigned_to_delivery';
  order.assignedAt = Date.now();
  order.deliveryPartnerLocation = partner.currentLocation;

  await order.save();

  partner.isAvailable = false;
  partner.totalDeliveries += 1;
  await partner.save();

  // ✅ SOCKET EMIT: Notify Delivery Boy
  if (global.io) {
    // Notify the specific partner (if they are in a room with their ID)
    global.io.to(partner._id.toString()).emit('new_assigned_order', {
      orderId: order._id,
      shopName: order.shopName // ensure shopName is available or populated
    });
    
    // Notify Customer
    global.io.to(orderId).emit('order_status_updated', {
      orderId,
      status: 'assigned_to_delivery'
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});