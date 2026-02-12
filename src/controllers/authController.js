const User = require('../models/User');
const { admin } = require('../config/firebase');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Register or login user
 * @route POST /api/auth/register
 */
exports.register = asyncHandler(async (req, res) => {
  const { firebaseUid, email, name, phone } = req.body;

  // Check if user already exists
  let user = await User.findOne({ firebaseUid });

  if (user) {
    return res.status(200).json({
      success: true,
      message: 'User already exists',
      data: user
    });
  }

  // Create new user
  user = await User.create({
    firebaseUid,
    email,
    name,
    phone,
    role: 'customer'
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-__v');

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Update user profile
 * @route PUT /api/auth/me
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage, preferences } = req.body;

  const updateFields = {};
  if (name) updateFields.name = name;
  if (phone) updateFields.phone = phone;
  if (profileImage) updateFields.profileImage = profileImage;
  if (preferences) updateFields.preferences = preferences;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateFields,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

/**
 * Add address to user profile
 * @route POST /api/auth/addresses
 */
exports.addAddress = asyncHandler(async (req, res) => {
  const { 
    type, 
    addressLine1, 
    addressLine2, 
    city, 
    state, 
    pincode, 
    landmark, 
    latitude, 
    longitude,
    isDefault 
  } = req.body;

  const user = await User.findById(req.user._id);

  // If this is set as default, unset other defaults
  if (isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  user.addresses.push({
    type,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    landmark,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    isDefault
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: user.addresses
  });
});

/**
 * Update address
 * @route PUT /api/auth/addresses/:addressId
 */
exports.updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(addressId);
  
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  Object.assign(address, req.body);

  // Handle location update
  if (req.body.latitude && req.body.longitude) {
    address.location = {
      type: 'Point',
      coordinates: [req.body.longitude, req.body.latitude]
    };
  }

  // If this is set as default, unset other defaults
  if (req.body.isDefault) {
    user.addresses.forEach(addr => {
      if (addr._id.toString() !== addressId) {
        addr.isDefault = false;
      }
    });
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: user.addresses
  });
});

/**
 * Delete address
 * @route DELETE /api/auth/addresses/:addressId
 */
exports.deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);

  user.addresses.pull(addressId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: user.addresses
  });
});

/**
 * Delete account
 * @route DELETE /api/auth/me
 */
exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Soft delete
  user.isActive = false;
  await user.save();

  // Optionally delete from Firebase
  // await admin.auth().deleteUser(user.firebaseUid);

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});
