'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRoadmapStore, PHASES, getCurrentPhase } from '@/features/roadmap/store';
import { Target as TargetIcon, Clock, Zap, FlaskConical } from 'lucide-react';
import { SECTION_COLORS } from '@/core/utils/constants';

export default function RoadmapPage() {
  const manualPhaseOverride = useRoadmapStore((s) => s.manualPhaseOverride);
  const setPhaseOverride = useRoadmapStore((s) => s.setPhaseOverride);
  
  const currentPhase = useMemo(() => getCurrentPhase(manualPhaseOverride), [manualPhaseOverride]);
  const actualCurrentPhase = useMemo(() => getCurrentPhase(null), []);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 40, height: '100%' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div className="hud-text" style={{ marginBottom: 12 }}>STRATEGIC_BLUEPRINT</div>
          <h1 className="mono" style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1, textTransform: 'uppercase', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
            ESCALATION_ROADMAP
          </h1>
        </div>
      </div>

      {/* ── Timeline Selection ── */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, flexShrink: 0, paddingRight: 40, marginLeft: -4, paddingLeft: 4 }}>
        {PHASES.map((phase) => {
          const isSelected = currentPhase.id === phase.id;
          const isActual = actualCurrentPhase.id === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => setPhaseOverride(phase.id)}
              style={{
                flexShrink: 0,
                padding: '20px 24px',
                background: isSelected ? 'rgba(0,229,255,0.1)' : 'rgba(0,0,0,0.4)',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                borderLeft: isSelected ? '4px solid var(--accent-cyan)' : `1px solid var(--border-subtle)`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                position: 'relative',
                minWidth: 200,
                boxShadow: isSelected ? 'inset 0 0 20px rgba(0,229,255,0.05)' : 'none',
              }}
            >
              {isActual && !isSelected && (
                <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }} />
              )}
              {isActual && isSelected && (
                <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }} />
              )}
              <div className="mono" style={{ fontSize: 10, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                [ PHASE_{phase.id} ]
              </div>
              <div className="mono" style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'left' }}>
                {phase.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Selected Phase Details ── */}
      <motion.div
        key={currentPhase.id}
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 32, paddingBottom: 64 }}
      >
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Objective Card */}
          <div className="cockpit-panel" style={{ padding: 48, overflow: 'hidden', position: 'relative', borderTop: '2px solid var(--accent-cyan)' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="hud-text" style={{ color: 'var(--accent-cyan)', marginBottom: 16 }}>
                {new Date(currentPhase.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }).toUpperCase()} // {new Date(currentPhase.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </div>
              <h2 className="mono" style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: 'var(--text-primary)', marginBottom: 40, letterSpacing: '0.02em', lineHeight: 1.1, fontWeight: 700, textTransform: 'uppercase' }}>
                {currentPhase.focus}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="hud-text">STRATEGIC_OBJECTIVES</div>
                {currentPhase.objective.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ marginTop: 4 }}>
                      <TargetIcon size={14} color="var(--accent-cyan)" />
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, textTransform: 'uppercase' }}>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section Focus Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { label: 'QUANT_APTITUDE', value: currentPhase.qaFocus, color: SECTION_COLORS.QA },
              { label: 'DATA_INTERPRETATION', value: currentPhase.dilrFocus, color: SECTION_COLORS.DILR },
              { label: 'VERBAL_ABILITY', value: currentPhase.varcFocus, color: SECTION_COLORS.VARC }
            ].map(sec => (
              <div key={sec.label} className="cockpit-panel" style={{ padding: 24, borderTop: `2px solid ${sec.color}` }}>
                <div className="hud-text" style={{ color: sec.color, marginBottom: 16 }}>{sec.label}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, textTransform: 'uppercase' }}>{sec.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Constraints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="cockpit-panel" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Clock size={16} color="var(--accent-cyan)" />
              <div className="hud-text">DAILY_VELOCITY</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div className="hud-text" style={{ marginBottom: 6 }}>WEEKDAYS</div>
                <div className="hud-value">{currentPhase.weekdayHours}</div>
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)' }} />
              <div>
                <div className="hud-text" style={{ marginBottom: 6 }}>WEEKENDS</div>
                <div className="hud-value">{currentPhase.weekendHours}</div>
              </div>
            </div>
          </div>

          <div className="cockpit-panel" style={{ padding: 32, borderLeft: '2px solid var(--accent-rose)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <FlaskConical size={16} color="var(--accent-rose)" />
              <div className="hud-text" style={{ color: 'var(--accent-rose)' }}>MOCK_STRATEGY</div>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, textTransform: 'uppercase' }}>
              {currentPhase.mockStrategy}
            </div>
          </div>

          <div className="cockpit-panel" style={{ padding: 32, borderLeft: '2px solid var(--accent-amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Zap size={16} color="var(--accent-amber)" />
              <div className="hud-text" style={{ color: 'var(--accent-amber)' }}>WORK_BALANCE</div>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, textTransform: 'uppercase' }}>
              MAINTAIN <strong style={{ color: 'var(--accent-amber)' }}>1–2 HRS/DAY MAX</strong> ON WEEKDAYS. DO NOT ABANDON PROJECTS.
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
