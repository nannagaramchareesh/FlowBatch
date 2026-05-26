import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workflow_db');
    console.log('Connected to MongoDB database...');

    const email = 'cherry@gmail.com';
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`User with email ${email} already exists. Updating to admin roles and password...`);
      existingUser.password = 'cherry@123';
      existingUser.role = 'admin';
      existingUser.roles = ['admin'];
      await existingUser.save();
      console.log('Admin account updated successfully.');
    } else {
      const adminUser = new User({
        name: 'Cherry',
        email: email,
        password: 'cherry@123',
        role: 'admin',
        roles: ['admin']
      });

      await adminUser.save();
      console.log('New admin account created successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
