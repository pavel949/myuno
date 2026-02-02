import { useState, useCallback, useEffect } from 'react';

const HINTS_STORAGE_KEY = 'uno-hints-dismissed';
const TOURS_STORAGE_KEY = 'uno-tours-completed';
const DISCOVERY_STORAGE_KEY = 'uno-feature-discovery';

type HintStorage = Record<string, boolean>;

function getStorageValue(key: string): HintStorage {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setStorageValue(key: string, value: HintStorage): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export function useHints() {
  const [dismissedHints, setDismissedHints] = useState<HintStorage>(() => 
    getStorageValue(HINTS_STORAGE_KEY)
  );
  const [completedTours, setCompletedTours] = useState<HintStorage>(() => 
    getStorageValue(TOURS_STORAGE_KEY)
  );
  const [discoveredFeatures, setDiscoveredFeatures] = useState<HintStorage>(() => 
    getStorageValue(DISCOVERY_STORAGE_KEY)
  );

  // Sync with localStorage on mount
  useEffect(() => {
    setDismissedHints(getStorageValue(HINTS_STORAGE_KEY));
    setCompletedTours(getStorageValue(TOURS_STORAGE_KEY));
    setDiscoveredFeatures(getStorageValue(DISCOVERY_STORAGE_KEY));
  }, []);

  const dismissHint = useCallback((hintId: string) => {
    setDismissedHints(prev => {
      const updated = { ...prev, [hintId]: true };
      setStorageValue(HINTS_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const isHintDismissed = useCallback((hintId: string): boolean => {
    return dismissedHints[hintId] === true;
  }, [dismissedHints]);

  const showHint = useCallback((hintId: string): boolean => {
    return !isHintDismissed(hintId);
  }, [isHintDismissed]);

  const completeTour = useCallback((tourId: string) => {
    setCompletedTours(prev => {
      const updated = { ...prev, [tourId]: true };
      setStorageValue(TOURS_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const isTourCompleted = useCallback((tourId: string): boolean => {
    return completedTours[tourId] === true;
  }, [completedTours]);

  const markFeatureDiscovered = useCallback((featureId: string) => {
    setDiscoveredFeatures(prev => {
      const updated = { ...prev, [featureId]: true };
      setStorageValue(DISCOVERY_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const isFeatureDiscovered = useCallback((featureId: string): boolean => {
    return discoveredFeatures[featureId] === true;
  }, [discoveredFeatures]);

  const resetAllHints = useCallback(() => {
    setDismissedHints({});
    setCompletedTours({});
    setDiscoveredFeatures({});
    localStorage.removeItem(HINTS_STORAGE_KEY);
    localStorage.removeItem(TOURS_STORAGE_KEY);
    localStorage.removeItem(DISCOVERY_STORAGE_KEY);
  }, []);

  const resetHint = useCallback((hintId: string) => {
    setDismissedHints(prev => {
      const updated = { ...prev };
      delete updated[hintId];
      setStorageValue(HINTS_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  return {
    // Hints
    showHint,
    dismissHint,
    isHintDismissed,
    resetHint,
    // Tours
    completeTour,
    isTourCompleted,
    // Feature Discovery
    markFeatureDiscovered,
    isFeatureDiscovered,
    // Reset
    resetAllHints,
  };
}

export type UseHintsReturn = ReturnType<typeof useHints>;
