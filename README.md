# Quick Commerce Multi-Shop Backend

A comprehensive backend solution for a quick commerce platform with multi-shop support, Firebase authentication, and location-based shop selection.

## Features

### Core Features
- 🔐 **Firebase Authentication** - Secure authentication for customers and admins
- 🏪 **Multi-Shop Management** - Single owner can manage multiple shops
- 📍 **Location-Based Services** - Find nearest shops based on user location
- 🛒 **Shopping Cart** - Full-featured cart with coupon support
- 📦 **Order Management** - Complete order lifecycle management
- 🎯 **Product Variants** - Support for product variations (size, color, etc.)
- 💰 **Dynamic Pricing** - Discounts, coupons, and promotional pricing
- ⭐ **Rating System** - Product and shop ratings
- 🔍 **Advanced Search** - Text search and filtering

### User Roles
- **Customer** - Browse, shop, and place orders
- **Shop Manager/Admin** - Manage shops, products, and orders
- **Admin** - Full system access and management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Firebase Admin SDK
- **Location Services**: Geolib
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting, Mongo Sanitize

## Installation

### Prerequisites
- Node.js >= 16.0.0
- MongoDB
- Firebase Project with Admin SDK

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd quick-commerce-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/quick-commerce
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
ALLOWED_ORIGINS=http://localhost:3000
```

4. **Set up Firebase**
   - Go to Firebase Console
   - Create a new project or use existing
   - Generate a service account key
   - Download the JSON file and save as `serviceAccountKey.json` in the root directory

5. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firebaseUid": "string",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "9876543210"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/me
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "phone": "9876543210",
  "preferences": {
    "notifications": true
  }
}
```

#### Add Address
```http
POST /api/auth/addresses
Authorization: Bearer <token>

{
  "type": "home",
  "addressLine1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "isDefault": true
}
```

---

### Shop Routes (`/api/shops`)

#### Get Nearby Shops
```http
GET /api/shops/nearby?latitude=19.0760&longitude=72.8777&maxDistance=10&categories=grocery
```

Query Parameters:
- `latitude` (required): User latitude
- `longitude` (required): User longitude
- `maxDistance` (optional): Search radius in km (default: 10)
- `categories` (optional): Comma-separated categories
- `minRating` (optional): Minimum rating filter
- `limit` (optional): Number of results (default: 20)

#### Create Shop (Shop Manager/Admin)
```http
POST /api/shops
Authorization: Bearer <token>

{
  "name": "QuickMart Downtown",
  "description": "Your neighborhood grocery store",
  "addressLine1": "456 Market Road",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "contactNumber": "9876543210",
  "email": "shop@example.com",
  "categories": ["grocery", "food"],
  "deliveryRadius": 5,
  "minimumOrderAmount": 100,
  "deliveryFee": 30,
  "estimatedDeliveryTime": 30
}
```

#### Get Shop Details
```http
GET /api/shops/:id
```

#### Get My Shops (Shop Manager)
```http
GET /api/shops/my-shops/list
Authorization: Bearer <token>
```

#### Update Shop
```http
PUT /api/shops/:id
Authorization: Bearer <token>

{
  "name": "Updated Shop Name",
  "deliveryFee": 40
}
```

---

### Product Routes (`/api/products`)

#### Get All Products
```http
GET /api/products?page=1&limit=20&shopId=123&category=grocery&search=milk
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `shopId`: Filter by shop
- `category`: Filter by category
- `search`: Text search
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `isAvailable`: Filter available products
- `isFeatured`: Filter featured products
- `sortBy`: Sort field (default: createdAt)
- `order`: asc or desc (default: desc)

#### Get Product Details
```http
GET /api/products/:id
```

#### Create Product (Shop Manager)
```http
POST /api/products
Authorization: Bearer <token>

{
  "shopId": "shop_id_here",
  "name": "Fresh Milk",
  "description": "Pure cow milk",
  "category": "dairy",
  "brand": "Amul",
  "price": 60,
  "comparePrice": 70,
  "stock": 100,
  "unit": "l",
  "unitValue": 1,
  "images": ["https://example.com/milk.jpg"],
  "tags": ["fresh", "organic"]
}
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>

{
  "price": 65,
  "stock": 150
}
```

#### Update Stock
```http
PATCH /api/products/:id/stock
Authorization: Bearer <token>

{
  "stock": 200
}
```

---

### Cart Routes (`/api/cart`)

#### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

#### Add to Cart
```http
POST /api/cart/items
Authorization: Bearer <token>

{
  "productId": "product_id_here",
  "quantity": 2,
  "variantId": "variant_id_optional"
}
```

#### Update Cart Item
```http
PUT /api/cart/items/:itemId
Authorization: Bearer <token>

{
  "quantity": 3
}
```

#### Remove from Cart
```http
DELETE /api/cart/items/:itemId
Authorization: Bearer <token>
```

#### Clear Cart
```http
DELETE /api/cart
Authorization: Bearer <token>
```

#### Apply Coupon
```http
POST /api/cart/coupon
Authorization: Bearer <token>

{
  "couponCode": "SAVE10"
}
```

#### Get Cart Grouped by Shop
```http
GET /api/cart/by-shop
Authorization: Bearer <token>
```

---

### Order Routes (`/api/orders`)

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>

{
  "shopId": "shop_id_here",
  "items": [
    {
      "productId": "product_id_1",
      "quantity": 2
    }
  ],
  "deliveryAddressId": "address_id_here",
  "contactNumber": "9876543210",
  "paymentMethod": "cod",
  "couponCode": "SAVE10",
  "specialInstructions": "Ring the bell twice"
}
```

#### Get User Orders
```http
GET /api/orders?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Get Shop Orders (Shop Manager)
```http
GET /api/orders/shop/:shopId?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Update Order Status (Shop Manager)
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>

{
  "status": "confirmed",
  "note": "Order confirmed and being prepared"
}
```

Order Status Flow:
- `pending` → `confirmed` → `preparing` → `ready_for_pickup` → `out_for_delivery` → `delivered`
- Can be `cancelled` at any point before delivery

#### Cancel Order
```http
PATCH /api/orders/:id/cancel
Authorization: Bearer <token>

{
  "reason": "Changed my mind"
}
```

---

## Data Models

### User Schema
```javascript
{
  firebaseUid: String (unique),
  email: String (unique),
  phone: String,
  name: String,
  role: 'customer' | 'admin' | 'shop_manager',
  addresses: [{
    type: 'home' | 'work' | 'other',
    addressLine1: String,
    city: String,
    state: String,
    pincode: String,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    isDefault: Boolean
  }],
  isActive: Boolean,
  preferences: Object
}
```

### Shop Schema
```javascript
{
  name: String,
  ownerId: ObjectId (ref: User),
  address: Object,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  contactNumber: String,
  categories: [String],
  deliveryRadius: Number (km),
  minimumOrderAmount: Number,
  deliveryFee: Number,
  estimatedDeliveryTime: Number (minutes),
  rating: {
    average: Number,
    count: Number
  },
  isActive: Boolean,
  isVerified: Boolean
}
```

### Product Schema
```javascript
{
  shopId: ObjectId (ref: Shop),
  name: String,
  description: String,
  category: String,
  price: Number,
  comparePrice: Number,
  stock: Number,
  unit: String,
  variants: [{
    name: String,
    value: String,
    price: Number,
    stock: Number
  }],
  images: [String],
  discount: {
    type: 'percentage' | 'fixed',
    value: Number,
    startDate: Date,
    endDate: Date
  },
  isAvailable: Boolean,
  isFeatured: Boolean,
  rating: {
    average: Number,
    count: Number
  }
}
```

### Cart Schema
```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId (ref: Product),
    shopId: ObjectId (ref: Shop),
    quantity: Number,
    price: Number,
    finalPrice: Number
  }],
  subtotal: Number,
  discount: Number,
  tax: Number,
  deliveryFee: Number,
  total: Number,
  appliedCoupon: Object
}
```

### Order Schema
```javascript
{
  orderNumber: String (unique),
  userId: ObjectId (ref: User),
  shopId: ObjectId (ref: Shop),
  items: [OrderItem],
  deliveryAddress: Object,
  pricing: {
    subtotal: Number,
    discount: Number,
    tax: Number,
    deliveryFee: Number,
    platformFee: Number,
    total: Number
  },
  paymentMethod: 'cod' | 'online' | 'wallet',
  paymentStatus: String,
  orderStatus: String,
  statusHistory: [Object],
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date
}
```

---

## Location-Based Features

### How Nearby Shop Selection Works

1. **User provides location** (latitude, longitude)
2. **System searches** for shops within specified radius using MongoDB geospatial queries
3. **Filters applied**:
   - Active and verified shops only
   - Optional category filters
   - Optional rating filters
4. **Results sorted** by distance
5. **Each shop includes**:
   - Exact distance from user
   - Whether user is within delivery radius

### Location Service Functions

- `findNearbyShops()` - Find all nearby shops
- `findNearestShop()` - Find closest shop from a list
- `isWithinDeliveryRadius()` - Check if delivery is possible
- `calculateDeliveryTime()` - Estimate delivery time based on distance

---

## Security Features

1. **Firebase Authentication** - Secure token-based auth
2. **Role-Based Access Control** - Different permissions for customers/managers/admins
3. **Rate Limiting** - Prevent API abuse
4. **Input Validation** - Joi schema validation
5. **MongoDB Injection Protection** - mongo-sanitize
6. **CORS Configuration** - Restricted origins
7. **Helmet Security Headers** - Enhanced HTTP security

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Development

### Project Structure
```
quick-commerce-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── .env.example         # Environment template
├── package.json
└── README.md
```

### Running Tests
```bash
npm test
```

### Code Style
This project uses ESLint for code quality. Run:
```bash
npx eslint src/
```

---

## Deployment

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use production MongoDB URI
- Configure proper CORS origins
- Set appropriate rate limits
- Use strong secrets

### Recommended Services
- **Hosting**: AWS EC2, Google Cloud, DigitalOcean, Heroku
- **Database**: MongoDB Atlas
- **Authentication**: Firebase
- **File Storage**: AWS S3, Cloudinary

---

## License

ISC

---

## Support

For issues or questions, please create an issue in the repository.
#   q u i c k - c o m m e r c e - b a c k e n d  
 