'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, FlaskConical,
  BarChart3, BookOpen, Settings, Terminal, Route, Brain,
} from 'lucide-react';
import { usePlannerStore } from '@/features/planner/store';

const NAV_ITEMS = [
  { href: '/',          label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/roadmap',   label: 'Roadmap',        icon: Route },
  { href: '/planner',   label: 'Daily Planner',  icon: CalendarDays },
  { href: '/mocks',     label: 'Mock Lab',        icon: FlaskConical },
  { href: '/analytics', label: 'Analytics',      icon: BarChart3 },
  { href: '/revision',  label: 'Revision',        icon: BookOpen },
  { href: '/ai',        label: 'Tactical AI',     icon: Brain },
  { href: '/settings',  label: 'Settings',        icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const streak   = usePlannerStore((s) => s.getStreak());

  return (
    <aside className="cockpit-panel" style={{ width: 'var(--sidebar-width)', height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 10 }}>
      {/* ── Logo ── */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(0, 229, 255, 0.4)' }}>
          <Terminal size={14} color="var(--bg-app)" strokeWidth={3} />
        </div>
        <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
          CAT_OS<span style={{ color: 'var(--accent-cyan)' }}>_</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <div className="hud-text" style={{ paddingLeft: 12, marginBottom: 12, opacity: 0.7 }}>System Modules</div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon
                size={16}
                strokeWidth={active ? 2.5 : 2}
                style={{
                  flexShrink: 0,
                  color: active ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
                  transition: 'color 0.2s',
                }}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ padding: '24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="hud-text" style={{ marginBottom: 12, opacity: 0.7 }}>Momentum Core</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 8, height: 8, borderRadius: '50%', 
            background: streak > 0 ? 'var(--accent-green)' : 'var(--border-strong)',
            boxShadow: streak > 0 ? '0 0 10px var(--accent-green)' : 'none'
          }} />
          <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: streak > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
            {streak > 0 ? `${streak} DAY STREAK` : 'NO ACTIVE STREAK'}
          </div>
        </div>
      </div>
    </aside>
  );
}
