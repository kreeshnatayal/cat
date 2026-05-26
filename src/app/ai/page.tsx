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
    <div className="page-container">
      <div style={{ marginBottom: 32 }}>
        <div className="section-label" style={{ marginBottom: 8 }}>INTELLIGENCE ENGINE</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Tactical AI</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Running <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>gpt-oss-120b</span> via Groq. 
          Reads your live data. No sugar-coating.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {actions.map(a => (
          <button
            key={a.label}
            onClick={() => run(a.prompt)}
            disabled={loading}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent-primary)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-default)'; }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Output Terminal */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 300,
      }}>
        {/* Terminal chrome */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3F3F46' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3F3F46' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3F3F46' }} />
          <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {loading ? 'PROCESSING...' : 'cat-os / tactical-ai'}
          </span>
        </div>

        {/* Output */}
        <pre style={{
          padding: '24px',
          margin: 0,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.8,
          color: output ? 'var(--text-primary)' : 'var(--text-muted)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          minHeight: 250,
        }}>
          {loading && !output ? '> Connecting to intelligence engine...\n' : ''}
          {output || '> Select a command above to begin.'}
          {loading && <span style={{ opacity: 0.5 }}>▌</span>}
        </pre>
      </div>

      {/* Context panel */}
      <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Context Being Sent to AI</div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[
            ['Phase', phase.name],
            ['Level', String(level.level)],
            ['Streak', `${streak} days`],
            ['Due Revisions', String(dueCount)],
            ['Mocks Taken', String(mocks.length)],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
