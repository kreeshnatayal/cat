'use client';

import { useEffect } from 'react';
import { usePlannerStore } from '@/lib/store/plannerStore';
import { useMockStore } from '@/lib/store/mockStore';
import { useRevisionStore, RevisionTopic } from '@/lib/store/revisionStore';
import { useSystemStore, WeeklyBattle } from '@/lib/store/systemStore';
import { QA_SYLLABUS, DILR_SYLLABUS, VARC_SYLLABUS, BLUEPRINT_BATTLES } from '@/lib/store/syllabusData';
import { Section } from '@/lib/constants';

/**
 * Triggers localStorage rehydration for all Zustand stores after the
 * component mounts on the client. This avoids the SSR "getServerSnapshot
 * should be cached" infinite loop caused by persist middleware trying to
 * access localStorage during server-side rendering.
 */
export function StoreHydrator() {
  useEffect(() => {
    usePlannerStore.persist.rehydrate();
    useMockStore.persist.rehydrate();
    useRevisionStore.persist.rehydrate();
    useSystemStore.persist.rehydrate();

    // Blueprint Data Injection
    const revisionStore = useRevisionStore.getState();
    if (revisionStore.topics.length === 0) {
      const now = new Date().toISOString().slice(0, 10);
      const toTopic = (name: string, subject: Section): RevisionTopic => ({
        id: crypto.randomUUID(),
        name,
        subject,
        dateStudied: now,
        lastRevised: null,
        retention: 1,
        status: 'Not Started',
        notes: ''
      });
      
      const allTopics = [
        ...QA_SYLLABUS.map(t => toTopic(t, 'QA')),
        ...DILR_SYLLABUS.map(t => toTopic(t, 'DILR')),
        ...VARC_SYLLABUS.map(t => toTopic(t, 'VARC')),
      ];
      revisionStore.injectSyllabus(allTopics);
      console.log('Injected CAT 2026 Master Syllabus into Knowledge Base');
    }

    const systemStore = useSystemStore.getState();
    if (systemStore.weeklyBattles.length === 0) {
      BLUEPRINT_BATTLES.forEach(b => systemStore.addWeeklyBattle(b));
      console.log('Injected CAT 2026 Master Blueprint Battles into Gamification Engine');
    }

  }, []);

  return null;
}
