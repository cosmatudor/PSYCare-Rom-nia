import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, isPast, isToday } from 'date-fns';
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

export default function PatientTasks() {
  const [tasks, setTasks] = useState<TherapeuticTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TherapeuticTask | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [patientNotes, setPatientNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    checkReminders();
    
    // Check for reminders every minute
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data.sort((a: TherapeuticTask, b: TherapeuticTask) => {
        // Sort by: incomplete first, then by due date
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReminders = async () => {
    try {
      const response = await axios.get('/api/tasks/reminders/pending');
      if (response.data.length > 0 && 'Notification' in window) {
        // Request notification permission if needed
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        
        if (Notification.permission === 'granted') {
          response.data.forEach((task: TherapeuticTask) => {
            // Check if we already notified for this task today
            const notificationKey = `reminder-${task.id}-${new Date().toDateString()}`;
            if (!localStorage.getItem(notificationKey)) {
              new Notification('Reminder: ' + task.title, {
                body: task.description || 'Ai o sarcină care necesită atenție',
                icon: '/favicon.ico',
                tag: notificationKey,
                requireInteraction: false
              });
              localStorage.setItem(notificationKey, 'true');
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to check reminders', error);
    }
  };

  const markAsCompleted = async (taskId: string) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { 
        completed: true,
        patientNotes: patientNotes || undefined
      });
      setPatientNotes('');
      setSelectedTask(null);
      await loadTasks();
    } catch (error) {
      alert('Eroare la marcarea sarcinii ca completată');
    }
  };

  const handleFileUpload = async (taskId: string) => {
    if (!fileInput) {
      alert('Selectează un fișier');
      return;
    }

    // Check file size (limit to 10MB for base64 encoding)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileInput.size > maxSize) {
      alert('Fișierul este prea mare. Dimensiunea maximă este 10MB.');
      return;
    }

    try {
      // Show loading state
      const uploadButton = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLButtonElement;
      if (uploadButton) {
        uploadButton.disabled = true;
        uploadButton.textContent = 'Se încarcă...';
      }

      // In a real app, you would upload to a file storage service
      // For now, we'll create a data URL (base64) or use a placeholder
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const fileUrl = reader.result as string;
          
          // Check if data URL is too large (base64 is ~33% larger than original)
          if (fileUrl.length > 13 * 1024 * 1024) { // ~10MB base64
            alert('Fișierul este prea mare pentru upload. Te rugăm să folosești un fișier mai mic.');
            return;
          }
          
          const response = await axios.post(`/api/tasks/${taskId}/attachments`, {
            fileName: fileInput.name,
            fileUrl: fileUrl, // In production, this would be a URL to the uploaded file
            fileSize: fileInput.size
          }, {
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          
          console.log('File uploaded successfully:', response.data);
          
          setFileInput(null);
          setShowUploadForm(false);
          await loadTasks();
          
          // Reload selected task to show the new attachment
          if (selectedTask && selectedTask.id === taskId) {
            const updatedTasks = await axios.get('/api/tasks');
            const updatedTask = updatedTasks.data.find((t: TherapeuticTask) => t.id === taskId);
            if (updatedTask) {
              setSelectedTask(updatedTask);
            }
          }
          
          alert('Fișier încărcat cu succes!');
        } catch (error: any) {
          console.error('Upload error:', error);
          const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Eroare la încărcarea fișierului';
          alert(`Eroare: ${errorMessage}`);
        } finally {
          const uploadButton = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLButtonElement;
          if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Încarcă';
          }
        }
      };
      reader.onerror = () => {
        alert('Eroare la citirea fișierului');
      };
      reader.readAsDataURL(fileInput);
    } catch (error: any) {
      console.error('File upload error:', error);
      alert(`Eroare: ${error.message || 'Eroare la încărcarea fișierului'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const markAsIncomplete = async (taskId: string) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { completed: false });
      await loadTasks();
    } catch (error) {
      alert('Eroare la actualizarea sarcinii');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // Show task details modal/view
  if (selectedTask) {
    return (
      <div className="px-4 py-6">
        <button
          onClick={() => {
            setSelectedTask(null);
            setShowUploadForm(false);
            setPatientNotes('');
            setFileInput(null);
          }}
          className="mb-4 text-primary-600 hover:text-primary-700"
        >
          ← Înapoi la listă
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">{selectedTask.title}</h2>
          <p className="text-gray-600 mb-4">{selectedTask.description}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
              {selectedTask.type === 'exercise' && '🏃 Exercițiu'}
              {selectedTask.type === 'journal' && '📝 Jurnal'}
              {selectedTask.type === 'form' && '📋 Formular'}
              {selectedTask.type === 'other' && '📌 Altceva'}
            </span>
            {selectedTask.dueDate && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm">
                Termen: {format(new Date(selectedTask.dueDate), "d MMMM yyyy", { locale: ro })}
              </span>
            )}
            {selectedTask.reminderDate && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm">
                🔔 Reminder: {format(new Date(selectedTask.reminderDate), "d MMM yyyy 'la' HH:mm", { locale: ro })}
              </span>
            )}
            {selectedTask.exerciseId && (
              <Link
                to="/exercises"
                className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200"
              >
                Vezi exercițiu →
              </Link>
            )}
          </div>

          {/* Attachments */}
          {selectedTask.attachments && selectedTask.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Fișiere încărcate:</h3>
              <div className="space-y-2">
                {selectedTask.attachments.map(attachment => (
                  <div key={attachment.id} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                    <div>
                      <p className="font-medium">{attachment.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Deschide →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Form */}
          {!selectedTask.completed && (
            <div className="mb-6">
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 mb-4"
              >
                {showUploadForm ? '✕ Anulează' : '+ Încarcă fișier'}
              </button>

              {showUploadForm && (
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <input
                    type="file"
                    onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                    className="mb-3"
                  />
                  <button
                    data-task-id={selectedTask.id}
                    onClick={() => handleFileUpload(selectedTask.id)}
                    disabled={!fileInput}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Încarcă
                  </button>
                  {fileInput && (
                    <p className="text-xs text-gray-500 mt-2">
                      Fișier selectat: {fileInput.name} ({(fileInput.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Patient Notes */}
          {!selectedTask.completed && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note/comentarii (opțional)
              </label>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Adaugă note despre cum ai lucrat la această sarcină..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={4}
              />
            </div>
          )}

          {/* Complete Button */}
          {!selectedTask.completed ? (
            <button
              onClick={() => markAsCompleted(selectedTask.id)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              ✓ Marchează ca completată
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✓ Sarcina este completată</p>
              {selectedTask.completedAt && (
                <p className="text-sm text-green-700 mt-1">
                  Completat: {format(new Date(selectedTask.completedAt), "d MMMM yyyy 'la' HH:mm", { locale: ro })}
                </p>
              )}
              {selectedTask.patientNotes && (
                <p className="text-sm text-gray-700 mt-2">{selectedTask.patientNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Sarcini terapeutice</h1>

      {/* Request notification permission */}
      {Notification.permission === 'default' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 mb-2">
            💡 Activează notificările pentru a primi reminder-e pentru sarcinile tale!
          </p>
          <button
            onClick={async () => {
              await Notification.requestPermission();
              checkReminders();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Activează notificările
          </button>
        </div>
      )}

      {/* Pending Tasks */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Sarcini active ({pendingTasks.length})
        </h2>
        {pendingTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Nu ai sarcini active
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTasks.map(task => {
              const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
              const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
              
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg shadow p-6 ${
                    isOverdue ? 'border-2 border-red-300' : isDueToday ? 'border-2 border-yellow-300' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {task.type === 'exercise' && '🏃 Exercițiu'}
                          {task.type === 'journal' && '📝 Jurnal'}
                          {task.type === 'form' && '📋 Formular'}
                          {task.type === 'other' && '📌 Altceva'}
                        </span>
                        {task.dueDate && (
                          <span className={`px-2 py-1 rounded ${
                            isOverdue ? 'bg-red-100 text-red-700' :
                            isDueToday ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {isOverdue && '⚠️ '}
                            {isDueToday && '📅 '}
                            Termen: {format(new Date(task.dueDate), "d MMMM yyyy", { locale: ro })}
                          </span>
                        )}
                        {task.reminderDate && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            🔔 Reminder: {format(new Date(task.reminderDate), "d MMM HH:mm", { locale: ro })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      {task.attachments && task.attachments.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs text-center">
                          📎 {task.attachments.length} fișier(e)
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                      >
                        Vezi detalii
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Sarcini completate ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow p-4 opacity-75"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold line-through text-gray-600">{task.title}</h3>
                    {task.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completat: {format(new Date(task.completedAt), "d MMMM yyyy 'la' HH:mm", { locale: ro })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => markAsIncomplete(task.id)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Reia
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

