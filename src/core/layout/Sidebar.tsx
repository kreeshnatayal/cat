'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, FlaskConical,
  BarChart3, BookOpen, Settings, Terminal, Route,
} from 'lucide-react';
import { usePlannerStore } from '@/features/planner/store';

const NAV_ITEMS = [
  { href: '/',          label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/roadmap',   label: 'Roadmap',        icon: Route },
  { href: '/planner',   label: 'Daily Planner',  icon: CalendarDays },
  { href: '/mocks',     label: 'Mock Lab',        icon: FlaskConical },
  { href: '/analytics', label: 'Analytics',      icon: BarChart3 },
  { href: '/revision',  label: 'Revision',        icon: BookOpen },
  { href: '/settings',  label: 'Settings',        icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const streak   = usePlannerStore((s) => s.getStreak());

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--bg-base)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 12,
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Terminal size={14} color="var(--bg-base)" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            CAT OS
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <div className="section-label" style={{ paddingLeft: 8, marginBottom: 8 }}>Overview</div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon
                size={16}
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
      <div style={{ padding: '24px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>
          Current Momentum
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: streak > 0 ? 'var(--accent-green)' : 'var(--border-strong)' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {streak > 0 ? `${streak} Day Streak` : 'No Active Streak'}
          </div>
        </div>
      </div>
    </aside>
  );
}
