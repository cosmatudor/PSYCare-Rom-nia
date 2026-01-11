import { useState, useEffect } from 'react';
import axios from 'axios';

interface PsychoEducationMaterial {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'podcast' | 'infographic';
  category: 'anxiety' | 'depression' | 'stress' | 'mindfulness' | 'cbt' | 'general';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
}

const categoryLabels: Record<string, string> = {
  anxiety: 'Anxietate',
  depression: 'Depresie',
  stress: 'Stres',
  mindfulness: 'Mindfulness',
  cbt: 'CBT',
  general: 'General'
};

export default function PatientMaterials() {
  const [materials, setMaterials] = useState<PsychoEducationMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<PsychoEducationMaterial | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await axios.get('/api/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Failed to load materials', error);
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    // Extract YouTube video ID from various URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const filteredMaterials = selectedCategory === 'all' 
    ? materials 
    : materials.filter(m => m.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(materials.map(m => m.category)))];

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (selectedMaterial) {
    return (
      <div className="px-4 py-6">
        <button
          onClick={() => setSelectedMaterial(null)}
          className="mb-4 text-primary-600 hover:text-primary-700"
        >
          ← Înapoi la listă
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-2">{selectedMaterial.title}</h2>
          <p className="text-gray-600 mb-4">{selectedMaterial.description}</p>
          
          <div className="flex gap-2 mb-4">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm">
              {selectedMaterial.type === 'video' && '🎥 Video'}
              {selectedMaterial.type === 'podcast' && '🎙️ Podcast'}
              {selectedMaterial.type === 'infographic' && '📊 Infografic'}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
              {categoryLabels[selectedMaterial.category]}
            </span>
            {selectedMaterial.duration && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
                ⏱️ {selectedMaterial.duration} min
              </span>
            )}
          </div>

          {selectedMaterial.type === 'video' && (
            <div className="mb-4">
              {selectedMaterial.url.includes('youtube.com') || selectedMaterial.url.includes('youtu.be') ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedMaterial.url)}
                    title={selectedMaterial.title}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video controls className="w-full rounded-lg" src={selectedMaterial.url}>
                  Browser-ul tău nu suportă tag-ul video.
                </video>
              )}
            </div>
          )}

          {selectedMaterial.type === 'podcast' && (
            <div className="mb-4">
              <audio controls className="w-full" src={selectedMaterial.url}>
                Browser-ul tău nu suportă tag-ul audio.
              </audio>
            </div>
          )}

          {selectedMaterial.type === 'infographic' && (
            <div className="mb-4">
              {selectedMaterial.thumbnailUrl ? (
                <img
                  src={selectedMaterial.thumbnailUrl}
                  alt={selectedMaterial.title}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-4">Infografic</p>
                  <a
                    href={selectedMaterial.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Deschide infografic →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Resurse psycho-educaționale</h1>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'Toate' : categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Nu există materiale disponibile în această categorie
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map(material => (
            <div
              key={material.id}
              onClick={() => setSelectedMaterial(material)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
            >
              <div className="text-4xl mb-3">
                {material.type === 'video' && '🎥'}
                {material.type === 'podcast' && '🎙️'}
                {material.type === 'infographic' && '📊'}
              </div>
              <h3 className="text-xl font-semibold mb-2">{material.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{material.description}</p>
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
      )}
    </div>
  );
}

