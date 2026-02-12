const cartService = require('../services/cartService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get user cart
 * @route GET /api/cart
 */
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);

  res.status(200).json({
    success: true,
    data: cart
  });
});

/**
 * Add item to cart
 * @route POST /api/cart/items
 */
exports.addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCart(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Item added to cart successfully',
    data: cart
  });
});

/**
 * Update cart item quantity
 * @route PUT /api/cart/items/:itemId
 */
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await cartService.updateCartItem(req.user._id, itemId, quantity);

  res.status(200).json({
    success: true,
    message: 'Cart updated successfully',
    data: cart
  });
});

/**
 * Remove item from cart
 * @route DELETE /api/cart/items/:itemId
 */
exports.removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await cartService.removeFromCart(req.user._id, itemId);

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: cart
  });
});

/**
 * Clear cart
 * @route DELETE /api/cart
 */
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: cart
  });
});

/**
 * Apply coupon to cart
 * @route POST /api/cart/coupon
 */
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  const cart = await cartService.applyCoupon(req.user._id, couponCode);

  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
    data: cart
  });
});

/**
 * Remove coupon from cart
 * @route DELETE /api/cart/coupon
 */
exports.removeCoupon = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCoupon(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Coupon removed',
    data: cart
  });
});

/**
 * Get cart grouped by shops
 * @route GET /api/cart/by-shop
 */
exports.getCartByShop = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  const groupedCart = cart.getItemsByShop();

  res.status(200).json({
    success: true,
    data: groupedCart
  });
});
