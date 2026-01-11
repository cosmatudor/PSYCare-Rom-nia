import { useState, useEffect } from 'react';
import axios from 'axios';

interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  anxiety?: number;
  sleep?: number;
  stress?: number;
  text?: string;
  emojis?: string[];
  emotions?: string[];
  automaticThoughts?: string[];
  audioUrl?: string;
}

export default function PatientJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [text, setText] = useState('');
  const [mood, setMood] = useState(5);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [automaticThoughts, setAutomaticThoughts] = useState('');
  const [emojis, setEmojis] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [loading, setLoading] = useState(true);

  const emotionOptions = ['Fericit', 'Trist', 'Anxios', 'Înfuriat', 'Frică', 'Liniștit', 'Confuz', 'Speriat'];
  
  const emojiOptions = ['😊', '😢', '😰', '😡', '😨', '😌', '😕', '😱', '😴', '😍', '🤔', '😤', '😔', '😃', '🙂', '😟'];

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await axios.get('/api/journal/me');
      setEntries(response.data.sort((a: JournalEntry, b: JournalEntry) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Failed to load entries', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/journal', {
        mood,
        text,
        emotions,
        emojis: emojis.length > 0 ? emojis : undefined,
        automaticThoughts: automaticThoughts ? automaticThoughts.split('\n').filter(t => t.trim()) : undefined,
        audioUrl: audioUrl || undefined,
        date: new Date().toISOString().split('T')[0]
      });
      setText('');
      setMood(5);
      setEmotions([]);
      setAutomaticThoughts('');
      setEmojis([]);
      setAudioUrl(null);
      await loadEntries();
      alert('Intrarea a fost salvată!');
    } catch (error) {
      alert('Eroare la salvarea intrării');
    }
  };

  const toggleEmoji = (emoji: string) => {
    setEmojis(prev => 
      prev.includes(emoji) 
        ? prev.filter(e => e !== emoji)
        : [...prev, emoji]
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      alert('Nu s-a putut accesa microfonul. Verifică permisiunile.');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const deleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const toggleEmotion = (emotion: string) => {
    setEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Jurnal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Adaugă o intrare nouă</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starea de spirit (0-10)
              </label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emoții
              </label>
              <div className="flex flex-wrap gap-2">
                {emotionOptions.map(emotion => (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      emotions.includes(emotion)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gânduri automate
              </label>
              <textarea
                value={automaticThoughts}
                onChange={(e) => setAutomaticThoughts(e.target.value)}
                placeholder="Notează gândurile care îți trec prin minte..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jurnal (text)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Scrie despre ziua ta, emoțiile tale, ce te-a afectat..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={6}
              />
            </div>

            {/* Emoji Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emoji
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {emojis.map((emoji, idx) => (
                  <span 
                    key={idx} 
                    className="text-2xl cursor-pointer"
                    onClick={() => toggleEmoji(emoji)}
                    title="Click pentru a elimina"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-sm"
              >
                {showEmojiPicker ? '✕ Închide' : '😊 Adaugă emoji'}
              </button>
              {showEmojiPicker && (
                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => toggleEmoji(emoji)}
                        className={`text-2xl p-1 rounded hover:bg-gray-200 ${
                          emojis.includes(emoji) ? 'bg-blue-200' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audio Recording */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Înregistrare audio
              </label>
              {!audioUrl ? (
                <div className="flex gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🎤</span>
                      <span>Începe înregistrarea</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2 animate-pulse"
                    >
                      <span className="text-xl">⏹️</span>
                      <span>Oprește înregistrarea</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <audio controls src={audioUrl} className="flex-1" />
                  <button
                    type="button"
                    onClick={deleteAudio}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                  >
                    Șterge
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Save
            </button>
          </form>
        </div>

        {/* Entries List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Istoric</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nu ai încă intrări în jurnal</p>
            ) : (
              entries.map(entry => (
                <div key={entry.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">
                      {new Date(entry.date).toLocaleDateString('ro-RO', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="text-lg font-bold text-primary-600">{entry.mood}/10</span>
                  </div>
                  
                  {entry.emotions && entry.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {entry.emotions.map((emotion, idx) => (
                        <span key={idx} className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {entry.automaticThoughts && entry.automaticThoughts.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600">Gânduri automate:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {entry.automaticThoughts.map((thought, idx) => (
                          <li key={idx}>{thought}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {entry.emojis && entry.emojis.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {entry.emojis.map((emoji, idx) => (
                        <span key={idx} className="text-xl">{emoji}</span>
                      ))}
                    </div>
                  )}
                  
                  {entry.text && (
                    <p className="text-gray-700 whitespace-pre-wrap">{entry.text}</p>
                  )}
                  
                  {entry.audioUrl && (
                    <div className="mt-2">
                      <audio controls src={entry.audioUrl} className="w-full" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

