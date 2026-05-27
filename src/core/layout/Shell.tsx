'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { StoreHydrator } from '@/core/store/StoreHydrator';
import { useRoadmapStore, getCurrentPhase } from '@/features/roadmap/store';

/**
 * Loading skeleton shown during SSR / before client hydration.
 * Prevents any Zustand store access during server-side rendering,
 * which eliminates the "getServerSnapshot should be cached" error.
 */
function AppSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--bg-base)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Sidebar skeleton */}
      <div
        style={{
          width: 224,
          height: '100vh',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      />
      {/* Main skeleton */}
      <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 56, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid var(--border-default)',
                borderTopColor: 'var(--accent-primary)',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading CAT OS…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const manualPhaseOverride = useRoadmapStore((s) => s.manualPhaseOverride);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Seasonal UI effect
  useEffect(() => {
    if (!mounted) return;
    const phase = getCurrentPhase(manualPhaseOverride);
    document.body.className = `phase-${phase.id}`;
  }, [mounted, manualPhaseOverride]);

  if (!mounted) return <AppSkeleton />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)', position: 'relative' }}>
      <StoreHydrator />
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1, position: 'relative' }}>
        <div className="scan-line" />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ minHeight: '100%', padding: '40px 60px', maxWidth: 1400, margin: '0 auto' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
