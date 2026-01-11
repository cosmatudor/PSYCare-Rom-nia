import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createTask, getTasksByPatient, getTasksByPsychologist, updateTask, getTasks } from '../data/tasks.js';
import { getUsers } from '../data/users.js';

const router = express.Router();

// Create task (psychologist)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { patientId, title, description, type, exerciseId, dueDate, reminderDate } = req.body;

    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create tasks' });
    }

    if (!patientId || !title || !description || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify patient belongs to psychologist
    const users = getUsers();
    const patient = users.find(u => u.id === patientId);
    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(403).json({ error: 'Patient not found or access denied' });
    }

    const task = createTask({
      patientId,
      psychologistId: req.userId!,
      title,
      description,
      type,
      exerciseId,
      dueDate,
      reminderDate
    });

    res.status(201).json(task);
  } catch (error: any) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get tasks (patient or psychologist)
router.get('/', async (req: AuthRequest, res) => {
  try {
    let tasks;
    if (req.userRole === 'patient') {
      tasks = getTasksByPatient(req.userId!);
    } else if (req.userRole === 'psychologist') {
      tasks = getTasksByPsychologist(req.userId!);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks for specific patient (psychologist)
router.get('/patient/:patientId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view patient tasks' });
    }

    const { patientId } = req.params;
    const users = getUsers();
    const patient = users.find(u => u.id === patientId);
    
    if (!patient || patient.psychologistId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = getTasksByPatient(patientId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Update task (mark as completed, add attachments, etc.)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Patient can mark as completed, add attachments and notes
    if (req.userRole === 'patient') {
      if (task.patientId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const updates: any = {};
      if (req.body.completed !== undefined) {
        updates.completed = req.body.completed;
      }
      if (req.body.attachments !== undefined) {
        updates.attachments = req.body.attachments;
      }
      if (req.body.patientNotes !== undefined) {
        updates.patientNotes = req.body.patientNotes;
      }
      updateTask(id, updates);
    } else if (req.userRole === 'psychologist') {
      if (task.psychologistId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      updateTask(id, req.body);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedTask = getTasks().find(t => t.id === id);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Upload attachment for task (patient)
router.post('/:id/attachments', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'patient') {
      return res.status(403).json({ error: 'Only patients can upload attachments' });
    }

    const { id } = req.params;
    const { fileName, fileUrl, fileSize } = req.body;

    if (!fileName || !fileUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);

    if (!task || task.patientId !== req.userId) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const { v4: uuidv4 } = await import('uuid');
    const newAttachment = {
      id: uuidv4(),
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      uploadedAt: new Date().toISOString()
    };

    // Get current attachments or initialize empty array
    const currentAttachments = task.attachments || [];
    const updatedAttachments = [...currentAttachments, newAttachment];
    
    console.log(`Adding attachment to task ${id}. Current attachments: ${currentAttachments.length}, New total: ${updatedAttachments.length}`);
    
    // Update the task with new attachments
    const { updateTask } = await import('../data/tasks.js');
    const updated = updateTask(id, { attachments: updatedAttachments });
    
    if (!updated) {
      console.error(`Failed to update task ${id} with attachment`);
      return res.status(500).json({ error: 'Failed to update task with attachment' });
    }

    // Verify the attachment was saved
    const verifyTasks = getTasks();
    const verifyTask = verifyTasks.find(t => t.id === id);
    console.log(`Task ${id} after update. Attachments count:`, verifyTask?.attachments?.length || 0);

    res.status(201).json(newAttachment);
  } catch (error: any) {
    console.error('Attachment upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload attachment',
      details: error.message || 'Unknown error'
    });
  }
});

// Delete task (psychologist only)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can delete tasks' });
    }

    const { id } = req.params;
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.psychologistId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filtered = tasks.filter(t => t.id !== id);
    const { saveTasks } = await import('../data/tasks.js');
    saveTasks(filtered);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get pending tasks with reminders (for notifications)
router.get('/reminders/pending', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'patient') {
      return res.status(403).json({ error: 'Only patients can view reminders' });
    }

    const tasks = getTasksByPatient(req.userId!);
    const now = new Date();
    const pendingTasks = tasks.filter(t => {
      if (t.completed) return false;
      if (!t.reminderDate) return false;
      const reminderDate = new Date(t.reminderDate);
      return reminderDate <= now;
    });

    res.json(pendingTasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

export default router;

