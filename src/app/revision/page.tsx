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

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' };
  const labelStyle = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700 };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 40, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px -16px rgba(0,0,0,0.8)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Knowledge Base</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{topic ? 'Edit Intelligence' : 'Log New Concept'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: '50%', color: 'var(--text-muted)', cursor: 'pointer', padding: 8, transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-glass-hover)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-glass)'; }}>
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
                    flex: 1, padding: '16px 8px', borderRadius: 'var(--radius-md)', border: `1px solid ${form.retention === value ? color : 'var(--border-subtle)'}`,
                    background: form.retention === value ? `${color}15` : 'var(--bg-glass)',
                    color: form.retention === value ? color : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                    boxShadow: form.retention === value ? `0 0 16px ${color}20` : 'none'
                  }}
                  onMouseOver={(e) => { if(form.retention !== value) { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.borderColor = 'var(--border-default)'; } }}
                  onMouseOut={(e) => { if(form.retention !== value) { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; } }}
                >
                  {'★'.repeat(value)}<br />
                  <span style={{ fontSize: 10, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 8, display: 'block' }}>{label}</span>
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
            <button className="btn-ghost" onClick={onClose} style={{ padding: '12px 24px' }}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} style={{ padding: '12px 28px', fontSize: 14 }}>{topic ? 'Update Intelligence' : 'Log Concept'}</button>
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
          <div className="section-label" style={{ marginBottom: 12 }}>
            Knowledge Base
          </div>
          <h1 className="mono gradient-text" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase' }}>
            Spaced Repetition
          </h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ padding: '10px 20px' }}>
          <Plus size={16} /> Log Concept
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {[
          { label: 'Total Tracked', value: topics.length, color: 'var(--accent-cyan)' },
          { label: 'Critical Due', value: dueTopics.length, color: dueTopics.length > 0 ? 'var(--accent-amber)' : 'var(--accent-green)' },
          { label: 'Mastered', value: masteredCount, color: 'var(--accent-green)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="surface-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.5 }} />
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</div>
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
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value as Section | 'All')} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, outline: 'none', fontWeight: 500, cursor: 'pointer' }}>
              <option value="All" style={{ background: 'var(--bg-elevated)' }}>All Sectors</option>
              {SECTIONS.map((s) => <option key={s} value={s} style={{ background: 'var(--bg-elevated)' }}>{s}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TopicStatus | 'All')} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, outline: 'none', fontWeight: 500, cursor: 'pointer' }}>
              <option value="All" style={{ background: 'var(--bg-elevated)' }}>All Statuses</option>
              {TOPIC_STATUS.map((s) => <option key={s} value={s} style={{ background: 'var(--bg-elevated)' }}>{s}</option>)}
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
                    className="surface-card"
                    style={{
                      padding: 32,
                      borderColor: isDueForRev ? 'rgba(251, 191, 36, 0.4)' : undefined, // Amber border
                      background: isDueForRev ? 'rgba(251, 191, 36, 0.05)' : undefined, // Amber bg
                      display: 'flex', flexDirection: 'column', gap: 24,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isDueForRev && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent-amber)' }} />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: SECTION_COLORS[topic.subject as keyof typeof SECTION_COLORS], letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>
                          {topic.subject}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, letterSpacing: '-0.02em' }}>
                          {topic.name}
                        </div>
                      </div>
                      {isDueForRev && (
                        <div style={{ padding: '6px 12px', background: 'rgba(251,191,36,0.15)', color: 'var(--accent-amber)', borderRadius: 99, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(251,191,36,0.3)' }}>
                          <AlertTriangle size={12} strokeWidth={2.5} /> Due
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: topic.notes ? 'none' : '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 8, background: 'var(--bg-glass)', borderRadius: '50%' }}><BrainCircuit size={16} color={retention.color} /></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Retention</span>
                          <span style={{ fontSize: 14, color: retention.color, fontWeight: 700 }}>
                            {'★'.repeat(topic.retention)} <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - topic.retention)}</span>
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 8, background: 'var(--bg-glass)', borderRadius: '50%' }}><Clock size={16} color="var(--text-secondary)" /></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Timeline</span>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                            {topic.lastRevised ? formatDistanceToNow(new Date(topic.lastRevised + 'T00:00:00'), { addSuffix: true }) : 'Never revised'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {topic.notes && (
                      <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500, border: '1px solid var(--border-subtle)' }}>
                        {topic.notes}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 16 }}>
                      {isDueForRev && (
                        <button onClick={() => markRevised(topic.id)} className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                          Mark Completed
                        </button>
                      )}
                      <button onClick={() => setEditTopic(topic)} className="btn-ghost" style={{ flex: isDueForRev ? 0 : 1, padding: '10px 20px' }}>
                        Edit
                      </button>
                      <button onClick={() => deleteTopic(topic.id)} className="btn-ghost" style={{ padding: '10px 14px', color: 'var(--accent-rose)', borderColor: 'transparent', background: 'rgba(251,113,133,0.05)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(251,113,133,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(251,113,133,0.05)'; }}>
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
