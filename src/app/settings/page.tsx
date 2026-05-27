'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/features/planner/store';
import { useMockStore } from '@/features/mocks/store';
import { useRevisionStore } from '@/features/revision/store';
import { CAT_DATE } from '@/core/utils/constants';
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
          <div className="hud-text" style={{ marginBottom: 12 }}>SYSTEM_CONFIGURATION</div>
          <h1 className="mono" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1, textTransform: 'uppercase', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
            SETTINGS
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 64 }}>
        
        {/* ── System Overview ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="cockpit-panel" style={{ padding: '40px', borderTop: '2px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <Database size={24} color="var(--accent-cyan)" />
            <div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>STORAGE_INTELLIGENCE</div>
              <div className="hud-text" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>LOCAL_CLIENT_PERSISTENCE_ACTIVE</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { label: 'EXECUTION_LOGS', value: plannerEntries.length, color: 'var(--accent-cyan)' },
              { label: 'MOCK_INTELLIGENCE', value: mocks.length, color: 'var(--accent-cyan)' },
              { label: 'CONCEPT_BASE', value: topics.length, color: 'var(--accent-green)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '24px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderLeft: `2px solid ${color}` }}>
                <div className="hud-value" style={{ color }}>{value}</div>
                <div className="hud-text" style={{ marginTop: 12, color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Mission Parameters ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="cockpit-panel" style={{ padding: '40px', borderTop: '2px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <Calendar size={24} color="var(--accent-green)" />
            <div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>MISSION_PARAMETERS</div>
              <div className="hud-text" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>TARGET_DEFINITION_AND_TIMELINE</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div className="mono" style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase' }}>ZERO_DAY (CAT_EXAM)</div>
                <div className="hud-text" style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                  {CAT_DATE.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="hud-text" style={{ padding: '8px 12px', background: 'rgba(0,255,102,0.1)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)' }}>
                T-MINUS {Math.ceil((CAT_DATE.getTime() - Date.now()) / 86400000)} DAYS
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div className="mono" style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase' }}>TARGET_PERCENTILE</div>
                <div className="hud-text" style={{ color: 'var(--text-muted)', marginTop: 8 }}>MINIMUM_REQUIRED_FOR_TIER_1</div>
              </div>
              <div className="hud-value" style={{ color: 'var(--accent-green)' }}>99.0+</div>
            </div>
          </div>
        </motion.div>

        {/* ── Data Controls ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="cockpit-panel" style={{ padding: '40px', borderTop: '2px solid var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <Settings size={24} color="var(--text-secondary)" />
            <div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>DATA_OPERATIONS</div>
              <div className="hud-text" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>EXPORT_OR_PURGE_INTELLIGENCE</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>BACKUP_INTELLIGENCE</div>
                <div className="hud-text" style={{ color: 'var(--text-muted)', marginTop: 8 }}>DOWNLOAD_SECURE_JSON_STATE</div>
              </div>
              <button className="btn-primary" onClick={handleExport} style={{ padding: '10px 20px' }}>
                <Download size={14} /> [ EXPORT_DATA ]
              </button>
            </div>

            <div style={{ padding: '24px', background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: confirmClear ? 24 : 0 }}>
                <div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
                    <AlertTriangle size={18} strokeWidth={2.5} /> PURGE_INTELLIGENCE
                  </div>
                  <div className="hud-text" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>IRREVERSIBLE_DELETION_OF_ALL_LOCAL_STORAGE. CANNOT_BE_UNDONE.</div>
                </div>
                {!confirmClear && (
                  <button onClick={() => setConfirmClear(true)} className="btn-ghost" style={{ padding: '10px 20px', color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Trash2 size={14} /> [ INITIATE_PURGE ]
                  </button>
                )}
              </div>
              {confirmClear && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <button className="btn-ghost" onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: '12px' }}>[ ABORT_OPERATION ]</button>
                  <button onClick={handleClear} style={{ flex: 1, padding: '12px 24px', background: 'var(--accent-rose)', color: 'var(--bg-base)', border: 'none', cursor: 'pointer', fontFamily: 'Geist Mono, monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', boxShadow: '0 0 20px rgba(255,51,102,0.4)', transition: 'all 0.2s', textTransform: 'uppercase' }}>
                    [ CONFIRM_ABSOLUTE_PURGE ]
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
