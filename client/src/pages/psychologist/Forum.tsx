import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface ForumReply {
  id: string;
  psychologistId: string;
  psychologistName: string;
  content: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

interface ForumPost {
  id: string;
  psychologistId: string;
  psychologistName: string;
  title: string;
  content: string;
  category: 'supervision' | 'case_discussion' | 'resources' | 'general' | 'techniques';
  tags: string[];
  likes: string[];
  replies: ForumReply[];
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<string, string> = {
  supervision: 'Supervizare',
  case_discussion: 'Discuție cazuri',
  resources: 'Resurse',
  general: 'General',
  techniques: 'Tehnici'
};

export default function PsychologistForum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as ForumPost['category'],
    tags: ''
  });

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await axios.get('/api/forum', { params });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to load posts', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPost = async (postId: string) => {
    try {
      const response = await axios.get(`/api/forum/${postId}`);
      setSelectedPost(response.data);
    } catch (error) {
      console.error('Failed to load post', error);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/forum', {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setShowForm(false);
      setFormData({
        title: '',
        content: '',
        category: 'general',
        tags: ''
      });
      await loadPosts();
      alert('Postarea a fost creată!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la crearea postării');
    }
  };

  const handleSubmitReply = async () => {
    if (!selectedPost || !replyContent.trim()) return;
    
    try {
      await axios.post(`/api/forum/${selectedPost.id}/replies`, {
        content: replyContent
      });
      setReplyContent('');
      await loadPost(selectedPost.id);
      await loadPosts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la adăugarea răspunsului');
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await axios.post(`/api/forum/${postId}/like`);
      if (selectedPost?.id === postId) {
        await loadPost(postId);
      }
      await loadPosts();
    } catch (error) {
      console.error('Failed to toggle like', error);
    }
  };

  const handleToggleReplyLike = async (replyId: string) => {
    if (!selectedPost) return;
    try {
      await axios.post(`/api/forum/${selectedPost.id}/replies/${replyId}/like`);
      await loadPost(selectedPost.id);
    } catch (error) {
      console.error('Failed to toggle reply like', error);
    }
  };

  const isLiked = (likes: string[]) => {
    return user ? likes.includes(user.id) : false;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (selectedPost) {
    return (
      <div className="px-4 py-6">
        <button
          onClick={() => setSelectedPost(null)}
          className="mb-4 text-primary-600 hover:text-primary-700"
        >
          ← Înapoi la forum
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{selectedPost.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                <span>de {selectedPost.psychologistName}</span>
                <span>•</span>
                <span>{format(new Date(selectedPost.createdAt), "d MMMM yyyy 'la' HH:mm", { locale: ro })}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  {categoryLabels[selectedPost.category]}
                </span>
              </div>
              {selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedPost.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{selectedPost.content}</p>
              <button
                onClick={() => handleToggleLike(selectedPost.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded ${
                  isLiked(selectedPost.likes)
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isLiked(selectedPost.likes) ? '❤️' : '🤍'} {selectedPost.likes.length}
              </button>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">
            Răspunsuri ({selectedPost.replies.length})
          </h3>
          <div className="space-y-4 mb-6">
            {selectedPost.replies.map(reply => (
              <div key={reply.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{reply.psychologistName}</span>
                      <span>•</span>
                      <span>{format(new Date(reply.createdAt), "d MMM yyyy 'la' HH:mm", { locale: ro })}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                  <button
                    onClick={() => handleToggleReplyLike(reply.id)}
                    className={`ml-4 flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      isLiked(reply.likes)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isLiked(reply.likes) ? '❤️' : '🤍'} {reply.likes.length}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold mb-3">Adaugă un răspuns</h4>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Scrie răspunsul tău..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              rows={4}
            />
            <button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
            >
              Trimite răspuns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Forum comunitar</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          {showForm ? 'Anulează' : '+ Postare nouă'}
        </button>
      </div>

      {/* Create Post Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Creează o postare nouă</h2>
          <form onSubmit={handleSubmitPost} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tag-uri (separate prin virgulă)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="ex: CBT, anxietate, tehnici"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conținut *</label>
              <textarea
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Scrie postarea ta..."
              />
            </div>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700"
            >
              Publică
            </button>
          </form>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6">
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

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Nu există postări încă. Fii primul care postează!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => loadPost(post.id)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span>de {post.psychologistName}</span>
                    <span>•</span>
                    <span>{format(new Date(post.createdAt), "d MMM yyyy", { locale: ro })}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {categoryLabels[post.category]}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3 line-clamp-2">{post.content}</p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{post.replies.length} răspunsuri</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(post.id);
                      }}
                      className={`flex items-center gap-1 ${
                        isLiked(post.likes) ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {isLiked(post.likes) ? '❤️' : '🤍'} {post.likes.length}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
