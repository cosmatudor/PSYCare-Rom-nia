import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Appointment {
  id: string;
  patientId: string;
  psychologistId: string;
  dateTime: string;
  duration: number; // minutes
  type: 'online' | 'offline';
  meetingLink?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const APPOINTMENTS_FILE = join(DATA_DIR, 'appointments.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getAppointments(): Appointment[] {
  ensureDataDir();
  if (!existsSync(APPOINTMENTS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(APPOINTMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveAppointments(appointments: Appointment[]) {
  ensureDataDir();
  writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
}

export function createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
  const appointments = getAppointments();
  const newAppointment: Appointment = {
    ...appointment,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  appointments.push(newAppointment);
  saveAppointments(appointments);
  return newAppointment;
}

export function getAppointmentsByPatient(patientId: string): Appointment[] {
  const appointments = getAppointments();
  return appointments.filter(a => a.patientId === patientId);
}

export function getAppointmentsByPsychologist(psychologistId: string): Appointment[] {
  const appointments = getAppointments();
  return appointments.filter(a => a.psychologistId === psychologistId);
}

export { getAppointments, saveAppointments };

