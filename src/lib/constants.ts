// CAT 2026 OS — Constants

export const CAT_DATE = new Date('2026-11-29T09:00:00+05:30'); // Approximate CAT 2026 date

export const SECTIONS = ['QA', 'DILR', 'VARC'] as const;
export type Section = typeof SECTIONS[number];

export const SECTION_COLORS: Record<Section, string> = {
  QA: '#6366f1',
  DILR: '#06b6d4',
  VARC: '#10b981',
};

export const SECTION_BG: Record<Section, string> = {
  QA: 'rgba(99,102,241,0.15)',
  DILR: 'rgba(6,182,212,0.15)',
  VARC: 'rgba(16,185,129,0.15)',
};

export const MOODS = [
  { emoji: '🔥', label: 'On Fire' },
  { emoji: '🧠', label: 'Focused' },
  { emoji: '😤', label: 'Grinding' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😰', label: 'Stressed' },
] as const;

export const RETENTION_LEVELS = [
  { value: 1, label: 'Forgotten', color: '#f43f5e' },
  { value: 2, label: 'Weak', color: '#f59e0b' },
  { value: 3, label: 'Fair', color: '#6366f1' },
  { value: 4, label: 'Good', color: '#06b6d4' },
  { value: 5, label: 'Mastered', color: '#10b981' },
] as const;

export const TOPIC_STATUS = ['Not Started', 'In Progress', 'Revised', 'Mastered'] as const;
export type TopicStatus = typeof TOPIC_STATUS[number];

export const MOCK_SERIES = [
  'SimCAT', 'AIMCAT', 'TIME Mock', 'CL Mock', 'IMS Mock',
  'Career Launcher', 'Unacademy Mock', 'Custom Mock', 'Full Length Practice',
];

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/planner', label: 'Daily Planner', icon: 'CalendarDays' },
  { href: '/mocks', label: 'Mock Lab', icon: 'FlaskConical' },
  { href: '/analytics', label: 'Analytics', icon: 'BarChart3' },
  { href: '/revision', label: 'Revision Engine', icon: 'BookOpen' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
] as const;
