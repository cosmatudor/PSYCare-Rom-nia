import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface JournalEntry {
  id: string;
  patientId: string;
  date: string;
  mood: number; // 0-10
  anxiety?: number; // 0-10
  sleep?: number; // ore de somn
  stress?: number; // 0-10
  text?: string;
  audioUrl?: string;
  emojis?: string[];
  emotions?: string[];
  automaticThoughts?: string[];
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const JOURNAL_FILE = join(DATA_DIR, 'journal.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getJournalEntries(): JournalEntry[] {
  ensureDataDir();
  if (!existsSync(JOURNAL_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(JOURNAL_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveJournalEntries(entries: JournalEntry[]) {
  ensureDataDir();
  writeFileSync(JOURNAL_FILE, JSON.stringify(entries, null, 2));
}

export function createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): JournalEntry {
  const entries = getJournalEntries();
  const newEntry: JournalEntry = {
    ...entry,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  entries.push(newEntry);
  saveJournalEntries(entries);
  return newEntry;
}

export function getJournalEntriesByPatient(patientId: string): JournalEntry[] {
  const entries = getJournalEntries();
  return entries.filter(e => e.patientId === patientId);
}

export { getJournalEntries, saveJournalEntries };

