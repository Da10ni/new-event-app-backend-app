import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongo.uri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};
