import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface CrisisAlert {
  patientId: string;
  patientName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  alertType: 'risc_suicidar' | 'agravare';
  reasons: string[];
  recentLowMoodEntries: number;
  lastEntry: any;
  createdAt: string;
}

interface WeeklySummary {
  totalEntries: number;
  avgMood: number;
  patientsWithEntries: number;
  entriesByDay: Record<string, number>;
}

interface DashboardData {
  totalPatients: number;
  upcomingAppointments: any[];
  crisisAlerts: CrisisAlert[];
  recentActivity: any[];
  weeklySummary: WeeklySummary;
}

export default function PsychologistDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await axios.get('/api/psychologists/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!dashboardData) {
    return <div className="p-6">Eroare la încărcarea datelor</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Psychologist ID Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 mb-6 shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-blue-900 mb-3">🔑 ID-ul tău de Psiholog</h3>
            <div className="bg-white border-2 border-blue-400 rounded-lg p-4 mb-3">
              <code 
                id="psychologist-id"
                className="text-2xl font-mono font-bold text-blue-800 break-all"
              >
                {user?.id}
              </code>
            </div>
            <p className="text-blue-800 font-medium mb-2">
              ⚠️ Important: Distribuie acest ID pacienților tăi!
            </p>
            <p className="text-blue-700 text-sm">
              Când pacienții își creează cont, trebuie să introducă acest ID în câmpul "ID Psiholog" pentru a fi asociați cu tine.
            </p>
          </div>
          <button
            onClick={() => {
              if (user?.id) {
                navigator.clipboard.writeText(user.id);
                alert('ID copiat în clipboard!');
              }
            }}
            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap"
          >
            📋 Copiază ID
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-primary-600">{dashboardData.totalPatients}</div>
          <div className="text-gray-600 mt-1">Pacienți activi</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{dashboardData.upcomingAppointments.length}</div>
          <div className="text-gray-600 mt-1">Programări viitoare</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-red-600">{dashboardData.crisisAlerts.length}</div>
          <div className="text-gray-600 mt-1">Alertă risc</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{dashboardData.weeklySummary?.totalEntries || 0}</div>
          <div className="text-gray-600 mt-1">Intrări săptămâna aceasta</div>
        </div>
      </div>

      {/* Weekly Summary */}
      {dashboardData.weeklySummary && dashboardData.weeklySummary.totalEntries > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Rezumat săptămâna aceasta</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Stare de spirit medie</p>
              <p className="text-2xl font-bold text-primary-600">{dashboardData.weeklySummary.avgMood}/10</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pacienți activi</p>
              <p className="text-2xl font-bold text-green-600">
                {dashboardData.weeklySummary.patientsWithEntries}/{dashboardData.totalPatients}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total intrări</p>
              <p className="text-2xl font-bold text-blue-600">{dashboardData.weeklySummary.totalEntries}</p>
            </div>
          </div>
        </div>
      )}

      {/* Crisis Alerts */}
      {dashboardData.crisisAlerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">⚠️ Alerte risc</h2>
          <div className="space-y-3">
            {dashboardData.crisisAlerts.map(alert => {
              const isCritical = alert.severity === 'critical';
              const isSuicideRisk = alert.alertType === 'risc_suicidar';
              const bgColor = isCritical ? 'bg-red-50 border-red-400' : alert.severity === 'high' ? 'bg-orange-50 border-orange-300' : 'bg-yellow-50 border-yellow-300';
              const textColor = isCritical ? 'text-red-900' : alert.severity === 'high' ? 'text-orange-900' : 'text-yellow-900';
              const borderColor = isCritical ? 'border-red-400' : alert.severity === 'high' ? 'border-orange-300' : 'border-yellow-300';
              
              return (
                <div key={alert.patientId} className={`${bgColor} border-2 ${borderColor} rounded-lg p-4`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-bold text-lg ${textColor}`}>
                          {isCritical ? '🚨' : '⚠️'} {alert.patientName}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          isCritical ? 'bg-red-600 text-white' :
                          alert.severity === 'high' ? 'bg-orange-600 text-white' :
                          'bg-yellow-600 text-white'
                        }`}>
                          {isSuicideRisk ? 'RISC SUICIDAR' : alert.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      {alert.reasons.length > 0 && (
                        <div className="mb-2">
                          <p className={`text-sm font-medium ${textColor} mb-1`}>Indicatori detectați:</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {alert.reasons.map((reason, idx) => (
                              <li key={idx} className={textColor}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {alert.lastEntry && (
                        <div className={`text-sm ${textColor} mt-2`}>
                          <p>
                            <strong>Ultima intrare:</strong> {new Date(alert.lastEntry.date).toLocaleDateString('ro-RO', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <div className="mt-1 space-x-4">
                            {alert.lastEntry.mood !== undefined && (
                              <span>Stare: <strong>{alert.lastEntry.mood}/10</strong></span>
                            )}
                            {alert.lastEntry.anxiety !== undefined && alert.lastEntry.anxiety !== null && (
                              <span>Anxietate: <strong>{alert.lastEntry.anxiety}/10</strong></span>
                            )}
                            {alert.lastEntry.stress !== undefined && alert.lastEntry.stress !== null && (
                              <span>Stres: <strong>{alert.lastEntry.stress}/10</strong></span>
                            )}
                          </div>
                          {alert.lastEntry.text && (
                            <p className="mt-2 italic text-xs bg-white p-2 rounded border border-gray-200">
                              "{alert.lastEntry.text.substring(0, 200)}{alert.lastEntry.text.length > 200 ? '...' : ''}"
                            </p>
                          )}
                        </div>
                      )}
                      
                      <p className={`text-xs mt-2 ${textColor} opacity-75`}>
                        Alertă generată: {new Date(alert.createdAt).toLocaleString('ro-RO')}
                      </p>
                    </div>
                    <Link
                      to={`/patients?patientId=${alert.patientId}`}
                      className={`ml-4 px-4 py-2 rounded font-medium text-sm whitespace-nowrap ${
                        isCritical ? 'bg-red-600 text-white hover:bg-red-700' :
                        alert.severity === 'high' ? 'bg-orange-600 text-white hover:bg-orange-700' :
                        'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                    >
                      Vezi detalii →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Programări viitoare</h2>
          <Link to="/appointments" className="text-primary-600 hover:text-primary-700">
            Vezi toate →
          </Link>
        </div>
        {dashboardData.upcomingAppointments.length === 0 ? (
          <p className="text-gray-500">Nu ai programări viitoare</p>
        ) : (
          <div className="space-y-3">
            {dashboardData.upcomingAppointments.map(appointment => (
              <div key={appointment.id} className="border-b pb-3 last:border-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">
                      {new Date(appointment.dateTime).toLocaleDateString('ro-RO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Durată: {appointment.duration} min | {appointment.type === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Activitate recentă</h2>
          <Link to="/patients" className="text-primary-600 hover:text-primary-700">
            Vezi toți pacienții →
          </Link>
        </div>
        {dashboardData.recentActivity.length === 0 ? (
          <p className="text-gray-500">Nu există activitate recentă</p>
        ) : (
          <div className="space-y-3">
            {dashboardData.recentActivity.map(activity => (
              <div key={activity.patientId} className="border-b pb-3 last:border-0">
                <p className="font-medium">{activity.patientName}</p>
                {activity.lastEntry ? (
                  <p className="text-sm text-gray-600">
                    Ultima intrare: {new Date(activity.lastEntry.date).toLocaleDateString('ro-RO')} - 
                    Stare {activity.lastEntry.mood}/10
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Nu are încă intrări în jurnal</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

