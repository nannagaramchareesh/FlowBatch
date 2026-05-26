import express from 'express';
import { getBatches, createBatch, assignBatch, advanceBatchStage, forceDeliverBatch, returnBatchStage } from '../controllers/batchController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/').get(getBatches).post(createBatch);
router.route('/:id/assign').put(assignBatch);
router.route('/:id/advance').put(upload.single('file'), advanceBatchStage);
router.route('/:id/return').put(upload.single('file'), returnBatchStage);
router.route('/:id/force-deliver').put(upload.single('file'), forceDeliverBatch);

export default router;
