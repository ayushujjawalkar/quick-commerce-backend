// const { admin } = require('../config/firebase');
// const User = require('../models/User');

// /**
//  * Middleware to verify Firebase ID token
//  */
// const verifyFirebaseToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({
//         success: false,
//         message: 'No token provided'
//       });
//     }

//     const idToken = authHeader.split('Bearer ')[1];

//     // Verify the token with Firebase
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
    
//     // Find or create user in database
//     let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
//     if (!user) {
//       // Create new user if doesn't exist
//       user = await User.create({
//         firebaseUid: decodedToken.uid,
//         email: decodedToken.email,
//         name: decodedToken.name || 'User',
//         phone: decodedToken.phone_number,
//         emailVerified: decodedToken.email_verified,
//         role: 'customer'
//       });
//     }

//     // Check if user is active
//     if (!user.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Account is deactivated. Please contact support.'
//       });
//     }

//     // Attach user to request
//     req.user = user;
//     req.firebaseUser = decodedToken;
    
//     next();
//   } catch (error) {
//     console.error('Firebase token verification error:', error);
    
//     if (error.code === 'auth/id-token-expired') {
//       return res.status(401).json({
//         success: false,
//         message: 'Token expired. Please login again.'
//       });
//     }
    
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid or expired token'
//     });
//   }
// };

// /**
//  * Middleware to check if user is admin
//  */
// const isAdmin = (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       message: 'Access denied. Admin privileges required.'
//     });
//   }
//   next();
// };

// /**
//  * Middleware to check if user is shop manager or admin
//  */
// const isShopManagerOrAdmin = (req, res, next) => {
//   if (req.user.role !== 'admin' && req.user.role !== 'shop_manager') {
//     return res.status(403).json({
//       success: false,
//       message: 'Access denied. Shop manager or admin privileges required.'
//     });
//   }
//   next();
// };

// /**
//  * Middleware to check if user is customer
//  */
// const isCustomer = (req, res, next) => {
//   if (req.user.role !== 'customer' && req.user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       message: 'Access denied. Customer access required.'
//     });
//   }
//   next();
// };

// /**
//  * Optional authentication - doesn't fail if no token
//  */
// const optionalAuth = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return next();
//     }

//     const idToken = authHeader.split('Bearer ')[1];
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
    
//     const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
//     if (user && user.isActive) {
//       req.user = user;
//       req.firebaseUser = decodedToken;
//     }
    
//     next();
//   } catch (error) {
//     // Continue without authentication
//     next();
//   }
// };

// module.exports = {
//   verifyFirebaseToken,
//   isAdmin,
//   isShopManagerOrAdmin,
//   isCustomer,
//   optionalAuth
// };


const { admin } = require('../config/firebase');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');

/**
 * Verify Firebase token
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // 🔍 check delivery partner
      const deliveryPartner = await DeliveryPartner.findOne({
        firebaseUid: decodedToken.uid
      });

      let role = "customer";
      if (deliveryPartner) {
        role = "delivery_partner";
      }

      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || 'User',
        phone: decodedToken.phone_number,
        emailVerified: decodedToken.email_verified,
        role
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Role middlewares
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  next();
};

const isShopManagerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'shop_manager') {
    return res.status(403).json({ success: false, message: 'Shop manager or admin only' });
  }
  next();
};

const isCustomer = (req, res, next) => {
  if (req.user.role !== 'customer' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Customer only' });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (user && user.isActive) {
      req.user = user;
      req.firebaseUser = decodedToken;
    }
    next();
  } catch (err) {
    next();
  }
};

module.exports = {
  verifyFirebaseToken,
  isAdmin,
  isShopManagerOrAdmin,
  isCustomer,
  optionalAuth
};
