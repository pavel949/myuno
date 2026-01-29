import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className,
  threshold = 80,
  disabled = false 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredHaptic = useRef(false);
  const canPull = useRef(false);

  // Check if we're at the top of the page (using window scroll)
  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only allow pull-to-refresh if we're at the top
    canPull.current = isAtTop();
    if (!canPull.current) return;
    
    startY.current = e.touches[0].clientY;
    startScrollTop.current = window.scrollY;
    setIsPulling(true);
    hasTriggeredHaptic.current = false;
  }, [disabled, isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing || !canPull.current) return;
    
    // If user scrolled down, cancel pull
    if (window.scrollY > 0) {
      setPullDistance(0);
      canPull.current = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only activate pull when moving down from top
    if (diff > 0 && isAtTop()) {
      // Prevent default scroll when pulling
      e.preventDefault();
      
      // Apply resistance to the pull
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, threshold * 1.5);
      setPullDistance(distance);
      
      // Trigger haptic when threshold is reached
      if (distance >= threshold && !hasTriggeredHaptic.current) {
        triggerHaptic('medium');
        hasTriggeredHaptic.current = true;
      } else if (distance < threshold && hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = false;
      }
    } else if (diff < 0) {
      // User is scrolling up, allow normal scroll
      setPullDistance(0);
      canPull.current = false;
    }
  }, [isPulling, disabled, isRefreshing, threshold, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    canPull.current = false;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('success');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, pullDistance, threshold, isRefreshing, onRefresh]);

  // Reset state if component becomes disabled
  useEffect(() => {
    if (disabled) {
      setPullDistance(0);
      setIsPulling(false);
      setIsRefreshing(false);
    }
  }, [disabled]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        // Prevent browser's native pull-to-refresh
        overscrollBehavior: 'none',
        touchAction: pullDistance > 0 ? 'none' : 'pan-y'
      }}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <div 
          className="fixed top-16 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
        >
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-lg transition-opacity duration-200",
            isRefreshing && "animate-pulse"
          )}>
            <RefreshCw 
              className={cn(
                "w-5 h-5 text-primary transition-transform duration-200",
                isRefreshing && "animate-spin"
              )}
              style={{ 
                transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              }}
            />
          </div>
        </div>
      )}
      
      {/* Content wrapper */}
      <div 
        style={{ 
          transform: pullDistance > 0 || isRefreshing ? `translateY(${isRefreshing ? 50 : pullDistance}px)` : undefined,
          transition: isPulling ? 'none' : 'transform 200ms ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
