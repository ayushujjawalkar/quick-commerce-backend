
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const compression = require('compression');
// const mongoSanitize = require('express-mongo-sanitize');
// const rateLimit = require('express-rate-limit');
// const dotenv = require('dotenv');

// // Load env vars
// dotenv.config();

// // Import routes
// const authRoutes = require('./routes/authRoutes');
// const shopRoutes = require('./routes/shopRoutes');
// const productRoutes = require('./routes/productRoutes');
// const cartRoutes = require('./routes/cartRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// const adminUserRoutes = require('./routes/adminUserRoutes'); // ✅ ADD THIS

// // Import middleware
// const { errorHandler, notFound } = require('./middleware/errorHandler');

// const app = express();

// // Security middleware
// app.use(helmet());

// // CORS
// const corsOptions = {
//   origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
//   credentials: true,
//   optionsSuccessStatus: 200
// };
// app.use(cors(corsOptions));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api/', limiter);

// // Body parser
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Data sanitization
// app.use(mongoSanitize());

// // Compression
// app.use(compression());

// // Health check
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is running',
//     timestamp: new Date().toISOString()
//   });
// });

// app.get("/", (req, res) => {
//   res.send("Quick Commerce Backend is running 🚀");
// });

// // API routes
// app.use('/api/auth', authRoutes);
// app.use('/api/shops', shopRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/cart', cartRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/admin', adminUserRoutes); // ✅ ADD THIS LINE

// // 404 handler
// app.use(notFound);

// // Error handler
// app.use(errorHandler);

// module.exports = app;




const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes'); // ✅ ADDED: Delivery Routes Import

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization
app.use(mongoSanitize());

// Compression
app.use(compression());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.send("Quick Commerce Backend is running 🚀");
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminUserRoutes); 
app.use('/api/delivery', deliveryRoutes); // ✅ ADDED: Register Delivery Routes

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;