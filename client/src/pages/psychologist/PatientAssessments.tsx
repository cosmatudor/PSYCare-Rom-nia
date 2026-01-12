import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PatientAssessment {
  id: string;
  patientId: string;
  scaleId: string;
  scaleName: string;
  totalScore: number;
  severity: string;
  interpretation: string;
  date: string;
  createdAt: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
}

export default function PsychologistPatientAssessments() {
  const { patientId } = useParams<{ patientId: string }>();
  const [assessments, setAssessments] = useState<PatientAssessment[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadAssessments();
      loadPatient();
    }
  }, [patientId]);

  const loadAssessments = async () => {
    try {
      if (patientId) {
        const response = await axios.get(`/api/assessments/patient/${patientId}`);
        setAssessments(response.data);
      }
    } catch (error) {
      console.error('Failed to load assessments', error);
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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!patient) {
    return <div className="p-6">Pacient negăsit</div>;
  }

  // Group assessments by scale
  const assessmentsByScale = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.scaleId]) {
      acc[assessment.scaleId] = [];
    }
    acc[assessment.scaleId].push(assessment);
    return acc;
  }, {} as Record<string, PatientAssessment[]>);

  const chartData = Object.entries(assessmentsByScale).map(([scaleId, scaleAssessments]) => ({
    scaleName: scaleAssessments[0].scaleName,
    data: scaleAssessments
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(a => ({
        date: format(new Date(a.date), 'dd MMM', { locale: ro }),
        score: a.totalScore,
        severity: a.severity
      }))
  }));

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluări - {patient.name}</h1>
      <p className="text-gray-600 mb-6">{patient.email}</p>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="mb-6 space-y-6">
          {chartData.map(({ scaleName, data }) => (
            <div key={scaleName} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{scaleName} - Evoluție</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={2} name="Scor" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Assessment List */}
      {assessments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Pacientul nu a completat încă nicio evaluare standardizată
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Istoric evaluări</h2>
          <div className="space-y-4">
            {assessments.map(assessment => (
              <div key={assessment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{assessment.scaleName}</h3>
                    <p className="text-gray-600">
                      {format(new Date(assessment.date), "d MMMM yyyy", { locale: ro })}
                    </p>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-primary-600">{assessment.totalScore}</span>
                      <span className="text-gray-600 ml-2">puncte</span>
                    </div>
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        assessment.severity === 'Sever' ? 'bg-red-100 text-red-700' :
                        assessment.severity === 'Moderat-sever' ? 'bg-orange-100 text-orange-700' :
                        assessment.severity === 'Moderat' ? 'bg-yellow-100 text-yellow-700' :
                        assessment.severity === 'Ușor' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {assessment.severity}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2">{assessment.interpretation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
