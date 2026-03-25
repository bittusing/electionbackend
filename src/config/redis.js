const redis = require('redis');
const logger = require('./logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        connectTimeout: 5000,
        reconnectStrategy: false // Don't retry if connection fails
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Client Error: ${err.message}`);
      redisClient = null;
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    redisClient = null;
    throw error;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
