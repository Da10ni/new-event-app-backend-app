import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://localhost:27017/events_platform';

async function fixAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // New password
    const newPassword = 'Admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update ALL admin users with new password
    const result = await usersCollection.updateMany(
      { role: 'admin' },
      {
        $set: {
          password: hashedPassword,
          isActive: true,
          isEmailVerified: true
        }
      }
    );

    console.log('Updated', result.modifiedCount, 'admin users');

    // List all admins
    const admins = await usersCollection.find({ role: 'admin' }).toArray();
    console.log('\n=== ADMIN USERS ===');
    admins.forEach(admin => {
      console.log(`Email: ${admin.email}`);
    });

    console.log('\n========================================');
    console.log('NEW PASSWORD FOR ALL ADMINS: Admin123');
    console.log('========================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdmin();
