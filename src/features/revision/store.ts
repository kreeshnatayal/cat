import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Section, TopicStatus } from '@/core/utils/constants';

export interface RevisionTopic {
  id: string;
  name: string;
  subject: Section;
  dateStudied: string;
  lastRevised: string | null;
  retention: 1 | 2 | 3 | 4 | 5;
  status: TopicStatus;
  notes: string;
  // SM-2 fields
  easeFactor: number;    // default 2.5, min 1.3
  interval: number;      // next review interval in days
  repetitions: number;   // times reviewed successfully
}

interface RevisionStore {
  topics: RevisionTopic[];
  addTopic: (topic: RevisionTopic) => void;
  injectSyllabus: (topics: RevisionTopic[]) => void;
  updateTopic: (id: string, partial: Partial<RevisionTopic>) => void;
  reviewTopic: (id: string, score: 1 | 2 | 3 | 4 | 5) => void;
  deleteTopic: (id: string) => void;
  getDueTopics: () => RevisionTopic[];
  getMasteredCount: () => number;
}

/**
 * SM-2 Algorithm
 * score: 1-2 = fail (reset), 3 = hard, 4 = good, 5 = easy
 * Returns updated interval (days) and easeFactor
 */
function sm2(score: number, repetitions: number, interval: number, easeFactor: number) {
  let newInterval: number;
  let newRep: number;
  let newEF: number;

  if (score >= 3) {
    // Successful recall
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 3;
    else newInterval = Math.round(interval * easeFactor);

    newRep = repetitions + 1;
    newEF = Math.max(1.3, easeFactor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
  } else {
    // Failed recall — reset
    newInterval = 1;
    newRep = 0;
    newEF = Math.max(1.3, easeFactor - 0.2);
  }

  return { interval: newInterval, repetitions: newRep, easeFactor: newEF };
}

export function isDue(topic: RevisionTopic): boolean {
  if (topic.status === 'Mastered') return false;
  const lastDate = topic.lastRevised ? new Date(topic.lastRevised) : new Date(topic.dateStudied);
  const daysSince = (Date.now() - lastDate.getTime()) / 86400000;
  // Use SM-2 interval if available, fall back to retention-based static
  const interval = topic.interval ?? ({ 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 }[topic.retention] ?? 7);
  return daysSince >= interval;
}

// Urgency score for sorting (higher = more urgent)
export function urgencyScore(topic: RevisionTopic): number {
  const lastDate = topic.lastRevised ? new Date(topic.lastRevised) : new Date(topic.dateStudied);
  const daysSince = (Date.now() - lastDate.getTime()) / 86400000;
  const interval = topic.interval ?? 7;
  // Overdue ratio: how many times overdue relative to interval
  return daysSince / interval;
}

export const useRevisionStore = create<RevisionStore>()(
  persist(
    (set, get) => ({
      topics: [],

      addTopic: (topic) => {
        const existing = get().topics.find(t =>
          t.name.toLowerCase() === topic.name.toLowerCase() && t.subject === topic.subject
        );
        if (existing) return; // don't add duplicates
        set((s) => ({
          topics: [...s.topics, {
            ...topic,
            easeFactor: topic.easeFactor ?? 2.5,
            interval: topic.interval ?? 1,
            repetitions: topic.repetitions ?? 0,
          }]
        }));
      },

      injectSyllabus: (newTopics) => {
        set((s) => ({
          topics: [
            ...s.topics,
            ...newTopics.map(t => ({
              ...t,
              easeFactor: 2.5,
              interval: 1,
              repetitions: 0,
            }))
          ]
        }));
      },

      updateTopic: (id, partial) => {
        set((s) => ({
          topics: s.topics.map((t) => (t.id === id ? { ...t, ...partial } : t)),
        }));
      },

      reviewTopic: (id, score) => {
        const topic = get().topics.find(t => t.id === id);
        if (!topic) return;

        const { interval, repetitions, easeFactor } = sm2(
          score, topic.repetitions, topic.interval, topic.easeFactor
        );

        const today = new Date().toISOString().slice(0, 10);

        // Map score to retention level (1-5)
        const retentionMap: Record<number, 1 | 2 | 3 | 4 | 5> = {
          1: 1, 2: 2, 3: 3, 4: 4, 5: 5
        };

        // If repetitions >= 4 and score >= 4 consistently, auto-master
        const shouldMaster = repetitions >= 5 && score >= 4;

        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === id
              ? {
                  ...t,
                  interval,
                  repetitions,
                  easeFactor,
                  retention: retentionMap[score],
                  lastRevised: today,
                  status: shouldMaster ? 'Mastered' : score >= 4 ? 'Revised' : t.status,
                }
              : t
          ),
        }));
      },

      deleteTopic: (id) => {
        set((s) => ({ topics: s.topics.filter((t) => t.id !== id) }));
      },

      getDueTopics: () => {
        return get().topics.filter(isDue).sort((a, b) => urgencyScore(b) - urgencyScore(a));
      },

      getMasteredCount: () => {
        return get().topics.filter((t) => t.status === 'Mastered').length;
      },
    }),
    { name: 'cat-os-revision', skipHydration: true }
  )
);
