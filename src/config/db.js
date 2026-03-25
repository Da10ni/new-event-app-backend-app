import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let cached = null;

export const connectDB = async () => {
  if (cached) {
    return cached;
  }

  try {
    const conn = await mongoose.connect(config.mongo.uri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    cached = conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};
