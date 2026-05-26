import express from 'express';
import { previewUpload, upload } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/preview', upload.single('file'), previewUpload);

export default router;
