import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.route('/').get(getAnalytics);

export default router;
