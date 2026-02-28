import { memo, forwardRef } from 'react';
import { Sparkles, type LucideIcon } from 'lucide-react';
import { resolveIcon, iconSizes, type IconSize } from '@/lib/iconMap';
import { cn } from '@/lib/utils';

export interface IconBadgeProps {
  icon: string | LucideIcon;
  size?: IconSize;
  variant?: 'default' | 'primary' | 'muted' | 'gradient' | 'ghost' | 'glass';
  gradient?: string;
  className?: string;
  iconClassName?: string;
}

const containerSizes: Record<IconSize, string> = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-13 h-13',
  xl: 'w-14 h-14',
  '2xl': 'w-16 h-16',
  '3xl': 'w-20 h-20',
};

const containerStyles = {
  default: 'bg-muted/80 text-icon-dark shadow-sm',
  primary: 'bg-primary/12 text-primary shadow-sm',
  muted: 'bg-muted/50 text-muted-foreground',
  gradient: '', // Dynamic - set via gradient prop
  ghost: 'bg-transparent text-foreground',
  glass: 'bg-background/60 backdrop-blur-sm border border-border/50 text-foreground shadow-sm',
};

/** strokeWidth by size — bolder at small sizes for clarity */
const strokeWidths: Record<IconSize, number> = {
  xs: 2.5,
  sm: 2.2,
  md: 2,
  lg: 2,
  xl: 1.8,
  '2xl': 1.8,
  '3xl': 1.6,
};

export const IconBadge = memo(forwardRef<HTMLDivElement, IconBadgeProps>(function IconBadge(
  {
    icon,
    size = 'md',
    variant = 'default',
    gradient,
    className,
    iconClassName,
  },
  ref
) {
  const IconComponent = resolveIcon(icon);

  const sizeClass = iconSizes[size];
  const containerSize = containerSizes[size];
  const sw = strokeWidths[size];
  
  const variantStyle = variant === 'gradient' && gradient 
    ? `bg-gradient-to-br ${gradient} text-white shadow-md` 
    : containerStyles[variant];

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
        containerSize,
        variantStyle,
        className
      )}
    >
      <IconComponent className={cn(sizeClass, iconClassName)} strokeWidth={sw} />
    </div>
  );
}));

// Inline icon without container - for use in chips/badges
export interface InlineIconProps {
  icon: string | LucideIcon;
  size?: IconSize;
  className?: string;
}

export const InlineIcon = memo(function InlineIcon({
  icon,
  size = 'sm',
  className,
}: InlineIconProps) {
  const IconComponent = resolveIcon(icon);
  const sizeClass = iconSizes[size];

  return <IconComponent className={cn(sizeClass, 'flex-shrink-0', className)} strokeWidth={2.2} />;
});
