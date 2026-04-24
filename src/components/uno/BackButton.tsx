import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'overlay';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function BackButton({ 
  fallbackPath = '/', 
  className,
  variant = 'default',
  size = 'md',
  onClick
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Always use fallback for reliability - history.length check is unreliable
    // in SPAs where history includes all internal navigations
    navigate(fallbackPath);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    default: 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/50',
    ghost: 'hover:bg-secondary/80 text-muted-foreground hover:text-foreground',
    overlay: 'bg-black/50 hover:bg-black/70 text-white',
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go back"
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "touch-manipulation",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <ChevronLeft className={iconSizeClasses[size]} />
    </button>
  );
}
