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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PSYCare API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

