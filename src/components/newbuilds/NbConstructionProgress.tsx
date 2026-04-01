import React from 'react';

interface Props {
  progress: number; // 0-100
  completionDate?: string | null;
  size?: 'sm' | 'md';
}

export function NbConstructionProgress({ progress, completionDate, size = 'md' }: Props) {
  const h = size === 'sm' ? 'h-1' : 'h-1.5';
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="nb-mono text-xs" style={{ color: 'hsl(var(--nb-gold))' }}>
          {progress}%
        </span>
        {completionDate && (
          <span className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
            Сдача: {new Date(completionDate).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
      <div className={`nb-progress-track ${h}`}>
        <div className="nb-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </div>
  );
}
