import User from '../models/User.model.js';
import { USER_ROLES } from '../constants/roles.js';
import { hashPassword } from '../utils/hashPassword.js';
import { logger } from '../utils/logger.js';

export const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN });
    if (existingAdmin) {
      logger.info('Admin user already exists. Skipping...');
      return;
    }

    const hashedPw = await hashPassword('Admin@123456');
    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@eventsplatform.com',
      phone: '+923000000000',
      password: hashedPw,
      role: USER_ROLES.ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    logger.info('Admin user seeded successfully. Email: admin@eventsplatform.com');
  } catch (error) {
    logger.error('Error seeding admin:', error.message);
  }
};
