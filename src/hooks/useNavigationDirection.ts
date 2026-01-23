import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Define tab order for bottom navigation
const tabOrder: Record<string, number> = {
  '/': 0,
  '/discover': 1,
  '/support': 2,
  '/bookings': 3,
  '/profile': 4,
  // Owner tabs
  '/owner': 0,
  '/owner/properties': 1,
  '/owner/calendar': 2,
  '/owner/messages': 3,
  // Vendor tabs
  '/vendor': 0,
  '/vendor/services': 1,
  '/vendor/bookings': 2,
  '/vendor/payouts': 3,
  // Admin tabs
  '/admin': 0,
  '/admin/leads': 1,
  '/admin/tickets': 2,
  '/admin/moderation': 3,
  // Team tabs
  '/team': 0,
  '/team/content': 1,
};

export type NavigationDirection = 'left' | 'right' | 'none';

// Global state for direction (accessible outside React)
let currentDirection: NavigationDirection = 'none';

export const getNavigationDirection = (): NavigationDirection => currentDirection;

export const useNavigationDirection = (): NavigationDirection => {
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);
  
  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;
    
    if (prevPath !== currentPath) {
      const prevIndex = getTabIndex(prevPath);
      const currentIndex = getTabIndex(currentPath);
      
      if (prevIndex !== -1 && currentIndex !== -1) {
        currentDirection = currentIndex > prevIndex ? 'right' : 'left';
      } else {
        currentDirection = 'none';
      }
      
      prevPathRef.current = currentPath;
    }
  }, [location.pathname]);
  
  return currentDirection;
};

function getTabIndex(path: string): number {
  // Exact match first
  if (tabOrder[path] !== undefined) {
    return tabOrder[path];
  }
  
  // Find matching prefix for nested routes
  const keys = Object.keys(tabOrder).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (path.startsWith(key) && key !== '/') {
      return tabOrder[key];
    }
  }
  
  return -1;
}
