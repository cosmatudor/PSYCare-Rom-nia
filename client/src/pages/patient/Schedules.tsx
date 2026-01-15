import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Appointment {
  id: string;
  dateTime: string;
  duration: number;
  type: 'online' | 'offline';
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function PatientSchedules() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      checkUpcomingAppointments();
      // Check for upcoming appointments every minute
      const interval = setInterval(checkUpcomingAppointments, 60000);
      return () => clearInterval(interval);
    }
  }, [appointments]);

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
            new Notification('Reminder: Ședință programată', {
              body: `Ai o ședință ${hoursUntil === 0 ? 'astăzi' : `în ${hoursUntil} ore`}: ${format(appointmentDate, "d MMMM yyyy 'la' HH:mm", { locale: ro })}`,
              icon: '/favicon.ico',
              tag: notificationKey
            });
            localStorage.setItem(notificationKey, 'true');
          }
        });
      }
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Programări</h1>

      {/* Calendar Export & Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Calendarul tău de programări</h2>
            <p className="text-gray-600 text-sm">
              Exportă programările în calendarul tău (Google Calendar, Outlook, Apple Calendar)
            </p>
          </div>
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
                alert('Calendar exportat cu succes! Poți importa fișierul în calendarul tău preferat.');
              } catch (error) {
                alert('Eroare la exportarea calendarului');
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            📅 Exportă calendar
          </button>
        </div>
        
        {/* Notification Permission */}
        {Notification.permission === 'default' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
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
      </div>

      {/* Upcoming Appointments */}
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
                      {format(new Date(appointment.dateTime), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}
                    </h3>
                    <p className="text-gray-600">
                      Durată: {appointment.duration} minute
                    </p>
                    <p className="text-gray-600">
                      Tip: {appointment.type === 'online' ? 'Online' : 'Offline'}
                    </p>
                    {appointment.type === 'online' && appointment.meetingLink && (
                      <a
                        href={appointment.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        <span>🔗 Join Google Meet</span>
                      </a>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    appointment.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                    appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {appointment.status === 'scheduled' ? 'Programat' :
                     appointment.status === 'completed' ? 'Completat' : 'Anulat'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Istoric programări</h2>
          <div className="space-y-4">
            {pastAppointments.map(appointment => (
              <div key={appointment.id} className="bg-white rounded-lg shadow p-6 opacity-75">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {format(new Date(appointment.dateTime), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}
                    </h3>
                    <p className="text-gray-600">
                      Durată: {appointment.duration} minute | Tip: {appointment.type === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
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

