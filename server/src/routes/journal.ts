import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createJournalEntry, getJournalEntriesByPatient } from '../data/journal.js';
import { getUsers } from '../data/users.js';

const router = express.Router();

// Create journal entry
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { mood, anxiety, sleep, stress, text, audioUrl, emojis, emotions, automaticThoughts } = req.body;
    
    if (!req.userId || req.userRole !== 'patient') {
      return res.status(403).json({ error: 'Only patients can create journal entries' });
    }

    if (mood === undefined || mood < 0 || mood > 10) {
      return res.status(400).json({ error: 'Mood must be between 0 and 10' });
    }

    if (anxiety !== undefined && (anxiety < 0 || anxiety > 10)) {
      return res.status(400).json({ error: 'Anxiety must be between 0 and 10' });
    }

    if (sleep !== undefined && (sleep < 0 || sleep > 24)) {
      return res.status(400).json({ error: 'Sleep must be between 0 and 24 hours' });
    }

    if (stress !== undefined && (stress < 0 || stress > 10)) {
      return res.status(400).json({ error: 'Stress must be between 0 and 10' });
    }

    const entry = createJournalEntry({
      patientId: req.userId,
      date: new Date().toISOString().split('T')[0],
      mood,
      anxiety,
      sleep,
      stress,
      text,
      audioUrl,
      emojis,
      emotions,
      automaticThoughts
    });

    // Check for immediate crisis indicators and return alert flag
    const suicideKeywords = ['suicid', 'mă sinucid', 'vreau să mor', 'nu mai vreau să trăiesc', 'să mă omor', 'să-mi iau viața', 'nu mai am putere', 'nu mai are sens'];
    const textContent = (text || '').toLowerCase();
    const hasSuicideKeywords = suicideKeywords.some(keyword => textContent.includes(keyword));
    const veryLowMood = mood <= 1;
    const extremeAnxiety = anxiety !== undefined && anxiety !== null && anxiety >= 9;
    const extremeStress = stress !== undefined && stress !== null && stress >= 9;
    
    const isCritical = hasSuicideKeywords || (veryLowMood && (extremeAnxiety || extremeStress));
    
    res.status(201).json({
      ...entry,
      alertFlag: isCritical ? 'critical' : (mood <= 2 ? 'high' : null)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// Get patient's journal entries
router.get('/patient/:patientId', async (req: AuthRequest, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if user is psychologist viewing their patient, or patient viewing own entries
    if (req.userRole === 'psychologist') {
      const users = getUsers();
      const patient = users.find(u => u.id === patientId);
      if (patient?.psychologistId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userId !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const entries = getJournalEntriesByPatient(patientId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Get own journal entries
router.get('/me', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || req.userRole !== 'patient') {
      return res.status(403).json({ error: 'Only patients can view their journal' });
    }

    const entries = getJournalEntriesByPatient(req.userId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

export default router;

