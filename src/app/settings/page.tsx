'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/lib/store/plannerStore';
import { useMockStore } from '@/lib/store/mockStore';
import { useRevisionStore } from '@/lib/store/revisionStore';
import { CAT_DATE } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Download, Trash2, AlertTriangle, Settings, Database, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const plannerEntries = usePlannerStore((s) => s.entries);
  const mocks = useMockStore((s) => s.mocks);
  const topics = useRevisionStore((s) => s.topics);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      planner: plannerEntries,
      mocks,
      revision: topics,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cat-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    localStorage.removeItem('cat-os-planner');
    localStorage.removeItem('cat-os-mocks');
    localStorage.removeItem('cat-os-revision');
    window.location.reload();
  };

  return (
    <div className="page-container" style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48, height: '100%' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>
            System Configuration
          </div>
          <h1 className="mono gradient-text" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase' }}>
            Settings
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 64 }}>
        
        {/* ── System Overview ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="surface-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent-primary)', opacity: 0.8 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ padding: 12, borderRadius: '50%', background: 'rgba(99, 153, 255, 0.1)', border: '1px solid rgba(99, 153, 255, 0.2)' }}>
              <Database size={24} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Storage Intelligence</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>Local client-side persistence active</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { label: 'Execution Logs', value: plannerEntries.length, color: 'var(--accent-primary)' },
              { label: 'Mock Intelligence', value: mocks.length, color: 'var(--accent-cyan)' },
              { label: 'Concept Base', value: topics.length, color: 'var(--accent-green)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: color, opacity: 0.5 }} />
                <div className="mono" style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Mission Parameters ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent-green)', opacity: 0.8 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ padding: 12, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
              <Calendar size={24} color="var(--accent-green)" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Mission Parameters</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>Target definition and timeline</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.01em' }}>Zero Day (CAT Exam)</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                  {CAT_DATE.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div style={{ padding: '8px 16px', borderRadius: 99, background: 'rgba(99, 153, 255, 0.1)', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 700, border: '1px solid rgba(99, 153, 255, 0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                T-Minus {Math.ceil((CAT_DATE.getTime() - Date.now()) / 86400000)} days
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.01em' }}>Target Percentile</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Minimum required for Tier 1</div>
              </div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>99.0+</div>
            </div>
          </div>
        </motion.div>

        {/* ── Data Controls ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="surface-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--text-secondary)', opacity: 0.8 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ padding: 12, borderRadius: '50%', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <Settings size={24} color="var(--text-secondary)" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Data Operations</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>Export or purge intelligence</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Backup Intelligence</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Download secure JSON state</div>
              </div>
              <button className="btn-primary" onClick={handleExport} style={{ padding: '10px 20px', fontSize: 13 }}>
                <Download size={16} /> Export Data
              </button>
            </div>

            <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'rgba(251, 113, 133, 0.05)', border: '1px solid rgba(251, 113, 133, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: confirmClear ? 24 : 0 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.01em' }}>
                    <AlertTriangle size={18} strokeWidth={2.5} /> Purge Intelligence
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>Irreversible deletion of all local storage. Cannot be undone.</div>
                </div>
                {!confirmClear && (
                  <button onClick={() => setConfirmClear(true)} style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(251, 113, 133, 0.1)', border: '1px solid rgba(251, 113, 133, 0.3)', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(251, 113, 133, 0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(251, 113, 133, 0.1)'; }}>
                    <Trash2 size={16} /> Initiate Purge
                  </button>
                )}
              </div>
              {confirmClear && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <button className="btn-ghost" onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: '12px' }}>Abort Operation</button>
                  <button onClick={handleClear} style={{ flex: 1, padding: '12px 24px', borderRadius: 8, background: 'var(--accent-rose)', color: 'var(--bg-base)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 0 20px rgba(251,113,133,0.4)', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(251,113,133,0.6)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(251,113,133,0.4)'; }}>
                    Confirm Absolute Purge
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
