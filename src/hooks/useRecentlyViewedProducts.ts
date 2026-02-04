import { useState, useEffect, useCallback } from 'react';
import { MarketplaceProduct } from '@/types/marketplace';

const STORAGE_KEY = 'myuno_recently_viewed_products';
const MAX_ITEMS = 10;

interface StoredProduct {
  id: string;
  name_en: string;
  name_ru: string;
  price: number;
  cover_image: string | null;
  vendor_name: string | null;
  viewed_at: number;
}

export function useRecentlyViewedProducts() {
  const [recentProducts, setRecentProducts] = useState<StoredProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredProduct[];
        setRecentProducts(parsed);
      }
    } catch (error) {
      console.error('Failed to load recently viewed products:', error);
    }
  }, []);

  // Add a product to recently viewed
  const addProduct = useCallback((product: MarketplaceProduct) => {
    setRecentProducts(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== product.id);
      
      // Add to beginning
      const newItem: StoredProduct = {
        id: product.id,
        name_en: product.name_en,
        name_ru: product.name_ru,
        price: product.price,
        cover_image: product.cover_image,
        vendor_name: product.vendor_name,
        viewed_at: Date.now(),
      };
      
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recently viewed products:', error);
      }
      
      return updated;
    });
  }, []);

  // Clear all recently viewed
  const clearAll = useCallback(() => {
    setRecentProducts([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recently viewed products:', error);
    }
  }, []);

  return {
    recentProducts,
    addProduct,
    clearAll,
    hasHistory: recentProducts.length > 0,
  };
}
