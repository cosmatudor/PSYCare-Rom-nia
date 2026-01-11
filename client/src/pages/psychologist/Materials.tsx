import { useState, useEffect } from 'react';
import axios from 'axios';

interface PsychoEducationMaterial {
  id: string;
  psychologistId?: string;
  title: string;
  description: string;
  type: 'video' | 'podcast' | 'infographic';
  category: 'anxiety' | 'depression' | 'stress' | 'mindfulness' | 'cbt' | 'general';
  url: string;
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

export default function PsychologistMaterials() {
  const [materials, setMaterials] = useState<PsychoEducationMaterial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video' as 'video' | 'podcast' | 'infographic',
    category: 'general' as 'anxiety' | 'depression' | 'stress' | 'mindfulness' | 'cbt' | 'general',
    url: '',
    thumbnailUrl: '',
    duration: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/materials', {
        ...formData,
        duration: formData.duration ? Number(formData.duration) : undefined
      });
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'video',
        category: 'general',
        url: '',
        thumbnailUrl: '',
        duration: ''
      });
      await loadMaterials();
      alert('Materialul a fost creat!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la crearea materialului');
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
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="video">🎥 Video</option>
                  <option value="podcast">🎙️ Podcast</option>
                  <option value="infographic">📊 Infografic</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL * (link către video/podcast/infographic)
              </label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://youtube.com/... sau https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pentru video: link YouTube sau Vimeo. Pentru podcast: link către fișier audio sau streaming.
              </p>
            </div>

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

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Creează material
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
                </div>
                <button
                  onClick={() => handleDelete(material.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Șterge
                </button>
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

