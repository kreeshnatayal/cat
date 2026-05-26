'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, FlaskConical,
  BarChart3, BookOpen, Settings, Zap, Route,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
        width: 220,
        height: '100vh',
        background: 'var(--bg-surface)',
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
          height: 72,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 10,
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-purple) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 16px var(--accent-primary-glow)',
          }}
        >
          <Zap size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
            CAT OS
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
            v2.0
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon
                size={15}
                style={{
                  flexShrink: 0,
                  color: active ? 'var(--accent-primary)' : 'inherit',
                }}
              />
              <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{label}</span>
              {active && (
                <motion.div
                  layoutId="sidebar-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 10,
                    background: 'rgba(99, 153, 255, 0.08)',
                    border: '1px solid rgba(99, 153, 255, 0.18)',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        {streak > 0 ? (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(251, 191, 36, 0.06)',
              border: '1px solid rgba(251, 191, 36, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>🔥</span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--accent-amber)', fontWeight: 700 }}>
                {streak} Day Streak
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Don't break the chain</div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>⚡</span>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Start your first streak</div>
          </div>
        )}
      </div>
    </aside>
  );
}
