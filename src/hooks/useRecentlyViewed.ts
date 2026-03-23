import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

const MAX_ITEMS = 10;

/**
 * Generic localStorage-backed "recently viewed" hook.
 * Replaces useRecentlyViewedProducts and useRecentlyViewedServices.
 *
 * Usage:
 *   const { items, addItem, clearAll } = useRecentlyViewed<ProductShape>('myuno_recently_viewed_products');
 */
export function useRecentlyViewed<T extends { id: string }>(storageKey: string) {
  const [items, setItems] = useState<(T & { viewed_at: number })[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      logger.error(`Failed to load ${storageKey}:`, error);
    }
  }, [storageKey]);

  const addItem = useCallback((item: T) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== item.id);
      const newItem = { ...item, viewed_at: Date.now() };
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        logger.error(`Failed to save ${storageKey}:`, error);
      }

      return updated;
    });
  }, [storageKey]);

  const clearAll = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      logger.error(`Failed to clear ${storageKey}:`, error);
    }
  }, [storageKey]);

  return {
    items,
    addItem,
    clearAll,
    hasHistory: items.length > 0,
  };
}
