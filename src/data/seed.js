import {
  Target,
  HeartPulse,
  Waves,
  Footprints,
  Timer,
  Dumbbell,
} from 'lucide-react'

/** UK towns and cities players compete within. */
export const TOWNS = [
  'All UK',
  'London',
  'Manchester',
  'Birmingham',
  'Leeds',
  'Liverpool',
  'Bristol',
  'Newcastle',
  'Sheffield',
  'Nottingham',
  'Glasgow',
  'Cardiff',
]

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'technical', label: 'Technical' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'recovery', label: 'Recovery' },
]

/** Per-category styling so a drill's discipline is readable at a glance. */
export const CATEGORY_STYLES = {
  technical: {
    label: 'Technical',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: 'text-emerald-400',
    glow: 'group-hover:border-emerald-500/40',
  },
  fitness: {
    label: 'Fitness',
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: 'text-amber-400',
    glow: 'group-hover:border-amber-500/40',
  },
  recovery: {
    label: 'Recovery',
    chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    icon: 'text-sky-400',
    glow: 'group-hover:border-sky-500/40',
  },
}

export const EXERCISES = [
  {
    id: 'wall-passes-100',
    title: '100 Wall Passes',
    category: 'technical',
    xp: 120,
    duration: '12 min',
    icon: Target,
    summary: 'Two-touch passing against a wall. Both feet, inside of the boot.',
    steps: [
      'Stand 3–4 metres from a solid wall.',
      '50 passes with your strong foot, first touch out of your feet.',
      '50 passes with your weak foot — quality over speed.',
      'Keep your head up between touches.',
    ],
    proof: 'video',
    proofHint: 'Record 20 seconds of your reps — the wall and the ball must both be in frame.',
  },
  {
    id: 'core-routine-15',
    title: '15-min Core Routine',
    category: 'fitness',
    xp: 150,
    duration: '15 min',
    icon: HeartPulse,
    summary: 'Plank circuit that builds the trunk strength you need to hold off defenders.',
    steps: [
      '3 × 45s front plank, 20s rest between sets.',
      '3 × 30s side plank each side.',
      '3 × 20 dead bugs, slow and controlled.',
      'Finish with 3 × 15 glute bridges.',
    ],
    proof: 'video',
    proofHint: 'One continuous clip of a full plank set — no cuts.',
  },
  {
    id: 'foam-roll-mobility',
    title: 'Foam Rolling & Mobility',
    category: 'recovery',
    xp: 80,
    duration: '10 min',
    icon: Waves,
    summary: 'Roll out the load from training so tomorrow you are fresh.',
    steps: [
      '90s per quad, slow rolls.',
      '90s per calf, toes turned in and out.',
      '2 min hip flexor stretch each side.',
      'Finish with 10 controlled leg swings each leg.',
    ],
    proof: 'photo',
    proofHint: 'A photo mid-session with your roller is enough.',
  },
  {
    id: 'cone-dribble',
    title: 'Cone Dribbling Gauntlet',
    category: 'technical',
    xp: 110,
    duration: '10 min',
    icon: Footprints,
    summary: 'Six cones, close control, both feet. Speed comes after accuracy.',
    steps: [
      'Set 6 cones one metre apart.',
      '5 runs weaving with the inside of both feet.',
      '5 runs using only the outside of the boot.',
      '3 runs at match pace to finish.',
    ],
    proof: 'video',
    proofHint: 'Film one full run with all six cones visible.',
  },
  {
    id: 'sprint-intervals',
    title: 'Sprint Intervals',
    category: 'fitness',
    xp: 160,
    duration: '18 min',
    icon: Timer,
    summary: 'Repeat-sprint ability — the difference in the last ten minutes of a match.',
    steps: [
      'Warm up 5 minutes, easy jog and skips.',
      '8 × 40m sprints, walk back recovery.',
      '4 × 100m at 80% effort, 60s rest.',
      'Cool down 3 minutes.',
    ],
    proof: 'video',
    proofHint: 'A clip of one 40m sprint, plus your watch or timer if you have one.',
  },
  {
    id: 'weak-foot-volleys',
    title: 'Weak Foot Volleys',
    category: 'technical',
    xp: 100,
    duration: '10 min',
    icon: Dumbbell,
    summary: 'Fifty clean strikes on your weaker side. Ankle locked, toe down.',
    steps: [
      'Throw the ball up and volley against a wall or net.',
      '25 half-volleys, 25 full volleys.',
      'Reset your stance every rep.',
    ],
    proof: 'video',
    proofHint: 'Show at least 10 consecutive strikes in one take.',
  },
]

/** Today's rotating quest board. */
export const QUESTS = [
  { id: 'q-touches', label: 'Log 200 touches on the ball', xp: 40, target: 200, progress: 140, unit: 'touches' },
  { id: 'q-weak-foot', label: 'Complete a weak foot drill', xp: 60, target: 1, progress: 0, unit: 'drill' },
  { id: 'q-recovery', label: 'Finish a recovery session', xp: 30, target: 1, progress: 0, unit: 'session' },
  { id: 'q-streak', label: 'Keep your streak alive today', xp: 50, target: 1, progress: 0, unit: 'drill' },
]

/** The signed-in player. */
export const PLAYER = {
  id: 'you',
  name: 'You',
  initials: 'YO',
  town: 'London',
  club: 'Southwark Colts U15',
  position: 'Winger',
  xp: 4820,
  streak: 6,
  sessions: 42,
  verifiedRate: 0.94,
}

/** Rival players used to populate the local and national boards. */
export const RIVALS = [
  { id: 'r1', name: 'Kayden O.', initials: 'KO', town: 'London', xp: 7310, streak: 14 },
  { id: 'r2', name: 'Amara B.', initials: 'AB', town: 'London', xp: 5240, streak: 9 },
  { id: 'r3', name: 'Riley T.', initials: 'RT', town: 'London', xp: 3980, streak: 4 },
  { id: 'r4', name: 'Jayden F.', initials: 'JF', town: 'London', xp: 2610, streak: 2 },
  { id: 'r5', name: 'Tomasz W.', initials: 'TW', town: 'Manchester', xp: 8120, streak: 21 },
  { id: 'r6', name: 'Ife A.', initials: 'IA', town: 'Manchester', xp: 6050, streak: 11 },
  { id: 'r7', name: 'Callum D.', initials: 'CD', town: 'Manchester', xp: 3410, streak: 3 },
  { id: 'r8', name: 'Zain M.', initials: 'ZM', town: 'Birmingham', xp: 6890, streak: 12 },
  { id: 'r9', name: 'Harvey P.', initials: 'HP', town: 'Birmingham', xp: 4470, streak: 7 },
  { id: 'r10', name: 'Sana K.', initials: 'SK', town: 'Birmingham', xp: 2980, streak: 5 },
  { id: 'r11', name: 'Ellis G.', initials: 'EG', town: 'Leeds', xp: 5560, streak: 8 },
  { id: 'r12', name: 'Marcus R.', initials: 'MR', town: 'Leeds', xp: 4120, streak: 6 },
  { id: 'r13', name: 'Dara N.', initials: 'DN', town: 'Liverpool', xp: 7040, streak: 16 },
  { id: 'r14', name: 'Joe S.', initials: 'JS', town: 'Liverpool', xp: 3320, streak: 2 },
  { id: 'r15', name: 'Alfie H.', initials: 'AH', town: 'Bristol', xp: 5810, streak: 10 },
  { id: 'r16', name: 'Nia L.', initials: 'NL', town: 'Bristol', xp: 3690, streak: 4 },
  { id: 'r17', name: 'Bobby C.', initials: 'BC', town: 'Newcastle', xp: 6320, streak: 13 },
  { id: 'r18', name: 'Layla J.', initials: 'LJ', town: 'Newcastle', xp: 2870, streak: 3 },
  { id: 'r19', name: 'Kofi E.', initials: 'KE', town: 'Sheffield', xp: 5980, streak: 9 },
  { id: 'r20', name: 'Owen V.', initials: 'OV', town: 'Sheffield', xp: 3150, streak: 5 },
  { id: 'r21', name: 'Reuben I.', initials: 'RI', town: 'Nottingham', xp: 6640, streak: 15 },
  { id: 'r22', name: 'Mia D.', initials: 'MD', town: 'Nottingham', xp: 4390, streak: 6 },
  { id: 'r23', name: 'Struan McK.', initials: 'SM', town: 'Glasgow', xp: 7480, streak: 18 },
  { id: 'r24', name: 'Erin B.', initials: 'EB', town: 'Glasgow', xp: 4020, streak: 7 },
  { id: 'r25', name: 'Rhys T.', initials: 'RY', town: 'Cardiff', xp: 6180, streak: 11 },
  { id: 'r26', name: 'Carys W.', initials: 'CW', town: 'Cardiff', xp: 3540, streak: 4 },
]
