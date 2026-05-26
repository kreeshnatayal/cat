import { create } from 'zustand';

export interface Phase {
  id: number;
  name: string;
  focus: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  weekdayHours: string;
  weekendHours: string;
  objective: string[];
  mockStrategy: string;
  qaFocus: string;
  dilrFocus: string;
  varcFocus: string;
}

export const PHASES: Phase[] = [
  {
    id: 1,
    name: 'Foundation Phase',
    focus: 'Foundation + Discipline',
    startDate: '2026-05-25',
    endDate: '2026-06-30',
    weekdayHours: '3.5–4.5 hrs',
    weekendHours: '5–6 hrs',
    objective: [
      'Build consistency and study rhythm',
      'Arithmetic foundation (Concept clarity)',
      'Reading stamina (1 RC/day)',
      'DILR comfort'
    ],
    mockStrategy: 'First diagnostic mock in Week 5. Purpose: understand pattern, NOT score obsession.',
    qaFocus: 'Percentages, Ratio, Averages, Mixtures, P&L, SI/CI, Time & Work, TSD',
    dilrFocus: 'Tables, basic arrangements, venn diagrams, scheduling',
    varcFocus: 'Basic parajumbles, daily reading, odd one out',
  },
  {
    id: 2,
    name: 'Concept Building',
    focus: 'Complete Syllabus Familiarity',
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    weekdayHours: '4.5–5.5 hrs',
    weekendHours: '6–8 hrs',
    objective: [
      'Complete syllabus familiarity',
      'Build sectional confidence',
      'Moderate speed and timed solving ability'
    ],
    mockStrategy: 'July: 2 mocks/month. August: 1 mock/week. Deep analysis mandatory.',
    qaFocus: 'July: Algebra (Linear, Quadratics, Logarithms). August: Geometry & Number System',
    dilrFocus: 'Circular arrangements, caselets, binary logic, tournament sets',
    varcFocus: 'RC inference, Para Summary, advanced VA, speed training',
  },
  {
    id: 3,
    name: 'Performance Building',
    focus: 'Performance Optimization',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    weekdayHours: '5.5–6 hrs',
    weekendHours: '7–8 hrs',
    objective: [
      'Shift from learning to performance optimization',
      'Speed without panic',
      'Decision-making under pressure'
    ],
    mockStrategy: '2 mocks/week. Mandatory deep analysis logs.',
    qaFocus: 'HCF/LCM, Base systems, Cyclicity, P&C, Probability, Set Theory',
    dilrFocus: 'High difficulty sets, set selection drills, mixed mocks',
    varcFocus: 'RC under pressure, timed VA, accuracy stabilization',
  },
  {
    id: 4,
    name: 'Mock Intensive',
    focus: 'Percentile-Building',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    weekdayHours: '6–7 hrs (mock-heavy)',
    weekendHours: '6–7 hrs',
    objective: [
      'Convert preparation into percentile',
      'Build stable strategy and emotional control',
      'Confidence stability and exam temperament'
    ],
    mockStrategy: '3 mocks/week. Flow: Mock → Deep Analysis → Repair → Repeat',
    qaFocus: 'Question selection + accuracy',
    dilrFocus: 'Set selection mastery',
    varcFocus: 'Consistency under pressure',
  },
  {
    id: 5,
    name: 'Final Peak Phase',
    focus: 'Peak State + Calmness',
    startDate: '2026-11-01',
    endDate: '2026-11-29',
    weekdayHours: '5–6 quality hrs',
    weekendHours: '5–6 quality hrs',
    objective: [
      'Reach exam day calm, sharp, confident',
      'Strategic refinement and weak area repair',
      'DO NOT panic study, destroy sleep, or try hard material'
    ],
    mockStrategy: 'Early Nov: 2/week. Last 10 days: Reduce frequency, focus on calm revision.',
    qaFocus: 'Formulas, arithmetic, algebra shortcuts, geometry properties',
    dilrFocus: 'Familiar set patterns, selection strategy',
    varcFocus: 'RC calmness, elimination logic, confidence maintenance',
  },
];

interface RoadmapStore {
  manualPhaseOverride: number | null;
  setPhaseOverride: (phaseId: number | null) => void;
}

export const useRoadmapStore = create<RoadmapStore>((set) => ({
  manualPhaseOverride: null,
  setPhaseOverride: (phaseId) => set({ manualPhaseOverride: phaseId }),
}));

// Utility function to get current phase (not a hook selector to avoid infinite loops)
export function getCurrentPhase(override: number | null): Phase {
  if (override !== null) {
    return PHASES.find((p) => p.id === override) || PHASES[0];
  }

  const now = new Date().toISOString().slice(0, 10);
  const current = PHASES.find((p) => now >= p.startDate && now <= p.endDate);
  
  // Default to Phase 1 if before start, or Phase 5 if after end
  if (!current) {
    if (now < PHASES[0].startDate) return PHASES[0];
    return PHASES[4];
  }
  
  return current;
}

export function getDailyTopics(date: string, phase: Phase) {
  // Deterministic hash based on date string (YYYY-MM-DD)
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = date.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const getSubtopic = (focusString: string, offset: number) => {
    // Some focus strings have 'July: Algebra. August: Geometry'. We just split by ',' or '.' or 'and' for simplicity, 
    // or just split by ',' and map.
    const parts = focusString.replace(/(July:|August:|Early Nov:|Last 10 days:)/g, '').split(/[,.]/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return focusString;
    return parts[(hash + offset) % parts.length];
  };

  return {
    qa: getSubtopic(phase.qaFocus, 0),
    dilr: getSubtopic(phase.dilrFocus, 1),
    varc: getSubtopic(phase.varcFocus, 2),
  };
}
