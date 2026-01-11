import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  anxiety?: number;
  sleep?: number;
  stress?: number;
  text?: string;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [mood, setMood] = useState(5);
  const [anxiety, setAnxiety] = useState(5);
  const [sleep, setSleep] = useState(8);
  const [stress, setStress] = useState(5);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = async () => {
    try {
      const response = await axios.get('/api/journal/me');
      setJournalEntries(response.data);
    } catch (error) {
      console.error('Failed to load journal entries', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSubmit = async () => {
    try {
      const response = await axios.post('/api/journal', {
        mood,
        anxiety,
        sleep,
        stress,
        date: new Date().toISOString().split('T')[0]
      });
      
      await loadJournalEntries();
      
      // Check for critical alerts
      if (response.data.alertFlag === 'critical') {
        alert('⚠️ ATENȚIE: Am detectat indicatori de risc critic. Te rugăm să contactezi imediat:\n\n• Linia de urgență: 112\n• Linia de suport: 0800 800 120\n• Psihologul tău\n\nDatele tale au fost salvate și psihologul tău va fi notificat.');
      } else if (response.data.alertFlag === 'high') {
        alert('⚠️ Am detectat stări de spirit foarte scăzute. Te rugăm să contactezi psihologul tău sau linia de suport dacă ai nevoie de ajutor imediat.');
      } else {
        alert('Datele tale au fost înregistrate!');
      }
    } catch (error) {
      alert('Eroare la înregistrarea datelor');
    }
  };

  const chartData = journalEntries
    .slice(-14)
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' }),
      mood: entry.mood,
      anxiety: entry.anxiety ?? null,
      sleep: entry.sleep ?? null,
      stress: entry.stress ?? null
    }));

  const todayEntry = journalEntries.find(e => e.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Daily Tracking Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Monitorizare zilnică</h2>
        
        {todayEntry ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">
              {todayEntry.mood <= 3 ? '😢' : todayEntry.mood <= 6 ? '😐' : '😊'}
            </div>
            <p className="text-lg text-gray-700 mb-2">
              Starea ta de astăzi: <strong>{todayEntry.mood}/10</strong>
            </p>
            {todayEntry.anxiety !== undefined && (
              <p className="text-gray-600">Anxietate: <strong>{todayEntry.anxiety}/10</strong></p>
            )}
            {todayEntry.sleep !== undefined && (
              <p className="text-gray-600">Somn: <strong>{todayEntry.sleep}h</strong></p>
            )}
            {todayEntry.stress !== undefined && (
              <p className="text-gray-600">Stres: <strong>{todayEntry.stress}/10</strong></p>
            )}
            <p className="text-sm text-gray-500 mt-2">Ai înregistrat deja datele pentru astăzi</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleMoodSubmit(); }} className="space-y-6">
            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starea de spirit (0-10)
              </label>
              <div className="text-center mb-2">
                <div className="text-4xl">
                  {mood <= 3 ? '😢' : mood <= 6 ? '😐' : '😊'}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>0</span>
                <span className="text-lg font-semibold text-primary-600">{mood}</span>
                <span>10</span>
              </div>
            </div>

            {/* Anxiety */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de anxietate (0-10)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={anxiety}
                onChange={(e) => setAnxiety(Number(e.target.value))}
                className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>0 (deloc)</span>
                <span className="text-lg font-semibold text-red-600">{anxiety}</span>
                <span>10 (foarte mult)</span>
              </div>
            </div>

            {/* Sleep */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ore de somn (noaptea trecută)
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={sleep}
                onChange={(e) => setSleep(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>0h</span>
                <span className="text-lg font-semibold text-blue-600">{sleep}h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Stress */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de stres (0-10)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={stress}
                onChange={(e) => setStress(Number(e.target.value))}
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>0 (deloc)</span>
                <span className="text-lg font-semibold text-orange-600">{stress}</span>
                <span>10 (foarte mult)</span>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Salvează datele
            </button>
          </form>
        )}
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="space-y-6">
          {/* Mood Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Evoluția stării de spirit</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="mood" stroke="#0284c7" strokeWidth={2} name="Stare de spirit" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Anxiety Chart */}
          {chartData.some(d => d.anxiety !== null) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Evoluția anxietății</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="anxiety" stroke="#dc2626" strokeWidth={2} name="Anxietate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sleep Chart */}
          {chartData.some(d => d.sleep !== null) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Evoluția somnului (ore)</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 12]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sleep" stroke="#2563eb" strokeWidth={2} name="Somn (ore)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stress Chart */}
          {chartData.some(d => d.stress !== null) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Evoluția nivelului de stres</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="stress" stroke="#ea580c" strokeWidth={2} name="Stres" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/journal"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="text-4xl mb-2">📝</div>
          <h3 className="font-semibold text-lg">Jurnal</h3>
          <p className="text-gray-600 text-sm mt-1">Notează-ți gândurile și emoțiile</p>
        </Link>

        <Link
          to="/exercises"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="text-4xl mb-2">🧘</div>
          <h3 className="font-semibold text-lg">Exerciții</h3>
          <p className="text-gray-600 text-sm mt-1">Mindfulness, respirație, CBT</p>
        </Link>

        <Link
          to="/schedules"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="text-4xl mb-2">📅</div>
          <h3 className="font-semibold text-lg">Programări</h3>
          <p className="text-gray-600 text-sm mt-1">Vezi ședințele tale</p>
        </Link>

        <Link
          to="/tasks"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="text-4xl mb-2">✅</div>
          <h3 className="font-semibold text-lg">Sarcini</h3>
          <p className="text-gray-600 text-sm mt-1">Vezi sarcinile terapeutice</p>
        </Link>
      </div>

      {/* Resources Quick Link */}
      <div className="mt-4">
        <Link
          to="/materials"
          className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer block"
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl">📚</div>
            <div>
              <h3 className="font-semibold text-lg text-purple-900">Resurse psycho-educaționale</h3>
              <p className="text-purple-700 text-sm mt-1">Accesează materiale video, podcasturi și infografice</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Crisis Button */}
      <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Ajutor de urgență</h3>
        <p className="text-red-700 mb-4">Dacă ai nevoie de ajutor imediat:</p>
        <div className="space-y-2">
          <a href="tel:112" className="block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-center">
            📞 Sună 112
          </a>
          <a href="tel:0800800120" className="block bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-center">
            📞 Linia de urgență: 0800 800 120
          </a>
        </div>
      </div>
    </div>
  );
}

