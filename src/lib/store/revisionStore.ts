import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Section, TopicStatus } from '../constants';

export interface RevisionTopic {
  id: string;
  name: string;
  subject: Section;
  dateStudied: string;
  lastRevised: string | null;
  retention: 1 | 2 | 3 | 4 | 5;
  status: TopicStatus;
  notes: string;
}

interface RevisionStore {
  topics: RevisionTopic[];
  addTopic: (topic: RevisionTopic) => void;
  injectSyllabus: (topics: RevisionTopic[]) => void;
  updateTopic: (id: string, partial: Partial<RevisionTopic>) => void;
  deleteTopic: (id: string) => void;
  getDueTopics: () => RevisionTopic[];
  getMasteredCount: () => number;
}

export function isDue(topic: RevisionTopic): boolean {
  const intervalDays: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
  const interval = intervalDays[topic.retention];
  const lastDate = topic.lastRevised ? new Date(topic.lastRevised) : new Date(topic.dateStudied);
  const daysSince = (Date.now() - lastDate.getTime()) / 86400000;
  return daysSince >= interval && topic.status !== 'Mastered';
}

export const useRevisionStore = create<RevisionStore>()(
  persist(
    (set, get) => ({
      topics: [],

      addTopic: (topic) => {
        set((s) => ({ topics: [...s.topics, topic] }));
      },

      injectSyllabus: (newTopics) => {
        set((s) => ({
          topics: [...s.topics, ...newTopics]
        }));
      },

      updateTopic: (id, partial) => {
        set((s) => ({
          topics: s.topics.map((t) => (t.id === id ? { ...t, ...partial } : t)),
        }));
      },

      deleteTopic: (id) => {
        set((s) => ({ topics: s.topics.filter((t) => t.id !== id) }));
      },

      getDueTopics: () => {
        return get().topics.filter(isDue);
      },

      getMasteredCount: () => {
        return get().topics.filter((t) => t.status === 'Mastered').length;
      },
    }),
    { name: 'cat-os-revision', skipHydration: true }
  )
);
