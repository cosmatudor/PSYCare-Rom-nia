import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  getBreakReminderByPsychologist,
  createOrUpdateBreakReminder,
  addStressLevel,
  getStressLevelsByPsychologist,
  getAverageStressLevel,
  getAllProfessionalResources,
  getProfessionalResourcesByCategory,
  createProfessionalResource
} from '../data/psychologistWellbeing.js';

const router = express.Router();

// Break Reminders
router.get('/break-reminder', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can access break reminders' });
    }

    const reminder = getBreakReminderByPsychologist(req.userId!);
    res.json(reminder || { enabled: false });
  } catch (error) {
    console.error('Error fetching break reminder:', error);
    res.status(500).json({ error: 'Failed to fetch break reminder' });
  }
});

router.post('/break-reminder', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can update break reminders' });
    }

    const { enabled, intervalMinutes, startTime, endTime } = req.body;

    if (!intervalMinutes || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reminder = createOrUpdateBreakReminder(req.userId!, {
      enabled: enabled !== false,
      intervalMinutes: Number(intervalMinutes),
      startTime,
      endTime
    });

    res.json(reminder);
  } catch (error) {
    console.error('Error updating break reminder:', error);
    res.status(500).json({ error: 'Failed to update break reminder' });
  }
});

// Stress Levels
router.post('/stress-level', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can add stress levels' });
    }

    const { date, level, notes, factors } = req.body;

    if (!date || level === undefined || level < 1 || level > 10) {
      return res.status(400).json({ error: 'Invalid stress level data' });
    }

    const stressLevel = addStressLevel(req.userId!, {
      date,
      level: Number(level),
      notes,
      factors: Array.isArray(factors) ? factors : factors ? [factors] : []
    });

    res.status(201).json(stressLevel);
  } catch (error) {
    console.error('Error adding stress level:', error);
    res.status(500).json({ error: 'Failed to add stress level' });
  }
});

router.get('/stress-levels', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view stress levels' });
    }

    const days = req.query.days ? Number(req.query.days) : undefined;
    const levels = getStressLevelsByPsychologist(req.userId!, days);
    const average = getAverageStressLevel(req.userId!, days || 7);

    res.json({
      levels,
      average,
      period: days || 'all'
    });
  } catch (error) {
    console.error('Error fetching stress levels:', error);
    res.status(500).json({ error: 'Failed to fetch stress levels' });
  }
});

// Professional Development Resources
router.get('/professional-resources', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view professional resources' });
    }

    const { category } = req.query;
    const resources = category && typeof category === 'string'
      ? getProfessionalResourcesByCategory(category)
      : getAllProfessionalResources();

    res.json(resources);
  } catch (error) {
    console.error('Error fetching professional resources:', error);
    res.status(500).json({ error: 'Failed to fetch professional resources' });
  }
});

router.post('/professional-resources', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can add professional resources' });
    }

    const { title, description, type, category, url, duration, provider, date, cost, language } = req.body;

    if (!title || !description || !type || !category || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const resource = createProfessionalResource({
      title,
      description,
      type,
      category,
      url,
      duration: duration ? Number(duration) : undefined,
      provider,
      date,
      cost,
      language
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating professional resource:', error);
    res.status(500).json({ error: 'Failed to create professional resource' });
  }
});

export default router;
