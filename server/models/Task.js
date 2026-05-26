import mongoose from 'mongoose';

const stageHistorySchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['Inventory', 'Production', 'QC', 'QA', 'Delivery', 'Done'],
    required: true,
  },
  enteredAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
  }
}, { _id: false });

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    documentName: {
      type: String,
    },
    receivedDate: {
      type: Date,
    },
    receivedFrom: {
      type: String,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
      default: 'Pending',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    currentStage: {
      type: String,
      enum: ['Inventory', 'Production', 'QC', 'QA', 'Delivery', 'Done'],
      default: 'Inventory',
    },
    stageHistory: [stageHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Middleware to automatically record stage history when a new task is created
taskSchema.pre('save', function () {
  if (this.isNew) {
    this.stageHistory.push({
      stage: this.currentStage,
      enteredAt: new Date(),
    });
  } else if (this.isModified('currentStage')) {
    // If the stage was modified, we push to history. 
    // Ideally, updatedBy should be passed in by the controller when modifying.
    this.stageHistory.push({
      stage: this.currentStage,
      enteredAt: new Date(),
    });
  }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
