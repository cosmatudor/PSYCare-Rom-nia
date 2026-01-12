import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  addConsent,
  getConsentsByPatient,
  revokeConsent,
  createDataAccessRequest,
  getDataAccessRequestsByPsychologist,
  updateDataAccessRequest,
  createDataBreachRecord,
  getDataBreachesByPsychologist,
  markBreachAsReported,
  getActivePrivacyPolicy,
  createPrivacyPolicyVersion
} from '../data/gdpr.js';
import { getUsers } from '../data/users.js';

const router = express.Router();

// Consents
router.get('/consents/patient/:patientId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view consents' });
    }

    const { patientId } = req.params;
    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const consents = getConsentsByPatient(patientId, req.userId!);
    res.json(consents);
  } catch (error) {
    console.error('Error fetching consents:', error);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

router.post('/consents', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can add consents' });
    }

    const { patientId, type, consentGiven, date, notes } = req.body;

    if (!patientId || !type || consentGiven === undefined || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const consent = addConsent({
      patientId,
      psychologistId: req.userId!,
      type,
      consentGiven,
      date,
      ipAddress: req.ip,
      notes
    });

    res.status(201).json(consent);
  } catch (error) {
    console.error('Error adding consent:', error);
    res.status(500).json({ error: 'Failed to add consent' });
  }
});

router.post('/consents/:consentId/revoke', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can revoke consents' });
    }

    const { consentId } = req.params;
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const revoked = revokeConsent(consentId, patientId, req.userId!);
    if (!revoked) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking consent:', error);
    res.status(500).json({ error: 'Failed to revoke consent' });
  }
});

// Data Access Requests
router.get('/data-access-requests', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view data access requests' });
    }

    const requests = getDataAccessRequestsByPsychologist(req.userId!);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching data access requests:', error);
    res.status(500).json({ error: 'Failed to fetch data access requests' });
  }
});

router.post('/data-access-requests', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create data access requests' });
    }

    const { patientId, type, notes } = req.body;

    if (!patientId || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const users = getUsers();
    const patient = users.find(u => u.id === patientId);

    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    const request = createDataAccessRequest({
      patientId,
      psychologistId: req.userId!,
      type,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      notes
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating data access request:', error);
    res.status(500).json({ error: 'Failed to create data access request' });
  }
});

router.put('/data-access-requests/:id', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can update data access requests' });
    }

    const request = updateDataAccessRequest(req.params.id, req.userId!, req.body);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating data access request:', error);
    res.status(500).json({ error: 'Failed to update data access request' });
  }
});

// Data Breaches
router.get('/data-breaches', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view data breaches' });
    }

    const breaches = getDataBreachesByPsychologist(req.userId!);
    res.json(breaches);
  } catch (error) {
    console.error('Error fetching data breaches:', error);
    res.status(500).json({ error: 'Failed to fetch data breaches' });
  }
});

router.post('/data-breaches', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can report data breaches' });
    }

    const { date, description, affectedPatients, severity, measuresTaken } = req.body;

    if (!date || !description || !affectedPatients || !severity || !measuresTaken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const breach = createDataBreachRecord({
      psychologistId: req.userId!,
      date,
      description,
      affectedPatients: Array.isArray(affectedPatients) ? affectedPatients : [affectedPatients],
      severity,
      reported: false,
      measuresTaken: Array.isArray(measuresTaken) ? measuresTaken : [measuresTaken]
    });

    res.status(201).json(breach);
  } catch (error) {
    console.error('Error creating data breach record:', error);
    res.status(500).json({ error: 'Failed to create data breach record' });
  }
});

router.post('/data-breaches/:id/mark-reported', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can mark breaches as reported' });
    }

    const breach = markBreachAsReported(req.params.id, req.userId!);
    if (!breach) {
      return res.status(404).json({ error: 'Breach not found' });
    }

    res.json(breach);
  } catch (error) {
    console.error('Error marking breach as reported:', error);
    res.status(500).json({ error: 'Failed to mark breach as reported' });
  }
});

// Privacy Policy
router.get('/privacy-policy', async (req: AuthRequest, res) => {
  try {
    const policy = getActivePrivacyPolicy();
    res.json(policy);
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    res.status(500).json({ error: 'Failed to fetch privacy policy' });
  }
});

router.post('/privacy-policy', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create privacy policy versions' });
    }

    const { version, content, effectiveDate } = req.body;

    if (!version || !content || !effectiveDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const policy = createPrivacyPolicyVersion({
      version,
      content,
      effectiveDate,
      isActive: true
    });

    res.status(201).json(policy);
  } catch (error) {
    console.error('Error creating privacy policy:', error);
    res.status(500).json({ error: 'Failed to create privacy policy' });
  }
});

export default router;
