import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedCategories } from './categories.seed.js';
import { seedAdmin } from './admin.seed.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runSeeds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding.');

    await seedCategories();
    await seedAdmin();

    logger.info('All seeds completed.');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

runSeeds();
