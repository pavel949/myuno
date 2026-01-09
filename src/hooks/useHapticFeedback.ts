import { useCallback } from 'react';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const vibrationPatterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [30, 50, 30],
  error: [50, 100, 50],
};

export function useHapticFeedback() {
  const vibrate = useCallback((style: HapticStyle = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(vibrationPatterns[style]);
      } catch (e) {
        // Vibration not supported or blocked
      }
    }
  }, []);

  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  return { vibrate, isSupported };
}

// Standalone function for use outside React components
export function triggerHaptic(style: HapticStyle = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(vibrationPatterns[style]);
    } catch (e) {
      // Vibration not supported or blocked
    }
  }
}
