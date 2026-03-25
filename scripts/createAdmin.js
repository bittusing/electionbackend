require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/features/auth/model');

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create Super Admin (without organizationId since multi-tenant is disabled)
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      phone: '9999999999',
      password: 'admin123',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@example.com');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nYou can now login at: http://localhost:3000');

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error creating admin: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();
