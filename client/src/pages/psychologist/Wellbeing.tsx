import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface BreakReminder {
  enabled: boolean;
  intervalMinutes: number;
  startTime: string;
  endTime: string;
}

interface StressLevel {
  id: string;
  date: string;
  level: number;
  notes?: string;
  factors?: string[];
}

interface ProfessionalResource {
  id: string;
  title: string;
  description: string;
  type: 'webinar' | 'training' | 'workshop' | 'course' | 'conference' | 'article' | 'book';
  category: 'self-care' | 'clinical-skills' | 'supervision' | 'ethics' | 'research' | 'business' | 'general';
  url: string;
  duration?: number;
  provider?: string;
  date?: string;
  cost?: string;
  language?: string;
}

const typeLabels: Record<string, string> = {
  webinar: 'Webinar',
  training: 'Training',
  workshop: 'Workshop',
  course: 'Curs',
  conference: 'Conferință',
  article: 'Articol',
  book: 'Carte'
};

const categoryLabels: Record<string, string> = {
  'self-care': 'Autocontrol',
  'clinical-skills': 'Abilități clinice',
  'supervision': 'Supervizare',
  'ethics': 'Etică',
  'research': 'Cercetare',
  'business': 'Business',
  'general': 'General'
};

export default function PsychologistWellbeing() {
  const [activeTab, setActiveTab] = useState<'breaks' | 'stress' | 'resources'>('breaks');
  const [breakReminder, setBreakReminder] = useState<BreakReminder | null>(null);
  const [stressLevels, setStressLevels] = useState<StressLevel[]>([]);
  const [averageStress, setAverageStress] = useState<number>(0);
  const [professionalResources, setProfessionalResources] = useState<ProfessionalResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [nextBreakTime, setNextBreakTime] = useState<Date | null>(null);

  const [reminderForm, setReminderForm] = useState({
    enabled: false,
    intervalMinutes: 60,
    startTime: '09:00',
    endTime: '18:00'
  });

  const [stressForm, setStressForm] = useState({
    date: new Date().toISOString().split('T')[0],
    level: 5,
    notes: '',
    factors: [] as string[]
  });

  useEffect(() => {
    loadData();
    setupBreakReminder();
  }, []);

  useEffect(() => {
    if (breakReminder?.enabled) {
      setupBreakReminder();
    }
  }, [breakReminder]);

  useEffect(() => {
    if (activeTab === 'resources') {
      loadProfessionalResources();
    }
  }, [selectedCategory, activeTab]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadBreakReminder(),
        loadStressLevels(),
        loadProfessionalResources()
      ]);
    } catch (error) {
      console.error('Failed to load wellbeing data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBreakReminder = async () => {
    try {
      const response = await axios.get('/api/wellbeing/break-reminder');
      const reminder = response.data;
      setBreakReminder(reminder);
      setReminderForm({
        enabled: reminder.enabled || false,
        intervalMinutes: reminder.intervalMinutes || 60,
        startTime: reminder.startTime || '09:00',
        endTime: reminder.endTime || '18:00'
      });
    } catch (error) {
      console.error('Failed to load break reminder', error);
    }
  };

  const loadStressLevels = async () => {
    try {
      const response = await axios.get('/api/wellbeing/stress-levels?days=30');
      setStressLevels(response.data.levels || []);
      setAverageStress(response.data.average || 0);
    } catch (error) {
      console.error('Failed to load stress levels', error);
    }
  };

  const loadProfessionalResources = async () => {
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await axios.get('/api/wellbeing/professional-resources', { params });
      setProfessionalResources(response.data);
    } catch (error) {
      console.error('Failed to load professional resources', error);
    }
  };

  const setupBreakReminder = () => {
    if (!breakReminder?.enabled) return;

    const now = new Date();
    const [startHour, startMin] = breakReminder.startTime.split(':').map(Number);
    const [endHour, endMin] = breakReminder.endTime.split(':').map(Number);

    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);

    // Calculate next break time
    const calculateNextBreak = () => {
      const current = new Date();
      if (current < startTime) {
        return startTime;
      }
      if (current > endTime) {
        const tomorrow = new Date(startTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }

      // Find next break within working hours
      let nextBreak = new Date(startTime);
      while (nextBreak <= current) {
        nextBreak = new Date(nextBreak.getTime() + breakReminder.intervalMinutes * 60000);
      }
      if (nextBreak > endTime) {
        const tomorrow = new Date(startTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }
      return nextBreak;
    };

    setNextBreakTime(calculateNextBreak());

    // Set up notification
    const timeUntilBreak = calculateNextBreak().getTime() - now.getTime();
    if (timeUntilBreak > 0 && timeUntilBreak < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Timp pentru o pauză! ☕', {
            body: `Ai lucrat ${breakReminder.intervalMinutes} minute. E timpul pentru o pauză!`,
            icon: '/favicon.ico'
          });
        }
        setupBreakReminder(); // Schedule next reminder
      }, timeUntilBreak);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestNotificationPermission();
      const response = await axios.post('/api/wellbeing/break-reminder', reminderForm);
      setBreakReminder(response.data);
      alert('Setările pentru reminder-uri au fost salvate!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la salvarea setărilor');
    }
  };

  const handleAddStressLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/wellbeing/stress-level', stressForm);
      setStressForm({
        date: new Date().toISOString().split('T')[0],
        level: 5,
        notes: '',
        factors: []
      });
      await loadStressLevels();
      alert('Nivelul de stres a fost înregistrat!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la înregistrarea nivelului de stres');
    }
  };

  const stressChartData = stressLevels.slice(0, 14).reverse().map(level => ({
    date: format(new Date(level.date), 'dd MMM', { locale: ro }),
    level: level.level
  }));

  const getStressColor = (level: number) => {
    if (level <= 3) return '#10b981'; // green
    if (level <= 5) return '#f59e0b'; // yellow
    if (level <= 7) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getStressLabel = (level: number) => {
    if (level <= 3) return 'Scăzut';
    if (level <= 5) return 'Moderat';
    if (level <= 7) return 'Ridicat';
    return 'Foarte ridicat';
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Bunăstarea ta</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('breaks')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'breaks'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ☕ Reminder-uri pauze
          </button>
          <button
            onClick={() => setActiveTab('stress')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stress'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Tracking stres
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'resources'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📚 Resurse dezvoltare
          </button>
        </nav>
      </div>

      {/* Break Reminders Tab */}
      {activeTab === 'breaks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reminder-uri pentru pauze</h2>
            <p className="text-gray-600 mb-4">
              Configurează reminder-uri automate pentru a-ți aminti să faci pauze regulate în timpul zilei de lucru.
            </p>

            {breakReminder?.enabled && nextBreakTime && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Următoarea pauză:</strong> {format(nextBreakTime, "HH:mm", { locale: ro })} ({Math.round((nextBreakTime.getTime() - new Date().getTime()) / 60000)} minute)
                </p>
              </div>
            )}

            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={reminderForm.enabled}
                  onChange={(e) => {
                    setReminderForm({ ...reminderForm, enabled: e.target.checked });
                    if (e.target.checked) {
                      requestNotificationPermission();
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  Activează reminder-urile pentru pauze
                </label>
              </div>

              {reminderForm.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interval între pauze (minute)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="180"
                      value={reminderForm.intervalMinutes}
                      onChange={(e) => setReminderForm({ ...reminderForm, intervalMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recomandat: 45-60 minute pentru o pauză scurtă
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ora de început
                      </label>
                      <input
                        type="time"
                        value={reminderForm.startTime}
                        onChange={(e) => setReminderForm({ ...reminderForm, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ora de sfârșit
                      </label>
                      <input
                        type="time"
                        value={reminderForm.endTime}
                        onChange={(e) => setReminderForm({ ...reminderForm, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700"
              >
                Salvează setările
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stress Tracking Tab */}
      {activeTab === 'stress' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Tracking nivel de stres</h2>
            <p className="text-gray-600 mb-4">
              Înregistrează nivelul tău de stres zilnic pentru a monitoriza tendințele și a identifica factorii care contribuie.
            </p>

            {averageStress > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Medie ultimele 7 zile</p>
                    <p className="text-2xl font-bold" style={{ color: getStressColor(averageStress) }}>
                      {averageStress.toFixed(1)} / 10
                    </p>
                    <p className="text-sm" style={{ color: getStressColor(averageStress) }}>
                      {getStressLabel(averageStress)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stressChartData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Evoluție ultimele 2 săptămâni</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stressChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="3 3" label="Moderat" />
                    <Line type="monotone" dataKey="level" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <form onSubmit={handleAddStressLevel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={stressForm.date}
                  onChange={(e) => setStressForm({ ...stressForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de stres (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressForm.level}
                  onChange={(e) => setStressForm({ ...stressForm, level: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 - Foarte scăzut</span>
                  <span className="text-lg font-bold" style={{ color: getStressColor(stressForm.level) }}>
                    {stressForm.level}
                  </span>
                  <span>10 - Foarte ridicat</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notițe (opțional)
                </label>
                <textarea
                  value={stressForm.notes}
                  onChange={(e) => setStressForm({ ...stressForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ce te-a stresat astăzi? Cum te-ai simțit?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700"
              >
                Înregistrează nivelul de stres
              </button>
            </form>

            {stressLevels.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Istoric recent</h3>
                <div className="space-y-2">
                  {stressLevels.slice(0, 7).map(level => (
                    <div key={level.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{format(new Date(level.date), "d MMMM yyyy", { locale: ro })}</p>
                        {level.notes && <p className="text-sm text-gray-600">{level.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: getStressColor(level.level) }}>
                          {level.level} / 10
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Resurse de dezvoltare profesională</h2>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', ...Object.keys(categoryLabels)].map(category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  loadProfessionalResources();
                }}
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

          {professionalResources.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Nu există resurse disponibile în această categorie.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionalResources.map(resource => (
                <div key={resource.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {typeLabels[resource.type]}
                    </span>
                    {resource.cost && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        resource.cost === 'Free' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {resource.cost}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{resource.description}</p>
                  <div className="space-y-1 mb-4">
                    {resource.provider && (
                      <p className="text-xs text-gray-500">Provider: {resource.provider}</p>
                    )}
                    {resource.duration && (
                      <p className="text-xs text-gray-500">Durată: {Math.floor(resource.duration / 60)}h {resource.duration % 60}m</p>
                    )}
                    {resource.date && (
                      <p className="text-xs text-gray-500">Data: {format(new Date(resource.date), "d MMMM yyyy", { locale: ro })}</p>
                    )}
                    {resource.language && (
                      <p className="text-xs text-gray-500">Limba: {resource.language}</p>
                    )}
                  </div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-primary-600 text-white text-center py-2 rounded hover:bg-primary-700"
                  >
                    Accesează resursa →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
