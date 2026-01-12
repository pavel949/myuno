import React, { useState, useRef, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredHaptic = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
    hasTriggeredHaptic.current = false;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
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
    }
  }, [isPulling, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
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

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto overscroll-contain", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <div 
          className="sticky top-2 left-0 right-0 flex justify-center items-center z-10 pointer-events-none"
          style={{ 
            marginBottom: -40,
          }}
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
      
      {/* Content wrapper - no transform to avoid blank screen issues */}
      <div 
        style={{ 
          paddingTop: isRefreshing ? 50 : pullDistance > 0 ? pullDistance : 0,
          transition: isPulling ? 'none' : 'padding-top 200ms ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
