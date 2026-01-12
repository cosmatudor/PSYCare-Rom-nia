import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SessionNote {
  id: string;
  appointmentId?: string;
  patientId: string;
  psychologistId: string;
  date: string;
  content: string;
  type: 'session' | 'follow-up' | 'assessment' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface PatientEvaluation {
  id: string;
  patientId: string;
  psychologistId: string;
  date: string;
  evaluationType: 'initial' | 'progress' | 'final' | 'crisis';
  scores: {
    [key: string]: number | string;
  };
  observations: string;
  recommendations: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientRecord {
  patientId: string;
  psychologistId: string;
  notes: SessionNote[];
  evaluations: PatientEvaluation[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const RECORDS_FILE = join(DATA_DIR, 'patientRecords.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getRecords(): PatientRecord[] {
  ensureDataDir();
  if (!existsSync(RECORDS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(RECORDS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveRecords(records: PatientRecord[]) {
  ensureDataDir();
  writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
}

function getOrCreateRecord(patientId: string, psychologistId: string): PatientRecord {
  const records = getRecords();
  let record = records.find(r => r.patientId === patientId && r.psychologistId === psychologistId);
  
  if (!record) {
    record = {
      patientId,
      psychologistId,
      notes: [],
      evaluations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(record);
    saveRecords(records);
  }
  
  return record;
}

export function addSessionNote(
  patientId: string,
  psychologistId: string,
  note: Omit<SessionNote, 'id' | 'createdAt' | 'updatedAt'>
): SessionNote {
  const records = getRecords();
  const record = getOrCreateRecord(patientId, psychologistId);
  
  const newNote: SessionNote = {
    ...note,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  record.notes.push(newNote);
  record.updatedAt = new Date().toISOString();
  
  const index = records.findIndex(r => r.patientId === patientId && r.psychologistId === psychologistId);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  
  saveRecords(records);
  return newNote;
}

export function updateSessionNote(
  noteId: string,
  patientId: string,
  psychologistId: string,
  updates: Partial<Omit<SessionNote, 'id' | 'createdAt' | 'patientId' | 'psychologistId'>>
): SessionNote | null {
  const records = getRecords();
  const record = records.find(r => r.patientId === patientId && r.psychologistId === psychologistId);
  
  if (!record) {
    return null;
  }
  
  const noteIndex = record.notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) {
    return null;
  }
  
  record.notes[noteIndex] = {
    ...record.notes[noteIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  record.updatedAt = new Date().toISOString();
  
  saveRecords(records);
  return record.notes[noteIndex];
}

export function deleteSessionNote(
  noteId: string,
  patientId: string,
  psychologistId: string
): boolean {
  const records = getRecords();
  const record = records.find(r => r.patientId === patientId && r.psychologistId === psychologistId);
  
  if (!record) {
    return false;
  }
  
  const noteIndex = record.notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) {
    return false;
  }
  
  record.notes.splice(noteIndex, 1);
  record.updatedAt = new Date().toISOString();
  
  saveRecords(records);
  return true;
}

export function addEvaluation(
  patientId: string,
  psychologistId: string,
  evaluation: Omit<PatientEvaluation, 'id' | 'createdAt' | 'updatedAt'>
): PatientEvaluation {
  const records = getRecords();
  const record = getOrCreateRecord(patientId, psychologistId);
  
  const newEvaluation: PatientEvaluation = {
    ...evaluation,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  record.evaluations.push(newEvaluation);
  record.updatedAt = new Date().toISOString();
  
  const index = records.findIndex(r => r.patientId === patientId && r.psychologistId === psychologistId);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  
  saveRecords(records);
  return newEvaluation;
}

export function updateEvaluation(
  evaluationId: string,
  patientId: string,
  psychologistId: string,
  updates: Partial<Omit<PatientEvaluation, 'id' | 'createdAt' | 'patientId' | 'psychologistId'>>
): PatientEvaluation | null {
  const records = getRecords();
  const record = records.find(r => r.patientId === patientId && r.psychologistId === psychologistId);
  
  if (!record) {
    return null;
  }
  
  const evalIndex = record.evaluations.findIndex(e => e.id === evaluationId);
  if (evalIndex === -1) {
    return null;
  }
  
  record.evaluations[evalIndex] = {
    ...record.evaluations[evalIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  record.updatedAt = new Date().toISOString();
  
  saveRecords(records);
  return record.evaluations[evalIndex];
}

export function deleteEvaluation(
  evaluationId: string,
  patientId: string,
  psychologistId: string
): boolean {
  const records = getRecords();
  const record = records.find(r => r.patientId === patientId && r.psychologistId === psychologistId);
  
  if (!record) {
    return false;
  }
  
  const evalIndex = record.evaluations.findIndex(e => e.id === evaluationId);
  if (evalIndex === -1) {
    return false;
  }
  
  record.evaluations.splice(evalIndex, 1);
  record.updatedAt = new Date().toISOString();
  
  saveRecords(records);
  return true;
}

export function getPatientRecord(patientId: string, psychologistId: string): PatientRecord | null {
  const records = getRecords();
  return records.find(r => r.patientId === patientId && r.psychologistId === psychologistId) || null;
}

export function getRecordsByPsychologist(psychologistId: string): PatientRecord[] {
  const records = getRecords();
  return records.filter(r => r.psychologistId === psychologistId);
}
