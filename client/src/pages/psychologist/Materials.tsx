import { useState, useEffect } from 'react';
import axios from 'axios';

interface PsychoEducationMaterial {
  id: string;
  psychologistId?: string;
  patientIds?: string[];
  isGeneral?: boolean;
  title: string;
  description: string;
  type: 'video' | 'podcast' | 'infographic' | 'file' | 'worksheet';
  category: 'anxiety' | 'depression' | 'stress' | 'mindfulness' | 'cbt' | 'general';
  url: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
  duration?: number;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  anxiety: 'Anxietate',
  depression: 'Depresie',
  stress: 'Stres',
  mindfulness: 'Mindfulness',
  cbt: 'CBT',
  general: 'General'
};

interface Patient {
  id: string;
  name: string;
}

export default function PsychologistMaterials() {
  const [materials, setMaterials] = useState<PsychoEducationMaterial[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [shareMode, setShareMode] = useState<'all' | 'selected' | 'general'>('all');
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video' as 'video' | 'podcast' | 'infographic' | 'file' | 'worksheet',
    category: 'general' as 'anxiety' | 'depression' | 'stress' | 'mindfulness' | 'cbt' | 'general',
    url: '',
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    fileType: '',
    thumbnailUrl: '',
    duration: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await axios.get('/api/patients/my-patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to load patients', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await axios.get('/api/materials/all');
      setMaterials(response.data.sort((a: PsychoEducationMaterial, b: PsychoEducationMaterial) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load materials', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Fișierul este prea mare. Te rugăm să folosești un fișier mai mic de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileUrl = reader.result as string;
      setFormData({
        ...formData,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: fileUrl // Also set url for compatibility
      });
    };
    reader.onerror = () => {
      alert('Eroare la citirea fișierului');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        duration: formData.duration ? Number(formData.duration) : undefined,
        fileSize: formData.fileSize || undefined
      };

      // Set sharing options
      if (shareMode === 'general') {
        payload.isGeneral = true;
        payload.psychologistId = undefined;
        payload.patientIds = undefined;
      } else if (shareMode === 'selected') {
        payload.isGeneral = false;
        payload.patientIds = selectedPatientIds;
      } else {
        // 'all' - share with all my patients
        payload.isGeneral = false;
        payload.patientIds = undefined; // undefined means all patients
      }

      await axios.post('/api/materials', payload, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      setShowForm(false);
      setShareMode('all');
      setSelectedPatientIds([]);
      setFormData({
        title: '',
        description: '',
        type: 'video',
        category: 'general',
        url: '',
        fileUrl: '',
        fileName: '',
        fileSize: 0,
        fileType: '',
        thumbnailUrl: '',
        duration: ''
      });
      if (fileInput) {
        fileInput.value = '';
      }
      await loadMaterials();
      alert('Materialul a fost creat și partajat!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la crearea materialului');
      console.error('Error creating material:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest material?')) return;
    
    try {
      await axios.delete(`/api/materials/${id}`);
      await loadMaterials();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la ștergerea materialului');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const myMaterials = materials.filter(m => m.psychologistId);
  const generalMaterials = materials.filter(m => !m.psychologistId);

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Resurse psycho-educaționale</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          {showForm ? 'Anulează' : '+ Adaugă material'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Adaugă material nou</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titlu *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Cum să gestionezi anxietatea"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descriere *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrie materialul..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tip *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setFormData({ 
                      ...formData, 
                      type: newType,
                      url: (newType === 'file' || newType === 'worksheet') ? '' : formData.url,
                      fileUrl: (newType === 'file' || newType === 'worksheet') ? formData.fileUrl : ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="video">🎥 Video</option>
                  <option value="podcast">🎙️ Podcast</option>
                  <option value="infographic">📊 Infografic</option>
                  <option value="file">📄 Fișier (PDF, DOC, etc.)</option>
                  <option value="worksheet">📝 Fișă de lucru</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="general">General</option>
                  <option value="anxiety">Anxietate</option>
                  <option value="depression">Depresie</option>
                  <option value="stress">Stres</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="cbt">CBT</option>
                </select>
              </div>
            </div>

            {(formData.type === 'file' || formData.type === 'worksheet') ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Încarcă fișier * (PDF, DOC, DOCX, etc. - max 10MB)
                </label>
                <input
                  ref={(input) => setFileInput(input)}
                  type="file"
                  required={!formData.fileUrl}
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {formData.fileName && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Fișier selectat: {formData.fileName} ({(formData.fileSize / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formate acceptate: PDF, DOC, DOCX, TXT, XLS, XLSX. Mărime maximă: 10MB.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL * (link către video/podcast/infographic)
                </label>
                <input
                  type="url"
                  required={formData.type !== 'file' && formData.type !== 'worksheet'}
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://youtube.com/... sau https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pentru video: link YouTube sau Vimeo. Pentru podcast: link către fișier audio sau streaming.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail URL (opțional)
                </label>
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durată (minute, opțional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="ex: 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Sharing Options */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Partajare cu pacienți *
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shareMode"
                    value="all"
                    checked={shareMode === 'all'}
                    onChange={(e) => {
                      setShareMode('all');
                      setSelectedPatientIds([]);
                    }}
                    className="text-primary-600"
                  />
                  <span className="text-gray-700">
                    📋 Toți pacienții mei (materialul va fi disponibil pentru toți pacienții tăi)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shareMode"
                    value="selected"
                    checked={shareMode === 'selected'}
                    onChange={(e) => setShareMode('selected')}
                    className="text-primary-600"
                  />
                  <span className="text-gray-700">
                    👥 Pacienți selectați (alege pacienții specifici)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shareMode"
                    value="general"
                    checked={shareMode === 'general'}
                    onChange={(e) => {
                      setShareMode('general');
                      setSelectedPatientIds([]);
                    }}
                    className="text-primary-600"
                  />
                  <span className="text-gray-700">
                    🌐 General (disponibil pentru toți pacienții tuturor psihologilor)
                  </span>
                </label>
              </div>

              {shareMode === 'selected' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selectează pacienții:
                  </label>
                  {patients.length === 0 ? (
                    <p className="text-sm text-gray-500">Nu ai pacienți încă.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {patients.map(patient => (
                        <label key={patient.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPatientIds.includes(patient.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPatientIds([...selectedPatientIds, patient.id]);
                              } else {
                                setSelectedPatientIds(selectedPatientIds.filter(id => id !== patient.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">{patient.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedPatientIds.length > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ {selectedPatientIds.length} pacient{selectedPatientIds.length > 1 ? 'i' : ''} selectat{selectedPatientIds.length > 1 ? 'i' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={shareMode === 'selected' && selectedPatientIds.length === 0}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Creează și partajează material
            </button>
          </form>
        </div>
      )}

      {/* My Materials */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Materialele mele ({myMaterials.length})</h2>
        {myMaterials.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Nu ai creat materiale încă
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myMaterials.map(material => (
              <div key={material.id} className="bg-white rounded-lg shadow p-6">
                <div className="text-4xl mb-3">
                  {material.type === 'video' && '🎥'}
                  {material.type === 'podcast' && '🎙️'}
                  {material.type === 'infographic' && '📊'}
                  {material.type === 'file' && '📄'}
                  {material.type === 'worksheet' && '📝'}
                </div>
                <h3 className="text-xl font-semibold mb-2">{material.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{material.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    {categoryLabels[material.category]}
                  </span>
                  {material.duration && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {material.duration} min
                    </span>
                  )}
                  {material.fileName && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      📎 {material.fileName}
                    </span>
                  )}
                </div>
                <div className="mb-3">
                  {material.isGeneral ? (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                      🌐 General (toți pacienții)
                    </span>
                  ) : material.patientIds && material.patientIds.length > 0 ? (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                      👥 {material.patientIds.length} pacient{material.patientIds.length > 1 ? 'i' : ''} selectat{material.patientIds.length > 1 ? 'i' : ''}
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      📋 Toți pacienții mei
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {(material.type === 'file' || material.type === 'worksheet') && material.fileUrl && (
                    <a
                      href={material.fileUrl}
                      download={material.fileName || 'download'}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Descarcă →
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General Materials */}
      {generalMaterials.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Materiale generale ({generalMaterials.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generalMaterials.map(material => (
              <div key={material.id} className="bg-white rounded-lg shadow p-6 opacity-75">
                <div className="text-4xl mb-3">
                  {material.type === 'video' && '🎥'}
                  {material.type === 'podcast' && '🎙️'}
                  {material.type === 'infographic' && '📊'}
                </div>
                <h3 className="text-xl font-semibold mb-2">{material.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{material.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    {categoryLabels[material.category]}
                  </span>
                  {material.duration && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {material.duration} min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

