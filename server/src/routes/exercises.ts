import express from 'express';
import { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const EXERCISES = [
  {
    id: 'breathing',
    title: 'Exerciții de respirație',
    type: 'breathing',
    description: 'Tehnici de respirație profundă pentru reducerea anxietății',
    duration: 5,
    steps: [
      'Inspiră lent prin nas timp de 4 secunde',
      'Ține respirația timp de 4 secunde',
      'Expiră lent prin gură timp de 6 secunde',
      'Repetă de 5-10 ori'
    ]
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    type: 'mindfulness',
    description: 'Meditație ghidată pentru prezent și conștientizare',
    duration: 10,
    steps: [
      'Găsește un loc liniștit',
      'Închide ochii și concentrează-te pe respirație',
      'Observă gândurile fără să le judeci',
      'Revino la respirație când mintea rătăcește'
    ]
  },
  {
    id: 'cbt',
    title: 'CBT - Gânduri automate',
    type: 'cbt',
    description: 'Identifică și contestă gândurile negative',
    duration: 15,
    steps: [
      'Identifică gândul automat negativ',
      'Notează emoțiile asociate',
      'Caută dovezi pentru și împotriva gândului',
      'Formulează un gând mai echilibrat'
    ]
  },
  {
    id: 'relaxation',
    title: 'Relaxare progresivă',
    type: 'relaxation',
    description: 'Tehnici de relaxare musculară progresivă',
    duration: 20,
    steps: [
      'Începe cu mușchii picioarelor',
      'Tensează mușchii timp de 5 secunde',
      'Relaxează complet timp de 10 secunde',
      'Continuă cu toate grupurile musculare'
    ]
  },
  {
    id: 'exposure',
    title: 'Expunere graduală',
    type: 'exposure',
    description: 'Tehnici de expunere graduală pentru frici și anxietăți',
    duration: 30,
    steps: [
      'Identifică situația sau obiectul care îți provoacă frică',
      'Creează o ierarhie de la cel mai puțin la cel mai înfricoșător',
      'Începe cu primul nivel (cel mai puțin înfricoșător)',
      'Rămâi în situație până când anxietatea scade cu cel puțin 50%',
      'Repetă până te simți confortabil, apoi treci la următorul nivel',
      'Progresează gradual prin toate nivelurile'
    ]
  }
];

// Get all exercises
router.get('/', async (req: AuthRequest, res) => {
  try {
    res.json(EXERCISES);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get exercise by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const exercise = EXERCISES.find(e => e.id === id);
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

export default router;

