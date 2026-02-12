const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get or create cart for user
 */
const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId })
    .populate('items.productId', 'name price images stock isAvailable')
    .populate('items.shopId', 'name isActive deliveryFee');

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

/**
 * Add item to cart
 */
const addToCart = async (userId, { productId, quantity, variantId }) => {
  // Fetch product details
  const product = await Product.findById(productId).populate('shopId');
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (!product.isAvailable) {
    throw new AppError('Product is not available', 400);
  }

  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  // Get or create cart
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  // Check if product already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId && 
           (!variantId || item.variantId?.toString() === variantId)
  );

  let price = product.price;
  let variantName, variantValue;

  // Handle variants
  if (variantId && product.hasVariants) {
    const variant = product.variants.id(variantId);
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }
    if (!variant.isAvailable) {
      throw new AppError('Variant is not available', 400);
    }
    if (variant.stock < quantity) {
      throw new AppError(`Only ${variant.stock} items available for this variant`, 400);
    }
    price = variant.price;
    variantName = variant.name;
    variantValue = variant.value;
  }

  // Calculate discount
  let discount = 0;
  if (product.discount && product.discount.value > 0) {
    const now = new Date();
    const discountStart = product.discount.startDate ? new Date(product.discount.startDate) : null;
    const discountEnd = product.discount.endDate ? new Date(product.discount.endDate) : null;

    const isDiscountActive = (!discountStart || now >= discountStart) && 
                            (!discountEnd || now <= discountEnd);

    if (isDiscountActive) {
      if (product.discount.type === 'percentage') {
        discount = (price * product.discount.value) / 100;
      } else {
        discount = product.discount.value;
      }
    }
  }

  const finalPrice = price - discount;

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // Check stock again
    if (product.stock < newQuantity) {
      throw new AppError(`Only ${product.stock} items available in stock`, 400);
    }

    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      productId,
      shopId: product.shopId._id,
      name: product.name,
      image: product.images[0],
      price,
      quantity,
      variantId,
      variantName,
      variantValue,
      unit: product.unit,
      unitValue: product.unitValue,
      discount,
      finalPrice
    });
  }

  await cart.save();
  
  return await cart.populate('items.productId items.shopId');
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (userId, itemId, quantity) => {
  const cart = await Cart.findOne({ userId });
  
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const item = cart.items.id(itemId);
  
  if (!item) {
    throw new AppError('Item not found in cart', 404);
  }

  // Check stock
  const product = await Product.findById(item.productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  if (quantity === 0) {
    // Remove item if quantity is 0
    cart.items.pull(itemId);
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  
  return await cart.populate('items.productId items.shopId');
};

/**
 * Remove item from cart
 */
const removeFromCart = async (userId, itemId) => {
  const cart = await Cart.findOne({ userId });
  
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.items.pull(itemId);
  await cart.save();
  
  return await cart.populate('items.productId items.shopId');
};

/**
 * Clear entire cart
 */
const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });
  
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.items = [];
  await cart.save();
  
  return cart;
};

/**
 * Apply coupon to cart
 */
const applyCoupon = async (userId, couponCode) => {
  const cart = await Cart.findOne({ userId });
  
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.findOne({ 
    code: couponCode.toUpperCase(), 
    isActive: true 
  });

  if (!coupon) {
    throw new AppError('Invalid coupon code', 404);
  }

  // Validate coupon
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new AppError('Coupon has expired or not yet valid', 400);
  }

  if (cart.subtotal < coupon.minOrderAmount) {
    throw new AppError(`Minimum order amount of ₹${coupon.minOrderAmount} required`, 400);
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (cart.subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.value;
  }

  cart.appliedCoupon = {
    code: coupon.code,
    discount
  };
  cart.discount = discount;

  await cart.save();
  
  return cart;
};

/**
 * Remove coupon from cart
 */
const removeCoupon = async (userId) => {
  const cart = await Cart.findOne({ userId });
  
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.appliedCoupon = undefined;
  cart.discount = 0;

  await cart.save();
  
  return cart;
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
};
