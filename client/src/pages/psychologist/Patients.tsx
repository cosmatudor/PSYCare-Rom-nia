import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface WeeklyReport {
  week: number;
  year: number;
  weekKey: string;
  startDate: string;
  endDate: string;
  entriesCount: number;
  avgMood: string | null;
  avgAnxiety: string | null;
  avgSleep: string | null;
  avgStress: string | null;
  minMood: number | null;
  maxMood: number | null;
  entries: any[];
}

interface PatientProgress {
  patient: Patient;
  moodData: { date: string; mood: number; anxiety?: number | null; sleep?: number | null; stress?: number | null }[];
  totalEntries: number;
  totalAppointments: number;
  weeklyReports: WeeklyReport[];
}

export default function PsychologistPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
    
    // Auto-refresh patient progress every 30 seconds for real-time monitoring
    const interval = setInterval(() => {
      if (selectedPatient) {
        loadPatientProgress(selectedPatient.patient.id);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const response = await axios.get('/api/patients/my-patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to load patients', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientProgress = async (patientId: string) => {
    try {
      const response = await axios.get(`/api/patients/${patientId}/progress`);
      setSelectedPatient(response.data);
    } catch (error) {
      console.error('Failed to load patient progress', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pacienți</h1>

      {selectedPatient ? (
        <div>
          <button
            onClick={() => setSelectedPatient(null)}
            className="mb-4 text-primary-600 hover:text-primary-700"
          >
            ← Înapoi la listă
          </button>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{selectedPatient.patient.name}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-2xl font-bold text-primary-600">{selectedPatient.totalEntries}</div>
                <div className="text-gray-600">Intrări în jurnal</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{selectedPatient.totalAppointments}</div>
                <div className="text-gray-600">Programări totale</div>
              </div>
            </div>

            {selectedPatient.moodData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Evoluția stării de spirit</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedPatient.moodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="mood" stroke="#0284c7" strokeWidth={2} name="Stare de spirit" />
                    {selectedPatient.moodData.some(d => d.anxiety !== null && d.anxiety !== undefined) && (
                      <Line type="monotone" dataKey="anxiety" stroke="#dc2626" strokeWidth={2} name="Anxietate" />
                    )}
                    {selectedPatient.moodData.some(d => d.stress !== null && d.stress !== undefined) && (
                      <Line type="monotone" dataKey="stress" stroke="#ea580c" strokeWidth={2} name="Stres" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Weekly Reports */}
            {selectedPatient.weeklyReports && selectedPatient.weeklyReports.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Rapoarte săptămânale</h3>
                <div className="space-y-4">
                  {selectedPatient.weeklyReports.slice(0, 4).map((report, idx) => (
                    <div key={report.weekKey} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            Săptămâna {report.week}, {report.year}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(report.startDate).toLocaleDateString('ro-RO')} - {new Date(report.endDate).toLocaleDateString('ro-RO')}
                          </p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm">
                          {report.entriesCount} intrări
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        {report.avgMood && (
                          <div>
                            <p className="text-xs text-gray-600">Stare de spirit medie</p>
                            <p className="text-lg font-bold text-primary-600">{report.avgMood}/10</p>
                            {report.minMood !== null && report.maxMood !== null && (
                              <p className="text-xs text-gray-500">({report.minMood} - {report.maxMood})</p>
                            )}
                          </div>
                        )}
                        {report.avgAnxiety && (
                          <div>
                            <p className="text-xs text-gray-600">Anxietate medie</p>
                            <p className="text-lg font-bold text-red-600">{report.avgAnxiety}/10</p>
                          </div>
                        )}
                        {report.avgSleep && (
                          <div>
                            <p className="text-xs text-gray-600">Somn mediu</p>
                            <p className="text-lg font-bold text-blue-600">{report.avgSleep}h</p>
                          </div>
                        )}
                        {report.avgStress && (
                          <div>
                            <p className="text-xs text-gray-600">Stres mediu</p>
                            <p className="text-lg font-bold text-orange-600">{report.avgStress}/10</p>
                          </div>
                        )}
                      </div>
                      
                      {idx < selectedPatient.weeklyReports.length - 1 && idx < 3 && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {(() => {
                              const currentWeek = selectedPatient.weeklyReports[idx];
                              const prevWeek = selectedPatient.weeklyReports[idx + 1];
                              if (currentWeek.avgMood && prevWeek.avgMood) {
                                const diff = (parseFloat(currentWeek.avgMood) - parseFloat(prevWeek.avgMood)).toFixed(2);
                                const isPositive = parseFloat(diff) > 0;
                                return (
                                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                                    {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(diff))} față de săptămâna precedentă
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2 flex-wrap">
              <Link
                to={`/patients/${selectedPatient.patient.id}/record`}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                📁 Dosar electronic
              </Link>
              <Link
                to={`/patients/${selectedPatient.patient.id}/assessments`}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                📊 Evaluări standardizate
              </Link>
              <Link
                to={`/messages?userId=${selectedPatient.patient.id}`}
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                Trimite mesaj
              </Link>
              <Link
                to="/appointments"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Programează ședință
              </Link>
            </div>
            
            {/* Real-time monitoring indicator */}
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Monitorizare în timp real (actualizare automată la fiecare 30 secunde)
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.length === 0 ? (
            <div className="col-span-full bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Nu ai pacienți încă</h3>
              <p className="text-yellow-700 mb-4">
                Pentru ca pacienții să apară aici, ei trebuie să își creeze cont cu ID-ul tău de psiholog.
              </p>
              <p className="text-yellow-700 text-sm">
                Vezi ID-ul tău în Dashboard sau spune-le pacienților să introducă ID-ul tău când își creează cont ca "Pacient".
              </p>
            </div>
          ) : (
            patients.map(patient => (
              <div
                key={patient.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => loadPatientProgress(patient.id)}
              >
                <div className="text-4xl mb-3">👤</div>
                <h3 className="text-xl font-semibold mb-1">{patient.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{patient.email}</p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadPatientProgress(patient.id);
                    }}
                    className="flex-1 bg-primary-600 text-white py-2 rounded hover:bg-primary-700"
                  >
                    Vezi progres
                  </button>
                  <Link
                    to={`/patients/${patient.id}/record`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 text-center"
                  >
                    Dosar
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

