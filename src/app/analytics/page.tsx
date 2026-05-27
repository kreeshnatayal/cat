'use client';

import { useMemo } from 'react';
import { usePlannerStore } from '@/features/planner/store';
import { useMockStore } from '@/features/mocks/store';
import { SECTION_COLORS } from '@/core/utils/constants';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="cockpit-panel" style={{ padding: '12px 16px', fontSize: 11, border: '1px solid var(--accent-cyan)' }}>
      <div className="hud-text" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>[ {label} ]</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color ?? 'var(--text-primary)', display: 'flex', gap: 16, justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="mono" style={{ textTransform: 'uppercase' }}>{p.name}</span>
          <span className="hud-value" style={{ fontSize: 14 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const entries = usePlannerStore((s) => s.entries);
  const mvdCount = usePlannerStore((s) => s.getMVDCount());
  const streak = usePlannerStore((s) => s.getStreak());
  const longestStreak = usePlannerStore((s) => s.getLongestStreak());
  
  const mocks = useMockStore((s) => s.mocks);
  const bestPercentile = useMockStore((s) => s.getBestPercentile());

  const last30Days = useMemo(() =>
    eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const entry = entries.find((e) => e.date === key);
      return { date: format(d, 'MMM d'), percent: entry?.completionPercent ?? 0, met: entry?.mvdMet ? 1 : 0 };
    })
  , [entries]);

  const weeklyData = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => {
      const weekStart = subDays(new Date(), (7 - i) * 7 + 7);
      const weekEnd = subDays(new Date(), (7 - i - 1) * 7);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const totalMet = days.reduce((sum, d) => {
        const key = format(d, 'yyyy-MM-dd');
        const entry = entries.find((e) => e.date === key);
        return sum + (entry?.mvdMet ? 1 : 0);
      }, 0);
      return { week: `W${i + 1}`, mvds: totalMet };
    })
  , [entries]);

  const sectionRadar = useMemo(() =>
    ['QA', 'DILR', 'VARC'].map((s) => {
      const section = s as 'QA' | 'DILR' | 'VARC';
      const avgScore = mocks.length > 0
        ? mocks.reduce((sum, m) => sum + m.sections[section].netScore, 0) / mocks.length
        : 0;
      const avgAccuracy = mocks.length > 0
        ? mocks.reduce((sum, m) => {
            const acc = m.sections[section].attempted > 0
              ? (m.sections[section].correct / m.sections[section].attempted) * 100
              : 0;
            return sum + acc;
          }, 0) / mocks.length
        : 0;
      return { subject: s, 'Avg Score': Math.round(avgScore * 10) / 10, 'Accuracy %': Math.round(avgAccuracy) };
    })
  , [mocks]);

  const weeks = useMemo(() => {
    const heatmapDays = eachDayOfInterval({ start: subDays(new Date(), 69), end: new Date() });
    const result: Date[][] = [];
    let currentWeek: Date[] = [];
    heatmapDays.forEach((d, i) => {
      currentWeek.push(d);
      if (currentWeek.length === 7 || i === heatmapDays.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    return result;
  }, []);

  const getHeatColor = (percent: number, met: boolean) => {
    if (percent === 0) return 'var(--border-subtle)';
    if (met) return 'var(--accent-green)';
    if (percent < 50) return 'rgba(99, 153, 255, 0.2)'; 
    if (percent < 100) return 'rgba(99, 153, 255, 0.6)';
    return 'var(--accent-primary)';
  };

  const statsRow = [
    { label: 'TOTAL_MVDS', value: mvdCount, color: 'var(--accent-cyan)' },
    { label: 'MOCKS_LOGGED', value: mocks.length, color: 'var(--accent-cyan)' },
    { label: 'ALL-TIME_HIGH', value: `${bestPercentile}%ILE`, color: 'var(--accent-green)' },
    { label: 'CURRENT_STREAK', value: `${streak}D`, color: 'var(--accent-amber)' },
    { label: 'MAX_STREAK', value: `${longestStreak}D`, color: 'var(--accent-rose)' },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="hud-text" style={{ marginBottom: 12 }}>SYSTEM_ANALYTICS</div>
          <h1 className="mono" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1, textTransform: 'uppercase', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
            DATA_INTELLIGENCE
          </h1>
        </div>
      </div>

      {/* ── Stats Summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
        {statsRow.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="cockpit-panel" style={{ padding: '24px', borderTop: `2px solid ${s.color}` }}>
            <div className="hud-value" style={{ color: s.color }}>{s.value}</div>
            <div className="hud-text" style={{ marginTop: 12, color: 'var(--text-secondary)' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* ── MVD Percent Area Chart ── */}
        <motion.div className="cockpit-panel" style={{ padding: '32px 32px 24px', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="hud-text" style={{ marginBottom: 32 }}>MVD_FULFILLMENT_30D</div>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last30Days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad30" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,229,255,0.1)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace', textAnchor: 'middle' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent-cyan)', strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="percent" stroke="var(--accent-cyan)" strokeWidth={2} fill="url(#grad30)" name="FULFILLMENT_PCT" activeDot={{ r: 4, fill: 'var(--bg-base)', stroke: 'var(--accent-cyan)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Weekly MVDs ── */}
        <motion.div className="cockpit-panel" style={{ padding: '32px 32px 24px', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="hud-text" style={{ marginBottom: 32 }}>WEEKLY_MVD_CONSISTENCY</div>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,255,102,0.1)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 7]} tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,255,102,0.1)' }} />
                <Bar dataKey="mvds" fill="var(--accent-green)" name="MVDS_ACHIEVED" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* ── Section Radar ── */}
        <motion.div className="cockpit-panel" style={{ padding: '32px 32px 24px', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="hud-text" style={{ marginBottom: 16 }}>SECTION_RADAR</div>
          {mocks.length > 0 ? (
            <div style={{ flex: 1, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={sectionRadar} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="rgba(0,229,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace' }} />
                  <Radar name="AVG_SCORE" dataKey="Avg Score" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.1} strokeWidth={1.5} />
                  <Radar name="ACCURACY_PCT" dataKey="Accuracy %" stroke="var(--accent-amber)" fill="var(--accent-amber)" fillOpacity={0.1} strokeWidth={1.5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Geist Mono, monospace', color: 'var(--text-secondary)', paddingTop: 20 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mono" style={{ flex: 1, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 12, textTransform: 'uppercase' }}>
              [ NO_INTELLIGENCE_LOGGED ]
            </div>
          )}
        </motion.div>

        {/* ── Consistency Heatmap ── */}
        <motion.div className="cockpit-panel" style={{ padding: '32px 32px 24px', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="hud-text" style={{ marginBottom: 32 }}>MVD_HEATMAP</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 24 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {week.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const entry = entries.find((e) => e.date === key);
                    const percent = entry?.completionPercent ?? 0;
                    const met = entry?.mvdMet ?? false;
                    return (
                      <div
                        key={key}
                        title={`${format(day, 'MMM d')}: ${met ? 'MVD Achieved' : `${percent}%`}`}
                        style={{
                          width: 16, height: 16, borderRadius: 4,
                          background: getHeatColor(percent, met),
                          transition: 'transform 0.15s',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLDivElement).style.transform = 'scale(1.2)'; }}
                        onMouseLeave={(e) => { (e.target as HTMLDivElement).style.transform = 'scale(1)'; }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 'auto', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>0%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(99, 153, 255, 0.2)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>&lt;50%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(99, 153, 255, 0.6)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>&lt;100%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--accent-green)' }} />
                <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 700 }}>MVD Met</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Shadow Analytics Engine ── */}
      <motion.div className="cockpit-panel" style={{ padding: '48px', border: '1px solid rgba(255,51,102,0.4)', position: 'relative', overflow: 'hidden' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,51,102,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, background: 'var(--accent-rose)', boxShadow: '0 0 16px var(--accent-rose)' }} />
            <h2 className="mono" style={{ fontSize: 24, fontWeight: 700, textTransform: 'uppercase', margin: 0, color: 'var(--accent-rose)' }}>SHADOW_SYSTEM</h2>
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 680, lineHeight: 1.6, textTransform: 'uppercase' }}>
            THIS_SYSTEM_PASSIVELY_TRACKS_BEHAVIORAL_AVOIDANCE_AND_FRICTION_LOOPS. TRUTH_IS_MANDATORY.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
            {(() => {
              // Shadow Logic
              const daysSinceMock = mocks.length > 0 
                ? Math.floor((Date.now() - new Date(mocks[mocks.length - 1].date).getTime()) / 86400000)
                : 999;
              
              const recentAvoidance = entries.slice(0, 14).filter(e => e.pmHours > 2 && e.mvdMet === false).length;
              const frictionLogs = entries.filter(e => e.frictionSource).length;

              return (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="hud-text">MOCK_AVOIDANCE</div>
                    <div className="hud-value" style={{ color: daysSinceMock > 14 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                      {daysSinceMock === 999 ? 'NO_MOCKS' : `${daysSinceMock} DAYS`}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: daysSinceMock > 14 ? 'var(--accent-rose)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {daysSinceMock > 14 ? 'HIGH_RISK : YOU_ARE_AVOIDING_REALITY' : 'ACCEPTABLE_RANGE'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="hud-text">MASKED_PROCRASTINATION</div>
                    <div className="hud-value" style={{ color: recentAvoidance > 2 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
                      {recentAvoidance} EVENTS
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: recentAvoidance > 2 ? 'var(--accent-amber)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      MVD_FAILED_WHILE_PM_WORK_SPIKED
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="hud-text">FRICTION_JOURNALS</div>
                    <div className="hud-value" style={{ color: 'var(--accent-cyan)' }}>
                      {frictionLogs} LOGS
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      QUALITATIVE_FRICTION_EVENTS_ANALYZED
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
