import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ConsentRecord {
  id: string;
  patientId: string;
  psychologistId: string;
  type: 'data_processing' | 'therapy' | 'research' | 'communication' | 'data_sharing';
  consentGiven: boolean;
  date: string;
  ipAddress?: string;
  notes?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface DataAccessRequest {
  id: string;
  patientId: string;
  psychologistId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface DataBreachRecord {
  id: string;
  psychologistId: string;
  date: string;
  description: string;
  affectedPatients: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  reported: boolean;
  reportedAt?: string;
  measuresTaken: string[];
  createdAt: string;
}

export interface PrivacyPolicyVersion {
  id: string;
  version: string;
  content: string;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const CONSENTS_FILE = join(DATA_DIR, 'consents.json');
const DATA_ACCESS_REQUESTS_FILE = join(DATA_DIR, 'dataAccessRequests.json');
const DATA_BREACHES_FILE = join(DATA_DIR, 'dataBreaches.json');
const PRIVACY_POLICIES_FILE = join(DATA_DIR, 'privacyPolicies.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Consent Records
function getConsents(): ConsentRecord[] {
  ensureDataDir();
  if (!existsSync(CONSENTS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(CONSENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveConsents(consents: ConsentRecord[]) {
  ensureDataDir();
  writeFileSync(CONSENTS_FILE, JSON.stringify(consents, null, 2));
}

export function addConsent(consent: Omit<ConsentRecord, 'id' | 'createdAt'>): ConsentRecord {
  const consents = getConsents();
  const newConsent: ConsentRecord = {
    ...consent,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  consents.push(newConsent);
  saveConsents(consents);
  return newConsent;
}

export function getConsentsByPatient(patientId: string, psychologistId: string): ConsentRecord[] {
  const consents = getConsents();
  return consents.filter(c => c.patientId === patientId && c.psychologistId === psychologistId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function revokeConsent(consentId: string, patientId: string, psychologistId: string): boolean {
  const consents = getConsents();
  const consent = consents.find(c => c.id === consentId && c.patientId === patientId && c.psychologistId === psychologistId);
  
  if (!consent) return false;
  
  consent.consentGiven = false;
  consent.revokedAt = new Date().toISOString();
  saveConsents(consents);
  return true;
}

// Data Access Requests
function getDataAccessRequests(): DataAccessRequest[] {
  ensureDataDir();
  if (!existsSync(DATA_ACCESS_REQUESTS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(DATA_ACCESS_REQUESTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveDataAccessRequests(requests: DataAccessRequest[]) {
  ensureDataDir();
  writeFileSync(DATA_ACCESS_REQUESTS_FILE, JSON.stringify(requests, null, 2));
}

export function createDataAccessRequest(request: Omit<DataAccessRequest, 'id' | 'createdAt'>): DataAccessRequest {
  const requests = getDataAccessRequests();
  const newRequest: DataAccessRequest = {
    ...request,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  requests.push(newRequest);
  saveDataAccessRequests(requests);
  return newRequest;
}

export function getDataAccessRequestsByPsychologist(psychologistId: string): DataAccessRequest[] {
  const requests = getDataAccessRequests();
  return requests.filter(r => r.psychologistId === psychologistId)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export function updateDataAccessRequest(requestId: string, psychologistId: string, updates: Partial<DataAccessRequest>): DataAccessRequest | null {
  const requests = getDataAccessRequests();
  const request = requests.find(r => r.id === requestId && r.psychologistId === psychologistId);
  
  if (!request) return null;
  
  Object.assign(request, updates);
  if (updates.status === 'completed' && !request.completedAt) {
    request.completedAt = new Date().toISOString();
  }
  saveDataAccessRequests(requests);
  return request;
}

// Data Breaches
function getDataBreaches(): DataBreachRecord[] {
  ensureDataDir();
  if (!existsSync(DATA_BREACHES_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(DATA_BREACHES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveDataBreaches(breaches: DataBreachRecord[]) {
  ensureDataDir();
  writeFileSync(DATA_BREACHES_FILE, JSON.stringify(breaches, null, 2));
}

export function createDataBreachRecord(breach: Omit<DataBreachRecord, 'id' | 'createdAt'>): DataBreachRecord {
  const breaches = getDataBreaches();
  const newBreach: DataBreachRecord = {
    ...breach,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  breaches.push(newBreach);
  saveDataBreaches(breaches);
  return newBreach;
}

export function getDataBreachesByPsychologist(psychologistId: string): DataBreachRecord[] {
  const breaches = getDataBreaches();
  return breaches.filter(b => b.psychologistId === psychologistId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function markBreachAsReported(breachId: string, psychologistId: string): DataBreachRecord | null {
  const breaches = getDataBreaches();
  const breach = breaches.find(b => b.id === breachId && b.psychologistId === psychologistId);
  
  if (!breach) return null;
  
  breach.reported = true;
  breach.reportedAt = new Date().toISOString();
  saveDataBreaches(breaches);
  return breach;
}

// Privacy Policies
function getPrivacyPolicies(): PrivacyPolicyVersion[] {
  ensureDataDir();
  if (!existsSync(PRIVACY_POLICIES_FILE)) {
    // Initialize with default policy
    const defaultPolicy: PrivacyPolicyVersion = {
      id: uuidv4(),
      version: '1.0',
      content: `POLITICĂ DE CONFIDENȚIALITATE

1. PREAMBUL
Această politică de confidențialitate descrie modul în care colectăm, utilizăm și protejăm datele personale ale pacienților, în conformitate cu Regulamentul General privind Protecția Datelor (GDPR) și legislația română aplicabilă.

2. DATE COLECTATE
- Date de identificare (nume, CNP, adresă)
- Date de contact (email, telefon)
- Date medicale și de sănătate
- Notițe de ședință și evaluări
- Date de plată

3. FINALITATEA PRELUĂRII
Datele sunt prelucrate exclusiv pentru:
- Furnizarea serviciilor de terapie
- Gestionarea programărilor
- Facturare și plată
- Respectarea obligațiilor legale

4. DREPTURILE PACIENTULUI
Conform GDPR, aveți dreptul la:
- Acces la datele personale
- Rectificare
- Ștergere (dreptul de a fi uitat)
- Restricționarea prelucrării
- Portabilitatea datelor
- Opoziție

5. SECURITATEA DATELOR
Implementăm măsuri tehnice și organizatorice pentru protejarea datelor:
- Criptare a datelor sensibile
- Backup securizat
- Acces restricționat
- Audit regulat

6. PERIOADA DE PĂSTRARE
Datele sunt păstrate conform cerințelor legale (minimum 10 ani pentru documentele medicale).

7. CONTACT
Pentru întrebări despre prelucrarea datelor, contactați-ne la: [email]`,
      effectiveDate: new Date().toISOString().split('T')[0],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    savePrivacyPolicies([defaultPolicy]);
    return [defaultPolicy];
  }
  try {
    const data = readFileSync(PRIVACY_POLICIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function savePrivacyPolicies(policies: PrivacyPolicyVersion[]) {
  ensureDataDir();
  writeFileSync(PRIVACY_POLICIES_FILE, JSON.stringify(policies, null, 2));
}

export function getActivePrivacyPolicy(): PrivacyPolicyVersion | null {
  const policies = getPrivacyPolicies();
  return policies.find(p => p.isActive) || null;
}

export function createPrivacyPolicyVersion(policy: Omit<PrivacyPolicyVersion, 'id' | 'createdAt'>): PrivacyPolicyVersion {
  const policies = getPrivacyPolicies();
  
  // Deactivate old policies
  policies.forEach(p => p.isActive = false);
  
  const newPolicy: PrivacyPolicyVersion = {
    ...policy,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  policies.push(newPolicy);
  savePrivacyPolicies(policies);
  return newPolicy;
}
