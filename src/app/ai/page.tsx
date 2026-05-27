'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/features/planner/store';
import { useMockStore } from '@/features/mocks/store';
import { useRevisionStore, isDue } from '@/features/revision/store';
import { useRoadmapStore, getCurrentPhase } from '@/features/roadmap/store';
import { computeLevel } from '@/core/store/systemStore';

export default function AIPage() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const streak = usePlannerStore(s => s.getStreak());
  const mvdCount = usePlannerStore(s => s.getMVDCount());
  const mocks = useMockStore(s => s.mocks);
  const bestPercentile = useMockStore(s => s.getBestPercentile());
  const topics = useRevisionStore(s => s.topics);
  const dueCount = topics.filter(isDue).length;
  const phaseOverride = useRoadmapStore(s => s.manualPhaseOverride);
  const phase = getCurrentPhase(phaseOverride);
  const level = computeLevel(mvdCount, mocks.length, bestPercentile);
  const recentMocks = [...mocks].sort((a, b) => a.date.localeCompare(b.date)).slice(-3);

  const run = async (prompt: string) => {
    if (loading) return;
    setLoading(true);
    setOutput('');

    const system = `You are the CAT OS Tactical AI. You are a brutal, highly analytical, extremely direct strategic coach for a student preparing for CAT (Common Admission Test for IIMs). Do NOT be polite. Do NOT use emojis. Military-style sentences only. Under 150 words. Use line breaks.

USER STATUS:
- Phase: ${phase.name}
- Level: ${level.level} (${level.name})
- Streak: ${streak} days
- Due Revisions: ${dueCount} topics
- Recent Mocks: ${JSON.stringify(recentMocks)}
- Total MVDs: ${mvdCount}`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] })
      });

      if (!res.body) { setOutput('[ERROR] No response body.'); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput(p => p + dec.decode(value, { stream: true }));
      }
    } catch (e: unknown) {
      setOutput(`[ERROR] ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { label: 'Daily Briefing', prompt: 'Give me my daily tactical briefing based on my current status.' },
    { label: 'Mock Analysis', prompt: 'Analyse my recent mock test performance. Identify weaknesses. Give me a drill plan.' },
    { label: 'Burn Check', prompt: 'Check if I am burning out. Give me an honest assessment and recovery protocol.' },
    { label: 'Push Harder', prompt: 'I am doing okay. Tell me exactly how to push harder and reach the next level.' },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 48, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="hud-text" style={{ marginBottom: 12 }}>INTELLIGENCE_ENGINE</div>
          <h1 className="mono" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1, textTransform: 'uppercase', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
            TACTICAL_AI
          </h1>
          <p className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 16, textTransform: 'uppercase' }}>
            RUNNING <span style={{ color: 'var(--accent-cyan)' }}>GPT-OSS-120B</span>. NO_SUGAR_COATING.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {actions.map(a => (
          <button
            key={a.label}
            onClick={() => run(a.prompt)}
            disabled={loading}
            className="btn-ghost"
            style={{
              padding: '10px 20px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            [ {a.label.toUpperCase()} ]
          </button>
        ))}
      </div>

      {/* Output Terminal */}
      <div className="cockpit-panel" style={{
        overflow: 'hidden',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Terminal chrome */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 24px',
          background: 'rgba(0,0,0,0.6)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, background: 'var(--accent-rose)', boxShadow: '0 0 10px var(--accent-rose)' }} />
            <div style={{ width: 10, height: 10, background: 'var(--accent-amber)' }} />
            <div style={{ width: 10, height: 10, background: 'var(--accent-green)' }} />
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
            {loading ? 'PROCESSING...' : 'ROOT@CAT-OS:/VAR/LOG/TACTICAL_AI'}
          </span>
        </div>

        {/* Output */}
        <pre className="mono" style={{
          padding: '24px',
          margin: 0,
          fontSize: 13,
          lineHeight: 1.8,
          color: output ? 'var(--accent-cyan)' : 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flex: 1,
          textTransform: 'uppercase'
        }}>
          {loading && !output ? '> CONNECTING_TO_INTELLIGENCE_ENGINE...\n' : ''}
          {output || '> SELECT_A_COMMAND_ABOVE_TO_BEGIN.'}
          {loading && <span style={{ opacity: 0.5 }}>_</span>}
        </pre>
      </div>

      {/* Context panel */}
      <div className="cockpit-panel" style={{ padding: '32px' }}>
        <div className="hud-text" style={{ marginBottom: 24, color: 'var(--accent-cyan)' }}>PAYLOAD_CONTEXT</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 32 }}>
          {[
            ['PHASE', phase.name],
            ['LEVEL', String(level.level)],
            ['STREAK', `${streak} DAYS`],
            ['DUE_REV', String(dueCount)],
            ['MOCKS_LOGGED', String(mocks.length)],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="hud-text" style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>{k}</div>
              <div className="hud-value" style={{ fontSize: 20 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
