const geolib = require('geolib');
const Shop = require('../models/Shop');

/**
 * Find nearby shops based on user location
 */
const findNearbyShops = async (latitude, longitude, maxDistance = 10, filters = {}) => {
  try {
    const userLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };

    // Build query
    const query = {
      isActive: true,
      isVerified: true,
      location: {
        $near: {
          $geometry: userLocation,
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    };

    // Apply additional filters
    if (filters.categories && filters.categories.length > 0) {
      query.categories = { $in: filters.categories };
    }

    if (filters.minRating) {
      query['rating.average'] = { $gte: filters.minRating };
    }

    // Find shops
    const shops = await Shop.find(query)
      .select('-bankDetails')
      .limit(filters.limit || 20);

    // Calculate distance for each shop
    const shopsWithDistance = shops.map(shop => {
      const distance = geolib.getDistance(
        { latitude, longitude },
        { 
          latitude: shop.location.coordinates[1], 
          longitude: shop.location.coordinates[0] 
        }
      );

      return {
        ...shop.toObject(),
        distance: (distance / 1000).toFixed(2), // Convert to km
        isInDeliveryRange: (distance / 1000) <= shop.deliveryRadius
      };
    });

    return shopsWithDistance;
  } catch (error) {
    console.error('Error finding nearby shops:', error);
    throw error;
  }
};

/**
 * Find nearest shop from a list of shop IDs
 */
const findNearestShop = async (latitude, longitude, shopIds) => {
  try {
    const shops = await Shop.find({
      _id: { $in: shopIds },
      isActive: true,
      isVerified: true
    });

    if (shops.length === 0) {
      return null;
    }

    // Calculate distance for each shop
    const shopsWithDistance = shops.map(shop => {
      const distance = geolib.getDistance(
        { latitude, longitude },
        { 
          latitude: shop.location.coordinates[1], 
          longitude: shop.location.coordinates[0] 
        }
      );

      return {
        shop,
        distance: distance / 1000 // Convert to km
      };
    });

    // Sort by distance and return nearest
    shopsWithDistance.sort((a, b) => a.distance - b.distance);
    
    return {
      ...shopsWithDistance[0].shop.toObject(),
      distance: shopsWithDistance[0].distance.toFixed(2)
    };
  } catch (error) {
    console.error('Error finding nearest shop:', error);
    throw error;
  }
};

/**
 * Check if location is within shop's delivery radius
 */
const isWithinDeliveryRadius = (shopLocation, userLocation, deliveryRadius) => {
  const distance = geolib.getDistance(
    { 
      latitude: userLocation.coordinates[1], 
      longitude: userLocation.coordinates[0] 
    },
    { 
      latitude: shopLocation.coordinates[1], 
      longitude: shopLocation.coordinates[0] 
    }
  );

  return (distance / 1000) <= deliveryRadius;
};

/**
 * Calculate estimated delivery time based on distance
 */
const calculateDeliveryTime = (distance, baseTime = 15) => {
  // Base time + 3 minutes per km
  const travelTime = Math.ceil(distance * 3);
  return baseTime + travelTime;
};

/**
 * Group cart items by nearest shop for each product
 */
const optimizeCartByLocation = async (cartItems, userLocation) => {
  try {
    const optimizedCart = {};

    for (const item of cartItems) {
      // Find all shops that have this product
      const Product = require('../models/Product');
      const product = await Product.findById(item.productId).populate('shopId');

      if (!product) continue;

      const shopId = product.shopId._id.toString();

      // Check if shop delivers to user location
      const canDeliver = isWithinDeliveryRadius(
        product.shopId.location,
        userLocation,
        product.shopId.deliveryRadius
      );

      if (!canDeliver) continue;

      if (!optimizedCart[shopId]) {
        optimizedCart[shopId] = {
          shop: product.shopId,
          items: []
        };
      }

      optimizedCart[shopId].items.push(item);
    }

    return Object.values(optimizedCart);
  } catch (error) {
    console.error('Error optimizing cart by location:', error);
    throw error;
  }
};

module.exports = {
  findNearbyShops,
  findNearestShop,
  isWithinDeliveryRadius,
  calculateDeliveryTime,
  optimizeCartByLocation
};
