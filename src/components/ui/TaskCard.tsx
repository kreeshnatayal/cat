'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
  title: string;
  subtitle: string;
  color: string;
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
  type?: string;
  unit?: string;
  isOptional?: boolean;
}

export function TaskCard({
  title, subtitle, color, value, onChange, placeholder, type = 'number', unit = '', isOptional = false
}: TaskCardProps) {
  const numVal    = Number(value);
  const isComplete = numVal > 0;

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-elevated)',
        border: `1px solid ${isComplete ? `${color}30` : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: 'default',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        boxShadow: isComplete
          ? `0 4px 24px -8px ${color}25, 0 0 0 1px ${color}15 inset`
          : '0 2px 12px -4px rgba(0,0,0,0.3)',
      }}
    >
      {/* Accent left bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: 3,
          borderRadius: '0 3px 3px 0',
          background: isComplete ? color : 'var(--border-subtle)',
          transition: 'background 0.25s ease',
        }}
      />

      {/* Glow wash */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(110deg, ${color}0A 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Completion dot */}
      <div style={{ flexShrink: 0, color: isComplete ? color : 'var(--border-default)', transition: 'color 0.2s' }}>
        <CheckCircle2 size={18} strokeWidth={isComplete ? 2.5 : 1.5} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: isComplete ? 'var(--text-primary)' : 'var(--text-secondary)',
          transition: 'color 0.2s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title}
          {isOptional && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              optional
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subtitle}
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexShrink: 0 }}>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          className="mono"
          min={0}
          style={{
            width: 64,
            background: 'transparent !important' as any,
            border: 'none !important' as any,
            borderBottom: `2px solid ${isComplete ? color : 'var(--border-default)'} !important` as any,
            color: isComplete ? color : 'var(--text-primary)',
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center',
            padding: '2px 0',
            outline: 'none',
            borderRadius: '0 !important' as any,
            boxShadow: 'none !important' as any,
            transition: 'border-color 0.2s ease, color 0.2s ease',
          }}
        />
        {unit && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
}
