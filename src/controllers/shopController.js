const Shop = require('../models/Shop');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');
const { findNearbyShops } = require('../services/locationService');

/**
 * Create new shop
 * @route POST /api/shops
 */
exports.createShop = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    landmark,
    latitude,
    longitude,
    contactNumber,
    email,
    categories,
    deliveryRadius,
    minimumOrderAmount,
    deliveryFee,
    estimatedDeliveryTime
  } = req.body;

  const shop = await Shop.create({
    name,
    description,
    ownerId: req.user._id,
    address: {
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark
    },
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    contactNumber,
    email,
    categories,
    deliveryRadius,
    minimumOrderAmount,
    deliveryFee,
    estimatedDeliveryTime
  });

  res.status(201).json({
    success: true,
    message: 'Shop created successfully',
    data: shop
  });
});

/**
 * Get all shops (admin)
 * @route GET /api/shops/admin/all
 */
exports.getAllShops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const query = {};
  
  if (status) {
    query.isActive = status === 'active';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } }
    ];
  }

  const shops = await Shop.find(query)
    .populate('ownerId', 'name email phone')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const count = await Shop.countDocuments(query);

  res.status(200).json({
    success: true,
    data: shops,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

/**
 * Get nearby shops
 * @route GET /api/shops/nearby
 */
exports.getNearbyShops = asyncHandler(async (req, res) => {
  const { latitude, longitude, maxDistance = 10, categories, minRating, limit } = req.query;

  if (!latitude || !longitude) {
    throw new AppError('Latitude and longitude are required', 400);
  }

  const filters = {
    categories: categories ? categories.split(',') : undefined,
    minRating: minRating ? parseFloat(minRating) : undefined,
    limit: limit ? parseInt(limit) : 20
  };

  const shops = await findNearbyShops(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(maxDistance),
    filters
  );

  res.status(200).json({
    success: true,
    count: shops.length,
    data: shops
  });
});

/**
 * Get shop by ID
 * @route GET /api/shops/:id
 */
exports.getShopById = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id)
    .populate('ownerId', 'name email');

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  res.status(200).json({
    success: true,
    data: shop
  });
});

/**
 * Get shops owned by current user
 * @route GET /api/shops/my-shops
 */
exports.getMyShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find({ ownerId: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: shops.length,
    data: shops
  });
});

/**
 * Update shop
 * @route PUT /api/shops/:id
 */
exports.updateShop = asyncHandler(async (req, res) => {
  let shop = await Shop.findById(req.params.id);

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  // Check ownership or admin
  if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update this shop', 403);
  }

  // Update location if latitude/longitude provided
  if (req.body.latitude && req.body.longitude) {
    shop.location = {
      type: 'Point',
      coordinates: [req.body.longitude, req.body.latitude]
    };
    delete req.body.latitude;
    delete req.body.longitude;
  }

  shop = await Shop.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Shop updated successfully',
    data: shop
  });
});

/**
 * Delete shop
 * @route DELETE /api/shops/:id
 */
exports.deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  // Check ownership or admin
  if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this shop', 403);
  }

  // Soft delete
  shop.isActive = false;
  await shop.save();

  res.status(200).json({
    success: true,
    message: 'Shop deleted successfully'
  });
});

/**
 * Toggle shop verification (admin only)
 * @route PATCH /api/shops/:id/verify
 */
exports.toggleVerification = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  shop.isVerified = !shop.isVerified;
  await shop.save();

  res.status(200).json({
    success: true,
    message: `Shop ${shop.isVerified ? 'verified' : 'unverified'} successfully`,
    data: shop
  });
});

/**
 * Update shop timings
 * @route PUT /api/shops/:id/timings
 */
exports.updateTimings = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  // Check ownership
  if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update shop timings', 403);
  }

  shop.timings = req.body.timings;
  await shop.save();

  res.status(200).json({
    success: true,
    message: 'Shop timings updated successfully',
    data: shop
  });
});
