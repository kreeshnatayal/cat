'use client';

import { CheckCircle2, Circle } from 'lucide-react';

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
    <div
      style={{
        background: 'var(--bg-base)',
        border: `1px solid ${isComplete ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Completion Icon */}
      <div style={{ flexShrink: 0, marginTop: 2, color: isComplete ? 'var(--text-primary)' : 'var(--border-strong)' }}>
        {isComplete ? <CheckCircle2 size={18} strokeWidth={2} /> : <Circle size={18} strokeWidth={2} />}
      </div>

      {/* Text Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: isComplete ? 'var(--text-secondary)' : 'var(--text-primary)',
          textDecoration: isComplete ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title}
          {isOptional && (
            <span className="tag" style={{ marginLeft: 8 }}>Optional</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subtitle}
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          className="mono"
          min={0}
          style={{
            width: 54,
            padding: '4px 8px',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 500,
          }}
        />
        {unit && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
