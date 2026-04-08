import express from 'express';
import { getAllStudents, deleteStudent, refreshAllStudents } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/students', protect, admin, getAllStudents);
router.delete('/students/:id', protect, admin, deleteStudent);
router.post('/refresh', protect, admin, refreshAllStudents);

export default router;
