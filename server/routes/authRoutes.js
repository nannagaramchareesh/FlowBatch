import express from 'express';
import { authUser, registerUser, getUsers, createUser, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/users').get(getUsers).post(createUser);
router.route('/profile').put(protect, updateProfile);

export default router;
