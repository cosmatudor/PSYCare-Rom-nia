import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface TaskAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

interface TherapeuticTask {
  id: string;
  patientId: string;
  title: string;
  description: string;
  type: 'exercise' | 'journal' | 'form' | 'other';
  exerciseId?: string;
  dueDate?: string;
  reminderDate?: string;
  completed: boolean;
  completedAt?: string;
  attachments?: TaskAttachment[];
  patientNotes?: string;
  createdAt: string;
}

interface Patient {
  id: string;
  name: string;
}

export default function PsychologistTasks() {
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [tasks, setTasks] = useState<TherapeuticTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'exercise' as 'exercise' | 'journal' | 'form' | 'other',
    exerciseId: '',
    dueDate: '',
    reminderDate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
    loadTasks();
    
    // Refresh tasks every 5 seconds to see updates from patients
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const loadTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      const sortedTasks = response.data.sort((a: TherapeuticTask, b: TherapeuticTask) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Debug: log attachments for each task
      sortedTasks.forEach((task: TherapeuticTask) => {
        if (task.attachments && task.attachments.length > 0) {
          console.log(`Task "${task.title}" has ${task.attachments.length} attachments:`, task.attachments);
        }
      });
      
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', {
        ...formData,
        patientId: selectedPatientId
      });
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'exercise',
        exerciseId: '',
        dueDate: '',
        reminderDate: ''
      });
      setSelectedPatientId('');
      await loadTasks();
      alert('Sarcina a fost creată!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la crearea sarcinii');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această sarcină?')) return;
    
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      await loadTasks();
      alert('Sarcina a fost ștearsă!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la ștergerea sarcinii');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sarcini terapeutice</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          {showForm ? 'Anulează' : '+ Creează sarcină'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Creează o sarcină nouă</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pacient *
              </label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Selectează pacient</option>
                {Object.values(patients).map(patient => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titlu *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Practică exercițiul de respirație"
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
                placeholder="Descrie sarcina în detaliu..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>

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
                <option value="exercise">Exercițiu</option>
                <option value="journal">Jurnal</option>
                <option value="form">Formular</option>
                <option value="other">Altceva</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data limită
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data reminder
              </label>
              <input
                type="datetime-local"
                value={formData.reminderDate}
                onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Creează sarcină
            </button>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Toate sarcinile</h2>
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Nu ai creat nicio sarcină încă
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`bg-white rounded-lg shadow p-6 ${
                  task.completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-lg font-semibold ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      {task.completed && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          ✓ Completat
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                    
                    {/* Patient Notes */}
                    {task.patientNotes ? (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                        <p className="text-xs font-medium text-blue-800 mb-1">Note de la pacient:</p>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{task.patientNotes}</p>
                      </div>
                    ) : (
                      !task.completed && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-2">
                          <p className="text-xs text-gray-500 italic">Pacientul nu a adăugat încă note</p>
                        </div>
                      )
                    )}

                    {/* Attachments */}
                    {(() => {
                      console.log(`Task ${task.id} attachments:`, task.attachments);
                      if (task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0) {
                        return (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mb-2">
                            <p className="text-xs font-medium text-green-800 mb-2">
                              📎 Fișiere încărcate ({task.attachments.length}):
                            </p>
                            <div className="space-y-2">
                              {task.attachments.map(attachment => (
                                <div key={attachment.id} className="bg-white rounded p-2 flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleDateString('ro-RO', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <a
                                    href={attachment.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-4 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                  >
                                    Deschide
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        return !task.completed && (
                          <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-2">
                            <p className="text-xs text-gray-500 italic">Pacientul nu a încărcat încă fișiere</p>
                          </div>
                        );
                      }
                    })()}

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Pacient: {patients[task.patientId]?.name || 'Necunoscut'}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {task.type === 'exercise' && '🏃 Exercițiu'}
                        {task.type === 'journal' && '📝 Jurnal'}
                        {task.type === 'form' && '📋 Formular'}
                        {task.type === 'other' && '📌 Altceva'}
                      </span>
                      {task.dueDate && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Termen: {format(new Date(task.dueDate), "d MMMM yyyy", { locale: ro })}
                        </span>
                      )}
                      {task.completedAt && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                          Completat: {format(new Date(task.completedAt), "d MMM yyyy", { locale: ro })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="ml-4 text-red-600 hover:text-red-700 text-sm"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

