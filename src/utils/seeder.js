const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Category = require('../models/Category');

dotenv.config();

// Sample data
const users = [
  {
    firebaseUid: 'admin-uid-001',
    email: 'admin@quickcommerce.com',
    name: 'Admin User',
    phone: '9999999999',
    role: 'admin',
    isActive: true,
    emailVerified: true
  },
  {
    firebaseUid: 'shop-owner-uid-001',
    email: 'owner@quickmart.com',
    name: 'Shop Owner',
    phone: '9876543210',
    role: 'shop_manager',
    isActive: true,
    emailVerified: true
  },
  {
    firebaseUid: 'customer-uid-001',
    email: 'customer@example.com',
    name: 'John Doe',
    phone: '9876543211',
    role: 'customer',
    isActive: true,
    emailVerified: true,
    addresses: [
      {
        type: 'home',
        addressLine1: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        },
        isDefault: true
      }
    ]
  }
];

const categories = [
  { name: 'Grocery', slug: 'grocery', level: 0 },
  { name: 'Vegetables', slug: 'vegetables', level: 0 },
  { name: 'Fruits', slug: 'fruits', level: 0 },
  { name: 'Dairy', slug: 'dairy', level: 0 },
  { name: 'Bakery', slug: 'bakery', level: 0 },
  { name: 'Beverages', slug: 'beverages', level: 0 },
  { name: 'Snacks', slug: 'snacks', level: 0 },
  { name: 'Personal Care', slug: 'personal-care', level: 0 }
];

// Seeder functions
const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Clear existing data
    await User.deleteMany();
    await Shop.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();

    console.log('Existing data cleared...');

    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log('Users created...');

    // Get shop owner
    const shopOwner = createdUsers.find(u => u.role === 'shop_manager');

    // Insert categories
    await Category.insertMany(categories);
    console.log('Categories created...');

    // Create shops
    const shops = [
      {
        name: 'QuickMart Downtown',
        description: 'Your neighborhood grocery store',
        ownerId: shopOwner._id,
        address: {
          addressLine1: '456 Market Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        },
        contactNumber: '9876543210',
        email: 'downtown@quickmart.com',
        categories: ['grocery', 'food'],
        deliveryRadius: 5,
        minimumOrderAmount: 100,
        deliveryFee: 30,
        estimatedDeliveryTime: 30,
        isActive: true,
        isVerified: true,
        timings: [
          { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'friday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'saturday', isOpen: true, openTime: '08:00', closeTime: '23:00' },
          { day: 'sunday', isOpen: true, openTime: '09:00', closeTime: '21:00' }
        ]
      },
      {
        name: 'Fresh Mart Express',
        description: 'Fresh groceries delivered fast',
        ownerId: shopOwner._id,
        address: {
          addressLine1: '789 Express Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002'
        },
        location: {
          type: 'Point',
          coordinates: [72.8800, 19.0800]
        },
        contactNumber: '9876543211',
        email: 'express@freshmart.com',
        categories: ['grocery', 'food'],
        deliveryRadius: 7,
        minimumOrderAmount: 150,
        deliveryFee: 40,
        estimatedDeliveryTime: 25,
        isActive: true,
        isVerified: true
      }
    ];

    const createdShops = await Shop.insertMany(shops);
    console.log('Shops created...');

    // Create products for first shop
    const products = [
      {
        shopId: createdShops[0]._id,
        name: 'Fresh Milk',
        description: 'Pure cow milk, full cream',
        category: 'dairy',
        brand: 'Amul',
        price: 60,
        comparePrice: 65,
        stock: 100,
        unit: 'l',
        unitValue: 1,
        isAvailable: true,
        isFeatured: true,
        tags: ['fresh', 'dairy', 'milk']
      },
      {
        shopId: createdShops[0]._id,
        name: 'Whole Wheat Bread',
        description: 'Fresh whole wheat bread',
        category: 'bakery',
        brand: 'Britannia',
        price: 45,
        stock: 50,
        unit: 'piece',
        unitValue: 1,
        isAvailable: true,
        tags: ['bread', 'bakery', 'wheat']
      },
      {
        shopId: createdShops[0]._id,
        name: 'Fresh Bananas',
        description: 'Ripe yellow bananas',
        category: 'fruits',
        price: 40,
        stock: 200,
        unit: 'dozen',
        unitValue: 1,
        isAvailable: true,
        isFeatured: true,
        tags: ['fresh', 'fruits', 'organic']
      },
      {
        shopId: createdShops[0]._id,
        name: 'Tomatoes',
        description: 'Fresh red tomatoes',
        category: 'vegetables',
        price: 30,
        stock: 150,
        unit: 'kg',
        unitValue: 1,
        isAvailable: true,
        tags: ['fresh', 'vegetables', 'organic']
      },
      {
        shopId: createdShops[0]._id,
        name: 'Coca Cola',
        description: 'Refreshing soft drink',
        category: 'beverages',
        brand: 'Coca Cola',
        price: 80,
        stock: 100,
        unit: 'l',
        unitValue: 2,
        isAvailable: true,
        hasVariants: true,
        variants: [
          { name: 'Size', value: '500ml', price: 40, stock: 50, isAvailable: true },
          { name: 'Size', value: '1L', price: 70, stock: 50, isAvailable: true },
          { name: 'Size', value: '2L', price: 100, stock: 50, isAvailable: true }
        ],
        tags: ['beverages', 'cold drink']
      }
    ];

    await Product.insertMany(products);
    console.log('Products created...');

    console.log('\n✅ Data Imported Successfully!');
    console.log('\n📊 Summary:');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Shops: ${createdShops.length}`);
    console.log(`Products: ${products.length}`);
    console.log(`Categories: ${categories.length}`);
    
    console.log('\n👤 Test Accounts:');
    console.log('Admin: admin@quickcommerce.com');
    console.log('Shop Owner: owner@quickmart.com');
    console.log('Customer: customer@example.com');

    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    await User.deleteMany();
    await Shop.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();

    console.log('✅ Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

// Run based on command line argument
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use: npm run seed -i (import) or npm run seed -d (destroy)');
  process.exit();
}
