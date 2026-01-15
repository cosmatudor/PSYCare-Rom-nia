import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUsers, saveUsers, createUser } from '../data/users.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, psychologistId } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = createUser({
      email,
      password: hashedPassword,
      name,
      role: role as 'patient' | 'psychologist',
      psychologistId: role === 'patient' ? psychologistId : undefined
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        psychologistId: user.psychologistId
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: error.message || 'Unknown error'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        psychologistId: user.psychologistId
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Update patient psychologist ID
router.put('/patient/psychologist', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { psychologistId } = req.body;

    if (req.userRole !== 'patient') {
      return res.status(403).json({ error: 'Only patients can update their psychologist ID' });
    }

    if (!psychologistId) {
      return res.status(400).json({ error: 'Psychologist ID is required' });
    }

    const users = getUsers();
    const patient = users.find(u => u.id === req.userId);
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Verify psychologist exists
    const psychologist = users.find(u => u.id === psychologistId && u.role === 'psychologist');
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }

    // Update patient's psychologist ID
    patient.psychologistId = psychologistId;
    saveUsers(users);

    res.json({
      id: patient.id,
      email: patient.email,
      name: patient.name,
      role: patient.role,
      psychologistId: patient.psychologistId
    });
  } catch (error: any) {
    console.error('Error updating psychologist ID:', error);
    res.status(500).json({ 
      error: 'Failed to update psychologist ID',
      details: error.message || 'Unknown error'
    });
  }
});

export default router;

