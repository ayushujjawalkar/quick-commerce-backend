const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.post('/register', validate(schemas.registerUser), authController.register);

// Protected routes
router.use(verifyFirebaseToken);

router.get('/me', authController.getMe);
router.put('/me', authController.updateProfile);
router.delete('/me', authController.deleteAccount);

// Address management
router.post('/addresses', validate(schemas.addAddress), authController.addAddress);
router.put('/addresses/:addressId', authController.updateAddress);
router.delete('/addresses/:addressId', authController.deleteAddress);

module.exports = router;
