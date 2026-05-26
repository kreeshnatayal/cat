'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CAT_DATE } from '@/core/utils/constants';
import { usePlannerStore } from '@/features/planner/store';
import { useMockStore } from '@/features/mocks/store';
import { useRevisionStore, isDue } from '@/features/revision/store';
import { useRoadmapStore, getCurrentPhase } from '@/features/roadmap/store';
import { useSystemStore, computeLevel } from '@/core/store/systemStore';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ShieldAlert, Target, Shield, BookOpen, Zap, ChevronRight, Activity } from 'lucide-react';

function useCountdown() {
  const [days, setDays] = useState(0);
  useEffect(() => {
    const update = () => {
      const diff = CAT_DATE.getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(diff / 86400000)));
    };
    update();
    const id = setInterval(update, 3600000);
    return () => clearInterval(id);
  }, []);
  return days;
}

export default function DashboardPage() {
  const daysLeft = useCountdown();
  
  const entries = usePlannerStore((s) => s.entries);
  const getMVDCount = usePlannerStore((s) => s.getMVDCount);
  const getStreak = usePlannerStore((s) => s.getStreak);
  const mvdStreak = getStreak();
  
  const mocks = useMockStore((s) => s.mocks);
  const bestPercentile = useMockStore((s) => s.getBestPercentile());
  
  const topics = useRevisionStore((s) => s.topics);
  const dueTopics = useMemo(() => topics.filter(isDue), [topics]);
  
  const manualPhaseOverride = useRoadmapStore((s) => s.manualPhaseOverride);
  const currentPhase = useMemo(() => getCurrentPhase(manualPhaseOverride), [manualPhaseOverride]);
  
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = useMemo(() => entries.find((e) => e.date === today), [entries, today]);
  
  const levelInfo = computeLevel(getMVDCount(), mocks.length, bestPercentile);
  
  const recentMocks = useMemo(() => {
    return [...mocks].sort((a, b) => a.date.localeCompare(b.date)).slice(-5);
  }, [mocks]);
  const lastMock = recentMocks[recentMocks.length - 1];

  const getRecentMentalStates = () => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    const burntOut = sorted.some(e => e.mentalState === 'Burnt Out' || e.mentalState === 'Anxious');
    return burntOut;
  };
  const isBurnoutRisk = getRecentMentalStates();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 32 }}>
      
      {/* ── Anti-Burnout Warning ── */}
      {isBurnoutRisk && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          style={{ 
            padding: '14px 24px', 
            background: 'rgba(251, 113, 133, 0.08)', 
            border: '1px solid rgba(251, 113, 133, 0.2)', 
            borderRadius: 'var(--radius-)', 
            display: 'flex', alignItems: 'center', gap: 16, 
            color: 'var(--accent-rose)' 
          }}
        >
          <div style={{ padding: 8, background: 'rgba(251,113,133,0.15)', borderRadius: '50%' }}>
            <ShieldAlert size={20} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Anti-Burnout Protocol Activated</div>
            <div style={{ fontSize: 12, marginTop: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Recent logs indicate high friction. Restrict hard QA today. Prioritize sleep and passive revision.</div>
          </div>
        </motion.div>
      )}

      {/* ── Hero Section ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, position: 'relative' }}
      >
        <div className="spotlight-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
             <span className="tag" style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}>
               Phase {currentPhase.id}: {currentPhase.name}
             </span>
             <span className="tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
               Level {levelInfo.level}
             </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, marginBottom: 20, textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
            <div className="mono" style={{ fontSize: 'clamp(72px, 12vw, 140px)', fontWeight: 800, letterSpacing: '-0.06em', lineHeight: 0.9, color: 'var(--text-primary)' }}>
              {daysLeft}
            </div>
            <div style={{ fontSize: 'clamp(24px, 4vw, 48px)', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              DAYS
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <span style={{ width: 80, height: 1, background: 'var(--border-strong)' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {levelInfo.name}
            </div>
            <span style={{ width: 80, height: 1, background: 'var(--border-strong)' }} />
          </div>
        </div>
      </motion.div>

      {/* ── Adaptive Weekly Battle ── */}
      {(() => {
        const battle = useSystemStore((s) => s.getBattleForDate(today));
        
        if (!battle) return null;
        
        const isRecovery = battle.id === 'adaptive-burnout' || battle.id === 'adaptive-collapse';
        const color = isRecovery ? 'var(--accent-rose)' : 'var(--accent-primary)';
        const colorMuted = isRecovery ? 'rgba(251,113,133,0.15)' : 'var(--accent-primary-muted)';

        return (
          <motion.div className="surface-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: '32px 40px', position: 'relative', overflow: 'hidden', border: `1px solid ${isRecovery ? 'rgba(251,113,133,0.3)' : 'var(--border-subtle)'}` }}>
            {isRecovery && (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(251,113,133,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
            )}
            {!isRecovery && (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(99, 153, 255, 0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
            )}
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
                  <div style={{ fontSize: 12, color: color, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                    {isRecovery ? 'System Override' : 'Primary Mission'}
                  </div>
                </div>
                <h2 className="mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 1.2, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {battle.focus}
                </h2>
              </div>
              
              <div style={{ flex: 1, maxWidth: 200, minWidth: 120, marginLeft: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
                  <span>Progress</span>
                  <span className="mono" style={{ color }}>{mvdStreak >= 7 ? 100 : Math.round((mvdStreak / 7) * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--bg-base)', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${Math.min((mvdStreak / 7) * 100, 100)}%` }} 
                    style={{ height: '100%', background: color, borderRadius: 99 }} 
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* ── 4 Primary Intelligence Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, paddingBottom: 40 }}>
        
        {/* 1. MVD Execution */}
        <Link href="/planner" style={{ textDecoration: 'none' }}>
          <motion.div className="surface-card" whileHover={{ y: -2 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div className="section-label">MVD Protocol</div>
              <Shield size={16} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: todayEntry?.mvdMet ? 'var(--accent-green)' : 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
                {todayEntry?.mvdMet ? 'SECURED' : `${todayEntry?.completionPercent || 0}%`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span style={{ color: mvdStreak > 0 ? 'var(--accent-amber)' : 'inherit' }}>{mvdStreak} Day</span> Consistency Streak
              </div>
            </div>
          </motion.div>
        </Link>

        {/* 2. Mock Trend */}
        <Link href="/mocks" style={{ textDecoration: 'none' }}>
          <motion.div className="surface-card" whileHover={{ y: -2 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
              <div className="section-label">Performance Intel</div>
              <Target size={16} color="var(--text-muted)" />
            </div>
            
            {recentMocks.length > 1 ? (
              <div style={{ height: 44, width: '100%', marginLeft: -8, marginBottom: 12, position: 'relative', zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentMocks}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="percentile" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--bg-base)', strokeWidth: 2 }} isAnimationActive={true} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 44, marginBottom: 12 }} />
            )}

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {lastMock ? `${lastMock.percentile}%ile` : 'N/A'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {lastMock ? 'Latest performance' : 'Take a diagnostic'}
              </div>
            </div>
          </motion.div>
        </Link>

        {/* 3. Level Progress */}
        <motion.div className="surface-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div className="section-label">Next Level Req</div>
            <Zap size={16} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
              {levelInfo.level === 4 ? 'Max Level Achieved' : levelInfo.req}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Current Level: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{levelInfo.level}</span>
            </div>
          </div>
        </motion.div>

        {/* 4. Revision Due */}
        <Link href="/revision" style={{ textDecoration: 'none' }}>
          <motion.div className="surface-card" whileHover={{ y: -2 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div className="section-label">Revision Queue</div>
              <BookOpen size={16} color={dueTopics.length > 0 ? 'var(--accent-amber)' : 'var(--text-muted)'} />
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: dueTopics.length > 0 ? 'var(--accent-amber)' : 'var(--accent-green)', letterSpacing: '-0.03em', marginBottom: 12 }}>
                {dueTopics.length} <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0', textTransform: 'uppercase' }}>due</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dueTopics.slice(0, 2).map(t => (
                  <div key={t.id} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-amber)' }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                  </div>
                ))}
                {dueTopics.length > 2 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>+{dueTopics.length - 2} more pending</div>}
                {dueTopics.length === 0 && <div style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 500 }}>All clear. Good work.</div>}
              </div>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
