import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AssessmentScale {
  id: string;
  name: string;
  description: string;
  category: 'anxiety' | 'depression' | 'stress' | 'other';
  questionCount: number;
}

interface AssessmentQuestion {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

interface FullAssessmentScale extends AssessmentScale {
  questions: AssessmentQuestion[];
  scoring: {
    min: number;
    max: number;
    interpretation: {
      range: [number, number];
      severity: string;
      description: string;
    }[];
  };
}

interface PatientAssessment {
  id: string;
  scaleId: string;
  scaleName: string;
  totalScore: number;
  severity: string;
  interpretation: string;
  date: string;
  createdAt: string;
}

export default function PatientAssessments() {
  const { user } = useAuth();
  const [scales, setScales] = useState<AssessmentScale[]>([]);
  const [assessments, setAssessments] = useState<PatientAssessment[]>([]);
  const [selectedScale, setSelectedScale] = useState<FullAssessmentScale | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadScales();
    loadAssessments();
  }, []);

  const loadScales = async () => {
    try {
      const response = await axios.get('/api/assessments/scales');
      setScales(response.data);
    } catch (error) {
      console.error('Failed to load scales', error);
    }
  };

  const loadAssessments = async () => {
    try {
      if (user?.id) {
        const response = await axios.get(`/api/assessments/patient/${user.id}`);
        setAssessments(response.data);
      }
    } catch (error) {
      console.error('Failed to load assessments', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScaleDetails = async (scaleId: string) => {
    try {
      const response = await axios.get(`/api/assessments/scales/${scaleId}`);
      setSelectedScale(response.data);
      setAnswers({});
    } catch (error) {
      console.error('Failed to load scale details', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedScale) return;
    
    // Validate all questions answered
    const unanswered = selectedScale.questions.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert('Te rugăm să răspunzi la toate întrebările');
      return;
    }
    
    setSubmitting(true);
    try {
      const answerArray = selectedScale.questions.map(q => ({
        questionId: q.id,
        value: answers[q.id]
      }));
      
      await axios.post('/api/assessments/submit', {
        scaleId: selectedScale.id,
        answers: answerArray
      });
      
      alert('Evaluarea a fost trimisă cu succes!');
      setSelectedScale(null);
      setAnswers({});
      await loadAssessments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Eroare la trimiterea evaluării');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // Group assessments by scale for charts
  const assessmentsByScale = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.scaleId]) {
      acc[assessment.scaleId] = [];
    }
    acc[assessment.scaleId].push(assessment);
    return acc;
  }, {} as Record<string, PatientAssessment[]>);

  const chartData = Object.entries(assessmentsByScale).map(([scaleId, scaleAssessments]) => {
    const scale = scales.find(s => s.id === scaleId);
    return {
      scaleName: scale?.name || scaleId,
      data: scaleAssessments.map(a => ({
        date: format(new Date(a.date), 'dd MMM', { locale: ro }),
        score: a.totalScore,
        severity: a.severity
      }))
    };
  });

  if (selectedScale) {
    return (
      <div className="px-4 py-6">
        <button
          onClick={() => setSelectedScale(null)}
          className="mb-4 text-primary-600 hover:text-primary-700"
        >
          ← Înapoi la evaluări
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-2">{selectedScale.name}</h2>
          <p className="text-gray-600 mb-6">{selectedScale.description}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {selectedScale.questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {index + 1}. {question.text}
                </label>
                <div className="space-y-2">
                  {question.options.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={() => setAnswers({ ...answers, [question.id]: option.value })}
                        className="text-primary-600 focus:ring-primary-500"
                        required
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
              >
                {submitting ? 'Se trimite...' : 'Trimite evaluarea'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedScale(null)}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Evaluări standardizate</h1>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="mb-6 space-y-6">
          {chartData.map(({ scaleName, data }) => (
            data.length > 0 && (
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
            )
          ))}
        </div>
      )}

      {/* Available Scales */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Scale disponibile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scales.map(scale => {
            const lastAssessment = assessments
              .filter(a => a.scaleId === scale.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            
            return (
              <div
                key={scale.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => loadScaleDetails(scale.id)}
              >
                <div className="text-4xl mb-3">
                  {scale.category === 'anxiety' && '😰'}
                  {scale.category === 'depression' && '😔'}
                  {scale.category === 'stress' && '😤'}
                  {scale.category === 'other' && '📊'}
                </div>
                <h3 className="text-xl font-semibold mb-2">{scale.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{scale.description}</p>
                <div className="text-xs text-gray-500 mb-2">
                  {scale.questionCount} întrebări
                </div>
                {lastAssessment && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Ultima evaluare: {format(new Date(lastAssessment.date), 'd MMM yyyy', { locale: ro })}
                    </div>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-primary-600">{lastAssessment.totalScore}</span>
                      <span className="text-sm text-gray-600 ml-2">({lastAssessment.severity})</span>
                    </div>
                  </div>
                )}
                <button className="mt-4 w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700">
                  {lastAssessment ? 'Refă evaluarea' : 'Începe evaluarea'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment History */}
      {assessments.length > 0 && (
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
