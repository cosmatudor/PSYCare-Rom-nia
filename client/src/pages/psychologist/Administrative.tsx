import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface BillingSettings {
  companyName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  iban?: string;
  taxRate?: number;
  currency: string;
  invoicePrefix: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
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
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Patient {
  id: string;
  name: string;
}

interface ConsentRecord {
  id: string;
  patientId: string;
  type: string;
  consentGiven: boolean;
  date: string;
  revokedAt?: string;
}

interface DataAccessRequest {
  id: string;
  patientId: string;
  type: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
}

interface DataBreachRecord {
  id: string;
  date: string;
  description: string;
  affectedPatients: string[];
  severity: string;
  reported: boolean;
}

interface BackupRecord {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  fileSize?: number;
  encrypted: boolean;
}

export default function Administrative() {
  const [activeTab, setActiveTab] = useState<'billing' | 'gdpr' | 'backup'>('billing');
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [dataAccessRequests, setDataAccessRequests] = useState<DataAccessRequest[]>([]);
  const [dataBreaches, setDataBreaches] = useState<DataBreachRecord[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedPatientForInvoice, setSelectedPatientForInvoice] = useState<string>('');
  const [invoiceForm, setInvoiceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: 0 }] as Array<{ description: string; quantity: number; unitPrice: number }>,
    tax: 19,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'billing') {
        await Promise.all([loadBillingSettings(), loadInvoices(), loadPatients()]);
      } else if (activeTab === 'gdpr') {
        await Promise.all([loadDataAccessRequests(), loadDataBreaches()]);
      } else if (activeTab === 'backup') {
        await Promise.all([loadBackups(), loadBackupStats()]);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBillingSettings = async () => {
    try {
      const response = await axios.get('/api/billing/settings');
      setBillingSettings(response.data);
    } catch (error) {
      console.error('Failed to load billing settings', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await axios.get('/api/billing/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to load invoices', error);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await axios.get('/api/patients/my-patients');
      const patientsMap: Record<string, Patient> = {};
      response.data.forEach((p: Patient) => {
        patientsMap[p.id] = p;
      });
      setPatients(patientsMap);
    } catch (error) {
      console.error('Failed to load patients', error);
    }
  };

  const loadDataAccessRequests = async () => {
    try {
      const response = await axios.get('/api/gdpr/data-access-requests');
      setDataAccessRequests(response.data);
    } catch (error) {
      console.error('Failed to load data access requests', error);
    }
  };

  const loadDataBreaches = async () => {
    try {
      const response = await axios.get('/api/gdpr/data-breaches');
      setDataBreaches(response.data);
    } catch (error) {
      console.error('Failed to load data breaches', error);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await axios.get('/api/backup');
      setBackups(response.data);
    } catch (error) {
      console.error('Failed to load backups', error);
    }
  };

  const loadBackupStats = async () => {
    try {
      const response = await axios.get('/api/backup/stats');
      setBackupStats(response.data);
    } catch (error) {
      console.error('Failed to load backup stats', error);
    }
  };

  const handleSaveBillingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/billing/settings', billingSettings);
      alert('Setările de facturare au fost salvate!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la salvarea setărilor');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForInvoice) {
      alert('Selectează un pacient');
      return;
    }

    try {
      await axios.post('/api/billing/invoices', {
        patientId: selectedPatientForInvoice,
        ...invoiceForm
      });
      setShowInvoiceForm(false);
      setInvoiceForm({
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        tax: 19,
        notes: ''
      });
      await loadInvoices();
      alert('Factura a fost creată!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la crearea facturii');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await axios.post('/api/backup', { type: 'manual', encrypt: true });
      alert('Backup-ul a fost creat cu succes!');
      await loadBackups();
      await loadBackupStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la crearea backup-ului');
    }
  };

  const handleDownloadInvoicePDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await axios.get(`/api/billing/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la generarea PDF-ului');
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const response = await axios.get(`/api/backup/${backupId}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${backupId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la descărcarea backup-ului');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Administrativ și legal</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('billing')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'billing'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💰 Facturare
          </button>
          <button
            onClick={() => setActiveTab('gdpr')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gdpr'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔒 GDPR/Confidențialitate
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'backup'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💾 Backup
          </button>
        </nav>
      </div>

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Billing Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Setări facturare</h2>
            <form onSubmit={handleSaveBillingSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nume companie</label>
                  <input
                    type="text"
                    value={billingSettings?.companyName || ''}
                    onChange={(e) => setBillingSettings({ ...billingSettings!, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CUI</label>
                  <input
                    type="text"
                    value={billingSettings?.taxId || ''}
                    onChange={(e) => setBillingSettings({ ...billingSettings!, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresă</label>
                <input
                  type="text"
                  value={billingSettings?.address || ''}
                  onChange={(e) => setBillingSettings({ ...billingSettings!, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
                  <input
                    type="text"
                    value={billingSettings?.iban || ''}
                    onChange={(e) => setBillingSettings({ ...billingSettings!, iban: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TVA (%)</label>
                  <input
                    type="number"
                    value={billingSettings?.taxRate || 19}
                    onChange={(e) => setBillingSettings({ ...billingSettings!, taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
                Salvează setările
              </button>
            </form>
          </div>

          {/* Create Invoice */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Facturi</h2>
              <button
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                {showInvoiceForm ? 'Anulează' : '+ Factură nouă'}
              </button>
            </div>

            {showInvoiceForm && (
              <form onSubmit={handleCreateInvoice} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pacient *</label>
                  <select
                    required
                    value={selectedPatientForInvoice}
                    onChange={(e) => setSelectedPatientForInvoice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selectează pacient</option>
                    {Object.values(patients).map(patient => (
                      <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data facturii</label>
                    <input
                      type="date"
                      required
                      value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scadență</label>
                    <input
                      type="date"
                      required
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Servicii</label>
                  {invoiceForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Descriere"
                        required
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...invoiceForm.items];
                          newItems[index].description = e.target.value;
                          setInvoiceForm({ ...invoiceForm, items: newItems });
                        }}
                        className="col-span-6 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="number"
                        placeholder="Cantitate"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...invoiceForm.items];
                          newItems[index].quantity = Number(e.target.value);
                          setInvoiceForm({ ...invoiceForm, items: newItems });
                        }}
                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="number"
                        placeholder="Preț unitar"
                        required
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...invoiceForm.items];
                          newItems[index].unitPrice = Number(e.target.value);
                          setInvoiceForm({ ...invoiceForm, items: newItems });
                        }}
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = invoiceForm.items.filter((_, i) => i !== index);
                          setInvoiceForm({ ...invoiceForm, items: newItems });
                        }}
                        className="col-span-1 text-red-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, { description: '', quantity: 1, unitPrice: 0 }] })}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    + Adaugă serviciu
                  </button>
                </div>
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
                  Creează factură
                </button>
              </form>
            )}

            {/* Invoices List */}
            {invoices.length === 0 ? (
              <p className="text-gray-500">Nu există facturi.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map(invoice => {
                  const patient = patients[invoice.patientId];
                  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
                  const taxAmount = invoice.tax || 0;
                  const total = subtotal + taxAmount;
                  
                  return (
                    <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">{patient?.name || 'Pacient necunoscut'}</p>
                          <p className="text-sm text-gray-600">{format(new Date(invoice.date), "d MMMM yyyy", { locale: ro })}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="font-bold text-lg">{total.toFixed(2)} {billingSettings?.currency || 'RON'}</p>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => handleDownloadInvoicePDF(invoice.id, invoice.invoiceNumber)}
                              className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                            >
                              📄 PDF
                            </button>
                            <span className={`px-2 py-1 rounded text-xs ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                              invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                              invoice.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {invoice.status === 'paid' ? 'Plătită' :
                               invoice.status === 'sent' ? 'Trimisă' :
                               invoice.status === 'cancelled' ? 'Anulată' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GDPR Tab */}
      {activeTab === 'gdpr' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cereri de acces la date</h2>
            {dataAccessRequests.length === 0 ? (
              <p className="text-gray-500">Nu există cereri de acces la date.</p>
            ) : (
              <div className="space-y-2">
                {dataAccessRequests.map(request => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Cerere {request.type}</p>
                        <p className="text-sm text-gray-600">{format(new Date(request.requestedAt), "d MMMM yyyy", { locale: ro })}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        request.status === 'completed' ? 'bg-green-100 text-green-700' :
                        request.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {request.status === 'completed' ? 'Completată' :
                         request.status === 'in_progress' ? 'În procesare' : 'În așteptare'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Înregistrări de încălcări</h2>
            {dataBreaches.length === 0 ? (
              <p className="text-gray-500">Nu există înregistrări de încălcări.</p>
            ) : (
              <div className="space-y-2">
                {dataBreaches.map(breach => (
                  <div key={breach.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{breach.description}</p>
                        <p className="text-sm text-gray-600">{format(new Date(breach.date), "d MMMM yyyy", { locale: ro })}</p>
                        <p className="text-sm text-gray-600">{breach.affectedPatients.length} pacienți afectați</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          breach.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          breach.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          breach.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {breach.severity}
                        </span>
                        {breach.reported && (
                          <p className="text-xs text-green-600 mt-1">Raportat</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {backupStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Statistici backup</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total backup-uri</p>
                  <p className="text-2xl font-bold">{backupStats.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dimensiune totală</p>
                  <p className="text-2xl font-bold">{formatFileSize(backupStats.totalSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completate</p>
                  <p className="text-2xl font-bold">{backupStats.byStatus?.completed || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Backup-uri</h2>
              <button
                onClick={handleCreateBackup}
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                + Creează backup
              </button>
            </div>

            {backups.length === 0 ? (
              <p className="text-gray-500">Nu există backup-uri.</p>
            ) : (
              <div className="space-y-2">
                {backups.map(backup => (
                  <div key={backup.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Backup {backup.type}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(backup.startedAt), "d MMMM yyyy HH:mm", { locale: ro })}
                        </p>
                        {backup.encrypted && (
                          <p className="text-xs text-green-600">🔒 Criptat</p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex gap-2 items-center">
                          {backup.status === 'completed' && (
                            <button
                              onClick={() => handleDownloadBackup(backup.id)}
                              className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                            >
                              📥 Descarcă
                            </button>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            backup.status === 'completed' ? 'bg-green-100 text-green-700' :
                            backup.status === 'failed' ? 'bg-red-100 text-red-700' :
                            backup.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {backup.status === 'completed' ? 'Completat' :
                             backup.status === 'failed' ? 'Eșuat' :
                             backup.status === 'in_progress' ? 'În progres' : 'În așteptare'}
                          </span>
                        </div>
                        {backup.fileSize && (
                          <p className="text-xs text-gray-600">{formatFileSize(backup.fileSize)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
