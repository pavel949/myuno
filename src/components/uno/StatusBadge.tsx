import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  FileEdit, 
  Send, 
  CheckCircle2, 
  Clock, 
  CheckCheck, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';

type BookingStatus = 
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_user'
  | 'cancelled_by_provider'
  | 'expired';

interface StatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<BookingStatus, {
  icon: React.ElementType;
  className: string;
}> = {
  draft: {
    icon: FileEdit,
    className: 'bg-muted text-muted-foreground',
  },
  submitted: {
    icon: Send,
    className: 'bg-info/20 text-info border-info/30',
  },
  confirmed: {
    icon: CheckCircle2,
    className: 'bg-success/20 text-success border-success/30',
  },
  in_progress: {
    icon: Clock,
    className: 'bg-warning/20 text-warning border-warning/30',
  },
  completed: {
    icon: CheckCheck,
    className: 'bg-success/20 text-success border-success/30',
  },
  cancelled_by_user: {
    icon: XCircle,
    className: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  cancelled_by_provider: {
    icon: XCircle,
    className: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  expired: {
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  className 
}: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{t(`status.${status}`)}</span>
    </span>
  );
}
