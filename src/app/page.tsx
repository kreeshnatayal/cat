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

      {/* ── Hero (HUD Status Strip) ── */}
      <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span className="badge badge-active">PHASE {currentPhase.id}: {currentPhase.name}</span>
            <span className="badge">LEVEL {levelInfo.level}</span>
          </div>
          <div className="hud-value" style={{ fontSize: 'clamp(48px, 6vw, 80px)', lineHeight: 1, color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0, 229, 255, 0.2)' }}>
            T-MINUS {daysLeft}
          </div>
          <div className="hud-text" style={{ color: 'var(--text-tertiary)', marginTop: 8 }}>
            DAYS TO ZERO DAY (CAT)
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div className="hud-text" style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>OPERATIVE STATUS</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {levelInfo.name}
          </div>
        </div>
      </div>

      {/* ── Tactical Terminal (AI) ── */}
      <div className="cockpit-panel" style={{ borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
              tactical-ai@cat-os:~#
            </span>
          </div>
          <button
            id="ai-execute-btn"
            className="btn-primary"
            style={{ padding: '4px 12px', fontSize: 10 }}
            onClick={async () => {
              const btn = document.getElementById('ai-execute-btn') as HTMLButtonElement;
              const body = document.getElementById('ai-response-body') as HTMLDivElement;
              if (!btn || !body) return;
              btn.disabled = true;
              btn.textContent = '[ EXECUTING ]';
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
                if (!res.ok || !res.body) { body.textContent = '[SYS_ERR] connection_refused'; return; }
                const reader = res.body.getReader();
                const dec = new TextDecoder();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  body.textContent += dec.decode(value, { stream: true });
                }
              } catch(e: unknown) { body.textContent = `[SYS_ERR] ${e instanceof Error ? e.message : 'Unknown'}`; }
              finally { btn.disabled = false; btn.textContent = '[ EXECUTE ]'; }
            }}
          >
            [ EXECUTE ]
          </button>
        </div>
        <div id="ai-response-body" style={{ padding: '20px 24px', minHeight: 120, fontFamily: 'Geist Mono, monospace', fontSize: 13, color: 'var(--accent-green)', lineHeight: 1.6, whiteSpace: 'pre-wrap', textShadow: '0 0 10px rgba(0, 255, 102, 0.2)' }}>
          {'> System standing by. Awaiting execution order...'}
        </div>
      </div>

      <div className="divider-h" style={{ margin: '8px 0' }} />

      {/* ── Active Directive (Primary Mission) ── */}
      {battle && (
        <SurfaceCard style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: battleColor, flexShrink: 0, boxShadow: `0 0 10px ${battleColor}` }} />
              <div className="hud-text" style={{ color: battleColor }}>
                {isRecovery ? 'CRITICAL SYSTEM OVERRIDE' : 'ACTIVE DIRECTIVE'}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', lineHeight: 1.5, wordBreak: 'break-word', textTransform: 'uppercase' }}>
              {battle.focus}
            </div>
          </div>
          <div style={{ minWidth: 180, maxWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <span className="hud-text">MOMENTUM</span>
              <span className="mono" style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>
                {mvdStreak >= 7 ? 100 : Math.round((mvdStreak / 7) * 100)}%
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${Math.min((mvdStreak / 7) * 100, 100)}%` }}
                style={{ height: '100%', background: battleColor, borderRadius: 2, boxShadow: `0 0 10px ${battleColor}` }}
              />
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* ── 4 System Diagnostics Instruments ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, paddingBottom: 48 }}>

        {/* MVD Protocol */}
        <Link href="/planner" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="hud-text">MVD_PROTOCOL</div>
              <Shield size={14} color={todayEntry?.mvdMet ? 'var(--accent-cyan)' : 'var(--text-tertiary)'} />
            </div>
            <div>
              <div className="hud-value" style={{ color: todayEntry?.mvdMet ? 'var(--accent-cyan)' : 'var(--text-primary)', textShadow: todayEntry?.mvdMet ? '0 0 10px rgba(0,229,255,0.4)' : 'none' }}>
                {todayEntry?.mvdMet ? 'SECURED' : `${todayEntry?.completionPercent || 0}%`}
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, letterSpacing: '0.05em' }}>
                {mvdStreak} DAY STREAK
              </div>
            </div>
          </SurfaceCard>
        </Link>

        {/* Performance Intel */}
        <Link href="/mocks" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="hud-text">RADAR_TELEMETRY</div>
              <Target size={14} color={lastMock ? 'var(--accent-green)' : 'var(--text-tertiary)'} />
            </div>
            {recentMocks.length > 1 && (
              <div style={{ height: 32, marginBottom: 8, marginLeft: -8, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentMocks}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="step" dataKey="percentile" stroke="var(--accent-green)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ marginTop: recentMocks.length > 1 ? 0 : 'auto' }}>
              <div className="hud-value" style={{ color: lastMock ? 'var(--accent-green)' : 'var(--text-primary)', textShadow: lastMock ? '0 0 10px rgba(0,255,102,0.4)' : 'none' }}>
                {lastMock ? `${lastMock.percentile}%ile` : 'N/A'}
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {lastMock ? 'LAST MISSION' : 'NO DATA'}
              </div>
            </div>
          </SurfaceCard>
        </Link>

        {/* Next Level */}
        <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="hud-text">ESCALATION_REQ</div>
            <Zap size={14} color="var(--accent-amber)" />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-amber)', letterSpacing: '0.02em', lineHeight: 1.4, marginBottom: 8, textTransform: 'uppercase' }}>
              {levelInfo.level === 4 ? 'MAX LEVEL SECURED' : levelInfo.req}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              CURRENT_LVL: <span style={{ color: 'var(--text-primary)' }}>{levelInfo.level}</span>
            </div>
          </div>
        </SurfaceCard>

        {/* Revision Queue */}
        <Link href="/revision" style={{ textDecoration: 'none' }}>
          <SurfaceCard style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', minHeight: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="hud-text">TARGET_LOCKS</div>
              <BookOpen size={14} color={dueTopics.length > 0 ? 'var(--accent-rose)' : 'var(--text-tertiary)'} />
            </div>
            <div>
              <div className="hud-value" style={{ color: dueTopics.length > 0 ? 'var(--accent-rose)' : 'var(--text-primary)', textShadow: dueTopics.length > 0 ? '0 0 10px rgba(255,51,102,0.4)' : 'none', marginBottom: 8 }}>
                {dueTopics.length} <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em' }}>DUE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dueTopics.slice(0, 2).map(t => (
                  <div key={t.id} style={{ fontSize: 10, fontFamily: 'Geist Mono, monospace', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div style={{ width: 4, height: 4, background: 'var(--accent-rose)', flexShrink: 0, boxShadow: '0 0 5px var(--accent-rose)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </div>
                ))}
                {dueTopics.length > 2 && <div style={{ fontSize: 10, fontFamily: 'Geist Mono, monospace', color: 'var(--text-tertiary)' }}>+ {dueTopics.length - 2} MORE</div>}
                {dueTopics.length === 0 && <div style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', color: 'var(--text-secondary)' }}>QUEUE CLEAR</div>}
              </div>
            </div>
          </SurfaceCard>
        </Link>

      </div>
    </div>
  );
}
