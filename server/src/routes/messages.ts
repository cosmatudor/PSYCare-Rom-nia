import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  audioUrl?: string;
  read: boolean;
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const MESSAGES_FILE = join(DATA_DIR, 'messages.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getMessages(): Message[] {
  ensureDataDir();
  if (!existsSync(MESSAGES_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  ensureDataDir();
  writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

const router = express.Router();

// Send message
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { toId, text, audioUrl } = req.body;

    if (!toId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const messages = getMessages();
    const message: Message = {
      id: uuidv4(),
      fromId: req.userId!,
      toId,
      text,
      audioUrl,
      read: false,
      createdAt: new Date().toISOString()
    };

    messages.push(message);
    saveMessages(messages);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get psychologist info for patient
router.get('/psychologist-info', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'patient') {
      return res.status(403).json({ error: 'Only patients can access psychologist info' });
    }

    const { getUsers } = await import('../data/users.js');
    const users = getUsers();
    const patient = users.find(u => u.id === req.userId);
    
    if (!patient || !patient.psychologistId) {
      return res.json({ psychologist: null });
    }

    const psychologist = users.find(u => u.id === patient.psychologistId);
    
    if (!psychologist) {
      return res.json({ psychologist: null });
    }

    res.json({
      psychologist: {
        id: psychologist.id,
        name: psychologist.name,
        email: psychologist.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch psychologist info' });
  }
});

// Get conversations
router.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const messages = getMessages();
    const userId = req.userId!;
    
    const conversations = new Map<string, Message[]>();
    
    messages.forEach(msg => {
      if (msg.fromId === userId || msg.toId === userId) {
        const otherId = msg.fromId === userId ? msg.toId : msg.fromId;
        if (!conversations.has(otherId)) {
          conversations.set(otherId, []);
        }
        conversations.get(otherId)!.push(msg);
      }
    });

    const result = Array.from(conversations.entries()).map(([otherId, msgs]) => ({
      userId: otherId,
      messages: msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      unreadCount: msgs.filter(m => !m.read && m.toId === userId).length
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages with specific user
router.get('/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const messages = getMessages();
    const userId = req.userId!;

    const conversation = messages
      .filter(m => 
        (m.fromId === userId && m.toId === otherUserId) ||
        (m.fromId === otherUserId && m.toId === userId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Mark as read
    conversation.forEach(msg => {
      if (msg.toId === userId && !msg.read) {
        msg.read = true;
      }
    });
    saveMessages(messages);

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;

