/**
 * AppTile — single superapp mini-app icon. Civic DS 2.1 tokens, sharp corners.
 * Touch-target ≥64×80, icon 26px, 2-line label.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppTileProps {
  to: string;
  icon: LucideIcon;
  label: string;
  caption?: string;
  status?: 'available' | 'soon' | 'pro' | 'info';
  external?: boolean;
}

export const AppTile: React.FC<AppTileProps> = ({
  to,
  icon: Icon,
  label,
  caption,
  status = 'available',
  external,
}) => {
  const isSoon = status === 'soon';
  const isPro = status === 'pro';

  const inner = (
    <>
      <div className="relative w-12 h-12 flex items-center justify-center bg-muted/60 border border-border group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors">
        <Icon className="w-[26px] h-[26px] text-foreground" strokeWidth={1.75} />
        {isSoon && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-muted-foreground"
          />
        )}
        {isPro && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent"
          />
        )}
      </div>
      <span className="mt-2 text-[11px] leading-tight text-foreground line-clamp-2 font-medium">
        {label}
      </span>
      {caption && (
        <span className="mt-0.5 text-[10px] leading-tight text-muted-foreground line-clamp-1">
          {caption}
        </span>
      )}
    </>
  );

  const className = cn(
    'group flex flex-col items-center text-center px-1 py-2',
    'min-h-[88px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    isSoon && 'opacity-70',
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {inner}
    </Link>
  );
};

export default AppTile;
