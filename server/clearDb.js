import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workflow_db');
    console.log('Connected to MongoDB database...');

    // Clear collections
    const tasksResult = await mongoose.connection.db.collection('tasks').deleteMany({});
    console.log(`Cleared ${tasksResult.deletedCount} tasks.`);

    const batchesResult = await mongoose.connection.db.collection('batches').deleteMany({});
    console.log(`Cleared ${batchesResult.deletedCount} batches.`);

    console.log('Database tasks and batches cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearData();
