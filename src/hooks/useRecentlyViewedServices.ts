import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'myuno_recently_viewed_services';
const MAX_ITEMS = 10;

export interface RecentlyViewedService {
  id: string;
  name_en: string;
  name_ru: string;
  price: number | null;
  image: string | null;
  provider_id: string;
  provider_name: string;
  viewed_at: number;
}

export function useRecentlyViewedServices() {
  const [recentServices, setRecentServices] = useState<RecentlyViewedService[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedService[];
        setRecentServices(parsed);
      }
    } catch (error) {
      console.error('Failed to load recently viewed services:', error);
    }
  }, []);

  // Add a service to recently viewed
  const addService = useCallback((service: {
    id: string;
    name_en: string;
    name_ru: string;
    price: number | null;
    images?: string[] | null;
    provider_id: string;
    provider?: { name: string } | null;
  }) => {
    setRecentServices(prev => {
      // Remove if already exists
      const filtered = prev.filter(s => s.id !== service.id);
      
      // Add to beginning
      const newItem: RecentlyViewedService = {
        id: service.id,
        name_en: service.name_en,
        name_ru: service.name_ru,
        price: service.price,
        image: service.images?.[0] || null,
        provider_id: service.provider_id,
        provider_name: service.provider?.name || 'Provider',
        viewed_at: Date.now(),
      };
      
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recently viewed services:', error);
      }
      
      return updated;
    });
  }, []);

  // Clear all recently viewed
  const clearAll = useCallback(() => {
    setRecentServices([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recently viewed services:', error);
    }
  }, []);

  return {
    recentServices,
    addService,
    clearAll,
    hasHistory: recentServices.length > 0,
  };
}
