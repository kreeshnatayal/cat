'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePlannerStore, calcCompletion, PlannerEntry } from '@/features/planner/store';
import { useMockStore } from '@/features/mocks/store';
import { useRevisionStore, isDue } from '@/features/revision/store';
import { useSystemStore, THEME_DAYS, MentalState, computeLevel } from '@/core/store/systemStore';
import { useRoadmapStore, getCurrentPhase, getDailyTopics } from '@/features/roadmap/store';
import { SECTION_COLORS } from '@/core/utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Zap, Activity, Brain, Crosshair, X, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { TaskCard } from '@/features/planner/components/TaskCard';

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
  
  const streak = usePlannerStore((s) => s.getStreak());
  const mvdCount = usePlannerStore((s) => s.getMVDCount());
  const mocks = useMockStore((s) => s.mocks);
  const bestPercentile = useMockStore((s) => s.getBestPercentile());
  const topics = useRevisionStore((s) => s.topics);
  const dueCount = topics.filter(isDue).length;
  const level = computeLevel(mvdCount, mocks.length, bestPercentile);

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
  const [aiOutput, setAiOutput]       = useState('');
  const [aiLoading, setAiLoading]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const runAI = async (prompt: string) => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiOutput('');

    const system = `You are the CAT OS Tactical AI. You are a brutal, highly analytical, extremely direct strategic coach for a student preparing for CAT. Do NOT be polite. Do NOT use emojis. Military-style sentences only. Under 150 words. Use line breaks.

USER STATUS:
- Phase: ${phase.name}
- Level: ${level.level} (${level.name})
- Streak: ${streak} days
- Due Revisions: ${dueCount} topics
- Total MVDs: ${mvdCount}`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] })
      });

      if (!res.body) { setAiOutput('[ERROR] No response body.'); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAiOutput(p => p + dec.decode(value, { stream: true }));
      }
    } catch (e: unknown) {
      setAiOutput(`[ERROR] ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const aiActions = [
    { label: 'DAILY_BRIEFING', prompt: 'Give me my daily tactical briefing based on my current status.' },
    { label: 'BURN_CHECK', prompt: 'Check if I am burning out. Give me an honest assessment and recovery protocol.' },
  ];

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

        {/* ── Header (Pre-flight Status) ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span className="badge badge-active">{theme.type} ENERGY</span>
            <span className="hud-text">{format(dateObj, 'EEEE, MMMM d')}</span>
            <span className="hud-text" style={{ marginLeft: 'auto' }}>PHASE {phase.id} · {phase.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24, marginBottom: 8 }}>
            <div>
              <div className="hud-text" style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>MISSION FOCUS</div>
              <h1 className="hud-value" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                {theme.name}<br />
                <span style={{ color: 'var(--accent-cyan)' }}>{theme.focus}</span>
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
              <button
                onClick={() => setIsFocusMode(true)}
                className="btn-primary"
                style={{ padding: '12px 24px', fontSize: 13, boxShadow: '0 0 20px rgba(0,229,255,0.2)' }}
              >
                <Crosshair size={16} /> [ ENGAGE_BATTLE_HUD ]
              </button>

              <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border-subtle)" strokeWidth="4" strokeDasharray="2 4" />
                  <circle
                    cx="40" cy="40" r="36" fill="none"
                    stroke={mvdMet ? 'var(--accent-green)' : 'var(--accent-cyan)'}
                    strokeWidth="4"
                    strokeDasharray={`${circumference * (completionPercent / 100)} ${circumference}`}
                    strokeLinecap="butt"
                    style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: mvdMet ? 'var(--accent-green)' : 'var(--text-primary)', lineHeight: 1 }}>
                    {completionPercent}%
                  </span>
                  <span className="hud-text" style={{ marginTop: 4 }}>
                    {mvdMet ? 'MVD_OK' : 'MVD_REQ'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Morning Block ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Sun size={14} color="var(--accent-amber)" />
            <span className="hud-text">MORNING_BLOCK · HI-COG LOAD</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Moon size={14} color="var(--accent-rose)" />
            <span className="hud-text">EVENING_BLOCK · CONSOLIDATION</span>
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
        <div className="cockpit-panel" style={{ padding: 24, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Zap size={14} color="var(--accent-amber)" />
            <span className="hud-text">AI/PM WORK LIMITER</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="hud-text" style={{ color: 'var(--text-secondary)' }}>HRS TODAY</span>
            <span
              className="mono"
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: form.pmHours > (dayOfWeek === 0 || dayOfWeek === 6 ? 3 : 1) ? 'var(--accent-rose)' : 'var(--accent-green)',
                textShadow: form.pmHours > (dayOfWeek === 0 || dayOfWeek === 6 ? 3 : 1) ? '0 0 10px rgba(255,51,102,0.4)' : 'none'
              }}
            >
              {form.pmHours}h
            </span>
          </div>
          <input
            type="range" min="0" max="8" step="0.5"
            value={form.pmHours}
            onChange={(e) => setForm(f => ({ ...f, pmHours: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
          />
          <div className="hud-text" style={{ color: 'var(--text-tertiary)', marginTop: 12 }}>
            CAP: {dayOfWeek === 0 || dayOfWeek === 6 ? '3H WEEKEND' : '1H WEEKDAY'}
          </div>
        </div>

        {/* ── Mental State ── */}
        <div className="cockpit-panel" style={{ padding: 24, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Activity size={14} color="var(--accent-cyan)" />
            <span className="hud-text">MENTAL STATE TELEMETRY</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MENTAL_STATES.map(({ state, color, emoji }) => {
              const selected = form.mentalState === state;
              return (
                <button
                  key={state}
                  onClick={() => setForm(f => ({ ...f, mentalState: state }))}
                  style={{
                    padding: '8px 12px',
                    fontFamily: 'Geist Mono, monospace',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: selected ? `rgba(${color === 'var(--accent-primary)' ? '0,229,255' : '255,255,255'}, 0.1)` : 'var(--bg-surface)',
                    color: selected ? color : 'var(--text-secondary)',
                    border: selected ? `1px solid ${color}` : '1px solid var(--border-default)',
                    boxShadow: selected ? `inset 0 0 10px ${color}` : 'none',
                  }}
                >
                  {emoji} {state}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Operator Journal ── */}
        <div className="cockpit-panel" style={{ padding: 24, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Brain size={14} color="var(--accent-rose)" />
            <span className="hud-text">OPERATOR JOURNAL (DEBRIEF)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="hud-text" style={{ color: 'var(--accent-rose)', marginBottom: 8 }}>
                [!] FRICTION_SOURCE
              </div>
              <input
                type="text"
                value={form.frictionSource}
                onChange={(e) => setForm(f => ({ ...f, frictionSource: e.target.value }))}
                placeholder="Root cause of slowdown..."
              />
            </div>
            <div>
              <div className="hud-text" style={{ color: 'var(--accent-green)', marginBottom: 8 }}>
                [*] MOMENTUM_SOURCE
              </div>
              <input
                type="text"
                value={form.momentumSource}
                onChange={(e) => setForm(f => ({ ...f, momentumSource: e.target.value }))}
                placeholder="What accelerated operations?"
              />
            </div>
            <div>
              <div className="hud-text" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                TACTICAL_NOTES
              </div>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="System adjustments for next cycle..."
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* ── Tactical AI Terminal ── */}
        <div className="cockpit-panel" style={{ padding: 24, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Brain size={14} color="var(--accent-cyan)" />
            <span className="hud-text" style={{ color: 'var(--accent-cyan)' }}>TACTICAL_AI_COPILOT</span>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {aiActions.map(a => (
              <button
                key={a.label}
                onClick={() => runAI(a.prompt)}
                disabled={aiLoading}
                className="btn-ghost"
                style={{
                  padding: '6px 12px',
                  fontSize: 10,
                  opacity: aiLoading ? 0.5 : 1,
                }}
              >
                [ {a.label} ]
              </button>
            ))}
          </div>

          <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden', padding: '16px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--border-subtle)' }} />
            <pre className="mono" style={{
              margin: 0,
              fontSize: 11,
              lineHeight: 1.6,
              color: aiOutput ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              textTransform: 'uppercase'
            }}>
              {aiLoading && !aiOutput ? '> INITIALIZING_NEURAL_LINK...\n' : ''}
              {aiOutput || '> AWAITING_COMMAND.'}
              {aiLoading && <span style={{ opacity: 0.5 }}>_</span>}
            </pre>
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
              {/* Battle HUD Overlay */}
              <div className="scan-line" />
              <div style={{ position: 'absolute', top: 40, left: 40, width: 20, height: 20, borderTop: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', top: 40, right: 40, width: 20, height: 20, borderTop: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', bottom: 40, left: 40, width: 20, height: 20, borderBottom: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', bottom: 40, right: 40, width: 20, height: 20, borderBottom: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)' }} />

              {/* Exit button */}
              <button
                onClick={() => setIsFocusMode(false)}
                className="btn-ghost"
                style={{ position: 'absolute', top: 32, right: 36, zIndex: 10 }}
              >
                <X size={13} /> [ ESC_TO_ABORT ]
              </button>

              {/* Label */}
              <div className="hud-text" style={{ color: 'var(--accent-cyan)', textShadow: '0 0 10px rgba(0,229,255,0.4)', marginBottom: 24 }}>
                BATTLE_HUD_ACTIVE · {format(dateObj, 'MMMM d')}
              </div>

              {/* Big title */}
              <motion.h1
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
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
                  textShadow: '0 0 30px rgba(255,255,255,0.1)'
                }}
              >
                {theme.focus}
              </motion.h1>

              <div className="hud-text" style={{ color: 'var(--text-secondary)', marginBottom: 56, textAlign: 'center' }}>
                PHASE {phase.id} · {phase.name}
              </div>

              {/* Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 900 }}
              >
                {[
                  { title: 'QUANT_OPS', subtitle: dailyTopics.qa, color: SECTION_COLORS.QA, key: 'qaSolved' as const, unit: 'QS', target: theme.targets.qa },
                  { title: 'DILR_OPS', subtitle: dailyTopics.dilr, color: SECTION_COLORS.DILR, key: 'dilrSolved' as const, unit: 'SETS', target: theme.targets.dilr },
                  { title: 'VARC_OPS', subtitle: dailyTopics.varc, color: SECTION_COLORS.VARC, key: 'rcsRead' as const, unit: 'RCS', target: theme.targets.varc },
                ].map(({ title, subtitle, color, key, unit, target }) => (
                  <div key={key} className="cockpit-panel" style={{ flex: 1, padding: '24px 20px', textAlign: 'center' }}>
                    <div className="hud-text" style={{ color, textShadow: `0 0 10px ${color}`, marginBottom: 8 }}>{title}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 24, textTransform: 'uppercase' }}>{subtitle}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
                      <input
                        type="number"
                        value={form[key] || ''}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0"
                        className="mono"
                        min={0}
                        style={{
                          width: 80,
                          background: 'transparent',
                          border: 'none',
                          borderBottom: `2px solid ${color}`,
                          color,
                          fontSize: 48,
                          fontWeight: 700,
                          textAlign: 'center',
                          outline: 'none',
                          padding: 0,
                          textShadow: `0 0 20px ${color}`
                        }}
                      />
                      <span className="hud-text" style={{ color: 'var(--text-muted)' }}>{unit}</span>
                    </div>
                    {target > 0 && (
                      <div className="hud-text" style={{ color: 'var(--text-secondary)', marginTop: 16 }}>TARGET: {target}</div>
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Progress bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                style={{ marginTop: 64, width: '100%', maxWidth: 900 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="hud-text">MVD_PROGRESS_METER</span>
                  <span className="hud-text" style={{ color: mvdMet ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    {completionPercent}% {mvdMet && '· SECURED'}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--border-dim)', overflow: 'hidden' }}>
                  <motion.div
                    style={{
                      height: '100%',
                      background: mvdMet ? 'var(--accent-green)' : 'var(--accent-cyan)',
                      boxShadow: mvdMet ? '0 0 10px var(--accent-green)' : '0 0 10px var(--accent-cyan)'
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
