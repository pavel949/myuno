import { memo, forwardRef } from 'react';
import { Sparkles, type LucideIcon } from 'lucide-react';
import { resolveIcon, iconSizes, type IconSize } from '@/lib/iconMap';
import { cn } from '@/lib/utils';

export interface IconBadgeProps {
  icon: string | LucideIcon;
  size?: IconSize;
  variant?: 'default' | 'primary' | 'muted' | 'gradient' | 'ghost';
  gradient?: string;
  className?: string;
  iconClassName?: string;
}

const containerSizes: Record<IconSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
  '2xl': 'w-16 h-16',
  '3xl': 'w-20 h-20',
};

const containerStyles = {
  default: 'bg-muted text-icon-dark',
  primary: 'bg-primary/10 text-icon-dark',
  muted: 'bg-muted/50 text-muted-foreground',
  gradient: '', // Dynamic - set via gradient prop
  ghost: 'bg-transparent text-foreground',
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
  
  const variantStyle = variant === 'gradient' && gradient 
    ? `bg-gradient-to-br ${gradient} text-white` 
    : containerStyles[variant];

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
        containerSize,
        variantStyle,
        className
      )}
    >
      <IconComponent className={cn(sizeClass, iconClassName)} />
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

  return <IconComponent className={cn(sizeClass, 'flex-shrink-0', className)} />;
});
