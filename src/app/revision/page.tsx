'use client';

import { useState, useMemo } from 'react';
import { useRevisionStore, RevisionTopic, isDue } from '@/features/revision/store';
import { SECTIONS, RETENTION_LEVELS, TOPIC_STATUS, SECTION_COLORS } from '@/core/utils/constants';
import type { Section, TopicStatus } from '@/core/utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, CheckCircle2, AlertTriangle, BookOpen, Clock, BrainCircuit } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

function TopicForm({ topic, onClose }: { topic?: RevisionTopic; onClose: () => void }) {
  const addTopic = useRevisionStore((s) => s.addTopic);
  const updateTopic = useRevisionStore((s) => s.updateTopic);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    name: topic?.name ?? '',
    subject: (topic?.subject ?? 'QA') as Section,
    dateStudied: topic?.dateStudied ?? today,
    lastRevised: topic?.lastRevised ?? null,
    retention: (topic?.retention ?? 3) as 1 | 2 | 3 | 4 | 5,
    status: (topic?.status ?? 'Not Started') as TopicStatus,
    notes: topic?.notes ?? '',
  });

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (topic) {
      updateTopic(topic.id, form);
    } else {
      addTopic({ id: crypto.randomUUID(), ...form });
    }
    onClose();
  };

  const inputStyle = { width: '100%', padding: '12px 16px', fontSize: 13, fontFamily: 'Geist Mono, monospace', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)', outline: 'none', transition: 'all 0.2s' };
  const labelStyle = { fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontFamily: 'Geist Mono, monospace' };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(5, 5, 10, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.2, ease: 'easeOut' }}
        className="cockpit-panel"
        style={{ padding: 40, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--accent-cyan)', boxShadow: '0 0 30px rgba(0,229,255,0.1)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <div className="hud-text" style={{ marginBottom: 8, color: 'var(--accent-cyan)' }}>[ KNOWLEDGE_BASE ]</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{topic ? 'EDIT_INTELLIGENCE' : 'LOG_NEW_CONCEPT'}</div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <label style={labelStyle}>Topic Name</label>
            <input type="text" placeholder="e.g. Number System — Remainders" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }} autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>Subject</label>
              <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value as Section }))} style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }}>
                {SECTIONS.map((s) => <option key={s} value={s} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TopicStatus }))} style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }}>
                {TOPIC_STATUS.map((s) => <option key={s} value={s} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Retention Level</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {RETENTION_LEVELS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setForm((f) => ({ ...f, retention: value as 1 | 2 | 3 | 4 | 5 }))}
                  style={{
                    flex: 1, padding: '16px 8px', border: `1px solid ${form.retention === value ? color : 'var(--border-subtle)'}`,
                    background: form.retention === value ? `color-mix(in srgb, ${color} 10%, transparent)` : 'var(--bg-surface)',
                    color: form.retention === value ? color : 'var(--text-secondary)',
                    cursor: 'pointer', fontFamily: 'Geist Mono, monospace', transition: 'all 0.2s',
                    boxShadow: form.retention === value ? `inset 0 0 10px ${color}` : 'none'
                  }}
                >
                  <div className="mono" style={{ fontSize: 16 }}>{'★'.repeat(value)}</div>
                  <span style={{ fontSize: 9, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8, display: 'block' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>First Logged</label>
              <input type="date" value={form.dateStudied} onChange={(e) => setForm((f) => ({ ...f, dateStudied: e.target.value }))} style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }} />
            </div>
            <div>
              <label style={labelStyle}>Last Revised</label>
              <input type="date" value={form.lastRevised ?? ''} onChange={(e) => setForm((f) => ({ ...f, lastRevised: e.target.value || null }))} style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Strategic Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Key formulas, tricks, concepts..." rows={4} style={{ ...inputStyle, resize: 'none' as const, lineHeight: 1.6 }} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }} />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-ghost" onClick={onClose} style={{ padding: '10px 24px' }}>[ CANCEL ]</button>
            <button className="btn-primary" onClick={handleSave} style={{ padding: '10px 28px' }}>[ {topic ? 'UPDATE_INTELLIGENCE' : 'LOG_CONCEPT'} ]</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function RevisionPage() {
  const topics = useRevisionStore((s) => s.topics);
  const deleteTopic = useRevisionStore((s) => s.deleteTopic);
  const updateTopic = useRevisionStore((s) => s.updateTopic);
  const dueTopics = useMemo(() => topics.filter(isDue), [topics]);
  const masteredCount = useMemo(() => topics.filter((t) => t.status === 'Mastered').length, [topics]);
  const [showForm, setShowForm] = useState(false);
  const [editTopic, setEditTopic] = useState<RevisionTopic | undefined>();
  const [filterSubject, setFilterSubject] = useState<Section | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<TopicStatus | 'All'>('All');

  const filtered = topics.filter((t) => {
    if (filterSubject !== 'All' && t.subject !== filterSubject) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aDue = dueTopics.some((d) => d.id === a.id);
    const bDue = dueTopics.some((d) => d.id === b.id);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    return a.retention - b.retention;
  });

  const markRevised = (id: string) => {
    updateTopic(id, { lastRevised: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 48, height: '100%' }}>
      <AnimatePresence>
        {(showForm || editTopic) && (
          <TopicForm topic={editTopic} onClose={() => { setShowForm(false); setEditTopic(undefined); }} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="hud-text" style={{ marginBottom: 12 }}>KNOWLEDGE_BASE</div>
          <h1 className="mono" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1, textTransform: 'uppercase', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
            SPACED_REPETITION
          </h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ padding: '10px 20px' }}>
          <Plus size={14} /> [ LOG_CONCEPT ]
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {[
          { label: 'TOTAL_TRACKED', value: topics.length, color: 'var(--accent-cyan)' },
          { label: 'CRITICAL_DUE', value: dueTopics.length, color: dueTopics.length > 0 ? 'var(--accent-rose)' : 'var(--accent-green)' },
          { label: 'MASTERED', value: masteredCount, color: 'var(--accent-green)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="cockpit-panel" style={{ padding: '24px', borderTop: `2px solid ${color}` }}>
            <div className="hud-value" style={{ color }}>{value}</div>
            <div className="hud-text" style={{ marginTop: 12, color: 'var(--text-secondary)' }}>{label}</div>
          </div>
        ))}
      </div>

      {topics.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6, marginTop: 100 }}>
          <BookOpen size={64} style={{ marginBottom: 32, color: 'var(--text-muted)' }} strokeWidth={1.5} />
          <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>No intelligence logged yet</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Start tracking concepts to build your spaced repetition queue.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 16 }}>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value as Section | 'All')} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)', padding: '10px 16px', fontSize: 11, fontFamily: 'Geist Mono, monospace', outline: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
              <option value="All" style={{ background: 'var(--bg-elevated)' }}>[ ALL_SECTORS ]</option>
              {SECTIONS.map((s) => <option key={s} value={s} style={{ background: 'var(--bg-elevated)' }}>[ {s} ]</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TopicStatus | 'All')} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)', padding: '10px 16px', fontSize: 11, fontFamily: 'Geist Mono, monospace', outline: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
              <option value="All" style={{ background: 'var(--bg-elevated)' }}>[ ALL_STATUSES ]</option>
              {TOPIC_STATUS.map((s) => <option key={s} value={s} style={{ background: 'var(--bg-elevated)' }}>[ {s.toUpperCase()} ]</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24, paddingBottom: 64 }}>
            <AnimatePresence>
              {sorted.map((topic) => {
                const isDueForRev = dueTopics.some((d) => d.id === topic.id);
                const retention = RETENTION_LEVELS.find((r) => r.value === topic.retention)!;
                return (
                  <motion.div
                    key={topic.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="cockpit-panel"
                    style={{
                      padding: '24px',
                      borderColor: isDueForRev ? 'var(--accent-rose)' : undefined, // Rose border
                      background: isDueForRev ? 'rgba(255, 51, 102, 0.05)' : undefined, // Rose bg
                      display: 'flex', flexDirection: 'column', gap: 24,
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="hud-text" style={{ color: SECTION_COLORS[topic.subject as keyof typeof SECTION_COLORS], marginBottom: 8 }}>
                          {topic.subject}
                        </div>
                        <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, textTransform: 'uppercase' }}>
                          {topic.name}
                        </div>
                      </div>
                      {isDueForRev && (
                        <div className="hud-text" style={{ padding: '6px 10px', background: 'rgba(255,51,102,0.1)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--accent-rose)' }}>
                          <AlertTriangle size={12} strokeWidth={2.5} /> TARGET_LOCK
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: topic.notes ? 'none' : '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className="hud-text">RETENTION_LVL</span>
                          <span className="mono" style={{ fontSize: 14, color: retention.color }}>
                            {'★'.repeat(topic.retention)} <span style={{ opacity: 0.2 }}>{'★'.repeat(5 - topic.retention)}</span>
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className="hud-text">LAST_SYNC</span>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                            {topic.lastRevised ? formatDistanceToNow(new Date(topic.lastRevised + 'T00:00:00'), { addSuffix: true }) : 'NEVER_SYNCED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {topic.notes && (
                      <div className="mono" style={{ padding: 12, background: 'rgba(0,0,0,0.3)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, border: '1px solid var(--border-subtle)', textTransform: 'uppercase' }}>
                        {topic.notes}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 16 }}>
                      {isDueForRev && (
                        <button onClick={() => markRevised(topic.id)} className="btn-primary" style={{ flex: 1, padding: '8px' }}>
                          [ MARK_SECURED ]
                        </button>
                      )}
                      <button onClick={() => setEditTopic(topic)} className="btn-ghost" style={{ flex: isDueForRev ? 0 : 1, padding: '8px 16px' }}>
                        [ EDIT ]
                      </button>
                      <button onClick={() => deleteTopic(topic.id)} className="btn-ghost" style={{ padding: '8px 12px', color: 'var(--accent-rose)', borderColor: 'transparent' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-rose)'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
