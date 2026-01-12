import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface AcademicArticle {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  doi?: string;
  url?: string;
  keywords: string[];
  category: 'anxiety' | 'depression' | 'stress' | 'cbt' | 'mindfulness' | 'trauma' | 'general';
  source: 'pubmed' | 'scholar' | 'manual';
  savedBy?: string[];
}

const categoryLabels: Record<string, string> = {
  anxiety: 'Anxietate',
  depression: 'Depresie',
  stress: 'Stres',
  cbt: 'CBT',
  mindfulness: 'Mindfulness',
  trauma: 'Traumă',
  general: 'General'
};

export default function AcademicResources() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<AcademicArticle[]>([]);
  const [savedArticles, setSavedArticles] = useState<AcademicArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    journal: '',
    year: new Date().getFullYear().toString(),
    abstract: '',
    doi: '',
    url: '',
    keywords: '',
    category: 'general' as AcademicArticle['category']
  });

  useEffect(() => {
    loadArticles();
    loadSavedArticles();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      searchArticles();
    } else {
      loadArticles();
    }
  }, [selectedCategory, searchQuery]);

  const loadArticles = async () => {
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await axios.get('/api/academic', { params });
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to load articles', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedArticles = async () => {
    try {
      const response = await axios.get('/api/academic/saved');
      setSavedArticles(response.data);
    } catch (error) {
      console.error('Failed to load saved articles', error);
    }
  };

  const searchArticles = async () => {
    try {
      const response = await axios.get('/api/academic', { params: { search: searchQuery } });
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to search articles', error);
    }
  };

  const handleSaveArticle = async (articleId: string) => {
    try {
      await axios.post(`/api/academic/${articleId}/save`);
      await loadSavedArticles();
      await loadArticles();
    } catch (error) {
      alert('Eroare la salvarea articolului');
    }
  };

  const handleUnsaveArticle = async (articleId: string) => {
    try {
      await axios.delete(`/api/academic/${articleId}/save`);
      await loadSavedArticles();
      await loadArticles();
    } catch (error) {
      alert('Eroare la eliminarea articolului');
    }
  };

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/academic', {
        ...formData,
        authors: formData.authors.split(',').map(a => a.trim()),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        year: Number(formData.year)
      });
      setShowAddForm(false);
      setFormData({
        title: '',
        authors: '',
        journal: '',
        year: new Date().getFullYear().toString(),
        abstract: '',
        doi: '',
        url: '',
        keywords: '',
        category: 'general'
      });
      await loadArticles();
      alert('Articolul a fost adăugat!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la adăugarea articolului');
    }
  };

  const isSaved = (articleId: string) => {
    return savedArticles.some(a => a.id === articleId);
  };

  const displayArticles = activeTab === 'saved' ? savedArticles : articles;

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Resurse academice</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          {showAddForm ? 'Anulează' : '+ Adaugă articol'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Toate articolele ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'saved'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Salvate ({savedArticles.length})
          </button>
        </nav>
      </div>

      {/* Add Article Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Adaugă articol academic</h2>
          <form onSubmit={handleAddArticle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titlu *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Autori * (separate prin virgulă)</label>
                <input
                  type="text"
                  required
                  value={formData.authors}
                  onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                  placeholder="ex: Smith, J., Doe, A."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jurnal *</label>
                <input
                  type="text"
                  required
                  value={formData.journal}
                  onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">An *</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorie *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Abstract *</label>
              <textarea
                required
                rows={4}
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DOI</label>
                <input
                  type="text"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  placeholder="10.1234/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuvinte cheie (separate prin virgulă)</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="ex: CBT, anxiety, treatment"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700"
            >
              Adaugă articol
            </button>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      {activeTab === 'all' && (
        <div className="mb-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Caută articole..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', ...Object.keys(categoryLabels)].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm ${
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
      )}

      {/* Articles List */}
      {displayArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          {activeTab === 'saved' ? 'Nu ai articole salvate' : 'Nu există articole'}
        </div>
      ) : (
        <div className="space-y-4">
          {displayArticles.map(article => (
            <div key={article.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                  <p className="text-gray-600 mb-2">
                    <strong>Autori:</strong> {article.authors.join(', ')}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <strong>Jurnal:</strong> {article.journal} ({article.year})
                  </p>
                  {article.doi && (
                    <p className="text-gray-600 mb-2">
                      <strong>DOI:</strong> {article.doi}
                    </p>
                  )}
                  <p className="text-gray-700 mt-3 mb-3">{article.abstract}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {categoryLabels[article.category]}
                    </span>
                    {article.keywords.map((keyword, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {article.source === 'pubmed' ? 'PubMed' : article.source === 'scholar' ? 'Scholar' : 'Manual'}
                    </span>
                  </div>
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Citește articolul →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => isSaved(article.id) ? handleUnsaveArticle(article.id) : handleSaveArticle(article.id)}
                  className={`ml-4 px-3 py-1 rounded text-sm ${
                    isSaved(article.id)
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSaved(article.id) ? '✓ Salvat' : 'Salvează'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
