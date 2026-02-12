const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyFirebaseToken, isShopManagerOrAdmin, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, productController.getAllProducts);
router.get('/featured', optionalAuth, productController.getFeaturedProducts);
router.get('/:id', optionalAuth, productController.getProductById);

// Protected routes - Shop manager/admin
router.use(verifyFirebaseToken);
router.use(isShopManagerOrAdmin);

router.post('/', validate(schemas.createProduct), productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/stock', productController.updateStock);
router.patch('/:id/availability', productController.toggleAvailability);
router.patch('/bulk-update', productController.bulkUpdate);

module.exports = router;
