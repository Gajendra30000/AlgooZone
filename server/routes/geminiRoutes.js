
import express from 'express';
import { analyzeProgress, reviewCode } from '../controllers/geminiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/gemini/analyze-progress
router.post('/analyze-progress', protect, analyzeProgress);

// POST /api/gemini/review-code
router.post('/review-code', protect, reviewCode);

export default router;
