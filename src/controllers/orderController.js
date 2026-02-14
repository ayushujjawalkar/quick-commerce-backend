// const Order = require('../models/Order');
// const Product = require('../models/Product');
// const User = require('../models/User');
// const Shop = require('../models/Shop');
// const Cart = require('../models/Cart');
// const { asyncHandler } = require('../middleware/errorHandler');
// const { AppError } = require('../middleware/errorHandler');
// const { v4: uuidv4 } = require('uuid');

// /**
//  * Create new order
//  * @route POST /api/orders
//  */
// exports.createOrder = asyncHandler(async (req, res) => {
//   const {
//     shopId,
//     items,
//     deliveryAddressId,
//     contactNumber,
//     paymentMethod,
//     couponCode,
//     specialInstructions
//   } = req.body;

//   // Verify shop exists
//   const shop = await Shop.findById(shopId);
//   if (!shop || !shop.isActive || !shop.isVerified) {
//     throw new AppError('Shop not available', 400);
//   }

//   // Get user with addresses
//   const user = await User.findById(req.user._id);
//   const deliveryAddress = user.addresses.id(deliveryAddressId);
  
//   if (!deliveryAddress) {
//     throw new AppError('Delivery address not found', 404);
//   }

//   // Calculate order details
//   let subtotal = 0;
//   const orderItems = [];

//   for (const item of items) {
//     const product = await Product.findById(item.productId);
    
//     if (!product) {
//       throw new AppError(`Product ${item.productId} not found`, 404);
//     }

//     if (!product.isAvailable) {
//       throw new AppError(`Product ${product.name} is not available`, 400);
//     }

//     if (product.stock < item.quantity) {
//       throw new AppError(`Insufficient stock for ${product.name}`, 400);
//     }

//     let price = product.price;
//     let discount = 0;

//     // Handle variants
//     if (item.variantId && product.hasVariants) {
//       const variant = product.variants.id(item.variantId);
//       if (!variant || !variant.isAvailable) {
//         throw new AppError(`Variant not available for ${product.name}`, 400);
//       }
//       price = variant.price;
//     }

//     // Calculate discount
//     if (product.discount && product.discount.value > 0) {
//       const now = new Date();
//       const discountStart = product.discount.startDate ? new Date(product.discount.startDate) : null;
//       const discountEnd = product.discount.endDate ? new Date(product.discount.endDate) : null;

//       const isDiscountActive = (!discountStart || now >= discountStart) && 
//                               (!discountEnd || now <= discountEnd);

//       if (isDiscountActive) {
//         if (product.discount.type === 'percentage') {
//           discount = (price * product.discount.value) / 100;
//         } else {
//           discount = product.discount.value;
//         }
//       }
//     }

//     const finalPrice = price - discount;
//     const itemSubtotal = finalPrice * item.quantity;

//     orderItems.push({
//       productId: product._id,
//       name: product.name,
//       image: product.images[0],
//       price,
//       quantity: item.quantity,
//       variantId: item.variantId,
//       unit: product.unit,
//       unitValue: product.unitValue,
//       discount,
//       finalPrice,
//       subtotal: itemSubtotal
//     });

//     subtotal += itemSubtotal;

//     // Update product stock
//     product.stock -= item.quantity;
//     await product.save();
//   }

//   // Check minimum order amount
//   if (subtotal < shop.minimumOrderAmount) {
//     throw new AppError(`Minimum order amount is ₹${shop.minimumOrderAmount}`, 400);
//   }

//   // Calculate pricing
//   const tax = subtotal * 0.05; // 5% tax
//   const deliveryFee = shop.deliveryFee;
//   const platformFee = subtotal * 0.02; // 2% platform fee
  
//   let couponDiscount = 0;
//   let appliedCoupon = null;

//   if (couponCode) {
//     const Coupon = require('../models/Coupon');
//     const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    
//     if (coupon) {
//       const now = new Date();
//       if (now >= coupon.validFrom && now <= coupon.validUntil && subtotal >= coupon.minOrderAmount) {
//         if (coupon.type === 'percentage') {
//           couponDiscount = (subtotal * coupon.value) / 100;
//           if (coupon.maxDiscount) {
//             couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
//           }
//         } else {
//           couponDiscount = coupon.value;
//         }
        
//         appliedCoupon = {
//           code: coupon.code,
//           discount: couponDiscount
//         };

//         coupon.usedCount += 1;
//         await coupon.save();
//       }
//     }
//   }

//   const total = subtotal + tax + deliveryFee + platformFee - couponDiscount;

//   // Generate order number
//   const orderNumber = `ORD-${Date.now()}-${uuidv4().substr(0, 8).toUpperCase()}`;

//   // Create order
//   const order = await Order.create({
//     orderNumber,
//     userId: req.user._id,
//     shopId,
//     items: orderItems,
//     deliveryAddress: {
//       addressLine1: deliveryAddress.addressLine1,
//       addressLine2: deliveryAddress.addressLine2,
//       city: deliveryAddress.city,
//       state: deliveryAddress.state,
//       pincode: deliveryAddress.pincode,
//       landmark: deliveryAddress.landmark,
//       location: deliveryAddress.location
//     },
//     contactNumber,
//     pricing: {
//       subtotal,
//       discount: couponDiscount,
//       tax,
//       deliveryFee,
//       platformFee,
//       total
//     },
//     couponApplied: appliedCoupon,
//     paymentMethod,
//     paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
//     specialInstructions,
//     estimatedDeliveryTime: new Date(Date.now() + shop.estimatedDeliveryTime * 60000)
//   });

//   // Clear cart for this shop
//   await Cart.updateOne(
//     { userId: req.user._id },
//     { $pull: { items: { shopId } } }
//   );

//   res.status(201).json({
//     success: true,
//     message: 'Order placed successfully',
//     data: order
//   });
// });

// /**
//  * Get user orders
//  * @route GET /api/orders
//  */
// exports.getUserOrders = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, status } = req.query;

//   const query = { userId: req.user._id };
  
//   if (status) {
//     query.orderStatus = status;
//   }

//   const orders = await Order.find(query)
//     .populate('shopId', 'name address contactNumber')
//     .limit(limit * 1)
//     .skip((page - 1) * limit)
//     .sort({ createdAt: -1 });

//   const count = await Order.countDocuments(query);

//   res.status(200).json({
//     success: true,
//     data: orders,
//     pagination: {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(count / limit),
//       totalItems: count
//     }
//   });
// });

// /**
//  * Get order by ID
//  * @route GET /api/orders/:id
//  */
// exports.getOrderById = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id)
//     .populate('userId', 'name email phone')
//     .populate('shopId', 'name address contactNumber');

//   if (!order) {
//     throw new AppError('Order not found', 404);
//   }

//   // Check ownership
//   if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//     const shop = await Shop.findById(order.shopId);
//     if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
//       throw new AppError('Not authorized to view this order', 403);
//     }
//   }

//   res.status(200).json({
//     success: true,
//     data: order
//   });
// });

// /**
//  * Get shop orders (for shop owner/manager)
//  * @route GET /api/orders/shop/:shopId
//  */
// exports.getShopOrders = asyncHandler(async (req, res) => {
//   const { shopId } = req.params;
//   const { page = 1, limit = 10, status } = req.query;

//   // Verify shop ownership
//   const shop = await Shop.findById(shopId);
//   if (!shop) {
//     throw new AppError('Shop not found', 404);
//   }

//   if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//     throw new AppError('Not authorized to view shop orders', 403);
//   }

//   const query = { shopId };
  
//   if (status) {
//     query.orderStatus = status;
//   }

//   const orders = await Order.find(query)
//     .populate('userId', 'name phone')
//     .limit(limit * 1)
//     .skip((page - 1) * limit)
//     .sort({ createdAt: -1 });

//   const count = await Order.countDocuments(query);

//   res.status(200).json({
//     success: true,
//     data: orders,
//     pagination: {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(count / limit),
//       totalItems: count
//     }
//   });
// });

// /**
//  * Update order status
//  * @route PATCH /api/orders/:id/status
//  */
// exports.updateOrderStatus = asyncHandler(async (req, res) => {
//   const { status, note } = req.body;

//   const order = await Order.findById(req.params.id).populate('shopId');

//   if (!order) {
//     throw new AppError('Order not found', 404);
//   }

//   // Check authorization
//   const shop = await Shop.findById(order.shopId);
//   if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//     throw new AppError('Not authorized to update order status', 403);
//   }

//   order.orderStatus = status;
  
//   if (note) {
//     order.statusHistory.push({
//       status,
//       timestamp: new Date(),
//       note
//     });
//   }

//   if (status === 'delivered') {
//     order.actualDeliveryTime = new Date();
//   }

//   await order.save();

//   res.status(200).json({
//     success: true,
//     message: 'Order status updated successfully',
//     data: order
//   });
// });

// /**
//  * Cancel order
//  * @route PATCH /api/orders/:id/cancel
//  */
// exports.cancelOrder = asyncHandler(async (req, res) => {
//   const { reason } = req.body;

//   const order = await Order.findById(req.params.id);

//   if (!order) {
//     throw new AppError('Order not found', 404);
//   }

//   // Check if order can be cancelled
//   if (['delivered', 'cancelled'].includes(order.orderStatus)) {
//     throw new AppError('Order cannot be cancelled', 400);
//   }

//   // Restore product stock
//   for (const item of order.items) {
//     await Product.findByIdAndUpdate(item.productId, {
//       $inc: { stock: item.quantity }
//     });
//   }

//   order.orderStatus = 'cancelled';
//   order.cancellationReason = reason;
//   order.cancelledBy = 'customer';
//   order.cancelledAt = new Date();

//   await order.save();

//   res.status(200).json({
//     success: true,
//     message: 'Order cancelled successfully',
//     data: order
//   });
// });



const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon'); // Added Coupon import
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * Create new order
 * @route POST /api/orders
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const {
    shopId,
    items,
    deliveryAddressId,
    contactNumber,
    paymentMethod,
    couponCode,
    specialInstructions
  } = req.body;

  // 1. Verify Shop Exists and is Active
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError('Shop not found', 404);
  }
  if (!shop.isActive) {
    throw new AppError('Shop is currently not accepting orders', 400);
  }

  // 2. Get User and Validate Address
  // We need the user to get the full address details from the ID
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const addressDoc = user.addresses.id(deliveryAddressId);
  if (!addressDoc) {
    throw new AppError('Delivery address not found in user profile', 400);
  }

  // 3. Process Items & Calculate Totals (Secure Backend Calculation)
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    
    if (!product) {
      throw new AppError(`Product not found: ${item.productId}`, 404);
    }

    if (!product.isAvailable) { // Assuming isAvailable is a boolean or check stock > 0
      throw new AppError(`Product "${product.name}" is currently unavailable`, 400);
    }

    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for "${product.name}"`, 400);
    }

    // Determine Base Price (Product vs Variant)
    let price = product.price;
    let variantName = '';
    let variantValue = '';

    if (item.variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.id(item.variantId);
      if (!variant) {
        throw new AppError(`Selected variant not available for "${product.name}"`, 400);
      }
      price = variant.price;
      variantName = variant.name || ''; 
      variantValue = variant.value || '';
    }

    // Calculate Product-Level Discount (if any)
    let itemDiscount = 0;
    if (product.discount && product.discount.value > 0) {
      const now = new Date();
      const start = product.discount.startDate ? new Date(product.discount.startDate) : null;
      const end = product.discount.endDate ? new Date(product.discount.endDate) : null;

      const isActive = (!start || now >= start) && (!end || now <= end);
      
      if (isActive) {
        if (product.discount.type === 'percentage') {
          itemDiscount = (price * product.discount.value) / 100;
        } else {
          itemDiscount = product.discount.value;
        }
      }
    }

    const finalPrice = Math.max(0, price - itemDiscount);
    const itemSubtotal = finalPrice * item.quantity;

    // Build Order Item Object (Matching Schema)
    orderItems.push({
      productId: product._id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      price: price,
      quantity: item.quantity,
      variantId: item.variantId || null,
      variantName: variantName,
      variantValue: variantValue,
      unit: product.unit,
      unitValue: product.unitValue,
      discount: itemDiscount,
      finalPrice: finalPrice,
      subtotal: itemSubtotal
    });

    subtotal += itemSubtotal;

    // Reserve Stock (Optimistic Locking pattern recommended for high scale, simplified here)
    product.stock -= item.quantity;
    await product.save();
  }

  // 4. Validate Minimum Order
  if (subtotal < (shop.minimumOrderAmount || 0)) {
    throw new AppError(`Minimum order amount is ₹${shop.minimumOrderAmount}`, 400);
  }

  // 5. Calculate Final Pricing
  const tax = subtotal * 0.05; // Example: 5% Tax
  const deliveryFee = shop.deliveryFee || 0;
  const platformFee = subtotal * 0.02; // Example: 2% Platform Fee (Min/Max logic can be added)
  
  let couponDiscount = 0;
  let appliedCouponData = null;

  // Coupon Logic
  if (couponCode) {
    const coupon = await Coupon.findOne({ 
      code: couponCode.toUpperCase(), 
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (coupon) {
      // Check if coupon is applicable to this shop or global
      const isApplicable = coupon.isGlobal || (coupon.applicableShops && coupon.applicableShops.includes(shopId));
      
      if (isApplicable && subtotal >= coupon.minOrderAmount) {
        if (coupon.type === 'percentage') {
          couponDiscount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount) {
            couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          }
        } else {
          couponDiscount = coupon.value;
        }

        appliedCouponData = {
          code: coupon.code,
          discount: couponDiscount
        };

        // Increment coupon usage
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }
  }

  const total = Math.max(0, subtotal + tax + deliveryFee + platformFee - couponDiscount);

  // 6. Generate Order Number & Create Order
  const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

  const order = await Order.create({
    orderNumber,
    userId: req.user._id,
    shopId,
    items: orderItems,
    deliveryAddress: {
      addressLine1: addressDoc.addressLine1,
      addressLine2: addressDoc.addressLine2,
      city: addressDoc.city,
      state: addressDoc.state,
      pincode: addressDoc.pincode,
      landmark: addressDoc.landmark,
      location: addressDoc.location // Ensure your User model has this structure
    },
    contactNumber: contactNumber || user.phone,
    pricing: {
      subtotal,
      discount: couponDiscount,
      tax,
      deliveryFee,
      platformFee,
      total
    },
    couponApplied: appliedCouponData,
    paymentMethod,
    paymentStatus: 'pending', // Default pending for all
    orderStatus: 'pending',
    specialInstructions,
    estimatedDeliveryTime: new Date(Date.now() + (shop.estimatedDeliveryTime || 30) * 60000)
  });

  // 7. Clear Ordered Items from Cart
  // Assuming Cart structure allows pulling by shopId or clearing full cart
  // This clears ONLY items from this specific shop if your cart supports multi-shop
  // Otherwise, use: await Cart.findOneAndDelete({ userId: req.user._id });
  await Cart.updateOne(
    { userId: req.user._id },
    { $pull: { items: { shopId: shopId } } }
  );

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: order
  });
});

/**
 * Get user orders
 * @route GET /api/orders
 */
exports.getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { userId: req.user._id };
  
  if (status) {
    query.orderStatus = status;
  }

  const orders = await Order.find(query)
    .populate('shopId', 'name address contactNumber image') // Added image if available
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const count = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

/**
 * Get order by ID
 * @route GET /api/orders/:id
 */
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('shopId', 'name address contactNumber');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check ownership (User or Shop Owner or Admin)
  const isUser = order.userId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isUser && !isAdmin) {
    // If not user or admin, check if it's the shop owner
    const shop = await Shop.findById(order.shopId);
    if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to view this order', 403);
    }
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * Get shop orders (for shop owner/manager)
 * @route GET /api/orders/shop/:shopId
 */
exports.getShopOrders = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  // Verify shop ownership
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view shop orders', 403);
  }

  const query = { shopId };
  
  if (status) {
    query.orderStatus = status;
  }

  const orders = await Order.find(query)
    .populate('userId', 'name phone')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const count = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

/**
 * Update order status
 * @route PATCH /api/orders/:id/status
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check authorization (Only Shop Owner or Admin)
  const shop = await Shop.findById(order.shopId);
  if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update order status', 403);
  }

  // Prevent backtracking if necessary, or just update
  order.orderStatus = status;
  
  // Add to history
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Status updated to ${status}`
  });

  if (status === 'delivered') {
    order.actualDeliveryTime = new Date();
    order.paymentStatus = 'paid'; // Usually COD becomes paid on delivery
  }

  await order.save();

  // TODO: Trigger notification to user (Socket.io or FCM)

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});

/**
 * Cancel order
 * @route PATCH /api/orders/:id/cancel
 */
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify User owns the order
  if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
     // Allow shop owner to cancel too? Usually yes.
     const shop = await Shop.findById(order.shopId);
     if (shop.ownerId.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to cancel this order', 403);
     }
  }

  // Check if order can be cancelled
  if (['delivered', 'cancelled', 'out_for_delivery'].includes(order.orderStatus)) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity }
    });
  }

  order.orderStatus = 'cancelled';
  order.cancellationReason = reason || 'Cancelled by user';
  order.cancelledBy = req.user.role === 'admin' ? 'admin' : (order.userId.toString() === req.user._id.toString() ? 'customer' : 'shop');
  order.cancelledAt = new Date();

  // Add to history
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: reason
  });

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});