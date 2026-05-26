import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Section } from '@/core/utils/constants';

export interface SectionData {
  attempted: number;
  correct: number;
  netScore: number;
  timeMinutes: number;
}

export interface MistakeCluster {
  silly: number;
  panic: number;
  timing: number;
  conceptual: number;
}

export type MistakeType = 'Silly' | 'Panic' | 'Timing' | 'Conceptual' | 'Selection';

export interface MistakeEntry {
  id: string;
  date: string; // ISO date string
  type: MistakeType;
  section: Section | 'General';
  description: string;
  learning: string;
  timeInMins?: number; // Time into the section when mistake occurred
}

export interface MistakeInsight {
  pattern: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface MockEntry {
  id: string;
  name: string;
  series: string;
  date: string;
  overallScore: number;
  percentile: number;
  sections: Record<Section, SectionData>;
  mistakes: MistakeCluster;
  emotionalState: string;
  keyLearnings: string;
  weakAreas: string;
}

interface MockStore {
  mocks: MockEntry[];
  mistakeLog: MistakeEntry[];
  addMock: (mock: MockEntry) => void;
  updateMock: (id: string, mock: Partial<MockEntry>) => void;
  deleteMock: (id: string) => void;
  addMistake: (mistake: MistakeEntry) => void;
  deleteMistake: (id: string) => void;
  getLastMock: () => MockEntry | undefined;
  getWeakSection: () => Section | null;
  getMovingAverage: (window?: number) => { date: string; avg: number }[];
  getBestPercentile: () => number;
  getMistakeInsights: () => MistakeInsight[];
}

export const useMockStore = create<MockStore>()(
  persist(
    (set, get) => ({
      mocks: [],
      mistakeLog: [],

      getMistakeInsights: () => {
        const logs = get().mistakeLog;
        const insights: MistakeInsight[] = [];
        if (logs.length < 3) return insights;

        const panicQA = logs.filter(l => l.section === 'QA' && l.type === 'Panic');
        if (panicQA.length >= 2) insights.push({ pattern: `${Math.round((panicQA.length / logs.filter(l => l.section === 'QA').length) * 100)}% of your QA errors are Panic-induced.`, severity: 'High' });

        const timingErrors = logs.filter(l => l.timeInMins && l.timeInMins > 30);
        if (timingErrors.length >= 3) insights.push({ pattern: `High fatigue clustering: ${timingErrors.length} errors occurred after the 30-minute mark.`, severity: 'Medium' });

        const dilrSelection = logs.filter(l => l.section === 'DILR' && l.type === 'Selection');
        if (dilrSelection.length >= 2) insights.push({ pattern: `DILR Set Selection is failing. Stop attempting hard sets first.`, severity: 'High' });

        if (insights.length === 0) insights.push({ pattern: `More data needed for behavioral clustering. Keep logging mistakes.`, severity: 'Low' });
        return insights;
      },

      addMock: (mock) => {
        set((s) => ({
          mocks: [...s.mocks, mock].sort((a, b) => b.date.localeCompare(a.date)),
        }));
      },

      updateMock: (id, partial) => {
        set((s) => ({
          mocks: s.mocks.map((m) => (m.id === id ? { ...m, ...partial } : m)),
        }));
      },

      deleteMock: (id) => {
        set((s) => ({ mocks: s.mocks.filter((m) => m.id !== id) }));
      },

      addMistake: (mistake) => {
        set((s) => ({
          mistakeLog: [...s.mistakeLog, mistake].sort((a, b) => b.date.localeCompare(a.date)),
        }));
      },

      deleteMistake: (id) => {
        set((s) => ({ mistakeLog: s.mistakeLog.filter((m) => m.id !== id) }));
      },

      getLastMock: () => {
        const sorted = [...get().mocks].sort((a, b) => b.date.localeCompare(a.date));
        return sorted[0];
      },

      getWeakSection: (): Section | null => {
        const mocks = get().mocks;
        if (mocks.length === 0) return null;
        const sections: Section[] = ['QA', 'DILR', 'VARC'];
        const avgs = sections.map((s) => {
          const scores = mocks.map((m) => m.sections[s].netScore);
          return { section: s, avg: scores.reduce((a, b) => a + b, 0) / scores.length };
        });
        avgs.sort((a, b) => a.avg - b.avg);
        return avgs[0].section;
      },

      getMovingAverage: (window = 3) => {
        const sorted = [...get().mocks].sort((a, b) => a.date.localeCompare(a.date));
        return sorted.map((_, i) => {
          const slice = sorted.slice(Math.max(0, i - window + 1), i + 1);
          const avg = slice.reduce((s, m) => s + m.overallScore, 0) / slice.length;
          return { date: sorted[i].date, avg: Math.round(avg * 10) / 10 };
        });
      },

      getBestPercentile: () => {
        const mocks = get().mocks;
        if (mocks.length === 0) return 0;
        return Math.max(...mocks.map((m) => m.percentile));
      },
    }),
    { name: 'cat-os-mocks', skipHydration: true }
  )
);
