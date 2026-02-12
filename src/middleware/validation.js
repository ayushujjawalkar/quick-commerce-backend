const Joi = require('joi');

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // User registration
  registerUser: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional()
  }),

  // Add address
  addAddress: Joi.object({
    type: Joi.string().valid('home', 'work', 'other').default('home'),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    landmark: Joi.string().optional(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    isDefault: Joi.boolean().default(false)
  }),

  // Create shop
  createShop: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    landmark: Joi.string().optional(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    contactNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().required(),
    categories: Joi.array().items(Joi.string()).min(1).required(),
    deliveryRadius: Joi.number().min(1).max(50).default(5),
    minimumOrderAmount: Joi.number().min(0).default(0),
    deliveryFee: Joi.number().min(0).default(0),
    estimatedDeliveryTime: Joi.number().min(10).max(120).default(30)
  }),

  // Create product
  createProduct: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    category: Joi.string().required(),
    subCategory: Joi.string().optional(),
    brand: Joi.string().optional(),
    price: Joi.number().min(0).required(),
    comparePrice: Joi.number().min(0).optional(),
    sku: Joi.string().optional(),
    stock: Joi.number().min(0).default(0),
    unit: Joi.string().valid('kg', 'g', 'l', 'ml', 'piece', 'dozen', 'packet', 'box').default('piece'),
    unitValue: Joi.number().min(0).default(1),
    tags: Joi.array().items(Joi.string()).optional(),
    minOrderQuantity: Joi.number().min(1).default(1),
    maxOrderQuantity: Joi.number().min(1).default(100)
  }),

  // Add to cart
  addToCart: Joi.object({
    productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    quantity: Joi.number().min(1).required(),
    variantId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
  }),

  // Create order
  createOrder: Joi.object({
    shopId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    items: Joi.array().items(Joi.object({
      productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      quantity: Joi.number().min(1).required(),
      variantId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
    })).min(1).required(),
    deliveryAddressId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    contactNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
    paymentMethod: Joi.string().valid('cod', 'online', 'wallet').required(),
    couponCode: Joi.string().optional(),
    specialInstructions: Joi.string().max(500).optional()
  }),

  // Create coupon
  createCoupon: Joi.object({
    code: Joi.string().uppercase().min(4).max(20).required(),
    description: Joi.string().required(),
    type: Joi.string().valid('percentage', 'fixed').required(),
    value: Joi.number().min(0).required(),
    maxDiscount: Joi.number().min(0).optional(),
    minOrderAmount: Joi.number().min(0).default(0),
    applicableShops: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    isGlobal: Joi.boolean().default(false),
    usageLimit: Joi.object({
      total: Joi.number().min(1).optional(),
      perUser: Joi.number().min(1).default(1)
    }).optional(),
    validFrom: Joi.date().required(),
    validUntil: Joi.date().greater(Joi.ref('validFrom')).required()
  })
};

module.exports = {
  validate,
  schemas
};
