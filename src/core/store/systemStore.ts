import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePlannerStore } from '@/features/planner/store';

export type MentalState = 'Focused' | 'Distracted' | 'Anxious' | 'Calm' | 'Burnt Out';
export type PerformanceState = 'Locked In' | 'Stable' | 'Friction' | 'Burnout Risk' | 'Collapse';

export interface WeeklyBattle {
  id: string;
  weekStart: string; // ISO yyyy-mm-dd
  focus: string; // e.g., 'Arithmetic Basics'
  isAdaptive?: boolean; // Marks if the battle was dynamically generated
}

export interface SystemStore {
  weeklyBattles: WeeklyBattle[];
  addWeeklyBattle: (battle: Omit<WeeklyBattle, 'id'>) => void;
  getBattleForDate: (date: string) => WeeklyBattle | undefined;
  monthlyResetDate: string | null;
  setMonthlyResetDate: (date: string) => void;
}

export const useSystemStore = create<SystemStore>()(
  persist(
    (set, get) => ({
      weeklyBattles: [],
      addWeeklyBattle: (battle) => {
        set((s) => ({
          weeklyBattles: [
            ...s.weeklyBattles,
            { ...battle, id: crypto.randomUUID() },
          ].sort((a, b) => b.weekStart.localeCompare(a.weekStart)), // newest first
        }));
      },
      getBattleForDate: (date) => {
        const pState = computePerformanceState();
        
        if (pState === 'Collapse') {
          return { id: 'adaptive-collapse', weekStart: date, focus: 'FORCED RESET: Zero High-Energy Work. Passive reading only.', isAdaptive: true };
        }
        if (pState === 'Burnout Risk') {
          return { id: 'adaptive-burnout', weekStart: date, focus: 'RECOVERY PROTOCOL: Reduce intensity. Consolidate knowledge.', isAdaptive: true };
        }

        const battles = get().weeklyBattles;
        if (!battles.length) return undefined;
        return battles.find((b) => b.weekStart <= date) || battles[battles.length - 1];
      },
      monthlyResetDate: null,
      setMonthlyResetDate: (date) => set({ monthlyResetDate: date }),
    }),
    { name: 'cat-os-system', skipHydration: true }
  )
);

export function computePerformanceState(): PerformanceState {
  const entries = usePlannerStore.getState().entries;
  if (entries.length === 0) return 'Stable';
  
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 5); // Last 5 days
  
  let burnoutCount = 0;
  let anxiousCount = 0;
  let focusedCount = 0;

  recent.forEach(e => {
    if (e.mentalState === 'Burnt Out') burnoutCount++;
    if (e.mentalState === 'Anxious') anxiousCount++;
    if (e.mentalState === 'Focused') focusedCount++;
  });

  if (burnoutCount >= 3) return 'Collapse';
  if (burnoutCount + anxiousCount >= 3) return 'Burnout Risk';
  if (burnoutCount + anxiousCount >= 1) return 'Friction';
  if (focusedCount >= 3) return 'Locked In';
  
  return 'Stable';
}

// Level Computation
export function computeLevel(mvdCount: number, mockCount: number, bestPercentile: number): { level: number; name: string; req: string } {
  if (bestPercentile >= 90) return { level: 4, name: 'Performance', req: '90+ Percentile Achieved' };
  if (mockCount >= 5) return { level: 3, name: 'Mock Ready', req: '5 Mocks Completed' };
  if (mvdCount >= 30) return { level: 2, name: 'Discipline', req: '30 Days MVD' };
  if (mvdCount >= 14) return { level: 1, name: 'Survival', req: '14 Days MVD' };
  return { level: 0, name: 'Initiate', req: 'Under 14 Days MVD' };
}

export const THEME_DAYS: Record<number, { name: string; focus: string; type: 'High' | 'Low' | 'Mixed'; targets: { qa: number; dilr: number; varc: number; rev: number } }> = {
  1: { name: 'Monday', focus: 'Arithmetic + RC', type: 'High', targets: { qa: 25, dilr: 0, varc: 3, rev: 15 } },
  2: { name: 'Tuesday', focus: 'DILR + Revision', type: 'High', targets: { qa: 5, dilr: 4, varc: 1, rev: 45 } },
  3: { name: 'Wednesday', focus: 'Algebra + RC', type: 'High', targets: { qa: 25, dilr: 1, varc: 3, rev: 15 } },
  4: { name: 'Thursday', focus: 'DILR + VA', type: 'High', targets: { qa: 5, dilr: 4, varc: 3, rev: 15 } },
  5: { name: 'Friday', focus: 'Mixed Timed Practice', type: 'Mixed', targets: { qa: 15, dilr: 2, varc: 2, rev: 30 } },
  6: { name: 'Saturday', focus: 'Long Study + Weak Areas', type: 'High', targets: { qa: 30, dilr: 3, varc: 3, rev: 60 } },
  0: { name: 'Sunday', focus: 'Mock + Analysis', type: 'High', targets: { qa: 0, dilr: 0, varc: 0, rev: 120 } },
};
