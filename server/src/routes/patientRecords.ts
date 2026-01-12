import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  addSessionNote,
  updateSessionNote,
  deleteSessionNote,
  addEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getPatientRecord,
  getRecordsByPsychologist
} from '../data/patientRecords.js';
import { getUsers } from '../data/users.js';

const router = express.Router();

// Get patient record (full dossier)
router.get('/patient/:patientId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view patient records' });
    }

    const { patientId } = req.params;
    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const record = getPatientRecord(patientId, req.userId!);
    
    if (!record) {
      return res.json({
        patientId,
        psychologistId: req.userId!,
        notes: [],
        evaluations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    res.json(record);
  } catch (error) {
    console.error('Error fetching patient record:', error);
    res.status(500).json({ error: 'Failed to fetch patient record' });
  }
});

// Add session note
router.post('/patient/:patientId/notes', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can add notes' });
    }

    const { patientId } = req.params;
    const { appointmentId, date, content, type } = req.body;

    if (!date || !content || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const note = addSessionNote(patientId, req.userId!, {
      appointmentId,
      patientId,
      psychologistId: req.userId!,
      date,
      content,
      type: type || 'session'
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Error adding session note:', error);
    res.status(500).json({ error: 'Failed to add session note' });
  }
});

// Update session note
router.put('/patient/:patientId/notes/:noteId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can update notes' });
    }

    const { patientId, noteId } = req.params;
    const updates = req.body;

    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const updatedNote = updateSessionNote(noteId, patientId, req.userId!, updates);

    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating session note:', error);
    res.status(500).json({ error: 'Failed to update session note' });
  }
});

// Delete session note
router.delete('/patient/:patientId/notes/:noteId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can delete notes' });
    }

    const { patientId, noteId } = req.params;

    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const deleted = deleteSessionNote(noteId, patientId, req.userId!);

    if (!deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session note:', error);
    res.status(500).json({ error: 'Failed to delete session note' });
  }
});

// Add evaluation
router.post('/patient/:patientId/evaluations', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can add evaluations' });
    }

    const { patientId } = req.params;
    const { date, evaluationType, scores, observations, recommendations } = req.body;

    if (!date || !evaluationType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const evaluation = addEvaluation(patientId, req.userId!, {
      patientId,
      psychologistId: req.userId!,
      date,
      evaluationType,
      scores: scores || {},
      observations: observations || '',
      recommendations: recommendations || ''
    });

    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Error adding evaluation:', error);
    res.status(500).json({ error: 'Failed to add evaluation' });
  }
});

// Update evaluation
router.put('/patient/:patientId/evaluations/:evaluationId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can update evaluations' });
    }

    const { patientId, evaluationId } = req.params;
    const updates = req.body;

    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const updatedEvaluation = updateEvaluation(evaluationId, patientId, req.userId!, updates);

    if (!updatedEvaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json(updatedEvaluation);
  } catch (error) {
    console.error('Error updating evaluation:', error);
    res.status(500).json({ error: 'Failed to update evaluation' });
  }
});

// Delete evaluation
router.delete('/patient/:patientId/evaluations/:evaluationId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can delete evaluations' });
    }

    const { patientId, evaluationId } = req.params;

    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const deleted = deleteEvaluation(evaluationId, patientId, req.userId!);

    if (!deleted) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ error: 'Failed to delete evaluation' });
  }
});

export default router;
