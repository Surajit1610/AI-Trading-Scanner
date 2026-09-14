import { Router } from 'express';
import UserProfile from '../models/UserProfile.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { addImmediateJob } from '../queues/scannerQueue.js';

const router = Router();

// Get User Profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    let profile = await UserProfile.findOne({ userId });
    
    // Create default profile if not exists
    if (!profile) {
      profile = new UserProfile({ userId });
      await profile.save();
    }
    
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { savedTickers, savedIndicators, preferredTimeframe, preferredBroker, notificationEmail } = req.body;
    
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { savedTickers, savedIndicators, preferredTimeframe, preferredBroker, notificationEmail },
      { new: true, upsert: true }
    );
    
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Trigger immediate test scan
router.post('/scan/trigger', requireAuth, async (req, res) => {
  try {
    await addImmediateJob(req.user!.id);
    res.status(200).json({ message: 'Immediate scan triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger scan' });
  }
});

export default router;
