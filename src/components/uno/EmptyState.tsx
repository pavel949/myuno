import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Accepts a LucideIcon component OR a ReactNode (e.g. <Icon className="h-8 w-8" />) */
  icon: LucideIcon | ReactNode;
  title: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  action?: ReactNode;
  className?: string;
  /** When true, shows Russian variants of title/description */
  isRu?: boolean;
}

function isLucideIcon(icon: unknown): icon is LucideIcon {
  // lucide-react icons can be functions OR forwardRef objects ($$typeof + render)
  if (typeof icon === 'function') return true;
  if (typeof icon === 'object' && icon !== null && '$$typeof' in icon && 'render' in icon) return true;
  return false;
}

export function EmptyState({ 
  icon, 
  title, 
  titleRu,
  description, 
  descriptionRu,
  action,
  className,
  isRu = false,
}: EmptyStateProps) {
  const displayTitle = isRu ? (titleRu || title) : title;
  const displayDesc = isRu ? (descriptionRu || description) : description;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 text-center",
      className
    )}>
      <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
        {isLucideIcon(icon) 
          ? React.createElement(icon, { className: "w-10 h-10 text-muted-foreground" })
          : <span className="text-muted-foreground">{icon}</span>
        }
      </div>
      <h2 className="text-xl font-semibold mb-2">{displayTitle}</h2>
      {displayDesc && (
        <p className="text-muted-foreground max-w-xs mb-6">{displayDesc}</p>
      )}
      {action}
    </div>
  );
}
