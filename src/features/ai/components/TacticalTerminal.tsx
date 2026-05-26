'use client';

import { useState } from 'react';
import { Terminal as TerminalIcon, Loader2 } from 'lucide-react';

interface Props {
  streak: number;
  mvdCount: number;
  level: number;
  phase: string;
  dueRevisionsCount: number;
  recentMocks: unknown[];
}

export function TacticalTerminal({ streak, mvdCount, level, phase, dueRevisionsCount, recentMocks }: Props) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const generateBriefing = async () => {
    if (loading) return;
    setLoading(true);
    setResponse('');

    const systemPrompt = `You are the CAT OS Tactical AI — a brutal, highly analytical, extremely direct strategic coach for a student preparing for CAT (Common Admission Test for IIMs).
Do NOT be polite. Do NOT use emojis. Do NOT sound like ChatGPT. Use short, punchy sentences.

USER STATUS:
- Current Phase: ${phase}
- OS Level: ${level}
- Consistency Streak: ${streak} days
- Revisions Due: ${dueRevisionsCount} topics
- Total MVDs Completed: ${mvdCount}
- Recent Mocks: ${JSON.stringify(recentMocks)}

If streak is 0, rip into them for inconsistency.
If many revisions are due, order them to clear the queue.
If mock scores are dropping, identify the weak section and demand a fix.
If doing great, push harder.
Keep under 150 words. Use line breaks.`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Give me my daily tactical briefing.' }
          ]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        setResponse(`[ERROR]: ${err.error || 'Failed to reach intelligence engine.'}`);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setResponse(prev => prev + text);
      }
    } catch (e: unknown) {
      setResponse(`[FATAL ERROR]: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#0D0D0D',
      border: '1px solid #27272A',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#111111',
        borderBottom: '1px solid #27272A',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TerminalIcon size={13} color="#5E6AD2" />
          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#71717A', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Intelligence Engine · gpt-oss-120b
          </span>
        </div>
        <button
          onClick={generateBriefing}
          disabled={loading}
          style={{
            background: 'transparent',
            border: '1px solid #3F3F46',
            color: '#FAFAFA',
            padding: '4px 14px',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Processing</> : 'Execute'}
        </button>
      </div>

      {/* Body */}
      <div style={{
        padding: '18px 20px',
        minHeight: 100,
        fontFamily: 'monospace',
        fontSize: 13,
        color: response ? '#FAFAFA' : '#52525B',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
      }}>
        {response || '> System standing by. Click EXECUTE to generate tactical briefing.'}
        {loading && <span style={{ opacity: 0.6 }}>▌</span>}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
