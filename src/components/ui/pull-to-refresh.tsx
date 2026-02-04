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

const DIRECTION_THRESHOLD = 10; // pixels to determine swipe direction

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
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredHaptic = useRef(false);
  const canPull = useRef(false);
  const directionDecided = useRef(false);
  const isVerticalGesture = useRef(false);

  // Check if we're at the top of the page (using window scroll)
  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Reset direction detection
    directionDecided.current = false;
    isVerticalGesture.current = false;
    
    // Only allow pull-to-refresh if we're at the top
    canPull.current = isAtTop();
    if (!canPull.current) return;
    
    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
    setIsPulling(true);
    hasTriggeredHaptic.current = false;
  }, [disabled, isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing || !canPull.current) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startY.current;
    const deltaX = currentX - startX.current;
    
    // Determine direction if not yet decided
    if (!directionDecided.current) {
      const totalMovement = Math.abs(deltaY) + Math.abs(deltaX);
      
      // Wait until we have enough movement to determine direction
      if (totalMovement < DIRECTION_THRESHOLD) {
        return;
      }
      
      directionDecided.current = true;
      
      // If horizontal movement is greater, this is a horizontal swipe - don't interfere
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        isVerticalGesture.current = false;
        canPull.current = false;
        setPullDistance(0);
        return;
      }
      
      // This is a vertical gesture
      isVerticalGesture.current = true;
    }
    
    // Only proceed if this is a confirmed vertical gesture
    if (!isVerticalGesture.current) {
      return;
    }
    
    // If user scrolled down, cancel pull
    if (window.scrollY > 0) {
      setPullDistance(0);
      canPull.current = false;
      return;
    }
    
    // Only activate pull when moving down from top
    if (deltaY > 0 && isAtTop()) {
      // Prevent default scroll when pulling down
      e.preventDefault();
      
      // Apply resistance to the pull
      const resistance = 0.4;
      const distance = Math.min(deltaY * resistance, threshold * 1.5);
      setPullDistance(distance);
      
      // Trigger haptic when threshold is reached
      if (distance >= threshold && !hasTriggeredHaptic.current) {
        triggerHaptic('medium');
        hasTriggeredHaptic.current = true;
      } else if (distance < threshold && hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = false;
      }
    } else if (deltaY < 0) {
      // User is scrolling up, allow normal scroll
      setPullDistance(0);
      canPull.current = false;
    }
  }, [isPulling, disabled, isRefreshing, threshold, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    canPull.current = false;
    directionDecided.current = false;
    isVerticalGesture.current = false;
    
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
        // Only lock touch action when actively pulling vertically
        touchAction: (pullDistance > 0 && isVerticalGesture.current) ? 'none' : 'pan-y pan-x'
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
