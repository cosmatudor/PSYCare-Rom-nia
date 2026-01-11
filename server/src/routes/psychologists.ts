import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { getUsers } from '../data/users.js';
import { getJournalEntriesByPatient } from '../data/journal.js';
import { getAppointmentsByPsychologist } from '../data/appointments.js';

const router = express.Router();

// Get psychologist dashboard
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can access dashboard' });
    }

    const users = getUsers();
    const patients = users.filter(u => u.role === 'patient' && u.psychologistId === req.userId);
    const appointments = getAppointmentsByPsychologist(req.userId!);

    // Check for crisis alerts with multiple severity levels
    const crisisAlerts: any[] = [];
    const suicideKeywords = ['suicid', 'mă sinucid', 'vreau să mor', 'nu mai vreau să trăiesc', 'să mă omor', 'să-mi iau viața', 'nu mai am putere', 'nu mai are sens'];
    
    for (const patient of patients) {
      const entries = getJournalEntriesByPatient(patient.id);
      const recentEntries = entries.filter(e => {
        const entryDate = new Date(e.date);
        const daysDiff = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (recentEntries.length === 0) continue;
      
      const lastEntry = recentEntries[0];
      const textContent = (lastEntry.text || '').toLowerCase();
      
      // Check for suicide risk indicators
      const hasSuicideKeywords = suicideKeywords.some(keyword => textContent.includes(keyword));
      const veryLowMood = lastEntry.mood !== undefined && lastEntry.mood <= 1;
      const extremeAnxiety = lastEntry.anxiety !== undefined && lastEntry.anxiety >= 9;
      const extremeStress = lastEntry.stress !== undefined && lastEntry.stress >= 9;
      
      // Check for rapid deterioration
      const lowMoodEntries = recentEntries.filter(e => e.mood !== undefined && e.mood <= 3);
      const consecutiveLowMood = recentEntries.slice(0, 3).every(e => e.mood !== undefined && e.mood <= 3);
      const moodDecline = recentEntries.length >= 2 && 
        recentEntries[0].mood !== undefined && recentEntries[1].mood !== undefined &&
        recentEntries[0].mood < recentEntries[1].mood - 3;
      
      let severity = 'low';
      let alertType = 'agravare';
      let reasons: string[] = [];
      
      // Critical: Suicide risk
      if (hasSuicideKeywords || (veryLowMood && (extremeAnxiety || extremeStress))) {
        severity = 'critical';
        alertType = 'risc_suicidar';
        if (hasSuicideKeywords) reasons.push('Mențiuni despre suicid în jurnal');
        if (veryLowMood) reasons.push('Stare de spirit extrem de scăzută (0-1/10)');
        if (extremeAnxiety) reasons.push('Anxietate extremă (9-10/10)');
        if (extremeStress) reasons.push('Stres extrem (9-10/10)');
      }
      // High: Multiple critical indicators
      else if (veryLowMood || (lowMoodEntries.length >= 3 && consecutiveLowMood) || moodDecline) {
        severity = 'high';
        alertType = 'agravare';
        if (veryLowMood) reasons.push('Stare de spirit foarte scăzută (0-1/10)');
        if (consecutiveLowMood) reasons.push('Stări scăzute consecutive');
        if (moodDecline) reasons.push('Deteriorare rapidă a stării');
        if (lowMoodEntries.length >= 3) reasons.push(`${lowMoodEntries.length} intrări cu stări scăzute în ultimele 7 zile`);
      }
      // Medium: Some concerning patterns
      else if (lowMoodEntries.length >= 2) {
        severity = 'medium';
        alertType = 'agravare';
        reasons.push(`${lowMoodEntries.length} intrări cu stări scăzute în ultimele 7 zile`);
      }
      
      if (severity !== 'low') {
        crisisAlerts.push({
          patientId: patient.id,
          patientName: patient.name,
          severity,
          alertType,
          reasons,
          recentLowMoodEntries: lowMoodEntries.length,
          lastEntry,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    // Sort by severity (critical first)
    crisisAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    });

    // Calculate weekly summary for all patients
    const weeklySummary = {
      totalEntries: 0,
      avgMood: 0,
      patientsWithEntries: 0,
      entriesByDay: {} as Record<string, number>
    };
    
    let totalMood = 0;
    let moodCount = 0;
    
    patients.forEach(patient => {
      const entries = getJournalEntriesByPatient(patient.id);
      const last7Days = entries.filter(e => {
        const entryDate = new Date(e.date);
        const daysDiff = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      });
      
      if (last7Days.length > 0) {
        weeklySummary.patientsWithEntries++;
        weeklySummary.totalEntries += last7Days.length;
        
        last7Days.forEach(entry => {
          if (entry.mood !== undefined) {
            totalMood += entry.mood;
            moodCount++;
          }
          
          const day = entry.date;
          weeklySummary.entriesByDay[day] = (weeklySummary.entriesByDay[day] || 0) + 1;
        });
      }
    });
    
    weeklySummary.avgMood = moodCount > 0 ? Number((totalMood / moodCount).toFixed(2)) : 0;

    res.json({
      totalPatients: patients.length,
      upcomingAppointments: appointments.filter(a => new Date(a.dateTime) > new Date()).slice(0, 5),
      crisisAlerts,
      recentActivity: patients.map(p => ({
        patientId: p.id,
        patientName: p.name,
        lastEntry: getJournalEntriesByPatient(p.id).slice(-1)[0] || null
      })),
      weeklySummary
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;

