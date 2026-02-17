// const express = require('express');
// const router = express.Router();
// const deliveryController = require('../controllers/deliveryController');
// const { verifyFirebaseToken, isAdmin, isShopManagerOrAdmin } = require('../middleware/auth');

// // Delivery Partner Routes (Protected)
// router.use(verifyFirebaseToken);

// // Profile management
// router.post('/register', deliveryController.registerDeliveryPartner);
// router.get('/me', deliveryController.getProfile);
// router.put('/me', deliveryController.updateProfile);

// // Location tracking
// router.post('/location', deliveryController.updateLocation);

// // Availability
// router.patch('/toggle-availability', deliveryController.toggleAvailability);

// // Orders
// router.get('/available-orders', deliveryController.getAvailableOrders);
// router.post('/accept-order/:orderId', deliveryController.acceptOrder);
// router.patch('/pickup-order/:orderId', deliveryController.pickupOrder);
// router.patch('/start-delivery/:orderId', deliveryController.startDelivery);
// router.patch('/complete-delivery/:orderId', deliveryController.completeDelivery);
// router.get('/my-deliveries', deliveryController.getMyDeliveries);

// // Admin routes
// router.get('/admin/all', isAdmin, deliveryController.getAllDeliveryPartners);
// router.patch('/admin/verify/:partnerId', isAdmin, deliveryController.verifyDeliveryPartner);

// // Manager routes
// router.post('/manager/assign', isShopManagerOrAdmin, deliveryController.assignOrderToPartner);

// module.exports = router;




const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { verifyFirebaseToken, isAdmin, isShopManagerOrAdmin } = require('../middleware/auth');

// ==========================================
// 🔓 PUBLIC ROUTES (No Token Required)
// ==========================================
// Move this ABOVE the middleware so you can register without a token header
router.post('/register', deliveryController.registerDeliveryPartner);

// ==========================================
// 🔒 PROTECTED ROUTES (Token Required)
// ==========================================
// All routes below this line will check for the Firebase Token
router.use(verifyFirebaseToken);

// Profile management
router.get('/me', deliveryController.getProfile);
router.put('/me', deliveryController.updateProfile);

// Location tracking
router.post('/location', deliveryController.updateLocation);

// Availability
router.patch('/toggle-availability', deliveryController.toggleAvailability);

// Orders
router.get('/available-orders', deliveryController.getAvailableOrders);
router.get('/my-deliveries', deliveryController.getMyDeliveries); // Moved up for grouping

router.post('/accept-order/:orderId', deliveryController.acceptOrder);
router.patch('/pickup-order/:orderId', deliveryController.pickupOrder);
router.patch('/start-delivery/:orderId', deliveryController.startDelivery);
router.patch('/complete-delivery/:orderId', deliveryController.completeDelivery);

// ==========================================
// 🛡️ ADMIN / MANAGER ROUTES
// ==========================================

// Admin routes
router.get('/admin/partners', isAdmin, deliveryController.getAllDeliveryPartners);
router.patch('/admin/verify/:partnerId', isAdmin, deliveryController.verifyDeliveryPartner);

// Manager routes
router.post('/manager/assign', isShopManagerOrAdmin, deliveryController.assignOrderToPartner);

module.exports = router;