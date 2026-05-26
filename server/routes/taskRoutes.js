import express from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { batchCreateTasks } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Batch create route MUST be before /:id so it doesn't get caught as an ID
router.post('/batch', batchCreateTasks);

// Currently applying 'protect' placeholder middleware to these routes if needed, 
// but for ease of initial testing, they are public.
// Uncomment the 'protect' middleware to secure routes.
router.route('/').get(getTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);

export default router;
