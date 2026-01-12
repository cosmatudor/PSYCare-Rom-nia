import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface BackupRecord {
  id: string;
  psychologistId?: string; // undefined = system-wide backup
  type: 'full' | 'incremental' | 'manual';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  filePath?: string;
  fileSize?: number;
  encrypted: boolean;
  checksum?: string;
  error?: string;
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const BACKUPS_DIR = join(process.cwd(), 'backups');
const BACKUP_RECORDS_FILE = join(DATA_DIR, 'backupRecords.json');
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production'; // Should be 32 bytes for AES-256

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(BACKUPS_DIR)) {
    mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function getBackupRecords(): BackupRecord[] {
  ensureDataDir();
  if (!existsSync(BACKUP_RECORDS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(BACKUP_RECORDS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveBackupRecords(records: BackupRecord[]) {
  ensureDataDir();
  writeFileSync(BACKUP_RECORDS_FILE, JSON.stringify(records, null, 2));
}

function encryptData(data: string): { encrypted: string; iv: string } {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return { encrypted, iv: iv.toString('hex') };
}

function decryptData(encrypted: string, ivHex: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

function getAllDataFiles(): string[] {
  ensureDataDir();
  if (!existsSync(DATA_DIR)) {
    return [];
  }
  
  const files: string[] = [];
  const entries = readdirSync(DATA_DIR);
  
  for (const entry of entries) {
    const fullPath = join(DATA_DIR, entry);
    const stat = statSync(fullPath);
    if (stat.isFile() && entry.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function calculateChecksum(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function createBackup(psychologistId?: string, type: 'full' | 'incremental' | 'manual' = 'manual', encrypt: boolean = true): BackupRecord {
  const records = getBackupRecords();
  const backupId = uuidv4();
  const startedAt = new Date().toISOString();
  
  const backupRecord: BackupRecord = {
    id: backupId,
    psychologistId,
    type,
    status: 'in_progress',
    startedAt,
    encrypted: encrypt,
    createdAt: startedAt
  };
  
  records.push(backupRecord);
  saveBackupRecords(records);
  
  try {
    // Collect all data files
    const dataFiles = getAllDataFiles();
    const backupData: Record<string, any> = {
      timestamp: startedAt,
      psychologistId,
      type,
      files: {}
    };
    
    // Read all data files
    for (const filePath of dataFiles) {
      try {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
        const content = readFileSync(filePath, 'utf-8');
        backupData.files[fileName] = JSON.parse(content);
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }
    
    const backupJson = JSON.stringify(backupData, null, 2);
    const checksum = calculateChecksum(backupJson);
    
    // Encrypt if requested
    let finalData = backupJson;
    if (encrypt) {
      const { encrypted, iv } = encryptData(backupJson);
      finalData = JSON.stringify({ encrypted, iv, checksum });
    }
    
    // Save backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}-${backupId.substring(0, 8)}.json`;
    const backupFilePath = join(BACKUPS_DIR, fileName);
    
    writeFileSync(backupFilePath, finalData);
    const fileSize = statSync(backupFilePath).size;
    
    // Update backup record
    backupRecord.status = 'completed';
    backupRecord.completedAt = new Date().toISOString();
    backupRecord.filePath = backupFilePath;
    backupRecord.fileSize = fileSize;
    backupRecord.checksum = checksum;
    
    const recordIndex = records.findIndex(r => r.id === backupId);
    if (recordIndex !== -1) {
      records[recordIndex] = backupRecord;
      saveBackupRecords(records);
    }
    
    return backupRecord;
  } catch (error: any) {
    backupRecord.status = 'failed';
    backupRecord.error = error.message;
    backupRecord.completedAt = new Date().toISOString();
    
    const recordIndex = records.findIndex(r => r.id === backupId);
    if (recordIndex !== -1) {
      records[recordIndex] = backupRecord;
      saveBackupRecords(records);
    }
    
    throw error;
  }
}

export function getBackupRecordsByPsychologist(psychologistId?: string): BackupRecord[] {
  const records = getBackupRecords();
  if (psychologistId) {
    return records.filter(r => r.psychologistId === psychologistId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
  return records.filter(r => !r.psychologistId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function getBackupById(backupId: string): BackupRecord | null {
  const records = getBackupRecords();
  return records.find(r => r.id === backupId) || null;
}

export function getDecryptedBackupContent(backupId: string): string | null {
  const backup = getBackupById(backupId);
  if (!backup || !backup.filePath || !existsSync(backup.filePath)) {
    return null;
  }

  try {
    const fileContent = readFileSync(backup.filePath, 'utf-8');
    
    if (backup.encrypted) {
      // Try to parse as encrypted format
      try {
        const encryptedData = JSON.parse(fileContent);
        if (encryptedData.encrypted && encryptedData.iv) {
          return decryptData(encryptedData.encrypted, encryptedData.iv);
        }
      } catch {
        // If parsing fails, might be old format or corrupted
        return null;
      }
    }
    
    // Not encrypted or already decrypted
    return fileContent;
  } catch (error) {
    console.error('Error reading backup file:', error);
    return null;
  }
}

export function deleteBackup(backupId: string): boolean {
  const records = getBackupRecords();
  const backup = records.find(r => r.id === backupId);
  
  if (!backup) return false;
  
  // Delete backup file if exists
  if (backup.filePath && existsSync(backup.filePath)) {
    try {
      const { unlinkSync } = require('fs');
      unlinkSync(backup.filePath);
    } catch (error) {
      console.error('Error deleting backup file:', error);
    }
  }
  
  // Remove from records
  const filtered = records.filter(r => r.id !== backupId);
  saveBackupRecords(filtered);
  return true;
}

export function getBackupStats(): { total: number; totalSize: number; byStatus: Record<string, number> } {
  const records = getBackupRecords();
  const completed = records.filter(r => r.status === 'completed');
  const totalSize = completed.reduce((sum, r) => sum + (r.fileSize || 0), 0);
  
  const byStatus: Record<string, number> = {};
  records.forEach(r => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });
  
  return {
    total: records.length,
    totalSize,
    byStatus
  };
}
