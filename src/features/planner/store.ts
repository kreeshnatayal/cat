import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MentalState } from '@/core/store/systemStore';

export interface PlannerEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  qaSolved: number;
  dilrSolved: number;
  rcsRead: number;
  revisionMins: number;
  pmHours: number;
  mentalState: MentalState | '';
  notes: string;
  frictionSource?: string;
  momentumSource?: string;
  mvdMet: boolean;
  completionPercent: number;
}

interface PlannerStore {
  entries: PlannerEntry[];
  addEntry: (entry: PlannerEntry) => void;
  updateEntry: (id: string, entry: Partial<PlannerEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntryByDate: (date: string) => PlannerEntry | undefined;
  getStreak: () => number;
  getLongestStreak: () => number;
  getMVDCount: () => number;
}

import { THEME_DAYS } from '@/core/store/systemStore';

// Dynamic Completion Calculation based on THEME_DAYS targets
function calcCompletion(entry: Omit<PlannerEntry, 'completionPercent' | 'mvdMet' | 'id'>): { percent: number; mvdMet: boolean } {
  const dateObj = new Date(entry.date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();
  const targets = THEME_DAYS[dayOfWeek].targets;

  let score = 0;
  let conditionsMet = 0;
  let totalConditions = 0;

  const check = (actual: number, target: number) => {
    if (target === 0) return; // Ignore if target is 0 for this day
    totalConditions++;
    if (actual >= target) {
      score += 25;
      conditionsMet++;
    } else if (actual > 0) {
      score += (actual / target) * 25;
    }
  };

  check(entry.qaSolved, targets.qa);
  check(entry.dilrSolved, targets.dilr);
  check(entry.rcsRead, targets.varc);
  check(entry.revisionMins, targets.rev);

  // Normalize score if total conditions < 4
  const finalPercent = totalConditions > 0 ? (score / (totalConditions * 25)) * 100 : 100;

  return {
    percent: Math.min(Math.round(finalPercent), 100),
    mvdMet: totalConditions > 0 ? conditionsMet === totalConditions : true,
  };
}

export { calcCompletion };

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        set((s) => ({
          entries: [
            ...s.entries.filter((e) => e.date !== entry.date),
            entry,
          ].sort((a, b) => b.date.localeCompare(a.date)),
        }));
      },

      updateEntry: (id, partial) => {
        set((s) => ({
          entries: s.entries.map((e) => {
            if (e.id === id) {
              const updated = { ...e, ...partial };
              const { percent, mvdMet } = calcCompletion(updated);
              return { ...updated, completionPercent: percent, mvdMet };
            }
            return e;
          }),
        }));
      },

      deleteEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
      },

      getEntryByDate: (date) => {
        return get().entries.find((e) => e.date === date);
      },

      getStreak: () => {
        const entries = get().entries;
        if (entries.length === 0) return 0;
        const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
        let streak = 0;
        const today = new Date().toISOString().slice(0, 10);
        let check = today;
        for (const e of sorted) {
          if (e.date === check && e.mvdMet) { // Streak is now based on MVD
            streak++;
            const d = new Date(check);
            d.setDate(d.getDate() - 1);
            check = d.toISOString().slice(0, 10);
          } else if (e.date < check) {
            break;
          }
        }
        return streak;
      },

      getLongestStreak: () => {
        const entries = get().entries.filter((e) => e.mvdMet); // Longest MVD streak
        if (entries.length === 0) return 0;
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        let max = 1, cur = 1;
        for (let i = 1; i < sorted.length; i++) {
          const prev = new Date(sorted[i - 1].date);
          const curr = new Date(sorted[i].date);
          const diff = (curr.getTime() - prev.getTime()) / 86400000;
          if (diff === 1) { cur++; max = Math.max(max, cur); }
          else cur = 1;
        }
        return max;
      },

      getMVDCount: () => {
        return get().entries.filter((e) => e.mvdMet).length;
      },
    }),
    { name: 'cat-os-planner', skipHydration: true }
  )
);
