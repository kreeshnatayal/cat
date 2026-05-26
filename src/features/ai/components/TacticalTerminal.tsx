'use client';

import { useState } from 'react';
import { Terminal as TerminalIcon, Loader2 } from 'lucide-react';
import { usePlannerStore } from '@/features/planner/store';
import { useMockStore } from '@/features/mocks/store';
import { useRevisionStore, isDue } from '@/features/revision/store';
import { useRoadmapStore, getCurrentPhase } from '@/features/roadmap/store';
import { computeLevel } from '@/core/store/systemStore';

export function TacticalTerminal() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Grab all context invisibly
  const streak = usePlannerStore(s => s.getStreak());
  const mvdCount = usePlannerStore(s => s.getMVDCount());
  const mocks = useMockStore(s => s.mocks);
  const bestPercentile = useMockStore(s => s.getBestPercentile());
  const topics = useRevisionStore(s => s.topics);
  const dueTopics = topics.filter(isDue);
  const phaseOverride = useRoadmapStore(s => s.manualPhaseOverride);
  const currentPhase = getCurrentPhase(phaseOverride);
  const levelInfo = computeLevel(mvdCount, mocks.length, bestPercentile);

  const generateBriefing = async () => {
    if (loading) return;
    setLoading(true);
    setResponse('');

    const contextData = {
      streak,
      mvdCount,
      level: levelInfo.level,
      phase: currentPhase.name,
      recentMocks: mocks.slice(-3),
      dueRevisionsCount: dueTopics.length,
    };

    const systemPrompt = `You are the CAT OS Tactical AI. You are a brutal, highly analytical, extremely direct strategic coach for a student preparing for the CAT (Common Admission Test for IIMs).
Do NOT be polite. Do NOT use emojis. Do NOT sound like ChatGPT. Use short, punchy, military-style sentences.

USER STATUS:
- Current Phase: ${contextData.phase}
- OS Level: ${contextData.level}
- Consistency Streak: ${contextData.streak} days
- Revisions Due: ${contextData.dueRevisionsCount} topics
- Recent Mocks: ${JSON.stringify(contextData.recentMocks)}

If their streak is 0, rip into them for being inconsistent.
If they have many due revisions, order them to clear the queue.
If their mock scores are dropping, identify the weak section and demand a fix.
If they are doing great, tell them to push harder.
Keep it under 150 words. Format with line breaks for readability.`;

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
        setResponse(`[ERROR]: ${err.error || 'Failed to connect to Groq neural net.'}`);
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
    } catch (e: any) {
      setResponse(`[FATAL ERROR]: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Terminal Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TerminalIcon size={14} color="var(--accent-primary)" />
          <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            INTELLIGENCE ENGINE // gpt-oss-120b
          </span>
        </div>
        <button 
          onClick={generateBriefing}
          disabled={loading}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)',
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Execute'}
        </button>
      </div>

      {/* Terminal Body */}
      <div className="mono" style={{
        padding: '20px 24px',
        minHeight: 120,
        fontSize: 13,
        color: response ? 'var(--text-primary)' : 'var(--text-muted)',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {response || '> System standing by. Click EXECUTE to generate daily tactical briefing.'}
        {loading && <span style={{ animation: 'pulse 1s infinite' }}>_</span>}
      </div>
    </div>
  );
}
