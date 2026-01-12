import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface PsychoEducationMaterial {
  id: string;
  psychologistId?: string; // undefined = material general disponibil tuturor
  patientIds?: string[]; // IDs of specific patients (if empty or undefined, available to all psychologist's patients)
  isGeneral?: boolean; // true = available to all patients of all psychologists
  title: string;
  description: string;
  type: 'video' | 'podcast' | 'infographic' | 'file' | 'worksheet';
  category: 'anxiety' | 'depression' | 'stress' | 'mindfulness' | 'cbt' | 'general';
  url: string; // URL pentru video/podcast sau link către infographic/file
  fileUrl?: string; // Base64 data URL pentru fișiere încărcate
  fileName?: string; // Numele fișierului pentru documente
  fileSize?: number; // Mărimea fișierului în bytes
  fileType?: string; // Tipul fișierului (application/pdf, etc.)
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
  // Return:
  // 1. General materials (isGeneral = true or no psychologistId and no patientIds)
  // 2. Materials from patient's psychologist (if no specific patientIds or patient is in patientIds)
  return materials.filter(m => {
    // General materials available to everyone
    if (m.isGeneral || (!m.psychologistId && !m.patientIds)) {
      return true;
    }
    
    // Materials from patient's psychologist
    if (m.psychologistId === psychologistId) {
      // If no specific patientIds, available to all patients of this psychologist
      if (!m.patientIds || m.patientIds.length === 0) {
        return true;
      }
      // If specific patientIds, check if this patient is included
      return m.patientIds.includes(patientId);
    }
    
    return false;
  });
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

