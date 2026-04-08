import express from 'express';
import { loginStudent, registerStudent, loginAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginStudent);
router.post('/register', registerStudent); // Optional, for seeding or self-reg
router.post('/admin/login', loginAdmin);

export default router;
