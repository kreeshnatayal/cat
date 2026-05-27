'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend, LineChart, Line,
} from 'recharts';
import {
  Activity, BookOpen, Map, Trash2, AlertTriangle, CheckCircle2,
  Clock, Star, TrendingUp, Zap, Target, ShieldAlert, Eye,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

import { usePlannerStore } from '@/features/planner/store';
import { useRevisionStore, isDue } from '@/features/revision/store';
import { useMockStore } from '@/features/mocks/store';
import { useRoadmapStore, PHASES, getCurrentPhase } from '@/features/roadmap/store';
import { SECTION_COLORS } from '@/core/utils/constants';
import type { Section } from '@/core/utils/constants';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type TabId = 'performance' | 'revision' | 'roadmap';
type RevFilter = 'ALL' | 'QA' | 'DILR' | 'VARC' | 'OVERDUE' | 'MASTERED';

/* ─────────────────────────────────────────────
   Framer variants
───────────────────────────────────────────── */
const tabVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.06, duration: 0.24, ease: 'easeOut' as const },
  }),
};

/* ─────────────────────────────────────────────
   Tiny helpers
───────────────────────────────────────────── */
function daysBetween(dateStr: string | null): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function sectionColor(s: Section) {
  return SECTION_COLORS[s] ?? '#6366f1';
}

/* ─────────────────────────────────────────────
   Sub-component: Stat Pill
───────────────────────────────────────────── */
function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="cockpit-panel" style={{
      flex: '1 1 0',
      minWidth: 110,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      borderColor: accent ?? 'var(--border-default)',
    }}>
      <span className="hud-text" style={{ fontSize: 10, letterSpacing: 2, color: accent ?? 'var(--text-tertiary)' }}>
        {label}
      </span>
      <span className="hud-value mono" style={{ fontSize: 26, color: accent ?? 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-component: Section Badge
───────────────────────────────────────────── */
function SubjectBadge({ subject }: { subject: Section }) {
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 1.5,
      padding: '2px 7px',
      borderRadius: 3,
      background: `${sectionColor(subject)}22`,
      color: sectionColor(subject),
      border: `1px solid ${sectionColor(subject)}55`,
    }}>
      {subject}
    </span>
  );
}

/* ─────────────────────────────────────────────
   TAB A: PERFORMANCE
───────────────────────────────────────────── */
function PerformanceTab() {
  const { entries, getMVDCount, getStreak, getLongestStreak } = usePlannerStore();
  const { mocks, getWeakSection, getBestPercentile } = useMockStore();

  const totalMVDs = getMVDCount();
  const streak = getStreak();
  const maxStreak = getLongestStreak();
  const mocksLogged = mocks.length;
  const bestPctile = getBestPercentile();

  /* ── Area chart: MVD % last 30 days ── */
  const last30 = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({ start: subDays(today, 29), end: today });
    return days.map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === key);
      return {
        date: format(d, 'MMM d'),
        completion: entry ? entry.completionPercent : 0,
        mvd: entry?.mvdMet ? 100 : 0,
      };
    });
  }, [entries]);

  /* ── Bar chart: weekly MVD count last 8 weeks ── */
  const weeklyMVD = useMemo(() => {
    const weeks: { week: string; mvds: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = subDays(new Date(), w * 7 + 6);
      const weekEnd = subDays(new Date(), w * 7);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const mvds = days.filter(d => {
        const key = format(d, 'yyyy-MM-dd');
        const e = entries.find(x => x.date === key);
        return e?.mvdMet;
      }).length;
      weeks.push({ week: `W${8 - w}`, mvds });
    }
    return weeks;
  }, [entries]);

  /* ── Heatmap: last 70 days ── */
  const heatmapData = useMemo(() => {
    const today = new Date();
    return eachDayOfInterval({ start: subDays(today, 69), end: today }).map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === key);
      const pct = entry?.completionPercent ?? 0;
      const mvd = entry?.mvdMet ?? false;
      let bg = 'var(--border-subtle)';
      if (mvd) bg = 'var(--accent-green)';
      else if (pct >= 50) bg = 'rgba(0,229,255,0.5)';
      else if (pct > 0) bg = 'rgba(0,229,255,0.2)';
      return { date: format(d, 'MMM d'), bg, pct, mvd };
    });
  }, [entries]);

  /* ── Shadow System ── */
  const weakSection = getWeakSection();

  const daysSinceLastMock = useMemo(() => {
    const sorted = [...mocks].sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length === 0) return null;
    return daysBetween(sorted[0].date);
  }, [mocks]);

  const maskedProcrastination = useMemo(() => {
    return entries.filter(e => e.pmHours > 2 && !e.mvdMet).length;
  }, [entries]);

  const avgMVDRate = entries.length > 0
    ? Math.round((totalMVDs / entries.length) * 100)
    : 0;

  const hardTruth = useMemo(() => {
    const parts: string[] = [];
    if (weakSection) parts.push(`Your ${weakSection} scores are your lowest across all mocks.`);
    if (avgMVDRate < 60) parts.push(`You complete your MVD only ${avgMVDRate}% of the time.`);
    if (daysSinceLastMock !== null && daysSinceLastMock > 14)
      parts.push(`You have not run a mock in ${daysSinceLastMock} days. This is avoidance.`);
    if (maskedProcrastination > 3)
      parts.push(`${maskedProcrastination} days logged PM hours but skipped MVD. Busywork ≠ progress.`);
    if (parts.length === 0) return 'Insufficient data to generate a pattern diagnosis.';
    return parts.join(' ');
  }, [weakSection, avgMVDRate, daysSinceLastMock, maskedProcrastination]);

  const mockAvoidanceRisk = daysSinceLastMock !== null && daysSinceLastMock > 14;

  return (
    <motion.div key="performance" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
      {/* Row 1: Stat pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatPill label="TOTAL MVDs" value={totalMVDs} accent="var(--accent-cyan)" />
        <StatPill label="CURRENT STREAK" value={`${streak}d`} accent="var(--accent-green)" />
        <StatPill label="MAX STREAK" value={`${maxStreak}d`} />
        <StatPill label="MOCKS LOGGED" value={mocksLogged} />
        <StatPill label="BEST %ILE" value={bestPctile > 0 ? `${bestPctile}%` : '—'} accent="var(--accent-amber)" />
      </div>

      {/* Row 2: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="cockpit-panel" style={{ padding: 18 }}>
          <p className="hud-text" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
            MVD COMPLETION % · LAST 30 DAYS
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={last30} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} interval={6} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-default)', borderRadius: 6 }}
                labelStyle={{ color: 'var(--text-secondary)', fontSize: 11 }}
                itemStyle={{ color: 'var(--accent-cyan)', fontSize: 11 }}
              />
              <Area type="monotone" dataKey="completion" stroke="var(--accent-cyan)" strokeWidth={2} fill="url(#areaGrad)" name="Completion %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="cockpit-panel" style={{ padding: 18 }}>
          <p className="hud-text" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
            WEEKLY MVD COUNT · LAST 8 WEEKS
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyMVD} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} allowDecimals={false} domain={[0, 7]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-default)', borderRadius: 6 }}
                labelStyle={{ color: 'var(--text-secondary)', fontSize: 11 }}
                itemStyle={{ color: 'var(--accent-green)', fontSize: 11 }}
              />
              <Bar dataKey="mvds" fill="var(--accent-green)" radius={[3, 3, 0, 0]} name="MVDs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: MVD Heatmap */}
      <div className="cockpit-panel" style={{ padding: 18, marginBottom: 20 }}>
        <p className="hud-text" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
          MVD HEATMAP · LAST 70 DAYS
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(35, 1fr)', gap: 4 }}>
          {heatmapData.map((cell, i) => (
            <div
              key={i}
              title={`${cell.date}: ${cell.pct}%${cell.mvd ? ' ✓ MVD' : ''}`}
              style={{
                aspectRatio: '1',
                borderRadius: 3,
                background: cell.bg,
                cursor: 'default',
                transition: 'transform 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.35)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center' }}>
          {[
            { bg: 'var(--border-subtle)', label: 'No data' },
            { bg: 'rgba(0,229,255,0.2)', label: '< 50%' },
            { bg: 'rgba(0,229,255,0.5)', label: '50–99%' },
            { bg: 'var(--accent-green)', label: 'MVD Met' },
          ].map(({ bg, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: bg }} />
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Shadow System */}
      <div className="cockpit-panel" style={{
        padding: 20,
        borderColor: 'var(--accent-rose)',
        background: 'rgba(244,63,94,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <ShieldAlert size={16} color="var(--accent-rose)" />
          <span className="hud-text" style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent-rose)' }}>
            THE SHADOW SYSTEM
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Mock Avoidance */}
          <div style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${mockAvoidanceRisk ? 'var(--accent-rose)' : 'var(--border-subtle)'}`,
            borderRadius: 8,
            padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-tertiary)' }}>MOCK AVOIDANCE</span>
              {mockAvoidanceRisk && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                  color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.15)',
                  padding: '2px 7px', borderRadius: 3,
                }}>HIGH RISK</span>
              )}
            </div>
            <span className="mono" style={{ fontSize: 22, color: mockAvoidanceRisk ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
              {daysSinceLastMock !== null ? `${daysSinceLastMock}d` : 'N/A'}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {daysSinceLastMock === null ? 'No mock recorded yet.' : `Days since last mock attempt.`}
            </p>
          </div>

          {/* Masked Procrastination */}
          <div style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${maskedProcrastination > 3 ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
            borderRadius: 8,
            padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-tertiary)' }}>MASKED PROCRASTINATION</span>
            </div>
            <span className="mono" style={{ fontSize: 22, color: maskedProcrastination > 3 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
              {maskedProcrastination}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Days with PM &gt; 2h but MVD not met.
            </p>
          </div>
        </div>

        {/* Hard Truth */}
        <div style={{
          background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.25)',
          borderRadius: 8,
          padding: 16,
        }}>
          <p style={{ fontSize: 10, letterSpacing: 3, color: 'var(--accent-rose)', marginBottom: 8 }}>
            THE HARD TRUTH
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.65, fontStyle: 'italic' }}>
            "{hardTruth}"
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   TAB B: REVISION QUEUE
───────────────────────────────────────────── */
function RevisionTab() {
  const { topics, reviewTopic, deleteTopic, getDueTopics, getMasteredCount } = useRevisionStore();
  const [filter, setFilter] = useState<RevFilter>('ALL');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dueTopics = getDueTopics();
  const masteredCount = getMasteredCount();

  const filters: RevFilter[] = ['ALL', 'QA', 'DILR', 'VARC', 'OVERDUE', 'MASTERED'];

  const filtered = useMemo(() => {
    return topics.filter(t => {
      if (dismissed.has(t.id)) return false;
      if (filter === 'ALL') return true;
      if (filter === 'MASTERED') return t.status === 'Mastered';
      if (filter === 'OVERDUE') return isDue(t) && t.status !== 'Mastered';
      return t.subject === filter;
    });
  }, [topics, filter, dismissed]);

  function handleReview(id: string, score: 1 | 2 | 3 | 4 | 5) {
    reviewTopic(id, score);
    setDismissed(prev => new Set([...prev, id]));
  }

  const ratingColors: Record<number, string> = {
    1: '#f43f5e', 2: '#f59e0b', 3: '#6366f1', 4: '#06b6d4', 5: '#10b981',
  };

  return (
    <motion.div key="revision" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { label: 'TOPICS TOTAL', value: topics.length, icon: <BookOpen size={13} /> },
          { label: 'DUE TODAY', value: dueTopics.length, icon: <Clock size={13} />, accent: dueTopics.length > 0 ? 'var(--accent-amber)' : undefined },
          { label: 'MASTERED', value: masteredCount, icon: <CheckCircle2 size={13} />, accent: 'var(--accent-green)' },
        ].map(({ label, value, icon, accent }) => (
          <div key={label} className="cockpit-panel" style={{
            flex: '1 1 0', minWidth: 120, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderColor: accent ?? 'var(--border-default)',
          }}>
            <span style={{ color: accent ?? 'var(--text-tertiary)' }}>{icon}</span>
            <div>
              <p style={{ fontSize: 9, letterSpacing: 2, color: accent ?? 'var(--text-tertiary)', marginBottom: 2 }}>{label}</p>
              <span className="mono" style={{ fontSize: 20, color: accent ?? 'var(--text-primary)' }}>{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'badge badge-active' : 'badge'}
            style={{ cursor: 'pointer', fontSize: 10, letterSpacing: 1.5, padding: '5px 12px' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Topic list */}
      {filtered.length === 0 ? (
        <div className="cockpit-panel" style={{ padding: 40, textAlign: 'center' }}>
          <CheckCircle2 size={28} color="var(--accent-green)" style={{ margin: '0 auto 12px' }} />
          <p className="hud-text" style={{ color: 'var(--text-secondary)' }}>No topics match this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((topic, i) => {
              const overdue = isDue(topic) && topic.status !== 'Mastered';
              const daysSince = daysBetween(topic.lastRevised ?? topic.dateStudied);
              const isMockFlaw = topic.name.startsWith('[MOCK_FLAW]');
              const displayName = isMockFlaw ? topic.name.replace('[MOCK_FLAW] ', '') : topic.name;
              const easeWidth = Math.min(100, ((topic.easeFactor - 1.3) / (3.5 - 1.3)) * 100);

              return (
                <motion.div
                  key={topic.id}
                  layout
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: 60, transition: { duration: 0.22 } }}
                  className="cockpit-panel"
                  style={{
                    padding: '14px 16px',
                    borderColor: overdue ? 'var(--accent-amber)' : 'var(--border-default)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {/* Left: meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                        {isMockFlaw && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                            padding: '2px 6px', borderRadius: 3,
                            background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)',
                            border: '1px solid rgba(244,63,94,0.3)',
                          }}>MOCK_FLAW</span>
                        )}
                        <SubjectBadge subject={topic.subject} />
                        {overdue && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                            padding: '2px 6px', borderRadius: 3,
                            background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)',
                            border: '1px solid rgba(245,158,11,0.35)',
                          }}>OVERDUE</span>
                        )}
                      </div>

                      <p style={{
                        fontSize: 13, color: 'var(--text-primary)', fontWeight: 600,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 340, marginBottom: 6,
                      }} title={displayName}>
                        {displayName}
                      </p>

                      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                        Last revised: {daysSince >= 9999 ? 'Never' : `${daysSince}d ago`}
                        &nbsp;·&nbsp;Interval: {topic.interval}d
                      </p>

                      {/* Ease bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 1 }}>EASE</span>
                        <div style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: 'var(--border-subtle)', maxWidth: 100,
                        }}>
                          <div style={{
                            width: `${easeWidth}%`, height: '100%', borderRadius: 2,
                            background: easeWidth > 60 ? 'var(--accent-green)' : easeWidth > 30 ? 'var(--accent-cyan)' : 'var(--accent-rose)',
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        <span className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                          {topic.easeFactor.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      {/* Rating buttons */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {([1, 2, 3, 4, 5] as const).map(score => (
                          <button
                            key={score}
                            onClick={() => handleReview(topic.id, score)}
                            title={`Rate ${score}`}
                            style={{
                              width: 28, height: 28, borderRadius: 4, cursor: 'pointer',
                              background: 'var(--bg-surface)',
                              border: `1px solid ${ratingColors[score]}55`,
                              color: ratingColors[score],
                              fontSize: 11, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'background 0.15s, transform 0.1s',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = `${ratingColors[score]}22`;
                              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
                              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                            }}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                      {/* Delete */}
                      <button
                        onClick={() => deleteTopic(topic.id)}
                        title="Delete topic"
                        style={{
                          width: 28, height: 28, borderRadius: 4, cursor: 'pointer',
                          background: 'transparent', border: '1px solid var(--border-subtle)',
                          color: 'var(--text-tertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'color 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-rose)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-rose)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   TAB C: ROADMAP
───────────────────────────────────────────── */
function RoadmapTab() {
  const { manualPhaseOverride, setPhaseOverride } = useRoadmapStore();
  const { mocks } = useMockStore();
  const activePhase = getCurrentPhase(manualPhaseOverride);

  const daysRemaining = useMemo(() => {
    const end = new Date(activePhase.endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
    return Math.max(0, diff);
  }, [activePhase]);

  /* How many mocks have occurred during this phase? */
  const phasesMockCount = useMemo(() => {
    return mocks.filter(m => m.date >= activePhase.startDate && m.date <= activePhase.endDate).length;
  }, [mocks, activePhase]);

  /* Recommended mock frequency for this phase (heuristic from mockStrategy text) */
  const recommendedMocksText = activePhase.mockStrategy.split('.')[0];

  const progressOk = phasesMockCount >= 1 || activePhase.id === 1;

  const sectionFocus: { section: Section; focus: string }[] = [
    { section: 'QA', focus: activePhase.qaFocus },
    { section: 'DILR', focus: activePhase.dilrFocus },
    { section: 'VARC', focus: activePhase.varcFocus },
  ];

  return (
    <motion.div key="roadmap" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
      {/* Phase selector tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {PHASES.map(phase => {
          const active = activePhase.id === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => setPhaseOverride(active && manualPhaseOverride !== null ? null : phase.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 5,
                border: `1px solid ${active ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                background: active ? 'rgba(0,229,255,0.1)' : 'var(--bg-surface)',
                color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              P{phase.id} · {phase.name.split(' ')[0]}
            </button>
          );
        })}
        {manualPhaseOverride !== null && (
          <button
            onClick={() => setPhaseOverride(null)}
            style={{
              padding: '7px 12px', borderRadius: 5, cursor: 'pointer',
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid var(--accent-rose)',
              color: 'var(--accent-rose)', fontSize: 10, letterSpacing: 1.5,
            }}
          >
            AUTO
          </button>
        )}
      </div>

      {/* Phase header */}
      <div className="cockpit-panel" style={{ padding: 22, marginBottom: 16, borderColor: 'var(--accent-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="hud-text" style={{ fontSize: 10, letterSpacing: 2.5, marginBottom: 4 }}>
              PHASE {activePhase.id} OF 5 · {format(new Date(activePhase.startDate), 'dd MMM')} → {format(new Date(activePhase.endDate), 'dd MMM yyyy')}
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: 1, margin: 0 }}>
              {activePhase.focus.toUpperCase()}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{activePhase.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="hud-text" style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-tertiary)' }}>DAYS REMAINING</p>
            <span className="mono" style={{ fontSize: 34, color: daysRemaining < 14 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
              {daysRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* Strategic objectives */}
      <div className="cockpit-panel" style={{ padding: 18, marginBottom: 16 }}>
        <p className="hud-text" style={{ fontSize: 10, letterSpacing: 2.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={13} /> STRATEGIC OBJECTIVES
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activePhase.objective.map((obj, i) => (
            <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: 'var(--accent-cyan)', marginTop: 1 }}>◆</span>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55 }}>{obj}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section focus cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {sectionFocus.map(({ section, focus }) => (
          <div key={section} className="cockpit-panel" style={{
            padding: 16,
            borderColor: `${sectionColor(section)}66`,
            background: `${sectionColor(section)}08`,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              color: sectionColor(section), marginBottom: 8,
            }}>{section}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{focus}</p>
          </div>
        ))}
      </div>

      {/* Mock strategy + Study hours */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="cockpit-panel" style={{ padding: 18 }}>
          <p className="hud-text" style={{ fontSize: 10, letterSpacing: 2.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} /> MOCK STRATEGY
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{activePhase.mockStrategy}</p>
        </div>
        <div className="cockpit-panel" style={{ padding: 18 }}>
          <p className="hud-text" style={{ fontSize: 10, letterSpacing: 2.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} /> STUDY HOURS TARGET
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'WEEKDAYS', value: activePhase.weekdayHours },
              { label: 'WEEKENDS', value: activePhase.weekendHours },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 2, marginBottom: 2 }}>{label}</p>
                <span className="mono" style={{ fontSize: 18, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress check */}
      <div className="cockpit-panel" style={{
        padding: 18,
        borderColor: progressOk ? 'var(--accent-green)' : 'var(--accent-rose)',
        background: progressOk ? 'rgba(16,185,129,0.04)' : 'rgba(244,63,94,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {progressOk
            ? <CheckCircle2 size={15} color="var(--accent-green)" />
            : <AlertTriangle size={15} color="var(--accent-rose)" />
          }
          <p className="hud-text" style={{
            fontSize: 10, letterSpacing: 2.5,
            color: progressOk ? 'var(--accent-green)' : 'var(--accent-rose)',
          }}>
            PROGRESS CHECK
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 2, marginBottom: 4 }}>MOCKS THIS PHASE</p>
            <span className="mono" style={{ fontSize: 28, color: progressOk ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
              {phasesMockCount}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 2, marginBottom: 6 }}>RECOMMENDED CADENCE</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {recommendedMocksText}.
            </p>
            {!progressOk && (
              <p style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 6, fontStyle: 'italic' }}>
                ⚠ Mock count is behind. Schedule one now.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function IntelPage() {
  const [activeTab, setActiveTab] = useState<TabId>('performance');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'performance', label: 'PERFORMANCE', icon: <TrendingUp size={13} /> },
    { id: 'revision', label: 'REVISION', icon: <BookOpen size={13} /> },
    { id: 'roadmap', label: 'ROADMAP', icon: <Map size={13} /> },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Eye size={18} color="var(--accent-cyan)" />
          <h1 style={{
            fontSize: 28, fontWeight: 900, letterSpacing: 4,
            color: 'var(--accent-cyan)', margin: 0,
          }}>
            INTEL
          </h1>
        </div>
        <p className="hud-text" style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-tertiary)', paddingLeft: 28 }}>
          PERFORMANCE · REVISION ENGINE · STRATEGIC ROADMAP
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px',
                border: 'none',
                borderBottom: `2px solid ${active ? 'var(--accent-cyan)' : 'transparent'}`,
                background: 'transparent',
                color: active ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
                fontSize: 11, fontWeight: active ? 700 : 400, letterSpacing: 2,
                cursor: 'pointer',
                transition: 'color 0.18s, border-color 0.18s',
                marginBottom: -1,
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)';
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'revision' && <RevisionTab />}
        {activeTab === 'roadmap' && <RoadmapTab />}
      </AnimatePresence>
    </div>
  );
}
