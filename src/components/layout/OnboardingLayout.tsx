import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Simple layout wrapper for onboarding pages.
 * Does not include header or bottom nav - those are handled globally.
 */
export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn("min-h-screen bg-background pb-20", className)}>
      {children}
    </div>
  );
};
