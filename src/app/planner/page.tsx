'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePlannerStore, calcCompletion, PlannerEntry } from '@/lib/store/plannerStore';
import { useSystemStore, THEME_DAYS, MentalState } from '@/lib/store/systemStore';
import { useRoadmapStore, getCurrentPhase, getDailyTopics } from '@/lib/store/roadmapStore';
import { SECTION_COLORS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Zap, Activity, Brain, Crosshair, X, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { TaskCard } from '@/components/ui/TaskCard';

const MENTAL_STATES: { state: MentalState; color: string; emoji: string }[] = [
  { state: 'Focused',    color: 'var(--accent-primary)',  emoji: '⚡' },
  { state: 'Calm',       color: 'var(--accent-green)',    emoji: '🌿' },
  { state: 'Distracted', color: 'var(--accent-amber)',    emoji: '💨' },
  { state: 'Anxious',    color: 'var(--accent-rose)',     emoji: '🌊' },
  { state: 'Burnt Out',  color: '#f43f5e',                emoji: '💀' },
];

export default function PlannerPage() {
  const today        = new Date().toISOString().slice(0, 10);
  const addEntry     = usePlannerStore((s) => s.addEntry);
  const existingEntry = usePlannerStore((s) => s.getEntryByDate(today));

  const dateObj  = new Date(today + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();
  const theme    = THEME_DAYS[dayOfWeek];

  const manualPhaseOverride = useRoadmapStore((s) => s.manualPhaseOverride);
  const phase       = getCurrentPhase(manualPhaseOverride);
  const dailyTopics = getDailyTopics(today, phase);

  const [form, setForm] = useState({
    date:           today,
    qaSolved:       existingEntry?.qaSolved        ?? 0,
    dilrSolved:     existingEntry?.dilrSolved      ?? 0,
    rcsRead:        existingEntry?.rcsRead         ?? 0,
    revisionMins:   existingEntry?.revisionMins    ?? 0,
    pmHours:        existingEntry?.pmHours         ?? 0,
    mentalState:    existingEntry?.mentalState     ?? '',
    notes:          existingEntry?.notes           ?? '',
    frictionSource: existingEntry?.frictionSource  ?? '',
    momentumSource: existingEntry?.momentumSource  ?? '',
  });

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { percent: completionPercent, mvdMet } = calcCompletion(form);

  const handleSave = () => {
    const entry: PlannerEntry = {
      id: existingEntry?.id ?? crypto.randomUUID(),
      ...form,
      qaSolved:     Number(form.qaSolved),
      dilrSolved:   Number(form.dilrSolved),
      rcsRead:      Number(form.rcsRead),
      revisionMins: Number(form.revisionMins),
      pmHours:      Number(form.pmHours),
      mentalState:  form.mentalState as MentalState,
      mvdMet,
      completionPercent,
    };
    addEntry(entry);
  };

  useEffect(() => {
    const t = setTimeout(handleSave, 800);
    return () => clearTimeout(t);
  }, [form]);

  // ── Escape to exit focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFocusMode(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const circumference = 2 * Math.PI * 40;

  return (
    <div className="page-container" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

      {/* ═══════════════════════════════════
          LEFT — Execution Board
      ═══════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 48 }}>

        {/* ── Header ── */}
        <div>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--bg-base)',
                background: 'var(--accent-primary)',
                padding: '4px 10px',
                borderRadius: 99,
              }}
            >
              {theme.type} Energy
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              {format(dateObj, 'EEEE, MMMM d')}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Phase {phase.id} · {phase.name}
            </span>
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <h1
              className="mono"
              style={{
                fontSize: 'clamp(26px, 3.5vw, 40px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                textTransform: 'uppercase',
              }}
            >
              {theme.name}<br />
              <span style={{ color: 'var(--accent-primary)' }}>{theme.focus}</span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {/* Focus button */}
              <button
                onClick={() => setIsFocusMode(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'var(--accent-primary-muted)',
                  border: '1px solid var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  padding: '9px 18px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 20px var(--accent-primary-glow)',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(99,153,255,0.2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'var(--accent-primary-muted)'; }}
              >
                <Crosshair size={13} /> Focus
              </button>

              {/* Progress ring */}
              <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
                <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="44" cy="44" r="40" fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
                  <circle
                    cx="44" cy="44" r="40" fill="none"
                    stroke={mvdMet ? 'var(--accent-green)' : 'var(--accent-primary)'}
                    strokeWidth="4"
                    strokeDasharray={`${circumference * (completionPercent / 100)} ${circumference}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mono" style={{ fontSize: 17, fontWeight: 700, color: mvdMet ? 'var(--accent-green)' : 'var(--text-primary)', lineHeight: 1 }}>
                    {completionPercent}%
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3, fontWeight: 600 }}>
                    {mvdMet ? 'Done ✓' : 'MVD'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Morning Block ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Sun size={14} color="var(--accent-amber)" />
            <span className="section-label">Morning · High Cognitive Load</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TaskCard
              title="Quantitative Aptitude"
              subtitle={theme.targets.qa > 0 ? `${theme.targets.qa} Qs target · ${dailyTopics.qa}` : 'Maintenance only today'}
              color={SECTION_COLORS.QA}
              value={form.qaSolved}
              onChange={(v) => setForm(f => ({ ...f, qaSolved: v }))}
              unit="Qs"
              isOptional={theme.targets.qa === 0}
            />
            <TaskCard
              title="Logical Reasoning & DI"
              subtitle={theme.targets.dilr > 0 ? `${theme.targets.dilr} Sets target · ${dailyTopics.dilr}` : 'Maintenance only today'}
              color={SECTION_COLORS.DILR}
              value={form.dilrSolved}
              onChange={(v) => setForm(f => ({ ...f, dilrSolved: v }))}
              unit="Sets"
              isOptional={theme.targets.dilr === 0}
            />
          </div>
        </div>

        {/* ── Evening Block ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Moon size={14} color="var(--accent-purple)" />
            <span className="section-label">Evening · Consolidation</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TaskCard
              title="Verbal Ability & RC"
              subtitle={theme.targets.varc > 0 ? `${theme.targets.varc} RCs target · ${dailyTopics.varc}` : 'Maintenance only today'}
              color={SECTION_COLORS.VARC}
              value={form.rcsRead}
              onChange={(v) => setForm(f => ({ ...f, rcsRead: v }))}
              unit="RCs"
              isOptional={theme.targets.varc === 0}
            />
            <TaskCard
              title="Spaced Repetition"
              subtitle={`${theme.targets.rev} min target · Flashcards & weak-area review`}
              color="var(--accent-green)"
              value={form.revisionMins}
              onChange={(v) => setForm(f => ({ ...f, revisionMins: v }))}
              unit="Mins"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          RIGHT — Context Panel
      ═══════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 48, paddingTop: 4 }}>

        {/* ── AI/PM Limiter ── */}
        <div className="surface-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={14} color="var(--accent-amber)" />
            <span className="section-label">AI / PM Limiter</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Work Hours Today</span>
            <span
              className="mono"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: form.pmHours > (dayOfWeek === 0 || dayOfWeek === 6 ? 3 : 1) ? 'var(--accent-rose)' : 'var(--accent-green)',
              }}
            >
              {form.pmHours}h
            </span>
          </div>
          <input
            type="range" min="0" max="8" step="0.5"
            value={form.pmHours}
            onChange={(e) => setForm(f => ({ ...f, pmHours: e.target.value }))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
            Cap: {dayOfWeek === 0 || dayOfWeek === 6 ? '3h weekends' : '1h weekdays'} · Protect deep work.
          </div>
        </div>

        {/* ── Mental State ── */}
        <div className="surface-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Activity size={14} color="var(--accent-primary)" />
            <span className="section-label">Mental State</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {MENTAL_STATES.map(({ state, color, emoji }) => {
              const selected = form.mentalState === state;
              return (
                <button
                  key={state}
                  onClick={() => setForm(f => ({ ...f, mentalState: state }))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    background: selected ? `${color}20` : 'var(--bg-glass)',
                    color: selected ? color : 'var(--text-muted)',
                    border: selected ? `1px solid ${color}50` : '1px solid var(--border-subtle)',
                    boxShadow: selected ? `0 0 12px ${color}25` : 'none',
                  }}
                >
                  {emoji} {state}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Operator Journal ── */}
        <div className="surface-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Brain size={14} color="var(--accent-purple)" />
            <span className="section-label">Operator Journal</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--accent-rose)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Friction Source
              </div>
              <input
                type="text"
                value={form.frictionSource}
                onChange={(e) => setForm(f => ({ ...f, frictionSource: e.target.value }))}
                placeholder="What slowed you down?"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-rose) !important'; }}
                onBlur={(e) => { e.target.style.borderColor = ''; }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Momentum Source
              </div>
              <input
                type="text"
                value={form.momentumSource}
                onChange={(e) => setForm(f => ({ ...f, momentumSource: e.target.value }))}
                placeholder="What accelerated you?"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Debrief
              </div>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="What needs fixing tomorrow?"
                rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, lineHeight: 1.6, resize: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          FOCUS MODE PORTAL
      ═══════════════════════════════════ */}
      {mounted && createPortal(
        <AnimatePresence>
          {isFocusMode && (
            <motion.div
              key="focus-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: '#05050C',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 60px',
              }}
            >
              {/* Exit button */}
              <button
                onClick={() => setIsFocusMode(false)}
                style={{
                  position: 'absolute',
                  top: 32,
                  right: 36,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  padding: '7px 14px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <X size={13} /> Exit · Esc
              </button>

              {/* Label */}
              <div style={{ fontSize: 11, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 20 }}>
                Mission Control · {format(dateObj, 'MMMM d')}
              </div>

              {/* Big title */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mono"
                style={{
                  fontSize: 'clamp(44px, 8vw, 100px)',
                  fontWeight: 700,
                  letterSpacing: '-0.05em',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                  marginBottom: 16,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                {theme.focus}
              </motion.h1>

              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 56, textAlign: 'center' }}>
                Phase {phase.id} · {phase.name}
              </div>

              {/* Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 860 }}
              >
                {[
                  { title: 'Quant', subtitle: dailyTopics.qa, color: SECTION_COLORS.QA, key: 'qaSolved' as const, unit: 'Qs', target: theme.targets.qa },
                  { title: 'DILR', subtitle: dailyTopics.dilr, color: SECTION_COLORS.DILR, key: 'dilrSolved' as const, unit: 'Sets', target: theme.targets.dilr },
                  { title: 'VARC', subtitle: dailyTopics.varc, color: SECTION_COLORS.VARC, key: 'rcsRead' as const, unit: 'RCs', target: theme.targets.varc },
                ].map(({ title, subtitle, color, key, unit, target }) => (
                  <div key={key} style={{ flex: 1 }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: `1px solid ${color}30`,
                      borderRadius: 14,
                      padding: '20px 20px 16px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>{subtitle}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                        <input
                          type="number"
                          value={form[key] || ''}
                          onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder="0"
                          className="mono"
                          min={0}
                          style={{
                            width: 80,
                            background: 'transparent !important' as any,
                            border: 'none !important' as any,
                            borderBottom: `2px solid ${color}60 !important` as any,
                            color,
                            fontSize: 36,
                            fontWeight: 700,
                            textAlign: 'center',
                            outline: 'none',
                            borderRadius: '0 !important' as any,
                            boxShadow: 'none !important' as any,
                          }}
                        />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{unit}</span>
                      </div>
                      {target > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 10 }}>Target: {target}</div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Progress bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                style={{ marginTop: 40, width: '100%', maxWidth: 860 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>MVD Progress</span>
                  <span className="mono" style={{ fontSize: 11, color: mvdMet ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                    {completionPercent}% {mvdMet && '· Achieved ✓'}
                  </span>
                </div>
                <div style={{ height: 3, background: 'var(--border-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div
                    style={{
                      height: '100%',
                      background: mvdMet ? 'var(--accent-green)' : 'var(--accent-primary)',
                      borderRadius: 99,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
