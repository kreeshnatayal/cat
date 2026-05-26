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
    <aside className="panel" style={{ width: 'var(--sidebar-width)', height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 10 }}>
      {/* ── Logo ── */}
      <div style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, borderBottom: '1px solid var(--border-dim)', flexShrink: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Terminal size={12} color="var(--bg-app)" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          CAT OS
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <div className="text-label" style={{ paddingLeft: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Overview</div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon
                size={14}
                strokeWidth={active ? 2.5 : 2}
                style={{
                  flexShrink: 0,
                  color: active ? 'var(--text-primary)' : 'inherit',
                }}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-dim)' }}>
        <div className="text-label" style={{ marginBottom: 8 }}>Current Momentum</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: streak > 0 ? 'var(--accent-green)' : 'var(--border-default)' }} />
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {streak > 0 ? `${streak} Day Streak` : 'No Active Streak'}
          </div>
        </div>
      </div>
    </aside>
  );
}
