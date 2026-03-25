require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');
const permissionService = require('./features/permission/service');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Initialize permissions
permissionService.initializePermissions()
  .then(() => logger.info('Permissions initialized'))
  .catch(err => logger.error(`Permission initialization failed: ${err.message}`));

// Connect to Redis (optional)
if (process.env.REDIS_HOST) {
  connectRedis()
    .then(() => logger.info('Redis connected successfully'))
    .catch(err => {
      logger.warn(`Redis connection failed: ${err.message}`);
      logger.warn('Continuing without Redis cache...');
    });
} else {
  logger.info('Redis disabled - running without cache');
}

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`Deployment mode: ${process.env.DEPLOYMENT_MODE || 'saas'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});
