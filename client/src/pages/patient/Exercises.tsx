import { useState, useEffect } from 'react';
import axios from 'axios';

interface Exercise {
  id: string;
  title: string;
  type: string;
  description: string;
  duration: number;
  steps: string[];
}

export default function PatientExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const response = await axios.get('/api/exercises');
      setExercises(response.data);
    } catch (error) {
      console.error('Failed to load exercises', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Exerciții</h1>

      {selectedExercise ? (
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={() => setSelectedExercise(null)}
            className="mb-4 text-primary-600 hover:text-primary-700"
          >
            ← Înapoi la listă
          </button>
          
          <h2 className="text-2xl font-bold mb-2">{selectedExercise.title}</h2>
          <p className="text-gray-600 mb-4">{selectedExercise.description}</p>
          <p className="text-sm text-gray-500 mb-6">Durată: ~{selectedExercise.duration} minute</p>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pași:</h3>
            {selectedExercise.steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <p className="flex-1 text-gray-700 pt-1">{step}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              alert('Exercițiul a fost marcat ca completat!');
              setSelectedExercise(null);
            }}
            className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition"
          >
            Marchează ca completat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map(exercise => (
            <div
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
            >
              <div className="text-4xl mb-3">
                {exercise.type === 'breathing' && '🌬️'}
                {exercise.type === 'mindfulness' && '🧘'}
                {exercise.type === 'cbt' && '💭'}
                {exercise.type === 'relaxation' && '🛌'}
                {exercise.type === 'exposure' && '🎯'}
              </div>
              <h3 className="text-xl font-semibold mb-2">{exercise.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{exercise.description}</p>
              <p className="text-xs text-gray-500">Durată: ~{exercise.duration} min</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

