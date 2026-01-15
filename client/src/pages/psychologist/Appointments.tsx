import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    dateTime: '',
    duration: 60,
    type: 'online' as 'online' | 'offline',
    meetingLink: '',
    autoGenerateLink: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      checkUpcomingAppointments();
      // Check for upcoming appointments every minute
      const interval = setInterval(checkUpcomingAppointments, 60000);
      return () => clearInterval(interval);
    }
  }, [appointments]);

  const checkUpcomingAppointments = () => {
    if (appointments.length === 0) return;
    
    const now = new Date();
    const upcoming = appointments.filter(a => {
      if (a.status !== 'scheduled') return false;
      const appointmentDate = new Date(a.dateTime);
      const timeDiff = appointmentDate.getTime() - now.getTime();
      // Check if appointment is in next 24 hours and not yet notified
      return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
    });

    if (upcoming.length > 0 && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        upcoming.forEach(appointment => {
          const appointmentDate = new Date(appointment.dateTime);
          const hoursUntil = Math.floor((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60));
          
          // Only notify if less than 24 hours away and not already notified today
          const notificationKey = `appointment-${appointment.id}-${appointmentDate.toDateString()}`;
          if (!localStorage.getItem(notificationKey) && hoursUntil <= 24) {
            const patientName = patients[appointment.patientId]?.name || 'Pacient';
            new Notification('Reminder: Ședință programată', {
              body: `Ai o ședință cu ${patientName} ${hoursUntil === 0 ? 'astăzi' : `în ${hoursUntil} ore`}: ${format(appointmentDate, "d MMMM yyyy 'la' HH:mm", { locale: ro })}`,
              icon: '/favicon.ico',
              tag: notificationKey
            });
            localStorage.setItem(notificationKey, 'true');
          }
        });
      } else if (Notification.permission === 'default') {
        // Request permission if not yet requested
        Notification.requestPermission();
      }
    }
  };

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
      let finalFormData = { ...formData };
      
      // Auto-generate Google Meet link if requested
      if (formData.type === 'online' && formData.autoGenerateLink && !formData.meetingLink) {
        try {
          // Create Google Meet space via API
          const meetResponse = await axios.post('/api/appointments/meet/create');
          finalFormData.meetingLink = meetResponse.data.meetingUri;
          console.log('Google Meet space created:', meetResponse.data);
        } catch (meetError: any) {
          console.error('Failed to create Google Meet:', meetError);
          // If Google Meet creation fails, the backend will handle it
          // We'll pass createGoogleMeet flag to let backend try
          finalFormData = { ...finalFormData, createGoogleMeet: true } as any;
        }
      }

      await axios.post('/api/appointments', {
        ...finalFormData,
        createGoogleMeet: formData.type === 'online' && formData.autoGenerateLink && !formData.meetingLink
      });
      
      setShowForm(false);
      setFormData({
        patientId: '',
        dateTime: '',
        duration: 60,
        type: 'online',
        meetingLink: '',
        autoGenerateLink: false
      });
      await loadAppointments();
      alert('Programarea a fost creată cu succes!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Eroare la crearea programării';
      alert(`Eroare: ${errorMessage}`);
      console.error('Appointment creation error:', error);
    }
  };

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    return appointments.filter(a => {
      const appointmentDate = new Date(a.dateTime);
      return isSameDay(appointmentDate, date) && a.status === 'scheduled';
    });
  };

  const calendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const timeStr = format(new Date(), "HH:mm");
    setFormData({ ...formData, dateTime: `${dateStr}T${timeStr}` });
    setShowForm(true);
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
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            {viewMode === 'list' ? '📅 Calendar' : '📋 Listă'}
          </button>
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
            📥 Exportă calendar
          </button>
          <button
            onClick={() => {
              setSelectedDate(null);
              setShowForm(!showForm);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            {showForm ? 'Anulează' : '+ Programează ședință'}
          </button>
        </div>
      </div>

      {/* Notification Permission */}
      {viewMode === 'list' && 'Notification' in window && Notification.permission === 'default' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-blue-800 text-sm mb-2">
            💡 Activează notificările pentru a primi reminder-e automate pentru programările tale!
          </p>
          <button
            onClick={async () => {
              await Notification.requestPermission();
              checkUpcomingAppointments();
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Activează notificările
          </button>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: ro })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                Astăzi
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays().map((day, idx) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-[80px] p-1 border border-gray-200 rounded cursor-pointer hover:bg-gray-50
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                    ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                    ${isSelected ? 'bg-primary-50 border-primary-300' : ''}
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map(apt => (
                      <div
                        key={apt.id}
                        className="text-xs bg-primary-100 text-primary-700 px-1 rounded truncate"
                        title={`${patients[apt.patientId]?.name || 'Pacient'} - ${format(new Date(apt.dateTime), 'HH:mm')}`}
                      >
                        {format(new Date(apt.dateTime), 'HH:mm')} {patients[apt.patientId]?.name?.split(' ')[0] || ''}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayAppointments.length - 2} mai multe
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              <div className="space-y-3">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.autoGenerateLink}
                      onChange={(e) => setFormData({ ...formData, autoGenerateLink: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Generează automat link Google Meet
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Un link Google Meet va fi generat automat prin API-ul Google Meet
                  </p>
                </div>
                {!formData.autoGenerateLink && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link ședință (Zoom/Google Meet)
                    </label>
                    <input
                      type="url"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                      placeholder="https://meet.google.com/... sau https://zoom.us/j/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <p>💡 Instrucțiuni pentru link-uri:</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li><strong>Google Meet:</strong> Creează o întâlnire în Google Calendar și copiază link-ul</li>
                        <li><strong>Zoom:</strong> Creează o întâlnire în Zoom și copiază link-ul de participare</li>
                        <li>Alternativ, folosește opțiunea de generare automată de mai sus</li>
                      </ul>
                    </div>
                  </div>
                )}
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

      {/* Upcoming - Only show in list view */}
      {viewMode === 'list' && (
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
                    {appointment.type === 'online' && (
                      <div className="mt-2">
                        {appointment.meetingLink ? (
                          <a
                            href={appointment.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                          >
                            <span>🔗 Join Google Meet</span>
                            <span>→</span>
                          </a>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                const meetResponse = await axios.post('/api/appointments/meet/create');
                                await axios.put(`/api/appointments/${appointment.id}`, {
                                  meetingLink: meetResponse.data.meetingUri
                                });
                                await loadAppointments();
                                alert('Link Google Meet creat cu succes!');
                              } catch (error: any) {
                                alert('Eroare la crearea link-ului Google Meet: ' + (error.response?.data?.error || error.message));
                              }
                            }}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            ➕ Creează link Google Meet
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      Programat
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await axios.put(`/api/appointments/${appointment.id}`, { status: 'completed' });
                            await loadAppointments();
                          } catch (error) {
                            alert('Eroare la actualizarea programării');
                          }
                        }}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Marchează completat
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Ești sigur că vrei să anulezi această programare?')) {
                            try {
                              await axios.put(`/api/appointments/${appointment.id}`, { status: 'cancelled' });
                              await loadAppointments();
                            } catch (error) {
                              alert('Eroare la anularea programării');
                            }
                          }
                        }}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Past - Only show in list view */}
      {viewMode === 'list' && pastAppointments.length > 0 && (
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

