import { Router } from 'express';
import AlarmTimer from '../models/AlarmTimer.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { addAlarmJob, removeAlarmJob } from '../queues/scannerQueue.js';

const router = Router();

// Get all alarms for user
router.get('/alarms', requireAuth, async (req, res) => {
  try {
    const alarms = await AlarmTimer.find({ userId: req.user!.id }).sort({ time: 1 });
    res.status(200).json(alarms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alarms' });
  }
});

// Create an alarm
router.post('/alarms', requireAuth, async (req, res) => {
  try {
    const { time } = req.body; // e.g. "09:30"
    const userId = req.user!.id;
    
    const alarm = new AlarmTimer({ userId, time, isActive: true });
    await alarm.save();
    
    // Add to BullMQ
    const [hour, minute] = time.split(':');
    const cron = `${minute} ${hour} * * *`;
    await addAlarmJob(alarm._id.toString(), userId, cron);
    
    res.status(201).json(alarm);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create alarm' });
  }
});

// Toggle alarm active state
router.put('/alarms/:id', requireAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const alarm = await AlarmTimer.findById(req.params.id);
    
    if (!alarm || alarm.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    
    alarm.isActive = isActive;
    await alarm.save();
    
    if (isActive) {
      const [hour, minute] = alarm.time.split(':');
      const cron = `${minute} ${hour} * * *`;
      await addAlarmJob(alarm._id.toString(), req.user!.id, cron);
    } else {
      await removeAlarmJob(alarm._id.toString());
    }
    
    res.status(200).json(alarm);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alarm' });
  }
});

// Delete an alarm
router.delete('/alarms/:id', requireAuth, async (req, res) => {
  try {
    const alarm = await AlarmTimer.findById(req.params.id);
    if (!alarm || alarm.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    await alarm.deleteOne();
    
    await removeAlarmJob(alarm._id.toString());
    res.status(200).json({ message: 'Alarm deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alarm' });
  }
});

export default router;
