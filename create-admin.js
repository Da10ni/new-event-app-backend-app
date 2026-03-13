import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://localhost:27017/events_platform';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    // Get the users collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check existing admin users
    console.log('=== EXISTING ADMIN USERS ===');
    const admins = await usersCollection.find({ role: 'admin' }).toArray();
    console.log('Found', admins.length, 'admin users:');
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (active: ${admin.isActive}, verified: ${admin.isEmailVerified})`);
    });

    // Delete old newadmin if exists
    await usersCollection.deleteOne({ email: 'newadmin@eventsplatform.com' });

    // Create new admin with proper password hash
    const password = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@events.com',
      phone: '+923009999999',
      password: hashedPassword,
      role: 'admin',
      avatar: { url: '', publicId: '' },
      isEmailVerified: true,
      isPhoneVerified: false,
      isActive: true,
      fcmTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Delete if already exists
    await usersCollection.deleteOne({ email: newAdmin.email });

    // Insert new admin
    const result = await usersCollection.insertOne(newAdmin);

    console.log('\n========================================');
    console.log('   NEW ADMIN CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log('Email:    superadmin@events.com');
    console.log('Password: Admin@123456');
    console.log('========================================\n');

    // Verify it was created
    const verify = await usersCollection.findOne({ email: 'superadmin@events.com' });
    console.log('Verification - User exists:', !!verify);
    console.log('Role:', verify?.role);
    console.log('isActive:', verify?.isActive);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
