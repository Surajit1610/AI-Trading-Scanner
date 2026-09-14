import { Router } from 'express';
import AlertSignal from '../models/AlertSignal.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Fetch recent signals for user
router.get('/signals', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const signals = await AlertSignal.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(limit);
      
    res.status(200).json(signals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

export default router;
