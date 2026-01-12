import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import psychologistRoutes from './routes/psychologists.js';
import journalRoutes from './routes/journal.js';
import exercisesRoutes from './routes/exercises.js';
import appointmentsRoutes from './routes/appointments.js';
import messagesRoutes from './routes/messages.js';
import tasksRoutes from './routes/tasks.js';
import materialsRoutes from './routes/materials.js';
import patientRecordsRoutes from './routes/patientRecords.js';
import assessmentsRoutes from './routes/assessments.js';
import academicResourcesRoutes from './routes/academicResources.js';
import forumRoutes from './routes/forum.js';
import psychologistWellbeingRoutes from './routes/psychologistWellbeing.js';
import billingRoutes from './routes/billing.js';
import gdprRoutes from './routes/gdpr.js';
import backupRoutes from './routes/backup.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads (base64 data URLs can be large)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', authenticateToken, patientRoutes);
app.use('/api/psychologists', authenticateToken, psychologistRoutes);
app.use('/api/journal', authenticateToken, journalRoutes);
app.use('/api/exercises', authenticateToken, exercisesRoutes);
app.use('/api/appointments', authenticateToken, appointmentsRoutes);
app.use('/api/messages', authenticateToken, messagesRoutes);
app.use('/api/tasks', authenticateToken, tasksRoutes);
app.use('/api/materials', authenticateToken, materialsRoutes);
app.use('/api/records', authenticateToken, patientRecordsRoutes);
app.use('/api/assessments', authenticateToken, assessmentsRoutes);
app.use('/api/academic', authenticateToken, academicResourcesRoutes);
app.use('/api/forum', authenticateToken, forumRoutes);
app.use('/api/wellbeing', authenticateToken, psychologistWellbeingRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);
app.use('/api/gdpr', authenticateToken, gdprRoutes);
app.use('/api/backup', authenticateToken, backupRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PSYCare API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

