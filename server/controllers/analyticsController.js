import Batch from '../models/Batch.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

export const getAnalytics = async (req, res) => {
  try {
    const totalBatches = await Batch.countDocuments();
    const totalTasks = await Task.countDocuments();

    // Bottlenecks: Batches grouped by stage
    const bottlenecks = await Batch.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Format bottlenecks for Recharts
    const bottlenecksData = bottlenecks.map(b => ({
      stage: b._id,
      count: b.count
    }));

    // Speed: Average completion time for 'Done' batches
    const doneBatches = await Batch.find({ stage: 'Done' });
    let totalCompletionTimeMs = 0;
    
    doneBatches.forEach(batch => {
      totalCompletionTimeMs += (batch.updatedAt - batch.createdAt);
    });
    
    const avgCompletionTimeMs = doneBatches.length > 0 ? (totalCompletionTimeMs / doneBatches.length) : 0;
    // Convert to hours
    const avgCompletionHours = (avgCompletionTimeMs / (1000 * 60 * 60)).toFixed(2);

    // User Productivity: Count batches completed by each user from history
    // Unwind history, group by assignedTo, lookup user details
    const productivity = await Batch.aggregate([
      { $unwind: '$history' },
      { $group: { _id: '$history.assignedTo', completedBatches: { $sum: 1 } } },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
      }},
      { $unwind: '$user' },
      { $project: {
          name: '$user.name',
          completedBatches: 1
      }},
      { $sort: { completedBatches: -1 } },
      { $limit: 10 } // Top 10 users
    ]);

    res.json({
      summary: {
        totalBatches,
        totalTasks,
        avgCompletionHours,
        doneCount: doneBatches.length
      },
      bottlenecks: bottlenecksData,
      productivity
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error generating analytics' });
  }
};
