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
      <div style={{ padding: '32px 0 8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className="tag">Phase {currentPhase.id}: {currentPhase.name}</span>
          <span className="tag">Level {levelInfo.level}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <div className="mono" style={{ fontSize: 'clamp(56px, 8vw, 96px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.9 }}>
            {daysLeft}
          </div>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Days Remaining
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 8 }}>
          {levelInfo.name}
        </div>
      </div>

      {/* ── Tactical Terminal (AI) ── */}
      <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#1F2937', borderBottom: '1px solid #374151' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717A', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            ▸ Intelligence Engine · gpt-oss-120b
          </span>
          <button
            id="ai-execute-btn"
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
            style={{ background: 'transparent', border: '1px solid #52525B', color: '#FAFAFA', padding: '4px 14px', fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}
          >
            Execute
          </button>
        </div>
        <div id="ai-response-body" style={{ padding: '16px 20px', minHeight: 90, fontFamily: 'monospace', fontSize: 13, color: '#71717A', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {'> System standing by. Click EXECUTE for your daily tactical briefing.'}
        </div>
      </div>


      <div className="divider" />

      {/* ── Primary Mission ── */}
      {battle && (
        <SurfaceCard style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: battleColor, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isRecovery ? 'System Override' : 'Primary Mission'}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {battle.focus}
            </div>
          </div>
          <div style={{ minWidth: 140, maxWidth: 160 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>
              <span>Progress</span>
              <span className="mono">{mvdStreak >= 7 ? 100 : Math.round((mvdStreak / 7) * 100)}%</span>
            </div>
            <div style={{ width: '100%', height: 3, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${Math.min((mvdStreak / 7) * 100, 100)}%` }}
                style={{ height: '100%', background: battleColor }}
              />
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* ── 4 Intelligence Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, paddingBottom: 48 }}>

        {/* MVD Protocol */}
        <Link href="/planner" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="section-label">MVD Protocol</div>
              <Shield size={15} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 600, color: todayEntry?.mvdMet ? 'var(--accent-primary)' : 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {todayEntry?.mvdMet ? 'SECURED' : `${todayEntry?.completionPercent || 0}%`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {mvdStreak} Day Streak
              </div>
            </div>
          </SurfaceCard>
        </Link>

        {/* Performance Intel */}
        <Link href="/mocks" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="section-label">Performance Intel</div>
              <Target size={15} color="var(--text-muted)" />
            </div>
            {recentMocks.length > 1 && (
              <div style={{ height: 40, marginBottom: 8, marginLeft: -8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentMocks}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="percentile" stroke="var(--accent-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {lastMock ? `${lastMock.percentile}%ile` : 'N/A'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {lastMock ? 'Latest mock' : 'Take a diagnostic'}
              </div>
            </div>
          </SurfaceCard>
        </Link>

        {/* Next Level */}
        <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="section-label">Next Level Req</div>
            <Zap size={15} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.4, marginBottom: 6 }}>
              {levelInfo.level === 4 ? 'Max Level' : levelInfo.req}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Level <span style={{ color: 'var(--text-primary)' }}>{levelInfo.level}</span>
            </div>
          </div>
        </SurfaceCard>

        {/* Revision Queue */}
        <Link href="/revision" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="section-label">Revision Queue</div>
              <BookOpen size={15} color={dueTopics.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)'} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                {dueTopics.length} <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>due</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {dueTopics.slice(0, 2).map(t => (
                  <div key={t.id} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </div>
                ))}
                {dueTopics.length > 2 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{dueTopics.length - 2} more</div>}
                {dueTopics.length === 0 && <div style={{ fontSize: 13, color: 'var(--accent-primary)', fontWeight: 500 }}>Queue clear.</div>}
              </div>
            </div>
          </SurfaceCard>
        </Link>

      </div>
    </div>
  );
}
