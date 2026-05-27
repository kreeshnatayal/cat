'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import {
  Zap, RefreshCw, ChevronDown, ChevronUp, Star, CheckCircle2,
  BookOpen, Brain, BarChart3, FlaskConical, AlertTriangle,
} from 'lucide-react';

import { usePlannerStore, calcCompletion, type PlannerEntry } from '@/features/planner/store';
import { useRevisionStore } from '@/features/revision/store';
import { useMockStore } from '@/features/mocks/store';
import { useRoadmapStore, getCurrentPhase, getDailyTopics } from '@/features/roadmap/store';
import {
  computePerformanceState, computeLevel, THEME_DAYS,
  type MentalState, type PerformanceState,
} from '@/core/store/systemStore';
import { CAT_DATE, SECTION_COLORS } from '@/core/utils/constants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const PERF_STATE_COLOR: Record<PerformanceState, string> = {
  'Locked In':    'var(--accent-green)',
  'Stable':       'var(--accent-cyan)',
  'Friction':     'var(--accent-amber)',
  'Burnout Risk': 'var(--accent-amber)',
  'Collapse':     'var(--accent-rose)',
};

const MENTAL_STATES: MentalState[] = ['Focused', 'Calm', 'Distracted', 'Anxious', 'Burnt Out'];
const MENTAL_COLORS: Record<MentalState, string> = {
  'Focused':    'var(--accent-green)',
  'Calm':       'var(--accent-cyan)',
  'Distracted': 'var(--accent-amber)',
  'Anxious':    'var(--accent-amber)',
  'Burnt Out':  'var(--accent-rose)',
};

const RETENTION_COLORS = ['', '#f43f5e', '#f59e0b', '#6366f1', '#06b6d4', '#10b981'];

function blankEntry(date: string): PlannerEntry {
  return {
    id: crypto.randomUUID(),
    date,
    qaSolved: 0,
    dilrSolved: 0,
    rcsRead: 0,
    revisionMins: 0,
    pmHours: 0,
    mentalState: '',
    notes: '',
    frictionSource: '',
    momentumSource: '',
    aiBriefing: '',
    mvdMet: false,
    completionPercent: 0,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MVDRing({ percent, streak, mvdMet }: { percent: number; streak: number; mvdMet: boolean }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = mvdMet ? 'var(--accent-green)' : percent > 60 ? 'var(--accent-cyan)' : 'var(--accent-amber)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
          <motion.circle
            cx="64" cy="64" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circ}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {mvdMet ? (
            <CheckCircle2 size={24} color="var(--accent-green)" />
          ) : (
            <span className="hud-value mono" style={{ fontSize: 22, color }}>{percent}%</span>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        {mvdMet && (
          <div className="hud-text" style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: 11, letterSpacing: 2 }}>
            MVD SECURED
          </div>
        )}
        <div className="hud-text" style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 2 }}>
          🔥 {streak} day streak
        </div>
      </div>
    </div>
  );
}

interface TaskRowProps {
  section: string;
  color: string;
  target: number;
  topic: string;
  value: number;
  unit: string;
  isRecovery: boolean;
  onChange: (v: number) => void;
}

function TaskRow({ section, color, target, topic, value, unit, isRecovery, onChange }: TaskRowProps) {
  const progress = target > 0 ? Math.min((value / target) * 100, 100) : 100;
  const done = target > 0 ? value >= target : true;

  return (
    <motion.div
      layout
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: done ? `${color}12` : 'var(--bg-surface)',
        border: `1px solid ${done ? color : 'var(--border-subtle)'}`,
        borderRadius: 8,
        transition: 'background 0.3s',
      }}
    >
      {/* Section badge */}
      <span
        className="mono"
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          color, minWidth: 40, textAlign: 'center',
          padding: '2px 6px', borderRadius: 4,
          background: `${color}22`,
        }}
      >
        {section}
      </span>

      {/* Target */}
      <span className="hud-text" style={{ color: 'var(--text-tertiary)', fontSize: 11, minWidth: 56 }}>
        TARGET <span className="mono" style={{ color }}>{isRecovery ? `${target}⚡` : target}</span>
      </span>

      {/* Topic */}
      <span
        className="hud-text"
        style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={topic}
      >
        {topic}
      </span>

      {/* Progress bar (small) */}
      <div style={{ width: 48, height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: done ? 'var(--accent-green)' : color, borderRadius: 2 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Input */}
      <input
        type="number"
        min={0}
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mono"
        style={{
          width: 60, background: 'var(--bg-app)', border: `1px solid ${done ? color : 'var(--border-subtle)'}`,
          borderRadius: 6, padding: '4px 8px', color: done ? color : 'var(--text-primary)',
          fontSize: 14, fontWeight: 600, textAlign: 'center', outline: 'none',
          transition: 'border-color 0.2s',
        }}
      />
      <span className="hud-text" style={{ fontSize: 11, color: 'var(--text-tertiary)', minWidth: 28 }}>{unit}</span>
      {done && <CheckCircle2 size={14} color="var(--accent-green)" />}
    </motion.div>
  );
}

interface RevisionCardProps {
  topic: { id: string; name: string; subject: string };
  onRate: (id: string, score: 1 | 2 | 3 | 4 | 5) => void;
}

function RevisionCard({ topic, onRate }: RevisionCardProps) {
  const [rated, setRated] = useState(false);
  const [hovered, setHovered] = useState(0);

  const subjectColor = SECTION_COLORS[topic.subject as keyof typeof SECTION_COLORS] ?? 'var(--accent-cyan)';

  const handleRate = (score: 1 | 2 | 3 | 4 | 5) => {
    setRated(true);
    setTimeout(() => onRate(topic.id, score), 350);
  };

  return (
    <AnimatePresence>
      {!rated && (
        <motion.div
          layout
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            padding: '10px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            marginBottom: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              className="mono"
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                padding: '2px 6px', borderRadius: 3,
                color: subjectColor, background: `${subjectColor}22`,
              }}
            >
              {topic.subject}
            </span>
            <span className="hud-text" style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>
              {topic.name}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([1, 2, 3, 4, 5] as const).map((score) => (
              <button
                key={score}
                onClick={() => handleRate(score)}
                onMouseEnter={() => setHovered(score)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  flex: 1, padding: '4px 0', borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${hovered >= score ? RETENTION_COLORS[score] : 'var(--border-subtle)'}`,
                  background: hovered >= score ? `${RETENTION_COLORS[score]}22` : 'var(--bg-app)',
                  transition: 'all 0.15s',
                }}
              >
                <Star
                  size={12}
                  color={hovered >= score ? RETENTION_COLORS[score] : 'var(--text-tertiary)'}
                  fill={hovered >= score ? RETENTION_COLORS[score] : 'none'}
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TodayPage() {
  // Store hooks
  const { getEntryByDate, addEntry, getStreak, getMVDCount } = usePlannerStore();
  const { getDueTopics, reviewTopic, topics: allTopics } = useRevisionStore();
  const { mocks, getBestPercentile } = useMockStore();
  const { manualPhaseOverride } = useRoadmapStore();

  // Derived store values (stable refs via useMemo)
  const existingEntry = useMemo(() => getEntryByDate(TODAY_ISO), [getEntryByDate]);
  const streak = useMemo(() => getStreak(), [getStreak]);
  const mvdCount = useMemo(() => getMVDCount(), [getMVDCount]);
  const bestPercentile = useMemo(() => getBestPercentile(), [getBestPercentile]);
  const dueTopics = useMemo(() => getDueTopics(), [getDueTopics, allTopics]);
  const perfState = useMemo(() => computePerformanceState(), []);
  const phase = useMemo(() => getCurrentPhase(manualPhaseOverride), [manualPhaseOverride]);
  const level = useMemo(() => computeLevel(mvdCount, mocks.length, bestPercentile), [mvdCount, mocks.length, bestPercentile]);
  const dayOfWeek = new Date().getDay();
  const themeDay = THEME_DAYS[dayOfWeek];
  const isRecovery = perfState === 'Collapse' || perfState === 'Burnout Risk';
  const multiplier = isRecovery ? 0.5 : 1;
  const targets = useMemo(() => ({
    qa: Math.ceil(themeDay.targets.qa * multiplier),
    dilr: Math.ceil(themeDay.targets.dilr * multiplier),
    varc: Math.ceil(themeDay.targets.varc * multiplier),
    rev: Math.ceil(themeDay.targets.rev * multiplier),
  }), [themeDay, multiplier]);

  // finalTopics: prefer due topics for each section, else phase topic
  const phaseTopics = useMemo(() => getDailyTopics(TODAY_ISO, phase), [phase]);
  const finalTopics = useMemo(() => {
    const dueBySection = (sec: string) =>
      dueTopics.filter(t => t.subject === sec).slice(0, 2).map(t => t.name).join(', ');
    return {
      qa: dueBySection('QA') ? `[DUE] ${dueBySection('QA')}` : phaseTopics.qa,
      dilr: dueBySection('DILR') ? `[DUE] ${dueBySection('DILR')}` : phaseTopics.dilr,
      varc: dueBySection('VARC') ? `[DUE] ${dueBySection('VARC')}` : phaseTopics.varc,
    };
  }, [dueTopics, phaseTopics]);

  // Days to CAT
  const daysToCAT = differenceInDays(CAT_DATE, new Date());

  // Form state
  const [form, setForm] = useState<PlannerEntry>(() => existingEntry ?? blankEntry(TODAY_ISO));
  const [debriefOpen, setDebriefOpen] = useState(false);

  // Completion derived from form
  const { percent, mvdMet } = useMemo(() => calcCompletion(form), [
    form.qaSolved, form.dilrSolved, form.rcsRead, form.revisionMins, form.date,
  ]);

  // AI Briefing state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const briefingRef = useRef<string>('');

  // Debounced auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSave = useCallback((updated: PlannerEntry) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const { percent: p, mvdMet: m } = calcCompletion(updated);
      addEntry({ ...updated, completionPercent: p, mvdMet: m });
    }, 800);
  }, [addEntry]);

  const updateForm = useCallback(<K extends keyof PlannerEntry>(key: K, value: PlannerEntry[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      handleSave(next);
      return next;
    });
  }, [handleSave]);

  // Keep form in sync if store updates externally (e.g. hydration)
  useEffect(() => {
    if (existingEntry) setForm(existingEntry);
  }, [existingEntry?.id]);

  // AI Briefing fetch (streaming)
  const generateBriefing = useCallback(async () => {
    setAiLoading(true);
    setAiError('');
    briefingRef.current = '';
    updateForm('aiBriefing', '');

    const systemPrompt = `You are CAT OS — a ruthlessly focused AI coach for a CAT 2026 aspirant. 
Generate a sharp, tactical daily briefing (max 120 words). 
Aspirant context: Streak=${streak} days | Phase=${phase.name} | Level=${level.name} | Due revisions=${dueTopics.length} | MVDs completed=${mvdCount} | Performance state=${perfState}.
Tone: direct, military-precise, motivating. No fluff. Address the aspirant as "you".
Focus on: what to attack today, one mental reminder, and one strategic priority.`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate today's briefing for ${format(new Date(), 'EEEE, MMMM d')}.` },
          ],
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        briefingRef.current += chunk;
        setForm(prev => {
          const next = { ...prev, aiBriefing: briefingRef.current };
          return next;
        });
      }

      // Final save with complete briefing
      setForm(prev => {
        const next = { ...prev, aiBriefing: briefingRef.current };
        handleSave(next);
        return next;
      });
    } catch (err: any) {
      setAiError(err.message ?? 'Failed to generate briefing');
    } finally {
      setAiLoading(false);
    }
  }, [streak, phase, level, dueTopics.length, mvdCount, perfState, handleSave]);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* HEADER */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          padding: '10px 16px',
          background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10,
        }}>
          <span className="hud-value mono" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </span>
          <span className="badge badge-active" style={{ fontSize: 10, letterSpacing: 1.5, background: `${SECTION_COLORS.DILR}22`, color: 'var(--accent-cyan)', border: `1px solid ${SECTION_COLORS.DILR}44` }}>
            PHASE {phase.id} · {phase.name.replace(' Phase', '').replace(' Building', '').replace(' Intensive', '')}
          </span>
          <span className="badge" style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            {daysToCAT} days to CAT
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <span
              className="badge mono"
              style={{
                fontSize: 10, letterSpacing: 1.5, fontWeight: 700,
                color: PERF_STATE_COLOR[perfState],
                background: `${PERF_STATE_COLOR[perfState]}18`,
                border: `1px solid ${PERF_STATE_COLOR[perfState]}44`,
                padding: '3px 10px', borderRadius: 20,
              }}
            >
              {perfState.toUpperCase()}
            </span>
          </div>
        </div>

        {/* RECOVERY BANNER */}
        <AnimatePresence>
          {isRecovery && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 8,
                background: 'rgba(244,63,94,0.08)', border: '1px solid var(--accent-rose)',
              }}
            >
              <AlertTriangle size={16} color="var(--accent-rose)" />
              <span className="hud-text" style={{ fontSize: 12, color: 'var(--accent-rose)', fontWeight: 600 }}>
                RECOVERY MODE ACTIVE — All targets halved. Protect your energy. Quality over quantity.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI BRIEFING */}
        <div className="cockpit-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Zap size={14} color="var(--accent-cyan)" />
            <span className="hud-text" style={{ fontSize: 11, letterSpacing: 2, color: 'var(--accent-cyan)', fontWeight: 700 }}>
              AI BRIEFING
            </span>
            {form.aiBriefing && !aiLoading && (
              <button
                onClick={generateBriefing}
                className="btn-ghost"
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px' }}
              >
                <RefreshCw size={10} />
                REGENERATE
              </button>
            )}
          </div>

          {aiLoading ? (
            <div style={{
              background: '#0a0e14', borderRadius: 8, padding: '12px 16px',
              fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-cyan)',
              lineHeight: 1.7, minHeight: 60,
            }}>
              <span style={{ whiteSpace: 'pre-wrap' }}>{form.aiBriefing}</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                style={{ display: 'inline-block', marginLeft: 2 }}
              >
                _
              </motion.span>
            </div>
          ) : form.aiBriefing ? (
            <pre style={{
              background: '#0a0e14', borderRadius: 8, padding: '12px 16px',
              fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-cyan)',
              lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              margin: 0,
            }}>
              {form.aiBriefing}
            </pre>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
              {aiError && (
                <span className="hud-text" style={{ fontSize: 11, color: 'var(--accent-rose)', marginBottom: 4 }}>
                  {aiError}
                </span>
              )}
              <motion.button
                onClick={generateBriefing}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: 1.5 }}
              >
                <Zap size={14} />
                GENERATE TODAY'S BRIEFING
              </motion.button>
              <span className="hud-text" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                Powered by streak · phase · performance context
              </span>
            </div>
          )}
        </div>

        {/* TODAY'S MISSION */}
        <div className="cockpit-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Brain size={14} color="var(--accent-amber)" />
            <span className="hud-text" style={{ fontSize: 11, letterSpacing: 2, color: 'var(--accent-amber)', fontWeight: 700 }}>
              TODAY'S MISSION
            </span>
            <span className="hud-text" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' }}>
              {themeDay.name} — {themeDay.focus}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <TaskRow
              section="QA"
              color={SECTION_COLORS.QA}
              target={targets.qa}
              topic={finalTopics.qa}
              value={form.qaSolved}
              unit="Qs"
              isRecovery={isRecovery}
              onChange={(v) => updateForm('qaSolved', v)}
            />
            <TaskRow
              section="DILR"
              color={SECTION_COLORS.DILR}
              target={targets.dilr}
              topic={finalTopics.dilr}
              value={form.dilrSolved}
              unit="sets"
              isRecovery={isRecovery}
              onChange={(v) => updateForm('dilrSolved', v)}
            />
            <TaskRow
              section="VARC"
              color={SECTION_COLORS.VARC}
              target={targets.varc}
              topic={finalTopics.varc}
              value={form.rcsRead}
              unit="RCs"
              isRecovery={isRecovery}
              onChange={(v) => updateForm('rcsRead', v)}
            />
            <TaskRow
              section="REV"
              color="var(--accent-amber)"
              target={targets.rev}
              topic="Active Recall · Spaced Repetition"
              value={form.revisionMins}
              unit="min"
              isRecovery={isRecovery}
              onChange={(v) => updateForm('revisionMins', v)}
            />
          </div>
        </div>

        {/* DEBRIEF (collapsible) */}
        <div className="cockpit-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            onClick={() => setDebriefOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <BookOpen size={14} color="var(--text-secondary)" />
            <span className="hud-text" style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-secondary)', fontWeight: 700 }}>
              DEBRIEF
            </span>
            {form.mentalState && (
              <span
                className="badge mono"
                style={{ fontSize: 9, marginLeft: 8, color: MENTAL_COLORS[form.mentalState as MentalState], background: `${MENTAL_COLORS[form.mentalState as MentalState]}18`, border: `1px solid ${MENTAL_COLORS[form.mentalState as MentalState]}40` }}
              >
                {form.mentalState.toUpperCase()}
              </span>
            )}
            <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>
              {debriefOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {debriefOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Mental State */}
                  <div>
                    <div className="hud-text" style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 1.5, marginBottom: 8 }}>
                      MENTAL STATE
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {MENTAL_STATES.map(state => {
                        const active = form.mentalState === state;
                        const c = MENTAL_COLORS[state];
                        return (
                          <button
                            key={state}
                            onClick={() => updateForm('mentalState', active ? '' : state)}
                            className="mono"
                            style={{
                              padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                              border: `1px solid ${active ? c : 'var(--border-subtle)'}`,
                              background: active ? `${c}22` : 'var(--bg-app)',
                              color: active ? c : 'var(--text-secondary)',
                              fontWeight: active ? 700 : 400,
                              transition: 'all 0.15s',
                            }}
                          >
                            {state}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Friction Source */}
                  <div>
                    <label className="hud-text" style={{ display: 'block', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 1.5, marginBottom: 6 }}>
                      FRICTION SOURCE
                    </label>
                    <input
                      type="text"
                      placeholder="What slowed you down today?"
                      value={form.frictionSource ?? ''}
                      onChange={e => updateForm('frictionSource', e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--bg-app)', border: '1px solid var(--border-subtle)',
                        borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)',
                        fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>

                  {/* Momentum Source */}
                  <div>
                    <label className="hud-text" style={{ display: 'block', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 1.5, marginBottom: 6 }}>
                      MOMENTUM SOURCE
                    </label>
                    <input
                      type="text"
                      placeholder="What worked well today?"
                      value={form.momentumSource ?? ''}
                      onChange={e => updateForm('momentumSource', e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--bg-app)', border: '1px solid var(--border-subtle)',
                        borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)',
                        fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="hud-text" style={{ display: 'block', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 1.5, marginBottom: 6 }}>
                      NOTES
                    </label>
                    <textarea
                      placeholder="Anything else worth logging..."
                      value={form.notes}
                      onChange={e => updateForm('notes', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', boxSizing: 'border-box', resize: 'vertical',
                        background: 'var(--bg-app)', border: '1px solid var(--border-subtle)',
                        borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)',
                        fontSize: 13, outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div style={{ flex: '0 0 300px', width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* MVD RING */}
        <div className="cockpit-panel" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span className="hud-text" style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 8 }}>
            MVD PROGRESS
          </span>
          <MVDRing percent={percent} streak={streak} mvdMet={mvdMet} />
          <div style={{ width: '100%', marginTop: 12, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="hud-text" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>LEVEL</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--accent-cyan)', fontWeight: 700 }}>
                L{level.level} · {level.name.toUpperCase()}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span className="hud-text" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{level.req}</span>
            </div>
          </div>
        </div>

        {/* DUE REVISIONS */}
        <div className="cockpit-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BookOpen size={13} color="var(--accent-amber)" />
            <span className="hud-text" style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent-amber)', fontWeight: 700 }}>
              DUE REVISIONS TODAY
            </span>
            {dueTopics.length > 0 && (
              <span className="badge mono" style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}>
                {dueTopics.length}
              </span>
            )}
          </div>

          {dueTopics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle2 size={20} color="var(--accent-green)" style={{ marginBottom: 6 }} />
              <div className="hud-text" style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>
                QUEUE CLEAR ✓
              </div>
              <div className="hud-text" style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                No revisions due today
              </div>
            </div>
          ) : (
            <div>
              {dueTopics.slice(0, 3).map(topic => (
                <RevisionCard
                  key={topic.id}
                  topic={topic}
                  onRate={(id, score) => reviewTopic(id, score)}
                />
              ))}
              {dueTopics.length > 3 && (
                <div className="hud-text" style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 4 }}>
                  +{dueTopics.length - 3} more in Revision Engine →
                </div>
              )}
            </div>
          )}
        </div>

        {/* QUICK STATS */}
        <div className="cockpit-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={13} color="var(--text-secondary)" />
            <span className="hud-text" style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-secondary)', fontWeight: 700 }}>
              QUICK STATS
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Mocks Logged', value: mocks.length, icon: <FlaskConical size={11} color="var(--accent-cyan)" />, color: 'var(--accent-cyan)' },
              { label: 'Best Percentile', value: bestPercentile > 0 ? `${bestPercentile}%ile` : '—', icon: <BarChart3 size={11} color="var(--accent-green)" />, color: 'var(--accent-green)' },
              { label: 'Total MVDs', value: mvdCount, icon: <CheckCircle2 size={11} color="var(--accent-amber)" />, color: 'var(--accent-amber)' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {icon}
                  <span className="hud-text" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                </div>
                <span className="hud-value mono" style={{ fontSize: 14, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
