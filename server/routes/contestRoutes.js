import express from 'express';
import { getUpcomingContests, getLeetCodeContests } from '../controllers/contestController.js';

const router = express.Router();

router.get('/', getUpcomingContests);
router.get('/leetcode', getLeetCodeContests);

export default router;
