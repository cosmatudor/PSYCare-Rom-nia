import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface BreakReminder {
  id: string;
  psychologistId: string;
  enabled: boolean;
  intervalMinutes: number; // Interval între pauze (ex: 60 = o pauză la fiecare oră)
  startTime: string; // Ora de început (ex: "09:00")
  endTime: string; // Ora de sfârșit (ex: "18:00")
  lastReminderAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StressLevel {
  id: string;
  psychologistId: string;
  date: string;
  level: number; // 1-10 scale
  notes?: string;
  factors?: string[]; // Factori care contribuie la stres
  createdAt: string;
}

export interface ProfessionalDevelopmentResource {
  id: string;
  title: string;
  description: string;
  type: 'webinar' | 'training' | 'workshop' | 'course' | 'conference' | 'article' | 'book';
  category: 'self-care' | 'clinical-skills' | 'supervision' | 'ethics' | 'research' | 'business' | 'general';
  url: string;
  duration?: number; // În minute
  provider?: string;
  date?: string; // Pentru evenimente viitoare
  cost?: string; // "Free", "Paid", sau suma
  language?: string;
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const BREAK_REMINDERS_FILE = join(DATA_DIR, 'breakReminders.json');
const STRESS_LEVELS_FILE = join(DATA_DIR, 'stressLevels.json');
const PROFESSIONAL_RESOURCES_FILE = join(DATA_DIR, 'professionalResources.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Break Reminders Functions
function getBreakReminders(): BreakReminder[] {
  ensureDataDir();
  if (!existsSync(BREAK_REMINDERS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(BREAK_REMINDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveBreakReminders(reminders: BreakReminder[]) {
  ensureDataDir();
  writeFileSync(BREAK_REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

export function getBreakReminderByPsychologist(psychologistId: string): BreakReminder | null {
  const reminders = getBreakReminders();
  return reminders.find(r => r.psychologistId === psychologistId) || null;
}

export function createOrUpdateBreakReminder(psychologistId: string, reminder: Omit<BreakReminder, 'id' | 'psychologistId' | 'createdAt' | 'updatedAt'>): BreakReminder {
  const reminders = getBreakReminders();
  const existing = reminders.find(r => r.psychologistId === psychologistId);

  if (existing) {
    existing.enabled = reminder.enabled;
    existing.intervalMinutes = reminder.intervalMinutes;
    existing.startTime = reminder.startTime;
    existing.endTime = reminder.endTime;
    existing.updatedAt = new Date().toISOString();
    saveBreakReminders(reminders);
    return existing;
  } else {
    const newReminder: BreakReminder = {
      ...reminder,
      id: uuidv4(),
      psychologistId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    reminders.push(newReminder);
    saveBreakReminders(reminders);
    return newReminder;
  }
}

// Stress Level Functions
function getStressLevels(): StressLevel[] {
  ensureDataDir();
  if (!existsSync(STRESS_LEVELS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(STRESS_LEVELS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveStressLevels(levels: StressLevel[]) {
  ensureDataDir();
  writeFileSync(STRESS_LEVELS_FILE, JSON.stringify(levels, null, 2));
}

export function addStressLevel(psychologistId: string, level: Omit<StressLevel, 'id' | 'psychologistId' | 'createdAt'>): StressLevel {
  const levels = getStressLevels();
  const newLevel: StressLevel = {
    ...level,
    id: uuidv4(),
    psychologistId,
    createdAt: new Date().toISOString()
  };
  levels.push(newLevel);
  saveStressLevels(levels);
  return newLevel;
}

export function getStressLevelsByPsychologist(psychologistId: string, days?: number): StressLevel[] {
  const levels = getStressLevels();
  let filtered = levels.filter(l => l.psychologistId === psychologistId);
  
  if (days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    filtered = filtered.filter(l => new Date(l.date) >= cutoffDate);
  }
  
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAverageStressLevel(psychologistId: string, days: number = 7): number {
  const levels = getStressLevelsByPsychologist(psychologistId, days);
  if (levels.length === 0) return 0;
  const sum = levels.reduce((acc, l) => acc + l.level, 0);
  return Math.round((sum / levels.length) * 10) / 10;
}

// Professional Development Resources Functions
function getProfessionalResources(): ProfessionalDevelopmentResource[] {
  ensureDataDir();
  if (!existsSync(PROFESSIONAL_RESOURCES_FILE)) {
    // Initialize with sample resources
    const sampleResources: ProfessionalDevelopmentResource[] = [
      {
        id: uuidv4(),
        title: 'Self-Care for Mental Health Professionals',
        description: 'Webinar despre tehnici de autocontrol și prevenirea burnout-ului pentru profesioniștii din domeniul sănătății mintale.',
        type: 'webinar',
        category: 'self-care',
        url: 'https://example.com/webinar-self-care',
        duration: 90,
        provider: 'Mental Health Professionals Association',
        cost: 'Free',
        language: 'English',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Advanced CBT Techniques Workshop',
        description: 'Workshop intensiv de 2 zile despre tehnici avansate de CBT pentru tratarea anxietății și depresiei.',
        type: 'workshop',
        category: 'clinical-skills',
        url: 'https://example.com/cbt-workshop',
        duration: 960,
        provider: 'CBT Institute',
        date: '2024-06-15',
        cost: '500 RON',
        language: 'Romanian',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Ethical Considerations in Online Therapy',
        description: 'Curs online despre considerații etice și legale în terapia online și telepsihologie.',
        type: 'course',
        category: 'ethics',
        url: 'https://example.com/ethics-course',
        duration: 180,
        provider: 'Online Therapy Academy',
        cost: '150 RON',
        language: 'Romanian',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Supervision Skills Training',
        description: 'Training pentru psihologi care doresc să ofere supervizare altor profesioniști.',
        type: 'training',
        category: 'supervision',
        url: 'https://example.com/supervision-training',
        duration: 240,
        provider: 'Professional Development Center',
        cost: '300 RON',
        language: 'Romanian',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Mindfulness-Based Stress Reduction for Therapists',
        description: 'Program de 8 săptămâni de MBSR adaptat special pentru terapeuți.',
        type: 'course',
        category: 'self-care',
        url: 'https://example.com/mbsr-therapists',
        duration: 480,
        provider: 'Mindfulness Institute',
        cost: '400 RON',
        language: 'Romanian',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Building a Private Practice',
        description: 'Webinar despre cum să construiești și să gestionezi o practică privată de succes.',
        type: 'webinar',
        category: 'business',
        url: 'https://example.com/private-practice',
        duration: 120,
        provider: 'Business Psychology Network',
        cost: 'Free',
        language: 'Romanian',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Trauma-Informed Care Conference',
        description: 'Conferință anuală despre îngrijire informată despre traumă și cele mai recente cercetări.',
        type: 'conference',
        category: 'clinical-skills',
        url: 'https://example.com/trauma-conference',
        duration: 1440,
        provider: 'Trauma Research Society',
        date: '2024-09-20',
        cost: '800 RON',
        language: 'English',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Research Methods in Clinical Psychology',
        description: 'Curs online despre metode de cercetare în psihologie clinică și cum să citezi și interpretezi studii.',
        type: 'course',
        category: 'research',
        url: 'https://example.com/research-methods',
        duration: 300,
        provider: 'Academic Psychology Center',
        cost: '200 RON',
        language: 'English',
        createdAt: new Date().toISOString()
      }
    ];
    saveProfessionalResources(sampleResources);
    return sampleResources;
  }
  try {
    const data = readFileSync(PROFESSIONAL_RESOURCES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveProfessionalResources(resources: ProfessionalDevelopmentResource[]) {
  ensureDataDir();
  writeFileSync(PROFESSIONAL_RESOURCES_FILE, JSON.stringify(resources, null, 2));
}

export function getAllProfessionalResources(): ProfessionalDevelopmentResource[] {
  return getProfessionalResources().sort((a, b) => {
    if (a.date && b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getProfessionalResourcesByCategory(category: string): ProfessionalDevelopmentResource[] {
  const resources = getProfessionalResources();
  if (category === 'all') return getAllProfessionalResources();
  return resources.filter(r => r.category === category).sort((a, b) => {
    if (a.date && b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function createProfessionalResource(resource: Omit<ProfessionalDevelopmentResource, 'id' | 'createdAt'>): ProfessionalDevelopmentResource {
  const resources = getProfessionalResources();
  const newResource: ProfessionalDevelopmentResource = {
    ...resource,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  resources.push(newResource);
  saveProfessionalResources(resources);
  return newResource;
}
