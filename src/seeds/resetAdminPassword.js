import mongoose from 'mongoose';
import User from '../models/User.model.js';
import { USER_ROLES } from '../constants/roles.js';
import { hashPassword } from '../utils/hashPassword.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const password = 'Admin@123456';
    const hashedPw = await hashPassword(password);

    // Delete existing admin if any
    await User.deleteMany({ role: USER_ROLES.ADMIN });

    // Create new admin
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@eventsplatform.com',
      password: hashedPw,
      phone: '+923000000000',
      role: USER_ROLES.ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    console.log('Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', password);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
