'use client';

import { useEffect } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CAT OS Error Caught:', error);
  }, [error]);

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="surface-card" 
        style={{ padding: 40, maxWidth: 500, width: '100%', textAlign: 'center', border: '1px solid var(--accent-rose)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ padding: 16, borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)' }}>
            <ShieldAlert size={40} />
          </div>
        </div>
        
        <h1 className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase' }}>
          System Failure
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          A critical rendering error occurred in the UI thread. The OS has isolated the failure to prevent further corruption.
        </div>

        <div style={{ background: 'var(--bg-base)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 32, textAlign: 'left', overflowX: 'auto' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-rose)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Error Trace
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
            {error.message || 'Unknown runtime error'}
          </div>
        </div>

        <button 
          onClick={() => reset()} 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8, 
            padding: '12px 24px', borderRadius: 8, 
            background: 'var(--accent-rose)', color: 'var(--bg-base)', 
            border: 'none', cursor: 'pointer', 
            fontSize: 14, fontWeight: 600 
          }}
        >
          <RotateCcw size={16} /> Attempt Recovery
        </button>
      </motion.div>
    </div>
  );
}
