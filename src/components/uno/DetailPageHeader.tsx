import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailPageHeaderProps {
  fallbackPath?: string;
  onShare?: () => void;
  showShare?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

/**
 * Consistent overlay header for detail pages (products, services).
 * Renders over hero images with semi-transparent buttons.
 */
export const DetailPageHeader = memo(function DetailPageHeader({
  fallbackPath = '/',
  onShare,
  showShare = true,
  className,
  actions,
}: DetailPageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(fallbackPath);
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  return (
    <div className={cn("absolute top-4 left-4 right-4 z-20 flex justify-between items-center", className)}>
      {/* Back button */}
      <button
        onClick={handleBack}
        aria-label="Go back"
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          "bg-background/80 backdrop-blur-sm shadow-lg",
          "hover:bg-background/90 active:scale-95 transition-all",
          "touch-manipulation"
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {actions}
        {showShare && (
          <button
            onClick={handleShare}
            aria-label="Share"
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              "bg-background/80 backdrop-blur-sm shadow-lg",
              "hover:bg-background/90 active:scale-95 transition-all",
              "touch-manipulation"
            )}
          >
            <Share2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
});

DetailPageHeader.displayName = 'DetailPageHeader';
