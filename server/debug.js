import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workflow_db').then(async () => {
  const db = mongoose.connection.db;
  const batches = await db.collection('batches').find({}).toArray();
  const users = await db.collection('users').find({}).toArray();
  const tasks = await db.collection('tasks').find({}).toArray();
  
  console.log('--- BATCHES ---');
  batches.forEach(b => {
    console.log(`Batch ${b.batchId} | Stage: ${b.stage} | AssignedTo: ${b.assignedTo}`);
  });
  
  console.log('\n--- USERS ---');
  users.forEach(u => {
    console.log(`User ${u.name} | Roles: ${JSON.stringify(u.roles)} | Legacy Role: ${u.role} | ID: ${u._id}`);
  });
  
  console.log('\n--- TASKS ---');
  tasks.forEach(t => {
    if (t.batchId) {
      console.log(`Task ${t.title} | Stage: ${t.currentStage} | Status: ${t.status} | AssignedTo: ${t.assignedTo}`);
    }
  });

  process.exit(0);
});
