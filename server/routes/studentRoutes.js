import express from 'express';
import { getStudentProfile, getLeaderboard, getStudentById } from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getStudentProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', protect, getStudentById); // :id must be last to avoid catching specific paths

export default router;
