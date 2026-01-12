import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

export interface AssessmentScale {
  id: string;
  name: string;
  description: string;
  category: 'anxiety' | 'depression' | 'stress' | 'other';
  questions: AssessmentQuestion[];
  scoring: {
    min: number;
    max: number;
    interpretation: {
      range: [number, number];
      severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
      description: string;
    }[];
  };
}

export interface PatientAssessment {
  id: string;
  patientId: string;
  psychologistId?: string;
  scaleId: string;
  scaleName: string;
  answers: { questionId: string; value: number }[];
  totalScore: number;
  severity: string;
  interpretation: string;
  date: string;
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const ASSESSMENTS_FILE = join(DATA_DIR, 'assessments.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Standardized assessment scales
export const ASSESSMENT_SCALES: AssessmentScale[] = [
  {
    id: 'gad-7',
    name: 'GAD-7 (Generalized Anxiety Disorder Scale)',
    description: 'Scală de evaluare a anxietății generalizate. 7 întrebări despre simptomele din ultimele 2 săptămâni.',
    category: 'anxiety',
    questions: [
      {
        id: 'gad-7-1',
        text: 'Simțirea de nerăbdare, anxietate sau tensiune',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'gad-7-2',
        text: 'Neputința de a opri sau controla îngrijorările',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'gad-7-3',
        text: 'Prea multe îngrijorări despre diferite lucruri',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'gad-7-4',
        text: 'Dificultatea de a relaxa',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'gad-7-5',
        text: 'Agitația atât de mare încât este dificil să stai pe loc',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'gad-7-6',
        text: 'Ușurința de a fi enervat sau iritat',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'gad-7-7',
        text: 'Frica că ceva teribil va putea să se întâmple',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      }
    ],
    scoring: {
      min: 0,
      max: 21,
      interpretation: [
        { range: [0, 4], severity: 'minimal', description: 'Anxietate minimă' },
        { range: [5, 9], severity: 'mild', description: 'Anxietate ușoară' },
        { range: [10, 14], severity: 'moderate', description: 'Anxietate moderată' },
        { range: [15, 21], severity: 'severe', description: 'Anxietate severă' }
      ]
    }
  },
  {
    id: 'phq-9',
    name: 'PHQ-9 (Patient Health Questionnaire)',
    description: 'Scală de evaluare a depresiei. 9 întrebări despre simptomele din ultimele 2 săptămâni.',
    category: 'depression',
    questions: [
      {
        id: 'phq-9-1',
        text: 'Interes sau plăcere redus pentru a face lucruri',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'phq-9-2',
        text: 'Stare de spirit deprimată, tristă sau fără speranță',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'phq-9-3',
        text: 'Dificultăți la adormit sau somn prea mult',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'phq-9-4',
        text: 'Simțirea de oboseală sau lipsă de energie',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'phq-9-5',
        text: 'Apetit redus sau mâncat prea mult',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'phq-9-6',
        text: 'Simțirea de vinovăție sau că ești un eșec sau că ai dezamăgit familia',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'phq-9-7',
        text: 'Dificultăți de concentrare la lucruri precum cititul ziarului sau urmărirea TV-ului',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'phq-9-8',
        text: 'Mișcare sau vorbire atât de lentă încât alții au observat sau invers - agitație',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      },
      {
        id: 'phq-9-9',
        text: 'Gânduri că ar fi mai bine dacă ai fi mort sau că ți-ai face rău',
        options: [
          { value: 0, label: 'Deloc' },
          { value: 1, label: 'Câteva zile' },
          { value: 2, label: 'Mai mult de jumătate din zile' },
          { value: 3, label: 'Aproape în fiecare zi' }
        ]
      }
    ],
    scoring: {
      min: 0,
      max: 27,
      interpretation: [
        { range: [0, 4], severity: 'minimal', description: 'Depresie minimă' },
        { range: [5, 9], severity: 'mild', description: 'Depresie ușoară' },
        { range: [10, 14], severity: 'moderate', description: 'Depresie moderată' },
        { range: [15, 19], severity: 'moderately_severe', description: 'Depresie moderat-severă' },
        { range: [20, 27], severity: 'severe', description: 'Depresie severă' }
      ]
    }
  },
  {
    id: 'pss',
    name: 'PSS (Perceived Stress Scale)',
    description: 'Scală de evaluare a stresului perceput. 10 întrebări despre sentimentele și gândurile din ultima lună.',
    category: 'stress',
    questions: [
      {
        id: 'pss-1',
        text: 'În ultima lună, cât de des ai fost deranjat de ceva neașteptat?',
        options: [
          { value: 0, label: 'Niciodată' },
          { value: 1, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 3, label: 'Destul de des' },
          { value: 4, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-2',
        text: 'În ultima lună, cât de des ți-ai simțit că nu poți controla lucrurile importante din viața ta?',
        options: [
          { value: 0, label: 'Niciodată' },
          { value: 1, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 3, label: 'Destul de des' },
          { value: 4, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-3',
        text: 'În ultima lună, cât de des ți-ai simțit nerăbdarea sau anxietatea?',
        options: [
          { value: 0, label: 'Niciodată' },
          { value: 1, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 3, label: 'Destul de des' },
          { value: 4, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-4',
        text: 'În ultima lună, cât de des ai simțit încredere în capacitatea ta de a gestiona problemele personale?',
        options: [
          { value: 4, label: 'Niciodată' },
          { value: 3, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 1, label: 'Destul de des' },
          { value: 0, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-5',
        text: 'În ultima lună, cât de des ai simțit că lucrurile merg bine pentru tine?',
        options: [
          { value: 4, label: 'Niciodată' },
          { value: 3, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 1, label: 'Destul de des' },
          { value: 0, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-6',
        text: 'În ultima lună, cât de des ai simțit că nu poți face față tuturor lucrurilor pe care trebuia să le faci?',
        options: [
          { value: 0, label: 'Niciodată' },
          { value: 1, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 3, label: 'Destul de des' },
          { value: 4, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-7',
        text: 'În ultima lună, cât de des ai putut controla iritările din viața ta?',
        options: [
          { value: 4, label: 'Niciodată' },
          { value: 3, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 1, label: 'Destul de des' },
          { value: 0, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-8',
        text: 'În ultima lună, cât de des ai simțit că ai lucrurile sub control?',
        options: [
          { value: 4, label: 'Niciodată' },
          { value: 3, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 1, label: 'Destul de des' },
          { value: 0, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-9',
        text: 'În ultima lună, cât de des ai fost supărat din cauza unor lucruri care erau în afara controlului tău?',
        options: [
          { value: 0, label: 'Niciodată' },
          { value: 1, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 3, label: 'Destul de des' },
          { value: 4, label: 'Foarte des' }
        ]
      },
      {
        id: 'pss-10',
        text: 'În ultima lună, cât de des ai simțit că dificultățile se acumulează atât de mult încât nu le poți depăși?',
        options: [
          { value: 0, label: 'Niciodată' },
          { value: 1, label: 'Aproape niciodată' },
          { value: 2, label: 'Uneori' },
          { value: 3, label: 'Destul de des' },
          { value: 4, label: 'Foarte des' }
        ]
      }
    ],
    scoring: {
      min: 0,
      max: 40,
      interpretation: [
        { range: [0, 13], severity: 'minimal', description: 'Stres scăzut' },
        { range: [14, 26], severity: 'moderate', description: 'Stres moderat' },
        { range: [27, 40], severity: 'severe', description: 'Stres ridicat' }
      ]
    }
  }
];

function getAssessments(): PatientAssessment[] {
  ensureDataDir();
  if (!existsSync(ASSESSMENTS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(ASSESSMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveAssessments(assessments: PatientAssessment[]) {
  ensureDataDir();
  writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2));
}

export function calculateScore(scale: AssessmentScale, answers: { questionId: string; value: number }[]): {
  totalScore: number;
  severity: string;
  interpretation: string;
} {
  const totalScore = answers.reduce((sum, answer) => sum + answer.value, 0);
  
  const interpretation = scale.scoring.interpretation.find(int =>
    totalScore >= int.range[0] && totalScore <= int.range[1]
  ) || scale.scoring.interpretation[0];
  
  const severityLabels: Record<string, string> = {
    minimal: 'Minim',
    mild: 'Ușor',
    moderate: 'Moderat',
    moderately_severe: 'Moderat-sever',
    severe: 'Sever'
  };
  
  return {
    totalScore,
    severity: severityLabels[interpretation.severity] || interpretation.severity,
    interpretation: interpretation.description
  };
}

export function createAssessment(
  patientId: string,
  psychologistId: string | undefined,
  scaleId: string,
  answers: { questionId: string; value: number }[]
): PatientAssessment {
  const scale = ASSESSMENT_SCALES.find(s => s.id === scaleId);
  if (!scale) {
    throw new Error('Scale not found');
  }
  
  const scoreResult = calculateScore(scale, answers);
  
  const assessment: PatientAssessment = {
    id: uuidv4(),
    patientId,
    psychologistId,
    scaleId,
    scaleName: scale.name,
    answers,
    totalScore: scoreResult.totalScore,
    severity: scoreResult.severity,
    interpretation: scoreResult.interpretation,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  
  const assessments = getAssessments();
  assessments.push(assessment);
  saveAssessments(assessments);
  
  return assessment;
}

export function getAssessmentsByPatient(patientId: string): PatientAssessment[] {
  const assessments = getAssessments();
  return assessments.filter(a => a.patientId === patientId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getAssessmentsByPsychologist(psychologistId: string): PatientAssessment[] {
  const assessments = getAssessments();
  return assessments.filter(a => a.psychologistId === psychologistId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
