import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  type: 'food' | 'flowers' | 'service' | 'product';
  name: string;
  nameRu?: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  providerId?: string;
  providerName?: string;
  providerNameRu?: string;
  options?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearByType: (type: CartItem['type']) => void;
  clearByProvider: (providerId: string) => void;
  getItemCount: () => number;
  getTotal: () => number;
  getItemsByType: (type: CartItem['type']) => CartItem[];
  getItemsByProvider: (providerId: string) => CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'superapp_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === newItem.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const clearByType = (type: CartItem['type']) => {
    setItems(prev => prev.filter(item => item.type !== type));
  };

  const clearByProvider = (providerId: string) => {
    setItems(prev => prev.filter(item => item.providerId !== providerId));
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getItemsByType = (type: CartItem['type']) => {
    return items.filter(item => item.type === type);
  };

  const getItemsByProvider = (providerId: string) => {
    return items.filter(item => item.providerId === providerId);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      clearByType,
      clearByProvider,
      getItemCount,
      getTotal,
      getItemsByType,
      getItemsByProvider,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
