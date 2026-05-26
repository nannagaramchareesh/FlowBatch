import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stage: {
      type: String,
      enum: ['Production', 'QA', 'QC', 'Delivery', 'Done'],
      default: 'Production',
    },
    taskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      }
    ],
    history: [
      {
        stage: { type: String, required: true },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        fileName: { type: String },
        fileUrl: { type: String },
        completedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
