import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface SessionNote {
  id: string;
  appointmentId?: string;
  date: string;
  content: string;
  type: 'session' | 'follow-up' | 'assessment' | 'other';
  createdAt: string;
  updatedAt: string;
}

interface PatientEvaluation {
  id: string;
  date: string;
  evaluationType: 'initial' | 'progress' | 'final' | 'crisis';
  scores: { [key: string]: number | string };
  observations: string;
  recommendations: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientRecord {
  patientId: string;
  notes: SessionNote[];
  evaluations: PatientEvaluation[];
}

interface Patient {
  id: string;
  name: string;
  email: string;
}

export default function PatientRecordPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'evaluations' | 'history'>('notes');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [editingEval, setEditingEval] = useState<PatientEvaluation | null>(null);

  const [noteForm, setNoteForm] = useState({
    appointmentId: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    type: 'session' as 'session' | 'follow-up' | 'assessment' | 'other'
  });

  const [evalForm, setEvalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    evaluationType: 'progress' as 'initial' | 'progress' | 'final' | 'crisis',
    scores: {} as { [key: string]: number | string },
    observations: '',
    recommendations: ''
  });

  useEffect(() => {
    if (patientId) {
      loadRecord();
      loadPatient();
    }
  }, [patientId]);

  const loadRecord = async () => {
    try {
      const response = await axios.get(`/api/records/patient/${patientId}`);
      setRecord(response.data);
    } catch (error) {
      console.error('Failed to load record', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatient = async () => {
    try {
      const response = await axios.get('/api/patients/my-patients');
      const foundPatient = response.data.find((p: Patient) => p.id === patientId);
      if (foundPatient) {
        setPatient(foundPatient);
      }
    } catch (error) {
      console.error('Failed to load patient', error);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await axios.put(`/api/records/patient/${patientId}/notes/${editingNote.id}`, noteForm);
      } else {
        await axios.post(`/api/records/patient/${patientId}/notes`, noteForm);
      }
      setShowNoteForm(false);
      setEditingNote(null);
      setNoteForm({
        appointmentId: '',
        date: new Date().toISOString().split('T')[0],
        content: '',
        type: 'session'
      });
      await loadRecord();
    } catch (error) {
      alert('Eroare la salvarea notiței');
      console.error(error);
    }
  };

  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEval) {
        await axios.put(`/api/records/patient/${patientId}/evaluations/${editingEval.id}`, evalForm);
      } else {
        await axios.post(`/api/records/patient/${patientId}/evaluations`, evalForm);
      }
      setShowEvalForm(false);
      setEditingEval(null);
      setEvalForm({
        date: new Date().toISOString().split('T')[0],
        evaluationType: 'progress',
        scores: {},
        observations: '',
        recommendations: ''
      });
      await loadRecord();
    } catch (error) {
      alert('Eroare la salvarea evaluării');
      console.error(error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această notiță?')) return;
    try {
      await axios.delete(`/api/records/patient/${patientId}/notes/${noteId}`);
      await loadRecord();
    } catch (error) {
      alert('Eroare la ștergerea notiței');
    }
  };

  const handleDeleteEval = async (evalId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această evaluare?')) return;
    try {
      await axios.delete(`/api/records/patient/${patientId}/evaluations/${evalId}`);
      await loadRecord();
    } catch (error) {
      alert('Eroare la ștergerea evaluării');
    }
  };

  const startEditNote = (note: SessionNote) => {
    setEditingNote(note);
    setNoteForm({
      appointmentId: note.appointmentId || '',
      date: note.date,
      content: note.content,
      type: note.type
    });
    setShowNoteForm(true);
  };

  const startEditEval = (evaluation: PatientEvaluation) => {
    setEditingEval(evaluation);
    setEvalForm({
      date: evaluation.date,
      evaluationType: evaluation.evaluationType,
      scores: evaluation.scores,
      observations: evaluation.observations,
      recommendations: evaluation.recommendations
    });
    setShowEvalForm(true);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!patient) {
    return <div className="p-6">Pacient negăsit</div>;
  }

  const sortedNotes = [...(record?.notes || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedEvals = [...(record?.evaluations || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/patients')}
            className="text-primary-600 hover:text-primary-700 mb-2"
          >
            ← Înapoi la pacienți
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Dosar electronic - {patient.name}</h1>
          <p className="text-gray-600">{patient.email}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex gap-2">
        <a
          href={`/patients/${patientId}/assessments`}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          📊 Vezi evaluări standardizate
        </a>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notițe ședințe ({record?.notes.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'evaluations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Evaluări ({record?.evaluations.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Istoric complet
          </button>
        </nav>
      </div>

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Notițe ședințe</h2>
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteForm({
                  appointmentId: '',
                  date: new Date().toISOString().split('T')[0],
                  content: '',
                  type: 'session'
                });
                setShowNoteForm(true);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              + Adaugă notiță
            </button>
          </div>

          {showNoteForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingNote ? 'Editează notiță' : 'Notiță nouă'}
              </h3>
              <form onSubmit={handleNoteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    required
                    value={noteForm.date}
                    onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                  <select
                    value={noteForm.type}
                    onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="session">Ședință</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="assessment">Evaluare</option>
                    <option value="other">Altele</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conținut</label>
                  <textarea
                    required
                    rows={8}
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Scrie notițele despre ședință..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                  >
                    Salvează
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoteForm(false);
                      setEditingNote(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          )}

          {sortedNotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Nu există notițe încă
            </div>
          ) : (
            <div className="space-y-4">
              {sortedNotes.map(note => (
                <div key={note.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm mr-2">
                        {note.type === 'session' ? 'Ședință' :
                         note.type === 'follow-up' ? 'Follow-up' :
                         note.type === 'assessment' ? 'Evaluare' : 'Altele'}
                      </span>
                      <span className="text-gray-600">
                        {format(new Date(note.date), "d MMMM yyyy", { locale: ro })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditNote(note)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-gray-700 whitespace-pre-wrap">{note.content}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    Creat: {format(new Date(note.createdAt), "d MMM yyyy HH:mm", { locale: ro })}
                    {note.updatedAt !== note.createdAt && (
                      <span> | Actualizat: {format(new Date(note.updatedAt), "d MMM yyyy HH:mm", { locale: ro })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evaluations Tab */}
      {activeTab === 'evaluations' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Evaluări</h2>
            <button
              onClick={() => {
                setEditingEval(null);
                setEvalForm({
                  date: new Date().toISOString().split('T')[0],
                  evaluationType: 'progress',
                  scores: {},
                  observations: '',
                  recommendations: ''
                });
                setShowEvalForm(true);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              + Adaugă evaluare
            </button>
          </div>

          {showEvalForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingEval ? 'Editează evaluare' : 'Evaluare nouă'}
              </h3>
              <form onSubmit={handleEvalSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                    <input
                      type="date"
                      required
                      value={evalForm.date}
                      onChange={(e) => setEvalForm({ ...evalForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tip evaluare</label>
                    <select
                      value={evalForm.evaluationType}
                      onChange={(e) => setEvalForm({ ...evalForm, evaluationType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="initial">Evaluare inițială</option>
                      <option value="progress">Evaluare progres</option>
                      <option value="final">Evaluare finală</option>
                      <option value="crisis">Evaluare criză</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observații</label>
                  <textarea
                    rows={6}
                    value={evalForm.observations}
                    onChange={(e) => setEvalForm({ ...evalForm, observations: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Observații despre starea pacientului..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recomandări</label>
                  <textarea
                    rows={6}
                    value={evalForm.recommendations}
                    onChange={(e) => setEvalForm({ ...evalForm, recommendations: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Recomandări pentru pacient..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                  >
                    Salvează
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEvalForm(false);
                      setEditingEval(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          )}

          {sortedEvals.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Nu există evaluări încă
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvals.map(evaluation => (
                <div key={evaluation.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm mr-2">
                        {evaluation.evaluationType === 'initial' ? 'Evaluare inițială' :
                         evaluation.evaluationType === 'progress' ? 'Evaluare progres' :
                         evaluation.evaluationType === 'final' ? 'Evaluare finală' : 'Evaluare criză'}
                      </span>
                      <span className="text-gray-600">
                        {format(new Date(evaluation.date), "d MMMM yyyy", { locale: ro })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditEval(evaluation)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleDeleteEval(evaluation.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                  {Object.keys(evaluation.scores).length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold mb-2">Scoruri:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(evaluation.scores).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-2 rounded">
                            <span className="text-sm text-gray-600">{key}:</span>{' '}
                            <span className="font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {evaluation.observations && (
                    <div className="mb-3">
                      <h4 className="font-semibold mb-2">Observații:</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{evaluation.observations}</p>
                    </div>
                  )}
                  {evaluation.recommendations && (
                    <div>
                      <h4 className="font-semibold mb-2">Recomandări:</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{evaluation.recommendations}</p>
                    </div>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    Creat: {format(new Date(evaluation.createdAt), "d MMM yyyy HH:mm", { locale: ro })}
                    {evaluation.updatedAt !== evaluation.createdAt && (
                      <span> | Actualizat: {format(new Date(evaluation.updatedAt), "d MMM yyyy HH:mm", { locale: ro })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Istoric complet</h2>
          <div className="space-y-4">
            {[...sortedNotes, ...sortedEvals]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((item, idx) => (
                <div key={`${'id' in item ? item.id : idx}`} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-1 rounded text-sm mr-2 ${
                        'type' in item
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {'type' in item ? 'Notiță' : 'Evaluare'}
                      </span>
                      <span className="text-gray-600">
                        {format(new Date(item.date), "d MMMM yyyy", { locale: ro })}
                      </span>
                    </div>
                  </div>
                  {'content' in item ? (
                    <div className="mt-3 text-gray-700">{item.content}</div>
                  ) : (
                    <div className="mt-3">
                      {item.observations && <p className="text-gray-700">{item.observations}</p>}
                      {item.recommendations && (
                        <p className="text-gray-700 mt-2">{item.recommendations}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            {sortedNotes.length === 0 && sortedEvals.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Nu există istoric încă
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
