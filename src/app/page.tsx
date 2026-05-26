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
import { ShieldAlert, Target, Shield, BookOpen, Zap } from 'lucide-react';
import { SurfaceCard } from '@/core/ui/SurfaceCard';

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
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} 
          style={{ 
            padding: '12px 16px', 
            background: 'var(--bg-elevated)', 
            border: '1px solid var(--accent-rose)', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', alignItems: 'center', gap: 12, 
            color: 'var(--text-primary)' 
          }}
        >
          <ShieldAlert size={18} color="var(--accent-rose)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Anti-Burnout Protocol Activated</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Recent logs indicate high friction. Restrict hard QA today. Prioritize sleep and passive revision.</div>
          </div>
        </motion.div>
      )}

      {/* ── Hero Section ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 0 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
           <span className="tag">
             Phase {currentPhase.id}: {currentPhase.name}
           </span>
           <span className="tag">
             Level {levelInfo.level}
           </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 'clamp(56px, 8vw, 96px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.9, color: 'var(--text-primary)' }}>
            {daysLeft}
          </div>
          <div style={{ fontSize: 'clamp(20px, 3vw, 32px)', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
            Days Remaining
          </div>
        </div>
        
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {levelInfo.name}
        </div>
      </div>

      <div className="divider" />

      {/* ── Adaptive Weekly Battle ── */}
      {(() => {
        const battle = useSystemStore((s) => s.getBattleForDate(today));
        if (!battle) return null;
        
        const isRecovery = battle.id === 'adaptive-burnout' || battle.id === 'adaptive-collapse';
        const color = isRecovery ? 'var(--accent-rose)' : 'var(--accent-primary)';

        return (
          <SurfaceCard style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {isRecovery ? 'System Override' : 'Primary Mission'}
                </div>
              </div>
              <h2 className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: 600 }}>
                {battle.focus}
              </h2>
            </div>
            
            <div style={{ flex: 1, maxWidth: 180, minWidth: 120, marginLeft: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>
                <span>Progress</span>
                <span className="mono">{mvdStreak >= 7 ? 100 : Math.round((mvdStreak / 7) * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${Math.min((mvdStreak / 7) * 100, 100)}%` }} 
                  style={{ height: '100%', background: color }} 
                />
              </div>
            </div>
          </SurfaceCard>
        );
      })()}

      {/* ── 4 Primary Intelligence Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, paddingBottom: 40 }}>
        
        {/* 1. MVD Execution */}
        <Link href="/planner" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div className="section-label">MVD Protocol</div>
              <Shield size={16} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: todayEntry?.mvdMet ? 'var(--accent-primary)' : 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {todayEntry?.mvdMet ? 'SECURED' : `${todayEntry?.completionPercent || 0}%`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span style={{ color: mvdStreak > 0 ? 'var(--text-primary)' : 'inherit' }}>{mvdStreak} Day</span> Consistency Streak
              </div>
            </div>
          </SurfaceCard>
        </Link>

        {/* 2. Mock Trend */}
        <Link href="/mocks" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div className="section-label">Performance Intel</div>
              <Target size={16} color="var(--text-muted)" />
            </div>
            
            {recentMocks.length > 1 ? (
              <div style={{ height: 44, width: '100%', marginLeft: -8, marginBottom: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentMocks}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="percentile" stroke="var(--accent-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 44, marginBottom: 12 }} />
            )}

            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {lastMock ? `${lastMock.percentile}%ile` : 'N/A'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {lastMock ? 'Latest performance' : 'Take a diagnostic'}
              </div>
            </div>
          </SurfaceCard>
        </Link>

        {/* 3. Level Progress */}
        <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div className="section-label">Next Level Req</div>
            <Zap size={16} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.3 }}>
              {levelInfo.level === 4 ? 'Max Level Achieved' : levelInfo.req}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Current Level: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{levelInfo.level}</span>
            </div>
          </div>
        </SurfaceCard>

        {/* 4. Revision Due */}
        <Link href="/revision" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div className="section-label">Revision Queue</div>
              <BookOpen size={16} color={dueTopics.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)'} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                {dueTopics.length} <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>due</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dueTopics.slice(0, 2).map(t => (
                  <div key={t.id} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-primary)' }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                  </div>
                ))}
                {dueTopics.length > 2 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>+{dueTopics.length - 2} more pending</div>}
                {dueTopics.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Queue is clear.</div>}
              </div>
            </div>
          </SurfaceCard>
        </Link>
      </div>
    </div>
  );
}
