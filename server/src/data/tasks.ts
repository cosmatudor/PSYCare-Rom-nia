import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface TherapeuticTask {
  id: string;
  patientId: string;
  psychologistId: string;
  title: string;
  description: string;
  type: 'exercise' | 'journal' | 'form' | 'other';
  exerciseId?: string; // ID-ul exercițiului dacă type === 'exercise'
  dueDate?: string; // Data limită (ISO string)
  reminderDate?: string; // Data reminder-ului (ISO string)
  completed: boolean;
  completedAt?: string;
  attachments?: TaskAttachment[]; // Fișiere încărcate de pacient
  patientNotes?: string; // Note/comentarii de la pacient
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const TASKS_FILE = join(DATA_DIR, 'tasks.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getTasks(): TherapeuticTask[] {
  ensureDataDir();
  if (!existsSync(TASKS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveTasks(tasks: TherapeuticTask[]) {
  ensureDataDir();
  try {
    writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
    console.log(`Saved ${tasks.length} tasks to ${TASKS_FILE}`);
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw error;
  }
}

export function createTask(task: Omit<TherapeuticTask, 'id' | 'createdAt' | 'completed'>): TherapeuticTask {
  const tasks = getTasks();
  const newTask: TherapeuticTask = {
    ...task,
    id: uuidv4(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function getTasksByPatient(patientId: string): TherapeuticTask[] {
  const tasks = getTasks();
  return tasks.filter(t => t.patientId === patientId);
}

export function getTasksByPsychologist(psychologistId: string): TherapeuticTask[] {
  const tasks = getTasks();
  return tasks.filter(t => t.psychologistId === psychologistId);
}

export function updateTask(taskId: string, updates: Partial<TherapeuticTask>): TherapeuticTask | null {
  const tasks = getTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return null;
  }
  
  const task = tasks[taskIndex];
  
  // Handle attachments array merge
  if (updates.attachments && Array.isArray(updates.attachments)) {
    task.attachments = updates.attachments;
  } else {
    // Merge other updates
    Object.assign(task, updates);
  }
  
  if (updates.completed && !task.completedAt) {
    task.completedAt = new Date().toISOString();
  }
  if (updates.completed === false) {
    task.completedAt = undefined;
  }
  
  // Update the task in the array
  tasks[taskIndex] = task;
  saveTasks(tasks);
  
  console.log(`Task ${taskId} updated. Attachments:`, task.attachments?.length || 0);
  return task;
}

export { getTasks, saveTasks };

