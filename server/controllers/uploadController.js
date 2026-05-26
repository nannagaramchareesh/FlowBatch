import multer from 'multer';
import xlsx from 'xlsx';
import Task from '../models/Task.js';

// Setup multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// @desc    Upload Excel and parse for preview
// @route   POST /api/upload/preview
// @access  Public (should be Admin in prod)
export const previewUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    // Expected headers roughly: "document name", "received date", "received from"
    const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    // Validate and format data
    const previewData = data.map((row, index) => {
      // Try to intelligently map the keys ignoring case/spaces
      const keys = Object.keys(row);
      const getVal = (possibleNames) => {
        const foundKey = keys.find(k => possibleNames.some(p => k.toLowerCase().includes(p)));
        return foundKey ? row[foundKey] : '';
      };

      const documentName = getVal(['document', 'name', 'title']);
      const receivedDateStr = getVal(['date', 'received date']);
      const receivedFrom = getVal(['from', 'received from', 'sender']);

      // Convert Excel date serial to JS Date if necessary, or parse string
      let receivedDate = receivedDateStr;
      if (typeof receivedDateStr === 'number') {
        receivedDate = new Date(Math.round((receivedDateStr - 25569) * 86400 * 1000)).toISOString().split('T')[0];
      } else if (receivedDateStr) {
        // Try to parse string to ensure it's a valid date
        const parsedDate = new Date(receivedDateStr);
        if (isNaN(parsedDate.getTime())) {
          receivedDate = null; // Mark invalid so it fails validation
        } else {
          receivedDate = parsedDate.toISOString().split('T')[0];
        }
      }

      const isValid = !!documentName && !!receivedDate && !!receivedFrom;
      const errors = [];
      if (!documentName) errors.push('Missing Document Name');
      if (!receivedDateStr) {
        errors.push('Missing Received Date');
      } else if (!receivedDate) {
        errors.push('Invalid Date Format');
      }
      if (!receivedFrom) errors.push('Missing Received From');

      return {
        id: index,
        title: documentName || 'Untitled Document', // Map to title for UI compatibility
        documentName,
        receivedDate,
        receivedFrom,
        isValid,
        errors
      };
    });

    res.json(previewData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing Excel file' });
  }
};

// @desc    Confirm upload and batch insert tasks
// @route   POST /api/tasks/batch
// @access  Public (should be Admin)
export const batchCreateTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'No tasks provided' });
    }

    const tasksToInsert = tasks.map(t => ({
      title: t.title,
      documentName: t.documentName,
      receivedDate: new Date(t.receivedDate),
      receivedFrom: t.receivedFrom,
      currentStage: 'Inventory',
      stageHistory: [{ stage: 'Inventory', enteredAt: new Date() }]
    }));

    const insertedTasks = await Task.insertMany(tasksToInsert);
    res.status(201).json({ message: `Successfully imported ${insertedTasks.length} tasks`, insertedCount: insertedTasks.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error importing tasks' });
  }
};
