import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { getUsers } from '../data/users.js';
import { getJournalEntriesByPatient } from '../data/journal.js';
import { getAppointmentsByPatient } from '../data/appointments.js';

const router = express.Router();

// Helper function to get week number and year from date
function getWeekNumber(date: Date): { week: number; year: number; startDate: string; endDate: string } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  // Calculate start and end of week (Monday to Sunday)
  const startDate = new Date(d);
  startDate.setUTCDate(d.getUTCDate() - 3); // Monday
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6); // Sunday
  
  return {
    week,
    year: d.getUTCFullYear(),
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Get patient progress (for psychologist)
router.get('/:patientId/progress', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view patient progress' });
    }

    const { patientId } = req.params;
    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const journalEntries = getJournalEntriesByPatient(patientId);
    const appointments = getAppointmentsByPatient(patientId);

    // Calculate trends for all metrics
    const moodData = journalEntries.map(e => ({
      date: e.date,
      mood: e.mood,
      anxiety: e.anxiety ?? null,
      sleep: e.sleep ?? null,
      stress: e.stress ?? null
    }));

    // Calculate weekly reports
    const weeklyReports: any[] = [];
    const entriesByWeek = new Map<string, any[]>();
    
    journalEntries.forEach(entry => {
      const weekInfo = getWeekNumber(new Date(entry.date));
      const weekKey = `${weekInfo.year}-W${weekInfo.week}`;
      
      if (!entriesByWeek.has(weekKey)) {
        entriesByWeek.set(weekKey, []);
      }
      entriesByWeek.get(weekKey)!.push(entry);
    });
    
    // Process each week
    entriesByWeek.forEach((entries, weekKey) => {
      const weekEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstEntry = weekEntries[0];
      const weekInfo = getWeekNumber(new Date(firstEntry.date));
      
      const moods = weekEntries.map(e => e.mood).filter(m => m !== undefined);
      const anxieties = weekEntries.map(e => e.anxiety).filter(a => a !== undefined && a !== null);
      const sleeps = weekEntries.map(e => e.sleep).filter(s => s !== undefined && s !== null);
      const stresses = weekEntries.map(e => e.stress).filter(s => s !== undefined && s !== null);
      
      weeklyReports.push({
        week: weekInfo.week,
        year: weekInfo.year,
        weekKey,
        startDate: weekInfo.startDate,
        endDate: weekInfo.endDate,
        entriesCount: weekEntries.length,
        avgMood: moods.length > 0 ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(2) : null,
        avgAnxiety: anxieties.length > 0 ? (anxieties.reduce((a, b) => a + b, 0) / anxieties.length).toFixed(2) : null,
        avgSleep: sleeps.length > 0 ? (sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(2) : null,
        avgStress: stresses.length > 0 ? (stresses.reduce((a, b) => a + b, 0) / stresses.length).toFixed(2) : null,
        minMood: moods.length > 0 ? Math.min(...moods) : null,
        maxMood: moods.length > 0 ? Math.max(...moods) : null,
        entries: weekEntries
      });
    });
    
    // Sort by date (newest first)
    weeklyReports.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email
      },
      moodData,
      totalEntries: journalEntries.length,
      totalAppointments: appointments.length,
      recentEntries: journalEntries.slice(-7),
      weeklyReports
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient progress' });
  }
});

// Get all patients for psychologist
router.get('/my-patients', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view their patients' });
    }

    const users = getUsers();
    const patients = users.filter(u => u.role === 'patient' && u.psychologistId === req.userId);

    res.json(patients.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      createdAt: p.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

export default router;

