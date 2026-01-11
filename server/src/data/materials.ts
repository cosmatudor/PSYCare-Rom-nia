import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface PsychoEducationMaterial {
  id: string;
  psychologistId?: string; // undefined = material general disponibil tuturor
  title: string;
  description: string;
  type: 'video' | 'podcast' | 'infographic';
  category: 'anxiety' | 'depression' | 'stress' | 'mindfulness' | 'cbt' | 'general';
  url: string; // URL pentru video/podcast sau link către infographic
  thumbnailUrl?: string; // Pentru video/infographic
  duration?: number; // În minute, pentru video/podcast
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const MATERIALS_FILE = join(DATA_DIR, 'materials.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getMaterials(): PsychoEducationMaterial[] {
  ensureDataDir();
  if (!existsSync(MATERIALS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(MATERIALS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveMaterials(materials: PsychoEducationMaterial[]) {
  ensureDataDir();
  writeFileSync(MATERIALS_FILE, JSON.stringify(materials, null, 2));
}

export function createMaterial(material: Omit<PsychoEducationMaterial, 'id' | 'createdAt'>): PsychoEducationMaterial {
  const materials = getMaterials();
  const newMaterial: PsychoEducationMaterial = {
    ...material,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  materials.push(newMaterial);
  saveMaterials(materials);
  return newMaterial;
}

export function getMaterialsForPatient(patientId: string, psychologistId?: string): PsychoEducationMaterial[] {
  const materials = getMaterials();
  // Return general materials + materials from patient's psychologist
  return materials.filter(m => 
    !m.psychologistId || // General materials
    m.psychologistId === psychologistId // Materials from patient's psychologist
  );
}

export function getMaterialsByPsychologist(psychologistId: string): PsychoEducationMaterial[] {
  const materials = getMaterials();
  return materials.filter(m => m.psychologistId === psychologistId);
}

export function deleteMaterial(materialId: string, psychologistId: string): boolean {
  const materials = getMaterials();
  const material = materials.find(m => m.id === materialId);
  
  if (!material || material.psychologistId !== psychologistId) {
    return false;
  }
  
  const filtered = materials.filter(m => m.id !== materialId);
  saveMaterials(filtered);
  return true;
}

export { getMaterials, saveMaterials };

