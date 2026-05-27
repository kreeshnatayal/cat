'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FlaskConical, Brain, Settings, Terminal } from 'lucide-react';
import { usePlannerStore } from '@/features/planner/store';

const NAV_ITEMS = [
  { href: '/',       label: 'Today',    icon: LayoutDashboard, hint: 'MISSION CTRL' },
  { href: '/mocks',  label: 'Mocks',    icon: FlaskConical,    hint: 'RADAR LAB'    },
  { href: '/intel',  label: 'Intel',    icon: Brain,           hint: 'INTELLIGENCE' },
  { href: '/settings', label: 'Settings', icon: Settings,      hint: 'CONFIG'       },
];

export function Sidebar() {
  const pathname = usePathname();
  const streak   = usePlannerStore((s) => s.getStreak());

  return (
    <aside className="cockpit-panel" style={{ width: 'var(--sidebar-width)', height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 10 }}>
      {/* ── Logo ── */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(0, 229, 255, 0.5)' }}>
          <Terminal size={14} color="var(--bg-app)" strokeWidth={3} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.08em', lineHeight: 1 }}>
            CAT<span style={{ color: 'var(--accent-cyan)' }}>_OS</span>
          </div>
          <div className="hud-text" style={{ color: 'var(--text-tertiary)', fontSize: 9, marginTop: 2 }}>
            v2.0 · ASPIRANT COCKPIT
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="hud-text" style={{ paddingLeft: 10, marginBottom: 10, opacity: 0.5, fontSize: 9 }}>CORE MODULES</div>
        {NAV_ITEMS.map(({ href, label, icon: Icon, hint }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={15} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0, color: active ? 'var(--accent-cyan)' : 'var(--text-tertiary)', transition: 'color 0.2s' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12 }}>{label}</div>
                {active && (
                  <div className="hud-text" style={{ fontSize: 8, color: 'var(--accent-cyan)', opacity: 0.7, marginTop: 1 }}>
                    {hint}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom: Streak ── */}
      <div style={{ padding: '20px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="hud-text" style={{ marginBottom: 8, opacity: 0.5, fontSize: 9 }}>MOMENTUM CORE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: streak > 0 ? 'var(--accent-green)' : 'var(--border-strong)',
            boxShadow: streak > 0 ? '0 0 12px var(--accent-green)' : 'none',
            flexShrink: 0,
          }} />
          <div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: streak > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)', lineHeight: 1 }}>
              {streak > 0 ? `${streak}` : '0'}
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 4 }}>DAY STREAK</span>
            </div>
            {streak === 0 && (
              <div className="hud-text" style={{ color: 'var(--accent-rose)', fontSize: 9, marginTop: 3 }}>
                STREAK BROKEN — RESPOND
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
