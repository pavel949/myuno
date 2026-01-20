import { useState, useEffect, useCallback } from 'react';

export interface FeedbackSettings {
  hapticEnabled: boolean;
  soundEnabled: boolean;
  typingSoundEnabled: boolean;
  volume: number; // 0-1
}

const STORAGE_KEY = 'uno-feedback-settings';

const defaultSettings: FeedbackSettings = {
  hapticEnabled: true,
  soundEnabled: true,
  typingSoundEnabled: true,
  volume: 0.7,
};

/**
 * Get feedback settings from localStorage (for use outside React components)
 */
export function getFeedbackSettings(): FeedbackSettings {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return defaultSettings;
}

/**
 * Save feedback settings to localStorage
 */
export function saveFeedbackSettings(settings: FeedbackSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * React hook for managing feedback settings
 */
export function useFeedbackSettings() {
  const [settings, setSettings] = useState<FeedbackSettings>(getFeedbackSettings);

  // Sync with localStorage on mount and when other tabs change it
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(e.newValue) });
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateSettings = useCallback((updates: Partial<FeedbackSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveFeedbackSettings(newSettings);
      return newSettings;
    });
  }, []);

  const toggleHaptic = useCallback(() => {
    updateSettings({ hapticEnabled: !settings.hapticEnabled });
  }, [settings.hapticEnabled, updateSettings]);

  const toggleSound = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  const toggleTypingSound = useCallback(() => {
    updateSettings({ typingSoundEnabled: !settings.typingSoundEnabled });
  }, [settings.typingSoundEnabled, updateSettings]);

  const setVolume = useCallback((volume: number) => {
    updateSettings({ volume: Math.max(0, Math.min(1, volume)) });
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    toggleHaptic,
    toggleSound,
    toggleTypingSound,
    setVolume,
  };
}
