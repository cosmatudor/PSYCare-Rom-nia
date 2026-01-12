import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  createBackup,
  getBackupRecordsByPsychologist,
  getBackupById,
  deleteBackup,
  getBackupStats,
  getDecryptedBackupContent
} from '../data/backup.js';
import { readFileSync, existsSync } from 'fs';

const router = express.Router();

router.post('/', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create backups' });
    }

    const { type, encrypt } = req.body;
    const backup = createBackup(req.userId, type || 'manual', encrypt !== false);
    
    res.status(201).json(backup);
  } catch (error: any) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: error.message || 'Failed to create backup' });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view backups' });
    }

    const backups = getBackupRecordsByPsychologist(req.userId);
    res.json(backups);
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

router.get('/stats', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view backup stats' });
    }

    const stats = getBackupStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching backup stats:', error);
    res.status(500).json({ error: 'Failed to fetch backup stats' });
  }
});

router.get('/:id/download', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can download backups' });
    }

    const backup = getBackupById(req.params.id);
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    if (!backup.filePath || !existsSync(backup.filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Get decrypted content (will decrypt if encrypted, or return plain if not)
    const decryptedContent = getDecryptedBackupContent(req.params.id);
    if (!decryptedContent) {
      return res.status(500).json({ error: 'Failed to decrypt backup or backup file is corrupted' });
    }

    // Set headers for file download
    const originalFileName = backup.filePath.split('/').pop() || backup.filePath.split('\\').pop() || 'backup.json';
    const downloadFileName = backup.encrypted 
      ? originalFileName.replace('.json', '-decrypted.json')
      : originalFileName;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    
    // Send decrypted content
    res.send(decryptedContent);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view backups' });
    }

    const backup = getBackupById(req.params.id);
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.json(backup);
  } catch (error) {
    console.error('Error fetching backup:', error);
    res.status(500).json({ error: 'Failed to fetch backup' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can delete backups' });
    }

    const deleted = deleteBackup(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

export default router;
