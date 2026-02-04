/**
 * DeveloperBadge - Compact developer info badge
 * Shows logo, name, verified status
 */

import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface DeveloperBadgeProps {
  developerId?: string | null;
  developerName?: string | null;
  developerLogo?: string | null;
  isVerified?: boolean;
  className?: string;
  showLink?: boolean;
  size?: 'sm' | 'md';
}

export const DeveloperBadge = forwardRef<HTMLDivElement, DeveloperBadgeProps>(
  function DeveloperBadge({
    developerId,
    developerName,
    developerLogo,
    isVerified = false,
    className,
    showLink = true,
    size = 'sm',
  }, ref) {
  const { language } = useLanguage();
  
  if (!developerName) return null;

  const content = (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-1.5 text-muted-foreground",
        showLink && developerId && "hover:text-primary transition-colors cursor-pointer",
        size === 'sm' ? "text-xs" : "text-sm",
        className
      )}
    >
      {developerLogo ? (
        <img
          src={developerLogo}
          alt={developerName}
          className={cn(
            "rounded object-contain bg-muted",
            size === 'sm' ? "w-4 h-4" : "w-5 h-5"
          )}
        />
      ) : (
        <Building2 className={size === 'sm' ? "w-3 h-3" : "w-4 h-4"} />
      )}
      <span className="truncate max-w-[120px]">{developerName}</span>
      {isVerified && (
        <CheckCircle2 
          className={cn(
            "text-primary flex-shrink-0",
            size === 'sm' ? "w-3 h-3" : "w-4 h-4"
          )} 
        />
      )}
    </div>
  );

  if (showLink && developerId) {
    return (
      <Link to={`/developers/${developerId}`} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
});

export default DeveloperBadge;
