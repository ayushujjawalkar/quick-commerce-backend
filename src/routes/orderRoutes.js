// const express = require('express');
// const router = express.Router();
// const orderController = require('../controllers/orderController');
// const { verifyFirebaseToken, isCustomer, isShopManagerOrAdmin } = require('../middleware/auth');
// const { validate, schemas } = require('../middleware/validation');

// // All order routes require authentication
// router.use(verifyFirebaseToken);

// // Customer routes
// router.post('/', isCustomer, validate(schemas.createOrder), orderController.createOrder);
// router.get('/', isCustomer, orderController.getUserOrders);
// router.get('/:id', orderController.getOrderById);
// router.patch('/:id/cancel', isCustomer, orderController.cancelOrder);

// // Shop manager/admin routes
// router.get('/shop/:shopId', isShopManagerOrAdmin, orderController.getShopOrders);
// router.patch('/:id/status', isShopManagerOrAdmin, orderController.updateOrderStatus);

// module.exports = router;


const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyFirebaseToken, isCustomer, isShopManagerOrAdmin, isAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(verifyFirebaseToken);

// ✅ ADMIN FIRST
router.get('/admin/all', isAdmin, orderController.getAllOrders);

// Customer
router.post('/', isCustomer, validate(schemas.createOrder), orderController.createOrder);
router.get('/', isCustomer, orderController.getUserOrders);
router.patch('/:id/cancel', isCustomer, orderController.cancelOrder);

// Shop manager/admin
router.get('/shop/:shopId', isShopManagerOrAdmin, orderController.getShopOrders);
router.patch('/:id/status', isShopManagerOrAdmin, orderController.updateOrderStatus);

// Last
router.get('/:id', orderController.getOrderById);

module.exports = router;
