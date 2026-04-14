import { useState, useEffect, useCallback } from 'react';

export interface ChecklistItem {
  id: string;
  completed: boolean;
}

const STORAGE_KEY = 'myuno-trip-checklist';

const DEFAULT_ITEMS: string[] = [
  'flights',
  'arrival_card',
  'fast_track',
  'transfer',
  'car_rental',
  'insurance',
  'events',
  'other_services',
];

export function useTripChecklist() {
  const [items, setItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignored */ }
    return Object.fromEntries(DEFAULT_ITEMS.map(id => [id, false]));
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggle = useCallback((id: string) => {
    setItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const completedCount = Object.values(items).filter(Boolean).length;
  const totalCount = DEFAULT_ITEMS.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return { items, toggle, completedCount, totalCount, progress };
}
