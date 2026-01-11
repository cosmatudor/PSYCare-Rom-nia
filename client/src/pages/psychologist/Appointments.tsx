import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Appointment {
  id: string;
  patientId: string;
  dateTime: string;
  duration: number;
  type: 'online' | 'offline';
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface Patient {
  id: string;
  name: string;
}

export default function PsychologistAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    dateTime: '',
    duration: 60,
    type: 'online' as 'online' | 'offline',
    meetingLink: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments');
      setAppointments(response.data.sort((a: Appointment, b: Appointment) => 
        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      ));
    } catch (error) {
      console.error('Failed to load appointments', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await axios.get('/api/patients/my-patients');
      const patientsMap: Record<string, Patient> = {};
      response.data.forEach((p: Patient) => {
        patientsMap[p.id] = p;
      });
      setPatients(patientsMap);
      
      if (response.data.length === 0) {
        console.warn('Nu ai pacienți încă. Pacienții trebuie să fie creați cu ID-ul tău de psiholog.');
      }
    } catch (error: any) {
      console.error('Failed to load patients', error);
      const errorMessage = error.response?.data?.error || 'Eroare la încărcarea pacienților';
      console.error('Error details:', errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/appointments', formData);
      setShowForm(false);
      setFormData({
        patientId: '',
        dateTime: '',
        duration: 60,
        type: 'online',
        meetingLink: ''
      });
      await loadAppointments();
      alert('Programarea a fost creată!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Eroare la crearea programării';
      alert(errorMessage);
      console.error('Appointment creation error:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const upcomingAppointments = appointments.filter(a => 
    new Date(a.dateTime) > new Date() && a.status === 'scheduled'
  );
  const pastAppointments = appointments.filter(a => 
    new Date(a.dateTime) <= new Date() || a.status !== 'scheduled'
  );

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Programări</h1>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const response = await axios.get('/api/appointments/export/ical', {
                  responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'psycare-appointments.ics');
                document.body.appendChild(link);
                link.click();
                link.remove();
                alert('Calendar exportat cu succes! Poți importa fișierul în Google Calendar, Outlook sau Apple Calendar.');
              } catch (error) {
                alert('Eroare la exportarea calendarului');
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            📅 Exportă calendar
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            {showForm ? 'Anulează' : '+ Programează ședință'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Programează o ședință nouă</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pacient
              </label>
              <select
                required
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Selectează pacient</option>
                {Object.values(patients).length === 0 ? (
                  <option value="" disabled>Nu ai pacienți. Mergi la "Pacienți" pentru mai multe informații.</option>
                ) : (
                  Object.values(patients).map(patient => (
                    <option key={patient.id} value={patient.id}>{patient.name}</option>
                  ))
                )}
              </select>
              {Object.values(patients).length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠️ Nu ai pacienți asociați. Pacienții trebuie să își creeze cont cu ID-ul tău de psiholog.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data și ora
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dateTime}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durată (minute)
              </label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'online' | 'offline' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {formData.type === 'online' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link ședință (Zoom/Google Meet)
                </label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Creează programare
            </button>
          </form>
        </div>
      )}

      {/* Upcoming */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Programări viitoare</h2>
        {upcomingAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Nu ai programări viitoare
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map(appointment => (
              <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {patients[appointment.patientId]?.name || 'Pacient necunoscut'}
                    </h3>
                    <p className="text-gray-600">
                      {format(new Date(appointment.dateTime), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}
                    </p>
                    <p className="text-gray-600">
                      Durată: {appointment.duration} minute | {appointment.type === 'online' ? 'Online' : 'Offline'}
                    </p>
                    {appointment.type === 'online' && appointment.meetingLink && (
                      <a
                        href={appointment.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
                      >
                        Link ședință →
                      </a>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Programat
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Istoric programări</h2>
          <div className="space-y-4">
            {pastAppointments.map(appointment => (
              <div key={appointment.id} className="bg-white rounded-lg shadow p-6 opacity-75">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {patients[appointment.patientId]?.name || 'Pacient necunoscut'}
                    </h3>
                    <p className="text-gray-600">
                      {format(new Date(appointment.dateTime), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}
                    </p>
                    <p className="text-gray-600">
                      Durată: {appointment.duration} min | {appointment.type === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {appointment.status === 'completed' ? 'Completat' : 'Anulat'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

