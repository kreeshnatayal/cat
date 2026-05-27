'use client';

import { useState, useMemo } from 'react';
import { useMockStore, MockEntry, MistakeCluster } from '@/features/mocks/store';
import { useRevisionStore } from '@/features/revision/store';
import { SECTION_COLORS, MOCK_SERIES } from '@/core/utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronRight, ChevronLeft, Target, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// ─── 3-Step Debrief Form ─────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const EMOTIONS = [
  { label: 'Calm',        color: 'var(--accent-green)',  score: 5 },
  { label: 'Focused',     color: 'var(--accent-cyan)',   score: 4 },
  { label: 'Nervous',     color: 'var(--accent-amber)',  score: 3 },
  { label: 'Anxious',     color: '#f97316',              score: 2 },
  { label: 'Panicking',   color: 'var(--accent-rose)',   score: 1 },
];

function MockDebrief({ onClose }: { onClose: () => void }) {
  const addMock = useMockStore((s) => s.addMock);
  const addTopic = useRevisionStore((s) => s.addTopic);
  const [step, setStep] = useState<Step>(1);

  const today = new Date().toISOString().slice(0, 10);

  const [basics, setBasics] = useState({
    name: '',
    series: 'SimCAT',
    date: today,
    overallScore: '',
    percentile: '',
    sections: {
      QA:   { attempted: '', correct: '', netScore: '', timeMinutes: '40' },
      DILR: { attempted: '', correct: '', netScore: '', timeMinutes: '40' },
      VARC: { attempted: '', correct: '', netScore: '', timeMinutes: '40' },
    },
    mistakes: { silly: '', panic: '', timing: '', conceptual: '' } as Record<string, string>,
  });

  const [story, setStory] = useState({
    emotion: '',
    whatHappened: '',
    hardestSection: '' as 'QA' | 'DILR' | 'VARC' | '',
    struggleTopics: '',
    keyTakeaway: '',
  });

  // Auto-compute action items for step 3
  const actionItems = useMemo(() => {
    const items: { topic: string; subject: 'QA' | 'DILR' | 'VARC'; reason: string }[] = [];

    // From conceptual mistakes
    if (Number(basics.mistakes.conceptual) > 0 && story.struggleTopics) {
      story.struggleTopics.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
        const subj = (story.hardestSection || 'QA') as 'QA' | 'DILR' | 'VARC';
        items.push({ topic: t, subject: subj, reason: 'Conceptual gap identified in mock' });
      });
    }

    // From timing mistakes
    if (Number(basics.mistakes.timing) >= 3) {
      items.push({ topic: 'Question Selection Strategy', subject: (story.hardestSection || 'DILR') as 'QA' | 'DILR' | 'VARC', reason: `${basics.mistakes.timing} timing errors — set selection needs work` });
    }

    // From panic mistakes
    if (Number(basics.mistakes.panic) >= 3) {
      items.push({ topic: 'Exam Temperament Drill', subject: 'QA', reason: `${basics.mistakes.panic} panic errors — mental control is the issue` });
    }

    // Low accuracy sections
    (['QA', 'DILR', 'VARC'] as const).forEach(sec => {
      const att = Number(basics.sections[sec].attempted);
      const cor = Number(basics.sections[sec].correct);
      if (att > 0 && (cor / att) < 0.5) {
        items.push({ topic: `${sec} Accuracy Recovery`, subject: sec, reason: `Only ${Math.round((cor/att)*100)}% accuracy in this mock` });
      }
    });

    return items;
  }, [basics, story]);

  const handleSave = () => {
    const entry: MockEntry = {
      id: crypto.randomUUID(),
      name: basics.name || basics.series,
      series: basics.series,
      date: basics.date,
      overallScore: Number(basics.overallScore),
      percentile: Number(basics.percentile),
      sections: {
        QA:   { attempted: Number(basics.sections.QA.attempted), correct: Number(basics.sections.QA.correct), netScore: Number(basics.sections.QA.netScore), timeMinutes: Number(basics.sections.QA.timeMinutes) },
        DILR: { attempted: Number(basics.sections.DILR.attempted), correct: Number(basics.sections.DILR.correct), netScore: Number(basics.sections.DILR.netScore), timeMinutes: Number(basics.sections.DILR.timeMinutes) },
        VARC: { attempted: Number(basics.sections.VARC.attempted), correct: Number(basics.sections.VARC.correct), netScore: Number(basics.sections.VARC.netScore), timeMinutes: Number(basics.sections.VARC.timeMinutes) },
      },
      mistakes: {
        silly: Number(basics.mistakes.silly),
        panic: Number(basics.mistakes.panic),
        timing: Number(basics.mistakes.timing),
        conceptual: Number(basics.mistakes.conceptual),
      } as MistakeCluster,
      emotionalState: story.emotion,
      keyLearnings: story.keyTakeaway,
      weakAreas: story.struggleTopics,
    };
    addMock(entry);

    // Inject action items into revision engine
    actionItems.forEach(item => {
      addTopic({
        id: crypto.randomUUID(),
        name: `[MOCK_FLAW] ${item.topic}`,
        subject: item.subject,
        dateStudied: basics.date,
        lastRevised: null,
        retention: 1,
        status: 'Not Started',
        notes: item.reason,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
      });
    });

    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', fontSize: 13,
    fontFamily: 'Geist Mono, monospace',
    background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)',
    color: 'var(--accent-cyan)', outline: 'none', transition: 'all 0.2s',
  };
  const label = (text: string) => (
    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Geist Mono, monospace' }}>
      {text}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(5, 5, 10, 0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
        className="cockpit-panel"
        style={{ padding: 40, width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--accent-cyan)', boxShadow: '0 0 40px rgba(0,229,255,0.08)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div className="hud-text" style={{ color: 'var(--accent-cyan)', marginBottom: 6 }}>MOCK DEBRIEF · STEP {step}/3</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, textTransform: 'uppercase' }}>
              {step === 1 ? 'The Numbers' : step === 2 ? 'The Story' : 'Action Items'}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: s <= step ? 'var(--accent-cyan)' : 'var(--border-subtle)', borderRadius: 2, transition: 'background 0.3s' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {/* Name + Series + Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                  <div>
                    {label('Test Name')}
                    <input type="text" value={basics.name} onChange={e => setBasics(b => ({ ...b, name: e.target.value }))} placeholder="e.g. SimCAT 8" style={inputStyle} />
                  </div>
                  <div>
                    {label('Series')}
                    <select value={basics.series} onChange={e => setBasics(b => ({ ...b, series: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {MOCK_SERIES.map(s => <option key={s} value={s} style={{ background: '#0a0a0f' }}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    {label('Date')}
                    <input type="date" value={basics.date} onChange={e => setBasics(b => ({ ...b, date: e.target.value }))} style={inputStyle} />
                  </div>
                </div>

                {/* Overall */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    {label('Overall Score')}
                    <input type="number" value={basics.overallScore} onChange={e => setBasics(b => ({ ...b, overallScore: e.target.value }))} placeholder="e.g. 142" style={{ ...inputStyle, fontSize: 24, fontWeight: 700 }} />
                  </div>
                  <div>
                    {label('Percentile')}
                    <input type="number" value={basics.percentile} onChange={e => setBasics(b => ({ ...b, percentile: e.target.value }))} placeholder="e.g. 87.5" style={{ ...inputStyle, fontSize: 24, fontWeight: 700, color: 'var(--accent-green)' }} />
                  </div>
                </div>

                {/* Sections */}
                <div>
                  {label('Sectional Data')}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {(['QA', 'DILR', 'VARC'] as const).map(sec => (
                      <div key={sec} style={{ padding: '20px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${SECTION_COLORS[sec]}22`, borderTop: `2px solid ${SECTION_COLORS[sec]}` }}>
                        <div className="hud-text" style={{ color: SECTION_COLORS[sec], marginBottom: 16 }}>{sec}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[['Attempted', 'attempted'], ['Correct', 'correct'], ['Net Score', 'netScore']].map(([lbl, field]) => (
                            <div key={field}>
                              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Geist Mono, monospace' }}>{lbl}</div>
                              <input
                                type="number"
                                value={(basics.sections[sec] as Record<string, string>)[field]}
                                onChange={e => setBasics(b => ({ ...b, sections: { ...b.sections, [sec]: { ...b.sections[sec], [field]: e.target.value } } }))}
                                placeholder="0"
                                style={{ ...inputStyle, padding: '8px 10px', fontSize: 16, fontWeight: 700 }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mistake clusters */}
                <div>
                  {label('Marks Lost By Category')}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { key: 'silly',      label: 'Silly/Calc',  color: 'var(--accent-amber)' },
                      { key: 'panic',      label: 'Panic',       color: 'var(--accent-rose)'  },
                      { key: 'timing',     label: 'Timing',      color: 'var(--accent-cyan)'  },
                      { key: 'conceptual', label: 'Conceptual',  color: 'var(--text-secondary)' },
                    ].map(({ key, label: lbl, color }) => (
                      <div key={key} style={{ padding: '16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 10, color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Geist Mono, monospace' }}>{lbl}</div>
                        <input
                          type="number"
                          value={basics.mistakes[key]}
                          onChange={e => setBasics(b => ({ ...b, mistakes: { ...b.mistakes, [key]: e.target.value } }))}
                          placeholder="0"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 28, width: '100%', outline: 'none', fontFamily: 'Geist Mono, monospace', fontWeight: 600, padding: 0 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {/* Emotion spectrum */}
                <div>
                  {label('How did you feel during this exam?')}
                  <div style={{ display: 'flex', gap: 10 }}>
                    {EMOTIONS.map(e => (
                      <button key={e.label} onClick={() => setStory(s => ({ ...s, emotion: e.label }))}
                        style={{
                          flex: 1, padding: '14px 8px', border: `1px solid ${story.emotion === e.label ? e.color : 'var(--border-subtle)'}`,
                          background: story.emotion === e.label ? `${e.color}18` : 'var(--bg-surface)',
                          color: story.emotion === e.label ? e.color : 'var(--text-secondary)',
                          fontFamily: 'Geist Mono, monospace', fontSize: 10, textTransform: 'uppercase', cursor: 'pointer',
                          transition: 'all 0.2s', boxShadow: story.emotion === e.label ? `0 0 12px ${e.color}44` : 'none',
                        }}>
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* What happened */}
                <div>
                  {label('What actually happened in this exam?')}
                  <textarea
                    value={story.whatHappened}
                    onChange={e => setStory(s => ({ ...s, whatHappened: e.target.value }))}
                    placeholder="Be honest. Did you panic in DILR? Did you rush QA? Write the raw truth..."
                    rows={4}
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.7 }}
                  />
                </div>

                {/* Hardest section */}
                <div>
                  {label('Which section hit you hardest?')}
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['QA', 'DILR', 'VARC'] as const).map(sec => (
                      <button key={sec} onClick={() => setStory(s => ({ ...s, hardestSection: sec }))}
                        style={{
                          flex: 1, padding: '14px', border: `1px solid ${story.hardestSection === sec ? SECTION_COLORS[sec] : 'var(--border-subtle)'}`,
                          background: story.hardestSection === sec ? `${SECTION_COLORS[sec]}18` : 'var(--bg-surface)',
                          color: story.hardestSection === sec ? SECTION_COLORS[sec] : 'var(--text-secondary)',
                          fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Struggle topics */}
                <div>
                  {label('What topics/concepts did you struggle with? (comma separated)')}
                  <input
                    type="text"
                    value={story.struggleTopics}
                    onChange={e => setStory(s => ({ ...s, struggleTopics: e.target.value }))}
                    placeholder="e.g. Circular Arrangements, P&C, RC Inference"
                    style={inputStyle}
                  />
                </div>

                {/* Key takeaway */}
                <div>
                  {label('One takeaway from this mock (be specific)')}
                  <input
                    type="text"
                    value={story.keyTakeaway}
                    onChange={e => setStory(s => ({ ...s, keyTakeaway: e.target.value }))}
                    placeholder="e.g. Stop attempting DILR Set 3 first. Start with Sets 1 & 2."
                    style={inputStyle}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: 1.7 }}>
                  System has analyzed your debrief. The following topics will be auto-injected into your Revision Engine with Retention = 1 (Forgotten).
                </div>

                {actionItems.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                    <div className="mono" style={{ fontSize: 13, textTransform: 'uppercase' }}>No action items generated.</div>
                    <div className="hud-text" style={{ marginTop: 8 }}>Your performance looked solid or insufficient data entered.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {actionItems.map((item, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px',
                          background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)',
                          borderLeft: `3px solid ${SECTION_COLORS[item.subject]}`,
                        }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: SECTION_COLORS[item.subject], marginTop: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                            {item.topic}
                          </div>
                          <div className="hud-text" style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
                            {item.reason}
                          </div>
                        </div>
                        <div className="badge" style={{ background: `${SECTION_COLORS[item.subject]}18`, color: SECTION_COLORS[item.subject], borderColor: SECTION_COLORS[item.subject] }}>
                          {item.subject}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div style={{ padding: '16px 20px', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.2)', marginTop: 8 }}>
                  <div className="hud-text" style={{ color: 'var(--accent-cyan)', marginBottom: 6 }}>SUMMARY</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: 1.7 }}>
                    Mock: {basics.name || basics.series} · {Number(basics.percentile)}%ile · Score: {basics.overallScore}<br />
                    Emotion: {story.emotion || 'Not logged'} · Takeaway: {story.keyTakeaway || 'Not logged'}<br />
                    Injecting {actionItems.length} topic(s) into revision queue.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
          <button onClick={() => step > 1 ? setStep(s => (s - 1) as Step) : onClose()} className="btn-ghost" style={{ padding: '10px 20px', gap: 8, display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={14} /> {step === 1 ? '[ CANCEL ]' : '[ BACK ]'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => (s + 1) as Step)} className="btn-primary" style={{ padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
              NEXT <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSave} className="btn-primary" style={{ padding: '10px 28px', background: 'rgba(0,255,102,0.1)', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
              [ COMMIT DEBRIEF ]
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Mocks Page ──────────────────────────────────────────────────────────

export default function MocksPage() {
  const mocks = useMockStore((s) => s.mocks);
  const deleteMock = useMockStore((s) => s.deleteMock);
  const [showDebrief, setShowDebrief] = useState(false);
  const [selectedMockId, setSelectedMockId] = useState<string | null>(null);

  const sortedMocks = useMemo(() => [...mocks].sort((a, b) => a.date.localeCompare(b.date)), [mocks]);
  const lastMock = sortedMocks[sortedMocks.length - 1];
  const selectedMock = selectedMockId ? mocks.find(m => m.id === selectedMockId) : lastMock;

  const trendData = useMemo(() => sortedMocks.map(m => ({
    name: m.name,
    percentile: m.percentile,
    score: m.overallScore,
  })), [sortedMocks]);

  const percentileChange = useMemo(() => {
    if (sortedMocks.length < 2) return null;
    return sortedMocks[sortedMocks.length - 1].percentile - sortedMocks[sortedMocks.length - 2].percentile;
  }, [sortedMocks]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <AnimatePresence>{showDebrief && <MockDebrief onClose={() => setShowDebrief(false)} />}</AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="hud-text" style={{ marginBottom: 10 }}>MOCK_LAB · RADAR_TELEMETRY</div>
          <h1 className="mono" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,229,255,0.3)', lineHeight: 1 }}>
            EXAM DEBRIEF
          </h1>
          {mocks.length > 0 && (
            <div className="hud-text" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
              {mocks.length} mocks logged · Best: {useMockStore.getState().getBestPercentile()}%ile
              {percentileChange !== null && (
                <span style={{ marginLeft: 12, color: percentileChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                  {percentileChange >= 0 ? '↑' : '↓'} {Math.abs(percentileChange).toFixed(1)}%ile from last mock
                </span>
              )}
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowDebrief(true)} style={{ padding: '12px 24px', gap: 8, display: 'flex', alignItems: 'center' }}>
          <Plus size={14} /> [ LOG MOCK ]
        </button>
      </div>

      {mocks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16 }}>
          <Target size={56} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} strokeWidth={1} />
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>No Mocks Logged Yet</div>
          <div className="hud-text" style={{ color: 'var(--text-tertiary)' }}>Give a mock and debrief it here. No data = no feedback loop.</div>
          <button className="btn-primary" onClick={() => setShowDebrief(true)} style={{ padding: '12px 28px', marginTop: 16 }}>
            [ BEGIN FIRST DEBRIEF ]
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
          
          {/* Left: Selected Mock Detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {selectedMock && (
              <motion.div key={selectedMock.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Hero */}
                <div className="cockpit-panel" style={{ padding: '40px 48px', borderTop: '2px solid var(--accent-green)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <div className="hud-text" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                        {selectedMock.series} · {format(new Date(selectedMock.date + 'T00:00:00'), 'MMM d, yyyy')}
                      </div>
                      <div className="mono" style={{ fontSize: 20, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                        {selectedMock.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="hud-value" style={{ fontSize: 56, color: 'var(--accent-green)', textShadow: '0 0 30px rgba(0,255,102,0.2)', lineHeight: 1 }}>
                        {selectedMock.percentile}
                      </div>
                      <div className="hud-text" style={{ color: 'var(--text-secondary)' }}>%ILE</div>
                    </div>
                  </div>

                  {/* Sections */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {(['QA', 'DILR', 'VARC'] as const).map(sec => {
                      const s = selectedMock.sections[sec];
                      const acc = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0;
                      return (
                        <div key={sec} style={{ padding: '16px', background: 'rgba(0,0,0,0.4)', borderTop: `2px solid ${SECTION_COLORS[sec]}` }}>
                          <div className="hud-text" style={{ color: SECTION_COLORS[sec], marginBottom: 12 }}>{sec}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div className="hud-text">NET</div>
                            <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{s.netScore}</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div className="hud-text">ACCURACY</div>
                            <div className="mono" style={{ fontSize: 13, color: acc >= 70 ? 'var(--accent-green)' : acc >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{acc}%</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="hud-text">ATTEMPTED</div>
                            <div className="mono" style={{ fontSize: 13 }}>{s.attempted}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mistakes */}
                  {(selectedMock.mistakes.silly + selectedMock.mistakes.panic + selectedMock.mistakes.timing + selectedMock.mistakes.conceptual) > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div className="hud-text" style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>MARKS LOST BY CATEGORY</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        {[
                          { k: 'silly', l: 'Silly', c: 'var(--accent-amber)' },
                          { k: 'panic', l: 'Panic', c: 'var(--accent-rose)' },
                          { k: 'timing', l: 'Timing', c: 'var(--accent-cyan)' },
                          { k: 'conceptual', l: 'Conceptual', c: 'var(--text-secondary)' },
                        ].map(({ k, l, c }) => (
                          <div key={k} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(0,0,0,0.3)', borderTop: `2px solid ${c}` }}>
                            <div className="hud-value" style={{ fontSize: 24 }}>{(selectedMock.mistakes as unknown as Record<string, number>)[k] || 0}</div>
                            <div className="hud-text" style={{ color: c, marginTop: 6 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Debrief text */}
                  {(selectedMock.keyLearnings || selectedMock.emotionalState) && (
                    <div style={{ marginTop: 20, padding: '16px 20px', background: 'rgba(0,0,0,0.4)', borderLeft: '2px solid var(--border-default)' }}>
                      {selectedMock.emotionalState && (
                        <div className="hud-text" style={{ marginBottom: 6 }}>EMOTION: <span style={{ color: 'var(--text-primary)' }}>{selectedMock.emotionalState.toUpperCase()}</span></div>
                      )}
                      {selectedMock.keyLearnings && (
                        <div className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: 1.6, marginTop: 8 }}>
                          KEY TAKEAWAY: {selectedMock.keyLearnings}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Percentile Trend */}
                {trendData.length > 1 && (
                  <div className="cockpit-panel" style={{ padding: '28px 32px' }}>
                    <div className="hud-text" style={{ marginBottom: 20 }}>PERCENTILE TREND</div>
                    <div style={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }} tickLine={false} axisLine={false} />
                          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-default)', fontFamily: 'Geist Mono, monospace', fontSize: 11 }} />
                          <Line type="monotone" dataKey="percentile" stroke="var(--accent-green)" strokeWidth={2} dot={{ r: 4, fill: 'var(--bg-panel)', stroke: 'var(--accent-green)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right: Mock History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="hud-text" style={{ marginBottom: 8 }}>MISSION HISTORY ({mocks.length})</div>
            {[...sortedMocks].reverse().map((mock, i) => {
              const isSelected = mock.id === (selectedMockId ?? lastMock?.id);
              const prevMock = sortedMocks[sortedMocks.findIndex(m => m.id === mock.id) - 1];
              const delta = prevMock ? mock.percentile - prevMock.percentile : null;
              return (
                <motion.div key={mock.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedMockId(mock.id)}
                  style={{
                    padding: '16px 20px', cursor: 'pointer',
                    background: isSelected ? 'rgba(0,229,255,0.06)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    borderLeft: `3px solid ${isSelected ? 'var(--accent-cyan)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {mock.name}
                      </div>
                      <div className="hud-text" style={{ marginTop: 4, color: 'var(--text-tertiary)' }}>
                        {format(new Date(mock.date + 'T00:00:00'), 'MMM d')} · {mock.series}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-green)' }}>{mock.percentile}%</div>
                      {delta !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                          {delta > 0 ? <TrendingUp size={10} color="var(--accent-green)" /> : delta < 0 ? <TrendingDown size={10} color="var(--accent-rose)" /> : <Minus size={10} color="var(--text-tertiary)" />}
                          <span className="hud-text" style={{ color: delta > 0 ? 'var(--accent-green)' : delta < 0 ? 'var(--accent-rose)' : 'var(--text-tertiary)' }}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
