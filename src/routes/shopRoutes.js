const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { verifyFirebaseToken, isAdmin, isShopManagerOrAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/nearby', shopController.getNearbyShops);
router.get('/:id', shopController.getShopById);

// Protected routes
router.use(verifyFirebaseToken);

// Admin routes
router.get('/admin/all', isAdmin, shopController.getAllShops);
router.patch('/:id/verify', isAdmin, shopController.toggleVerification);

// Shop manager/admin routes
router.post('/', isShopManagerOrAdmin, validate(schemas.createShop), shopController.createShop);
router.get('/my-shops/list', isShopManagerOrAdmin, shopController.getMyShops);
router.put('/:id', isShopManagerOrAdmin, shopController.updateShop);
router.delete('/:id', isShopManagerOrAdmin, shopController.deleteShop);
router.put('/:id/timings', isShopManagerOrAdmin, shopController.updateTimings);

module.exports = router;
