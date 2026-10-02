import { Router } from 'express';
import AlertSignal from '../models/AlertSignal.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Fetch signals for user — supports ?level=math_pass|ai_alert
router.get('/signals', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const level = req.query.level as string | undefined;

    const query: Record<string, any> = { userId: req.user!.id };
    
    if (level) {
      query.level = level;
    }

    // For math_pass events, only return last 24 hours to avoid table flooding
    if (level === 'math_pass') {
      query.createdAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    }

    const signals = await AlertSignal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
      
    res.status(200).json(signals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

export default router;
