'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Your CAT prep at a glance' },
  '/planner': { title: 'Daily Planner', subtitle: 'Log today\'s study session' },
  '/mocks': { title: 'Mock Analysis Lab', subtitle: 'Track and analyze your tests' },
  '/analytics': { title: 'Analytics', subtitle: 'Visualize your progress' },
  '/revision': { title: 'Revision Engine', subtitle: 'Spaced repetition for mastery' },
  '/settings': { title: 'Settings', subtitle: 'Configure your CAT OS' },
};

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const page = PAGE_TITLES[pathname] ?? { title: 'CAT OS', subtitle: '' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header
      style={{
        height: '56px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(8,8,16,0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 14,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}
    >
      <button
        onClick={onMenuClick}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          borderRadius: 6,
          transition: 'color 0.15s',
        }}
      >
        <Menu size={18} />
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {page.title}
          </h1>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{page.subtitle}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="pulse-dot" style={{ backgroundColor: '#10b981', color: '#10b981' }} />
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {dateStr}
          </span>
        </div>
      </div>
    </header>
  );
}
