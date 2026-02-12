const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create new product
 * @route POST /api/products
 */
exports.createProduct = asyncHandler(async (req, res) => {
  const { shopId } = req.body;

  // Verify shop exists and user owns it
  const shop = await Shop.findById(shopId);
  
  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to add products to this shop', 403);
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

/**
 * Get all products with filters
 * @route GET /api/products
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    shopId, 
    category, 
    search, 
    minPrice, 
    maxPrice,
    isAvailable,
    isFeatured,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const query = {};

  if (shopId) query.shopId = shopId;
  if (category) query.category = category;
  if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
  if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

  if (search) {
    query.$text = { $search: search };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortOrder };

  const products = await Product.find(query)
    .populate('shopId', 'name location deliveryFee')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort(sortOptions);

  const count = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

/**
 * Get product by ID
 * @route GET /api/products/:id
 */
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('shopId', 'name address location contactNumber deliveryFee rating');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

/**
 * Update product
 * @route PUT /api/products/:id
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id).populate('shopId');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check ownership
  if (product.shopId.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update this product', 403);
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product
  });
});

/**
 * Delete product
 * @route DELETE /api/products/:id
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('shopId');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check ownership
  if (product.shopId.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this product', 403);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * Update product stock
 * @route PATCH /api/products/:id/stock
 */
exports.updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    throw new AppError('Valid stock quantity required', 400);
  }

  const product = await Product.findById(req.params.id).populate('shopId');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check ownership
  if (product.shopId.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update stock', 403);
  }

  product.stock = stock;
  product.isAvailable = stock > 0;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: product
  });
});

/**
 * Toggle product availability
 * @route PATCH /api/products/:id/availability
 */
exports.toggleAvailability = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('shopId');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check ownership
  if (product.shopId.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update product availability', 403);
  }

  product.isAvailable = !product.isAvailable;
  await product.save();

  res.status(200).json({
    success: true,
    message: `Product ${product.isAvailable ? 'enabled' : 'disabled'} successfully`,
    data: product
  });
});

/**
 * Bulk update products
 * @route PATCH /api/products/bulk-update
 */
exports.bulkUpdate = asyncHandler(async (req, res) => {
  const { productIds, updateData } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError('Product IDs array required', 400);
  }

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    updateData
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} products updated successfully`,
    data: result
  });
});

/**
 * Get featured products
 * @route GET /api/products/featured
 */
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 10, latitude, longitude } = req.query;

  const query = { isFeatured: true, isAvailable: true };

  const products = await Product.find(query)
    .populate('shopId', 'name location rating')
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});
