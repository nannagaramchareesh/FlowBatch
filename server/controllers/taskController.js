import Task from '../models/Task.js';

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({}).populate('batchId', 'batchId stage');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Public
export const createTask = async (req, res) => {
  try {
    const { title, description, stage } = req.body;

    const task = new Task({
      title,
      description,
      stage: stage || 'Production',
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(400).json({ message: 'Invalid task data' });
  }
};

// @desc    Update a task (move between stages)
// @route   PUT /api/tasks/:id
// @access  Public
export const updateTask = async (req, res) => {
  try {
    const { title, description, stage, status } = req.body;

    const task = await Task.findById(req.params.id);

    if (task) {
      task.title = title || task.title;
      task.description = description || task.description;
      
      // Update stage if provided
      if (stage && stage !== task.currentStage) {
        task.currentStage = stage;
      }
      
      // Update status if provided
      if (status) {
        task.status = status;
      }

      const updatedTask = await task.save();
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating task' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Public
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (task) {
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
};
