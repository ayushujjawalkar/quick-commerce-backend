const app = require('./app');
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Initialize Firebase
initializeFirebase();

// Start server
const server = app.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   Quick Commerce Backend Server                      ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
    ║   Port: ${PORT}                                          ║
    ║   Time: ${new Date().toLocaleString()}               ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});
