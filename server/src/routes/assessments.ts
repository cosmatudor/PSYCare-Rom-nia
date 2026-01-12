import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ASSESSMENT_SCALES, createAssessment, getAssessmentsByPatient, getAssessmentsByPsychologist } from '../data/assessments.js';
import { getUsers } from '../data/users.js';

const router = express.Router();

// Get all available assessment scales
router.get('/scales', async (req: AuthRequest, res) => {
  try {
    res.json(ASSESSMENT_SCALES.map(scale => ({
      id: scale.id,
      name: scale.name,
      description: scale.description,
      category: scale.category,
      questionCount: scale.questions.length
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessment scales' });
  }
});

// Get a specific assessment scale
router.get('/scales/:scaleId', async (req: AuthRequest, res) => {
  try {
    const { scaleId } = req.params;
    const scale = ASSESSMENT_SCALES.find(s => s.id === scaleId);
    
    if (!scale) {
      return res.status(404).json({ error: 'Assessment scale not found' });
    }
    
    res.json(scale);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessment scale' });
  }
});

// Submit an assessment (patient or psychologist can submit)
router.post('/submit', async (req: AuthRequest, res) => {
  try {
    const { scaleId, answers, patientId } = req.body;
    
    if (!scaleId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // If psychologist is submitting for a patient
    let targetPatientId = req.userId!;
    let psychologistId: string | undefined = undefined;
    
    if (req.userRole === 'psychologist') {
      if (!patientId) {
        return res.status(400).json({ error: 'Patient ID required when psychologist submits assessment' });
      }
      
      const users = getUsers();
      const patient = users.find(u => u.id === patientId);
      
      if (!patient || patient.psychologistId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      targetPatientId = patientId;
      psychologistId = req.userId;
    }
    
    const assessment = createAssessment(targetPatientId, psychologistId, scaleId, answers);
    res.status(201).json(assessment);
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ error: error.message || 'Failed to submit assessment' });
  }
});

// Get patient's assessments
router.get('/patient/:patientId', async (req: AuthRequest, res) => {
  try {
    const { patientId } = req.params;
    
    // Check access
    if (req.userRole === 'psychologist') {
      const users = getUsers();
      const patient = users.find(u => u.id === patientId);
      if (!patient || patient.psychologistId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userId !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const assessments = getAssessmentsByPatient(patientId);
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Get all assessments for psychologist's patients
router.get('/psychologist/all', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view all assessments' });
    }
    
    const assessments = getAssessmentsByPsychologist(req.userId!);
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

export default router;
