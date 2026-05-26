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
// TacticalTerminal inlined

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

  // ── Planner ──
  const entries = usePlannerStore((s) => s.entries);
  const getMVDCount = usePlannerStore((s) => s.getMVDCount);
  const getStreak = usePlannerStore((s) => s.getStreak);
  const mvdStreak = getStreak();
  const mvdCount = getMVDCount();

  // ── Mocks ──
  const mocks = useMockStore((s) => s.mocks);
  const bestPercentile = useMockStore((s) => s.getBestPercentile());

  // ── Revision ──
  const topics = useRevisionStore((s) => s.topics);
  const dueTopics = useMemo(() => topics.filter(isDue), [topics]);

  // ── Roadmap ──
  const manualPhaseOverride = useRoadmapStore((s) => s.manualPhaseOverride);
  const currentPhase = useMemo(() => getCurrentPhase(manualPhaseOverride), [manualPhaseOverride]);

  // ── System / Weekly Battle ──
  const today = new Date().toISOString().slice(0, 10);
  const battle = useSystemStore((s) => s.getBattleForDate(today));

  // ── Derived ──
  const todayEntry = useMemo(() => entries.find((e) => e.date === today), [entries, today]);
  const levelInfo = computeLevel(mvdCount, mocks.length, bestPercentile);
  const recentMocks = useMemo(() => [...mocks].sort((a, b) => a.date.localeCompare(b.date)).slice(-5), [mocks]);
  const lastMock = recentMocks[recentMocks.length - 1];
  const isBurnoutRisk = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    return sorted.some(e => e.mentalState === 'Burnt Out' || e.mentalState === 'Anxious');
  }, [entries]);

  const isRecovery = battle?.id === 'adaptive-burnout' || battle?.id === 'adaptive-collapse';
  const battleColor = isRecovery ? 'var(--accent-rose)' : 'var(--accent-primary)';

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

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
          }}
        >
          <ShieldAlert size={16} color="var(--accent-rose)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Anti-Burnout Protocol Active</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Recent logs show high friction. Prioritize passive revision and sleep today.</div>
          </div>
        </motion.div>
      )}

      {/* ── Hero ── */}
      <div style={{ padding: '24px 0 32px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge">Phase {currentPhase.id}: {currentPhase.name}</span>
          <span className="badge" style={{ background: 'var(--text-primary)', color: 'var(--bg-app)', border: 'none' }}>
            Level {levelInfo.level}
          </span>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 'clamp(64px, 8vw, 100px)', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-primary)' }}>
            {daysLeft}
          </div>
          <div style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>
            Days Remaining
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {levelInfo.name}
        </div>
      </div>

      {/* ── Tactical Terminal (AI) ── */}
      <div className="panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-default)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-default)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-default)' }} />
            </div>
            <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
              tactical-ai / gpt-oss-120b
            </span>
          </div>
          <button
            id="ai-execute-btn"
            className="btn-secondary"
            onClick={async () => {
              const btn = document.getElementById('ai-execute-btn') as HTMLButtonElement;
              const body = document.getElementById('ai-response-body') as HTMLDivElement;
              if (!btn || !body) return;
              btn.disabled = true;
              btn.textContent = 'Processing...';
              body.textContent = '';
              try {
                const res = await fetch('/api/ai', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ messages: [
                    { role: 'system', content: `You are the CAT OS Tactical AI. Brutal, direct coach for CAT exam prep. No emojis. Military-style. Under 120 words. User: Streak=${mvdStreak} days, Level=${levelInfo.level}, Phase=${currentPhase.name}, Due Revisions=${dueTopics.length}, Recent Mocks=${JSON.stringify(recentMocks.slice(-3))}. Rip into them if streak is 0. Push harder if doing well.` },
                    { role: 'user', content: 'Daily briefing.' }
                  ]})
                });
                if (!res.ok || !res.body) { body.textContent = '[ERROR] Could not reach AI.'; return; }
                const reader = res.body.getReader();
                const dec = new TextDecoder();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  body.textContent += dec.decode(value, { stream: true });
                }
              } catch(e: unknown) { body.textContent = `[ERROR] ${e instanceof Error ? e.message : 'Unknown'}`; }
              finally { btn.disabled = false; btn.textContent = 'Execute'; }
            }}
          >
            Execute
          </button>
        </div>
        <div id="ai-response-body" style={{ padding: '20px 24px', minHeight: 120, fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {'> System standing by. Click EXECUTE for your daily tactical briefing.'}
        </div>
      </div>

      <div className="divider-h" style={{ margin: '8px 0' }} />

      {/* ── Primary Mission ── */}
      {battle && (
        <SurfaceCard style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: battleColor, flexShrink: 0 }} />
              <div className="text-label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isRecovery ? 'System Override' : 'Primary Mission'}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {battle.focus}
            </div>
          </div>
          <div style={{ minWidth: 160, maxWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <span className="text-label">Progress</span>
              <span className="mono" style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                {mvdStreak >= 7 ? 100 : Math.round((mvdStreak / 7) * 100)}%
              </span>
            </div>
            <div style={{ width: '100%', height: 4, background: 'var(--bg-hover)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${Math.min((mvdStreak / 7) * 100, 100)}%` }}
                style={{ height: '100%', background: battleColor, borderRadius: 99 }}
              />
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* ── 4 Intelligence Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, paddingBottom: 48 }}>

        {/* MVD Protocol */}
        <Link href="/planner" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="text-label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>MVD Protocol</div>
              <Shield size={14} color="var(--text-tertiary)" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: todayEntry?.mvdMet ? 'var(--text-primary)' : 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {todayEntry?.mvdMet ? 'SECURED' : `${todayEntry?.completionPercent || 0}%`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {mvdStreak} Day Streak
              </div>
            </div>
          </SurfaceCard>
        </Link>

        {/* Performance Intel */}
        <Link href="/mocks" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="text-label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Performance Intel</div>
              <Target size={14} color="var(--text-tertiary)" />
            </div>
            {recentMocks.length > 1 && (
              <div style={{ height: 32, marginBottom: 8, marginLeft: -8, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentMocks}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="percentile" stroke="var(--text-secondary)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ marginTop: recentMocks.length > 1 ? 0 : 'auto' }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {lastMock ? `${lastMock.percentile}%ile` : 'N/A'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {lastMock ? 'Latest mock' : 'Take a diagnostic'}
              </div>
            </div>
          </SurfaceCard>
        </Link>

        {/* Next Level */}
        <SurfaceCard style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="text-label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Level Req</div>
            <Zap size={14} color="var(--text-tertiary)" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.4, marginBottom: 4 }}>
              {levelInfo.level === 4 ? 'Max Level Achieved' : levelInfo.req}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Currently Level <span style={{ color: 'var(--text-primary)' }}>{levelInfo.level}</span>
            </div>
          </div>
        </SurfaceCard>

        {/* Revision Queue */}
        <Link href="/revision" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="text-label" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revision Queue</div>
              <BookOpen size={14} color={dueTopics.length > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)'} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {dueTopics.length} <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>due</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dueTopics.slice(0, 2).map(t => (
                  <div key={t.id} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </div>
                ))}
                {dueTopics.length > 2 && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>+{dueTopics.length - 2} more</div>}
                {dueTopics.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Queue clear.</div>}
              </div>
            </div>
          </SurfaceCard>
        </Link>

      </div>
    </div>
  );
}
