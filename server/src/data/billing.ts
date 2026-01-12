import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Invoice {
  id: string;
  psychologistId: string;
  patientId: string;
  invoiceNumber: string; // Format: INV-YYYY-MM-XXXX
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PsychologistBillingSettings {
  psychologistId: string;
  companyName?: string;
  taxId?: string; // CUI
  address?: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  iban?: string;
  taxRate?: number; // Procent TVA (ex: 19 pentru 19%)
  currency: string; // RON, EUR, USD
  invoicePrefix: string; // Prefix pentru numărul de factură
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const INVOICES_FILE = join(DATA_DIR, 'invoices.json');
const BILLING_SETTINGS_FILE = join(DATA_DIR, 'billingSettings.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInvoices(): Invoice[] {
  ensureDataDir();
  if (!existsSync(INVOICES_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(INVOICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveInvoices(invoices: Invoice[]) {
  ensureDataDir();
  writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));
}

function getBillingSettings(): PsychologistBillingSettings[] {
  ensureDataDir();
  if (!existsSync(BILLING_SETTINGS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(BILLING_SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveBillingSettings(settings: PsychologistBillingSettings[]) {
  ensureDataDir();
  writeFileSync(BILLING_SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function generateInvoiceNumber(psychologistId: string, prefix: string = 'INV'): string {
  const invoices = getInvoices();
  const psychologistInvoices = invoices.filter(i => i.psychologistId === psychologistId);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Count invoices for this month
  const monthInvoices = psychologistInvoices.filter(i => {
    const invoiceDate = new Date(i.date);
    return invoiceDate.getFullYear() === year && invoiceDate.getMonth() === now.getMonth();
  });
  
  const sequence = String(monthInvoices.length + 1).padStart(4, '0');
  return `${prefix}-${year}-${month}-${sequence}`;
}

export function getBillingSettingsByPsychologist(psychologistId: string): PsychologistBillingSettings | null {
  const settings = getBillingSettings();
  return settings.find(s => s.psychologistId === psychologistId) || null;
}

export function createOrUpdateBillingSettings(psychologistId: string, settings: Partial<Omit<PsychologistBillingSettings, 'psychologistId' | 'createdAt' | 'updatedAt'>>): PsychologistBillingSettings {
  const allSettings = getBillingSettings();
  const existing = allSettings.find(s => s.psychologistId === psychologistId);

  if (existing) {
    Object.assign(existing, settings, { updatedAt: new Date().toISOString() });
    saveBillingSettings(allSettings);
    return existing;
  } else {
    const newSettings: PsychologistBillingSettings = {
      psychologistId,
      currency: 'RON',
      invoicePrefix: 'INV',
      ...settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    allSettings.push(newSettings);
    saveBillingSettings(allSettings);
    return newSettings;
  }
}

export function createInvoice(psychologistId: string, invoice: Omit<Invoice, 'id' | 'psychologistId' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Invoice {
  const invoices = getInvoices();
  const settings = getBillingSettingsByPsychologist(psychologistId);
  const prefix = settings?.invoicePrefix || 'INV';
  
  const newInvoice: Invoice = {
    ...invoice,
    id: uuidv4(),
    psychologistId,
    invoiceNumber: generateInvoiceNumber(psychologistId, prefix),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  invoices.push(newInvoice);
  saveInvoices(invoices);
  return newInvoice;
}

export function getInvoicesByPsychologist(psychologistId: string): Invoice[] {
  const invoices = getInvoices();
  return invoices.filter(i => i.psychologistId === psychologistId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getInvoiceById(invoiceId: string, psychologistId: string): Invoice | null {
  const invoices = getInvoices();
  const invoice = invoices.find(i => i.id === invoiceId && i.psychologistId === psychologistId);
  return invoice || null;
}

export function updateInvoice(invoiceId: string, psychologistId: string, updates: Partial<Invoice>): Invoice | null {
  const invoices = getInvoices();
  const invoice = invoices.find(i => i.id === invoiceId && i.psychologistId === psychologistId);
  
  if (!invoice) return null;
  
  Object.assign(invoice, updates, { updatedAt: new Date().toISOString() });
  saveInvoices(invoices);
  return invoice;
}

export function markInvoiceAsPaid(invoiceId: string, psychologistId: string, paymentMethod: string, paymentDate?: string): Invoice | null {
  return updateInvoice(invoiceId, psychologistId, {
    status: 'paid',
    paymentMethod,
    paymentDate: paymentDate || new Date().toISOString().split('T')[0]
  });
}
