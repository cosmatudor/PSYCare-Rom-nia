import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createMaterial, getMaterialsForPatient, getMaterialsByPsychologist, deleteMaterial, getMaterials } from '../data/materials.js';
import { getUsers } from '../data/users.js';

const router = express.Router();

// Get materials (patient or psychologist)
router.get('/', async (req: AuthRequest, res) => {
  try {
    let materials;
    if (req.userRole === 'patient') {
      const users = getUsers();
      const patient = users.find(u => u.id === req.userId);
      materials = getMaterialsForPatient(req.userId!, patient?.psychologistId);
    } else if (req.userRole === 'psychologist') {
      materials = getMaterialsByPsychologist(req.userId!);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get all materials (for psychologist to see general + their own)
router.get('/all', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view all materials' });
    }

    const allMaterials = getMaterials();
    res.json(allMaterials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Create material (psychologist)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, description, type, category, url, thumbnailUrl, duration } = req.body;

    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create materials' });
    }

    if (!title || !description || !type || !category || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const material = createMaterial({
      psychologistId: req.userId,
      title,
      description,
      type,
      category,
      url,
      thumbnailUrl,
      duration
    });

    res.status(201).json(material);
  } catch (error: any) {
    console.error('Material creation error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// Delete material (psychologist)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can delete materials' });
    }

    const { id } = req.params;
    const success = deleteMaterial(id, req.userId!);

    if (!success) {
      return res.status(404).json({ error: 'Material not found or access denied' });
    }

    res.json({ message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

export default router;

