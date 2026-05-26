import Batch from '../models/Batch.js';
import Task from '../models/Task.js';
import crypto from 'crypto';

// @desc    Get all batches
// @route   GET /api/batches
// @access  Public
export const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({})
      .populate('taskIds')
      .populate('history.assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new batch from selected tasks
// @route   POST /api/batches
// @access  Public
export const createBatch = async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'No tasks provided for batch' });
    }

    // Ensure none of the tasks are already batched
    const existingTasks = await Task.find({ _id: { $in: taskIds } });
    const alreadyBatched = existingTasks.some(t => t.batchId);
    if (alreadyBatched) {
      return res.status(400).json({ message: 'One or more tasks are already assigned to a batch.' });
    }

    // Generate a short unique ID for the batch
    const batchIdStr = `BATCH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create the batch. For a placeholder createdBy, we'll use a dummy ObjectId if req.user isn't set, 
    // but the schema requires createdBy. Let's find the first user in DB or use a dummy.
    // In a real app with auth middleware, req.user._id would be used.
    let createdBy = '605c72ef1f2b2a1a1c8b4567'; // fallback dummy ID
    if (req.user) {
      createdBy = req.user._id;
    } else {
      const User = (await import('../models/User.js')).default;
      const admin = await User.findOne({ role: 'admin' }) || await User.findOne({});
      if (admin) createdBy = admin._id;
    }

    const batch = new Batch({
      batchId: batchIdStr,
      createdBy,
      stage: 'Production', // Default next stage
      taskIds,
    });

    const createdBatch = await batch.save();

    // Update all tasks to belong to this batch, and optionally move them to Production
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { 
        $set: { 
          batchId: createdBatch._id,
          currentStage: 'Production' 
        } 
      }
    );

    // Also update history for those tasks (updateMany doesn't trigger pre('save'))
    // But for simplicity of this demo, we can just leave it or trigger it manually.
    for (const t of existingTasks) {
      t.batchId = createdBatch._id;
      t.currentStage = 'Production';
      await t.save(); // This triggers the pre('save') middleware to push to stageHistory!
    }

    res.status(201).json(createdBatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating batch' });
  }
};

// @desc    Assign a batch to a user
// @route   PUT /api/batches/:id/assign
// @access  Public
export const assignBatch = async (req, res) => {
  try {
    const { userId } = req.body;
    const batchId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required for assignment' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    batch.assignedTo = userId;
    const updatedBatch = await batch.save();

    // Update all tasks in this batch
    const tasks = await Task.find({ batchId: batch._id });
    for (const t of tasks) {
      t.assignedTo = userId;
      t.status = 'Pending';
      // Do not change the stage here, it preserves whatever stage it is in (Production, QA, QC, Delivery)
      await t.save();
    }

    res.json(updatedBatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error assigning batch' });
  }
};

// @desc    Advance a batch to the next stage
// @route   PUT /api/batches/:id/advance
// @access  Public
export const advanceBatchStage = async (req, res) => {
  try {
    const batchId = req.params.id;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const tasks = await Task.find({ batchId: batch._id });
    
    // Check if all tasks are completed
    const allCompleted = tasks.every(t => t.status === 'Completed');
    if (!allCompleted) {
      return res.status(400).json({ message: 'All tasks must be marked as Completed before advancing the batch' });
    }

    const stages = ['Production', 'QC', 'QA', 'Delivery', 'Done'];
    const currentIndex = stages.indexOf(batch.stage);
    
    if (currentIndex === -1 || currentIndex >= stages.length - 1) {
      return res.status(400).json({ message: 'Batch cannot be advanced further' });
    }
    
    const nextStage = stages[currentIndex + 1];

    // Log the current stage completion into history before advancing
    const historyEntry = {
      stage: batch.stage,
      assignedTo: batch.assignedTo,
      completedAt: new Date()
    };
    
    // Clear out fileName and fileUrl from any previous history entries for this exact stage
    // to ensure only the latest Excel file for a stage is kept available.
    batch.history.forEach(entry => {
      if (entry.stage === batch.stage) {
        entry.fileName = undefined;
        entry.fileUrl = undefined;
      }
    });
    
    // Add file details if uploaded
    if (req.file) {
      historyEntry.fileName = req.file.originalname;
      historyEntry.fileUrl = `/uploads/${req.file.filename}`;
    }
    
    batch.history.push(historyEntry);

    // Check if this batch is being resubmitted back to a user who previously rejected it
    let stickyAssignee = null;
    const returnStageString = `${nextStage} (Returned)`;
    for (let i = batch.history.length - 1; i >= 0; i--) {
      if (batch.history[i].stage === returnStageString) {
        stickyAssignee = batch.history[i].assignedTo;
        break;
      }
    }

    // Update batch stage
    batch.stage = nextStage;
    const updatedBatch = await batch.save();

    // Update all tasks to next stage and reset status to Pending for the next user
    for (const t of tasks) {
      if (nextStage === 'Done') {
        t.status = 'Completed';
      } else {
        t.status = 'Pending';
      }
      t.currentStage = nextStage;
      t.assignedTo = stickyAssignee;
      await t.save();
    }
    
    // Also unassign or sticky-assign the batch
    updatedBatch.assignedTo = stickyAssignee;
    await updatedBatch.save();

    res.json(updatedBatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error advancing batch stage' });
  }
};

// @desc    Return a batch to the previous stage
// @route   PUT /api/batches/:id/return
// @access  Public
export const returnBatchStage = async (req, res) => {
  try {
    const batchId = req.params.id;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const stages = ['Production', 'QC', 'QA', 'Delivery', 'Done'];
    const currentIndex = stages.indexOf(batch.stage);
    
    if (currentIndex <= 0 || currentIndex >= stages.length - 1) {
      return res.status(400).json({ message: 'Batch cannot be returned from this stage' });
    }
    
    const previousStage = stages[currentIndex - 1];

    // Find the most recent assignee for the previous stage from history
    let previousAssignee = null;
    if (batch.history && batch.history.length > 0) {
      // Search backwards through history
      for (let i = batch.history.length - 1; i >= 0; i--) {
        if (batch.history[i].stage === previousStage) {
          previousAssignee = batch.history[i].assignedTo;
          break;
        }
      }
    }

    // Log the return action in history so the audit trail shows the rejection
    const historyEntry = {
      stage: `${batch.stage} (Returned)`,
      assignedTo: batch.assignedTo,
      completedAt: new Date()
    };
    
    // Clear out any previous Return files for this specific return stage
    batch.history.forEach(entry => {
      if (entry.stage === historyEntry.stage) {
        entry.fileName = undefined;
        entry.fileUrl = undefined;
      }
    });

    if (req.file) {
      historyEntry.fileName = req.file.originalname;
      historyEntry.fileUrl = `/uploads/${req.file.filename}`;
    }

    batch.history.push(historyEntry);

    // Update batch stage and assignment
    batch.stage = previousStage;
    batch.assignedTo = previousAssignee;
    const updatedBatch = await batch.save();

    // Update all tasks to previous stage and reset status to Pending
    const tasks = await Task.find({ batchId: batch._id });
    for (const t of tasks) {
      t.status = 'Pending';
      t.currentStage = previousStage;
      t.assignedTo = previousAssignee;
      await t.save();
    }

    res.json(updatedBatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error returning batch stage' });
  }
};

// @desc    Admin explicitly marks a Delivery batch as Done
// @route   PUT /api/batches/:id/force-deliver
// @access  Public (Should be Admin)
export const forceDeliverBatch = async (req, res) => {
  try {
    const batchId = req.params.id;
    const batch = await Batch.findById(batchId);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    if (batch.stage !== 'Delivery') {
      return res.status(400).json({ message: 'Only batches in Delivery stage can be force-delivered' });
    }

    // Log Delivery stage completion in history
    const historyEntry = {
      stage: batch.stage,
      assignedTo: req.user ? req.user._id : null, // Admin user
      completedAt: new Date()
    };
    
    if (req.file) {
      historyEntry.fileName = req.file.originalname;
      historyEntry.fileUrl = `/uploads/${req.file.filename}`;
    }
    
    batch.history.push(historyEntry);

    batch.stage = 'Done';
    batch.assignedTo = null;
    const updatedBatch = await batch.save();

    // Mark all tasks as Completed and stage Done
    const tasks = await Task.find({ batchId: batch._id });
    for (const t of tasks) {
      t.status = 'Completed';
      t.currentStage = 'Done';
      t.assignedTo = null;
      await t.save();
    }

    res.json(updatedBatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error force delivering batch' });
  }
};
