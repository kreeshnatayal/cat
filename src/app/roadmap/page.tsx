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
          <div className="section-label" style={{ marginBottom: 12 }}>
            Strategic Blueprint
          </div>
          <h1 className="mono gradient-text-blue" style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase' }}>
            Escalation Roadmap
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
                padding: '20px 28px',
                borderRadius: 'var(--radius-)',
                background: isSelected ? 'var(--text-primary)' : 'var(--bg-glass)',
                color: isSelected ? 'var(--bg-base)' : 'var(--text-secondary)',
                border: `1px solid ${isSelected ? 'transparent' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                position: 'relative',
                minWidth: 180,
                boxShadow: isSelected ? '0 8px 32px rgba(255,255,255,0.15)' : 'none',
                transform: isSelected ? 'translateY(-2px)' : 'none',
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--bg-glass-hover)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--bg-glass)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }
              }}
            >
              {isActual && !isSelected && (
                <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, background: 'var(--accent-primary)', borderRadius: '50%', boxShadow: '0 0 12px var(--accent-primary)' }} />
              )}
              {isActual && isSelected && (
                <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, background: 'var(--bg-base)', borderRadius: '50%', opacity: 0.5 }} />
              )}
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, opacity: isSelected ? 0.7 : 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Phase {phase.id}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'left' }}>
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
          <div className="surface-card spotlight-bg" style={{ padding: 48, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                {new Date(currentPhase.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – {new Date(currentPhase.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: 'var(--text-primary)', marginBottom: 40, letterSpacing: '-0.03em', lineHeight: 1.1, fontWeight: 800 }}>
                {currentPhase.focus}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="section-label">Strategic Objectives</div>
                {currentPhase.objective.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ marginTop: 4, background: 'var(--bg-glass)', padding: 6, borderRadius: '50%' }}>
                      <TargetIcon size={16} color="var(--accent-primary)" />
                    </div>
                    <span style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section Focus Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { label: 'Quantitative Aptitude', value: currentPhase.qaFocus, color: SECTION_COLORS.QA },
              { label: 'Data Interpretation & LR', value: currentPhase.dilrFocus, color: SECTION_COLORS.DILR },
              { label: 'Verbal Ability & RC', value: currentPhase.varcFocus, color: SECTION_COLORS.VARC }
            ].map(sec => (
              <div key={sec.label} className="surface-card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: sec.color, opacity: 0.8 }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: sec.color, marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{sec.label}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>{sec.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Constraints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="surface-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 8, background: 'var(--bg-glass)', borderRadius: '50%' }}><Clock size={16} color="var(--text-primary)" /></div>
              <div className="section-label">Daily Velocity</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Weekdays</div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{currentPhase.weekdayHours}</div>
              </div>
              <div className="divider" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Weekends</div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{currentPhase.weekendHours}</div>
              </div>
            </div>
          </div>

          <div className="surface-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 8, background: 'var(--bg-glass)', borderRadius: '50%' }}><FlaskConical size={16} color="var(--accent-purple)" /></div>
              <div className="section-label" style={{ color: 'var(--accent-purple)' }}>Mock Strategy</div>
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
              {currentPhase.mockStrategy}
            </div>
          </div>

          <div className="surface-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 8, background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%' }}><Zap size={16} color="var(--accent-amber)" /></div>
              <div className="section-label" style={{ color: 'var(--accent-amber)' }}>Work Balance</div>
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
              Maintain <strong style={{ color: 'var(--text-primary)' }}>1–2 hrs/day max</strong> on weekdays. Do not abandon projects.
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
