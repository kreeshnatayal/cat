'use client';

import { useState, useMemo } from 'react';
import { useMockStore, MockEntry, MistakeCluster } from '@/lib/store/mockStore';
import { SECTION_COLORS, MOCK_SERIES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Brain, AlertTriangle, Clock, Target, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

function MockForm({ onClose }: { onClose: () => void }) {
  const addMock = useMockStore((s) => s.addMock);
  const [form, setForm] = useState({
    name: '',
    series: 'SimCAT',
    date: new Date().toISOString().slice(0, 10),
    overallScore: 0,
    percentile: 0,
    emotionalState: '',
    keyLearnings: '',
    weakAreas: '',
    sections: {
      QA: { attempted: 0, correct: 0, netScore: 0, timeMinutes: 40 },
      DILR: { attempted: 0, correct: 0, netScore: 0, timeMinutes: 40 },
      VARC: { attempted: 0, correct: 0, netScore: 0, timeMinutes: 40 },
    },
    mistakes: {
      silly: 0,
      panic: 0,
      timing: 0,
      conceptual: 0,
    } as MistakeCluster,
  });

  const updateSection = (section: 'QA' | 'DILR' | 'VARC', field: string, value: number) => {
    setForm((f) => ({ ...f, sections: { ...f.sections, [section]: { ...f.sections[section], [field]: value } } }));
  };

  const updateMistake = (type: keyof MistakeCluster, value: number) => {
    setForm((f) => ({ ...f, mistakes: { ...f.mistakes, [type]: value } }));
  };

  const handleSave = () => {
    if (!form.name && !form.series) return;
    addMock({
      id: crypto.randomUUID(),
      ...form,
    });
    onClose();
  };

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: var(--radius-md), fontSize: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' };
  const labelStyle = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700 };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: var(--radius-xl), padding: 40, width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px -16px rgba(0,0,0,0.8)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Mission Entry</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Log Intelligence</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: '50%', color: 'var(--text-muted)', cursor: 'pointer', padding: 8, transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-glass-hover)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-glass)'; }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Basics & Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>Test Name</label>
              <input type="text" placeholder="e.g. SimCAT 8" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }} />
            </div>
            <div>
              <label style={labelStyle}>Net Score</label>
              <input type="number" value={form.overallScore || ''} onChange={(e) => setForm((f) => ({ ...f, overallScore: Number(e.target.value) }))} style={{...inputStyle, fontFamily: 'JetBrains Mono', fontSize: 16}} placeholder="0" onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }} />
            </div>
            <div>
              <label style={labelStyle}>Percentile</label>
              <input type="number" value={form.percentile || ''} onChange={(e) => setForm((f) => ({ ...f, percentile: Number(e.target.value) }))} style={{...inputStyle, fontFamily: 'JetBrains Mono', fontSize: 16}} placeholder="0" onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }} />
            </div>
          </div>

          <div className="divider" />

          {/* Sections (simplified input for brevity) */}
          <div>
            <label style={labelStyle}>Sectional Scores (Net)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {(['QA', 'DILR', 'VARC'] as const).map(sec => (
                <div key={sec} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 14, left: 16, fontSize: 13, fontWeight: 700, color: SECTION_COLORS[sec] }}>{sec}</div>
                  <input type="number" value={form.sections[sec].netScore || ''} onChange={(e) => updateSection(sec, 'netScore', Number(e.target.value))} style={{...inputStyle, paddingLeft: 64, fontFamily: 'JetBrains Mono', fontSize: 16}} placeholder="0" onFocus={(e) => { e.target.style.borderColor = SECTION_COLORS[sec]; e.target.style.background = 'rgba(255,255,255,0.04)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'rgba(255,255,255,0.025)'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Mistake Clusters */}
          <div>
            <label style={labelStyle}>Mistake Clusters (Marks Lost)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { key: 'silly', label: 'Silly/Calc', color: 'var(--accent-amber)' },
                { key: 'panic', label: 'Panic/Anxiety', color: 'var(--accent-rose)' },
                { key: 'timing', label: 'Time Mgmt', color: 'var(--accent-primary)' },
                { key: 'conceptual', label: 'Conceptual', color: 'var(--text-muted)' },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-subtle)', borderRadius: var(--radius-lg), padding: 20, transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <input 
                    type="number" value={form.mistakes[key as keyof MistakeCluster] || ''} 
                    onChange={(e) => updateMistake(key as keyof MistakeCluster, Number(e.target.value))} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 28, width: '100%', outline: 'none', fontFamily: 'JetBrains Mono', fontWeight: 600, padding: 0 }} 
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn-ghost" onClick={onClose} style={{ padding: '12px 24px' }}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} style={{ padding: '12px 28px', fontSize: 14 }}>Log Mission Data</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: var(--radius-md), padding: '10px 14px', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div className="mono" style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 2, fontSize: 15 }}>{payload[0].value}%ile</div>
      <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{payload[0].payload.name}</div>
    </div>
  );
};

export default function MocksPage() {
  const mocks = useMockStore((s) => s.mocks);
  const bestPercentile = useMockStore((s) => s.getBestPercentile());
  const [showForm, setShowForm] = useState(false);

  const sortedMocks = useMemo(() => [...mocks].sort((a, b) => a.date.localeCompare(b.date)), [mocks]);
  const lastMock = sortedMocks[sortedMocks.length - 1];

  const trendData = useMemo(() => sortedMocks.map(m => ({ name: m.name, percentile: m.percentile })), [sortedMocks]);

  const aggMistakes = useMemo(() => {
    const agg = { silly: 0, panic: 0, timing: 0, conceptual: 0 };
    if (!lastMock) return agg;
    return lastMock.mistakes || agg;
  }, [lastMock]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <AnimatePresence>{showForm && <MockForm onClose={() => setShowForm(false)} />}</AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>
            Performance Intelligence
          </div>
          <h1 className="mono gradient-text" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase' }}>
            Mock Lab
          </h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ padding: '10px 20px' }}>
          <Plus size={16} /> Log Intelligence
        </button>
      </div>

      {!lastMock ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6, marginTop: 100 }}>
          <Target size={64} style={{ marginBottom: 32, color: 'var(--text-muted)' }} strokeWidth={1.5} />
          <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>Awaiting Mission Data</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Log your first mock to activate the intelligence engine.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          
          {/* Top Hero: Percentile */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '48px 0', position: 'relative' }}>
            <div className="spotlight-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 24, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Latest Mission: {lastMock.name}</div>
              <h1 className="mono" style={{ fontSize: 'clamp(80px, 12vw, 160px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.06em', lineHeight: 1, textShadow: '0 0 60px rgba(255,255,255,0.08)' }}>
                {lastMock.percentile}<span style={{ fontSize: 'clamp(32px, 4vw, 48px)', color: 'var(--text-muted)', marginLeft: 4 }}>%ile</span>
              </h1>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>
                  <div style={{ padding: 6, background: 'rgba(52, 211, 153, 0.1)', borderRadius: '50%' }}><Target size={16} color="var(--accent-green)" /></div>
                  Best: <span style={{ color: 'var(--text-primary)' }}>{bestPercentile}%ile</span>
                </div>
                <div style={{ width: 1, height: 24, background: 'var(--border-strong)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>
                  <div style={{ padding: 6, background: 'rgba(99, 153, 255, 0.1)', borderRadius: '50%' }}><Brain size={16} color="var(--accent-primary)" /></div>
                  Score: <span style={{ color: 'var(--text-primary)' }}>{lastMock.overallScore}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trend Line */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ height: 160, width: '100%', maxWidth: 900, margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -20, left: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Percentile Trend</div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, bottom: 0, left: 0, right: 0 }}>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="percentile" stroke="var(--text-primary)" strokeWidth={3} dot={{ r: 5, fill: 'var(--bg-base)', stroke: 'var(--text-primary)', strokeWidth: 2 }} activeDot={{ r: 8, fill: 'var(--accent-primary)', stroke: 'var(--bg-base)', strokeWidth: 3 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="divider" style={{ margin: '16px 0' }} />

          {/* Mistake Clusters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="section-label" style={{ marginBottom: 24 }}>
              Mistake Clusters (Lost Marks)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[
                { label: 'Silly / Calc', value: aggMistakes.silly, icon: Brain, color: 'var(--accent-amber)', desc: 'Preventable unforced errors' },
                { label: 'Panic', value: aggMistakes.panic, icon: AlertTriangle, color: 'var(--accent-rose)', desc: 'Stress-induced misreads' },
                { label: 'Time Mgmt', value: aggMistakes.timing, icon: Clock, color: 'var(--accent-primary)', desc: 'Poor question selection' },
                { label: 'Conceptual', value: aggMistakes.conceptual, icon: Target, color: 'var(--text-muted)', desc: 'Fundamental knowledge gaps' },
              ].map(({ label, value, icon: Icon, color, desc }) => (
                <div key={label} className="surface-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, opacity: 0.8 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ padding: 10, background: 'var(--bg-glass)', borderRadius: 10, border: `1px solid var(--border-subtle)` }}>
                      <Icon size={20} color={color} />
                    </div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value || 0}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: color, marginTop: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5, fontWeight: 500 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mistake Intelligence Layer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="surface-card" style={{ padding: 36, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ width: 10, height: 10, background: 'var(--accent-primary)', borderRadius: '50%', boxShadow: '0 0 12px var(--accent-primary)' }} />
              <div className="section-label">
                Mistake Intelligence Layer
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(() => {
                const insights = useMockStore.getState().getMistakeInsights();
                if (insights.length === 0) return <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Not enough data for behavioral clustering. Keep logging mistakes.</div>;
                
                return insights.map((insight, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', 
                    background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: var(--radius-md) 
                  }}>
                    {insight.severity === 'High' && <div style={{ padding: 8, background: 'rgba(251,113,133,0.1)', borderRadius: '50%' }}><AlertTriangle size={18} color="var(--accent-rose)" /></div>}
                    {insight.severity === 'Medium' && <div style={{ padding: 8, background: 'rgba(251,191,36,0.1)', borderRadius: '50%' }}><Clock size={18} color="var(--accent-amber)" /></div>}
                    {insight.severity === 'Low' && <div style={{ padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}><Brain size={18} color="var(--text-muted)" /></div>}
                    
                    <div style={{ flex: 1, fontSize: 14, color: insight.severity === 'High' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.5 }}>
                      {insight.pattern}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
