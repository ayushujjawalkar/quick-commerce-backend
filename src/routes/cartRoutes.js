const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyFirebaseToken, isCustomer } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All cart routes require authentication
router.use(verifyFirebaseToken);
router.use(isCustomer);

router.get('/', cartController.getCart);
router.get('/by-shop', cartController.getCartByShop);
router.post('/items', validate(schemas.addToCart), cartController.addToCart);
router.put('/items/:itemId', cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);
router.post('/coupon', cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);

module.exports = router;
