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
    const { title, description, type, category, url, fileUrl, fileName, fileSize, fileType, thumbnailUrl, duration, patientIds, isGeneral } = req.body;

    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create materials' });
    }

    if (!title || !description || !type || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For file/worksheet types, require fileUrl or url
    if ((type === 'file' || type === 'worksheet') && !fileUrl && !url) {
      return res.status(400).json({ error: 'File URL or file data is required for file/worksheet types' });
    }

    // For other types, require url
    if (type !== 'file' && type !== 'worksheet' && !url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate patientIds if provided
    let validatedPatientIds: string[] | undefined = undefined;
    if (patientIds && Array.isArray(patientIds) && patientIds.length > 0) {
      const users = getUsers();
      // Verify all patient IDs belong to this psychologist
      const validPatients = patientIds.filter((pid: string) => {
        const patient = users.find(u => u.id === pid);
        return patient && patient.role === 'patient' && patient.psychologistId === req.userId;
      });
      validatedPatientIds = validPatients.length > 0 ? validPatients : undefined;
    }

    const material = createMaterial({
      psychologistId: isGeneral ? undefined : req.userId,
      patientIds: validatedPatientIds,
      isGeneral: isGeneral === true,
      title,
      description,
      type,
      category,
      url: url || fileUrl || '',
      fileUrl,
      fileName,
      fileSize: fileSize ? Number(fileSize) : undefined,
      fileType,
      thumbnailUrl,
      duration: duration ? Number(duration) : undefined
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

