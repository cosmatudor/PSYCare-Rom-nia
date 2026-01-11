import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createAppointment, getAppointmentsByPatient, getAppointmentsByPsychologist, getAppointments, saveAppointments } from '../data/appointments.js';

const router = express.Router();

// Create appointment
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { patientId, dateTime, duration, type, meetingLink } = req.body;

    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create appointments' });
    }

    if (!patientId || !dateTime || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const appointment = createAppointment({
      patientId,
      psychologistId: req.userId!,
      dateTime,
      duration,
      type: type || 'online',
      meetingLink,
      status: 'scheduled'
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create appointment',
      details: error.message || 'Unknown error'
    });
  }
});

// Get appointments
router.get('/', async (req: AuthRequest, res) => {
  try {
    let appointments;
    if (req.userRole === 'patient') {
      appointments = getAppointmentsByPatient(req.userId!);
    } else if (req.userRole === 'psychologist') {
      appointments = getAppointmentsByPsychologist(req.userId!);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const appointments = getAppointments();
    const appointment = appointments.find(a => a.id === id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.psychologistId !== req.userId && appointment.patientId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(appointment, req.body);
    saveAppointments(appointments);

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Export calendar (ICS format)
router.get('/export/ical', async (req: AuthRequest, res) => {
  try {
    let appointments;
    if (req.userRole === 'patient') {
      appointments = getAppointmentsByPatient(req.userId!);
    } else if (req.userRole === 'psychologist') {
      appointments = getAppointmentsByPsychologist(req.userId!);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { getUsers } = await import('../data/users.js');
    const users = getUsers();
    
    // Generate ICS content
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//PSYCare România//Appointments//RO\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';

    appointments.forEach(appointment => {
      if (appointment.status !== 'scheduled') return;
      
      const startDate = new Date(appointment.dateTime);
      const endDate = new Date(startDate.getTime() + appointment.duration * 60000);
      
      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const patient = users.find(u => u.id === appointment.patientId);
      const psychologist = users.find(u => u.id === appointment.psychologistId);
      const title = req.userRole === 'patient' 
        ? `Ședință cu ${psychologist?.name || 'Psiholog'}`
        : `Ședință cu ${patient?.name || 'Pacient'}`;
      
      const description = [
        `Tip: ${appointment.type === 'online' ? 'Online' : 'Offline'}`,
        appointment.meetingLink ? `Link: ${appointment.meetingLink}` : '',
        `Durată: ${appointment.duration} minute`
      ].filter(Boolean).join('\\n');
      
      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${appointment.id}@psycare.ro\r\n`;
      icsContent += `DTSTART:${formatICSDate(startDate)}\r\n`;
      icsContent += `DTEND:${formatICSDate(endDate)}\r\n`;
      icsContent += `SUMMARY:${title}\r\n`;
      icsContent += `DESCRIPTION:${description}\r\n`;
      icsContent += `LOCATION:${appointment.type === 'online' ? (appointment.meetingLink || 'Online') : 'Offline'}\r\n`;
      icsContent += `STATUS:CONFIRMED\r\n`;
      icsContent += `SEQUENCE:0\r\n`;
      
      // Add reminder (24 hours before)
      const reminderDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      icsContent += 'BEGIN:VALARM\r\n';
      icsContent += `TRIGGER:-PT24H\r\n`;
      icsContent += 'ACTION:DISPLAY\r\n';
      icsContent += `DESCRIPTION:Reminder: ${title}\r\n`;
      icsContent += 'END:VALARM\r\n';
      
      // Add reminder (1 hour before)
      icsContent += 'BEGIN:VALARM\r\n';
      icsContent += `TRIGGER:-PT1H\r\n`;
      icsContent += 'ACTION:DISPLAY\r\n';
      icsContent += `DESCRIPTION:Reminder: ${title}\r\n`;
      icsContent += 'END:VALARM\r\n';
      
      icsContent += 'END:VEVENT\r\n';
    });

    icsContent += 'END:VCALENDAR\r\n';

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="psycare-appointments.ics"');
    res.send(icsContent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export calendar' });
  }
});

export default router;

