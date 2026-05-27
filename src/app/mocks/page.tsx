'use client';

import { useState, useMemo } from 'react';
import { useMockStore, MockEntry, MistakeCluster } from '@/features/mocks/store';
import { SECTION_COLORS, MOCK_SERIES } from '@/core/utils/constants';
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
        style={{ padding: 40, width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--accent-cyan)', boxShadow: '0 0 30px rgba(0,229,255,0.1)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <div className="hud-text" style={{ marginBottom: 8, color: 'var(--accent-cyan)' }}>[ SYSTEM_INPUT ]</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Log Intelligence</div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}>
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
                <div key={key} style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-)', padding: 20, transition: 'all 0.2s' }}>
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
            <button className="btn-ghost" onClick={onClose} style={{ padding: '10px 24px' }}>[ CANCEL ]</button>
            <button className="btn-primary" onClick={handleSave} style={{ padding: '10px 28px' }}>[ TRANSMIT_DATA ]</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-)', padding: '10px 14px', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
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
          <div className="hud-text" style={{ marginBottom: 12 }}>RADAR_TELEMETRY</div>
          <h1 className="mono" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1, textTransform: 'uppercase', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
            MOCK_LAB
          </h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ padding: '10px 20px' }}>
          <Plus size={14} /> [ LOG_MISSION ]
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '32px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
            <div className="hud-text" style={{ color: 'var(--accent-cyan)', marginBottom: 24 }}>LATEST_MISSION : {lastMock.name}</div>
            <h1 className="hud-value" style={{ fontSize: 'clamp(80px, 12vw, 160px)', color: 'var(--accent-green)', textShadow: '0 0 40px rgba(0,255,102,0.2)' }}>
              {lastMock.percentile}<span style={{ fontSize: 'clamp(32px, 4vw, 48px)', color: 'var(--text-secondary)', marginLeft: 8 }}>%ILE</span>
            </h1>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, marginTop: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Target size={14} color="var(--accent-green)" />
                <span className="hud-text">ALL-TIME_HIGH : <span style={{ color: 'var(--text-primary)' }}>{bestPercentile}%ILE</span></span>
              </div>
              <div style={{ width: 1, height: 24, background: 'var(--border-strong)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Brain size={14} color="var(--accent-cyan)" />
                <span className="hud-text">NET_SCORE : <span style={{ color: 'var(--text-primary)' }}>{lastMock.overallScore}</span></span>
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
            <div className="hud-text" style={{ marginBottom: 24 }}>
              MISTAKE_CLUSTERS (MARKS LOST)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'SILLY / CALC', value: aggMistakes.silly, icon: Brain, color: 'var(--accent-amber)', desc: 'Preventable unforced errors' },
                { label: 'PANIC', value: aggMistakes.panic, icon: AlertTriangle, color: 'var(--accent-rose)', desc: 'Stress-induced misreads' },
                { label: 'TIME MGMT', value: aggMistakes.timing, icon: Clock, color: 'var(--accent-cyan)', desc: 'Poor question selection' },
                { label: 'CONCEPTUAL', value: aggMistakes.conceptual, icon: Target, color: 'var(--text-secondary)', desc: 'Fundamental knowledge gaps' },
              ].map(({ label, value, icon: Icon, color, desc }) => (
                <div key={label} className="cockpit-panel" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, borderTop: `2px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div>
                    <div className="hud-value" style={{ color: 'var(--text-primary)' }}>{value || 0}</div>
                    <div className="hud-text" style={{ color: color, marginTop: 8 }}>{label}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8, textTransform: 'uppercase' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mistake Intelligence Layer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="cockpit-panel" style={{ padding: 32, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, background: 'var(--accent-rose)', boxShadow: '0 0 10px var(--accent-rose)' }} />
              <div className="hud-text">
                MISTAKE_INTELLIGENCE_LAYER
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(() => {
                const insights = useMockStore.getState().getMistakeInsights();
                if (insights.length === 0) return <div className="mono" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>INSUFFICIENT_DATA_FOR_CLUSTERING</div>;
                
                return insights.map((insight, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
                    background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderLeft: `2px solid ${insight.severity === 'High' ? 'var(--accent-rose)' : insight.severity === 'Medium' ? 'var(--accent-amber)' : 'var(--text-secondary)'}`
                  }}>
                    {insight.severity === 'High' && <AlertTriangle size={14} color="var(--accent-rose)" />}
                    {insight.severity === 'Medium' && <Clock size={14} color="var(--accent-amber)" />}
                    {insight.severity === 'Low' && <Brain size={14} color="var(--text-secondary)" />}
                    
                    <div className="mono" style={{ flex: 1, fontSize: 12, color: insight.severity === 'High' ? 'var(--text-primary)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
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
