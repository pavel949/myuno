import { useCallback, useRef } from 'react';

interface RippleEvent {
  clientX: number;
  clientY: number;
  currentTarget: HTMLElement;
}

export function useRipple(color: string = 'hsl(var(--primary) / 0.3)') {
  const rippleRef = useRef<HTMLSpanElement | null>(null);

  const createRipple = useCallback((event: RippleEvent) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    
    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;
    
    // Remove existing ripple
    const existingRipple = element.querySelector('.ripple-effect');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    // Create new ripple
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      width: ${diameter}px;
      height: ${diameter}px;
      left: ${x}px;
      top: ${y}px;
      background: ${color};
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out forwards;
      pointer-events: none;
      z-index: 10;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
    
    rippleRef.current = ripple;
  }, [color]);

  return { createRipple };
}

// Simpler approach - just add this to any clickable element
export function triggerRipple(
  event: React.MouseEvent<HTMLElement>,
  color: string = 'hsl(var(--primary) / 0.3)'
) {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;
  
  const x = event.clientX - rect.left - radius;
  const y = event.clientY - rect.top - radius;
  
  // Remove existing ripple
  const existingRipple = element.querySelector('.ripple-effect');
  if (existingRipple) {
    existingRipple.remove();
  }
  
  // Create new ripple
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.cssText = `
    position: absolute;
    width: ${diameter}px;
    height: ${diameter}px;
    left: ${x}px;
    top: ${y}px;
    background: ${color};
    border-radius: 50%;
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out forwards;
    pointer-events: none;
    z-index: 10;
  `;
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  // Remove ripple after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}
