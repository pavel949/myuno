import { useEffect, useRef, useMemo } from 'react';
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

// Store for tracking previous path across renders
const navigationStore = {
  prevPath: '',
  direction: 'none' as NavigationDirection,
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

export const getNavigationDirection = (): NavigationDirection => navigationStore.direction;

export const updateNavigationDirection = (newPath: string): NavigationDirection => {
  const prevPath = navigationStore.prevPath;
  
  if (prevPath && prevPath !== newPath) {
    const prevIndex = getTabIndex(prevPath);
    const currentIndex = getTabIndex(newPath);
    
    if (prevIndex !== -1 && currentIndex !== -1) {
      navigationStore.direction = currentIndex > prevIndex ? 'right' : 'left';
    } else {
      navigationStore.direction = 'none';
    }
  }
  
  navigationStore.prevPath = newPath;
  return navigationStore.direction;
};

export const useNavigationDirection = (): NavigationDirection => {
  const location = useLocation();
  const isFirstRender = useRef(true);
  
  // Calculate direction on path change
  const direction = useMemo(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      navigationStore.prevPath = location.pathname;
      return 'none' as NavigationDirection;
    }
    return updateNavigationDirection(location.pathname);
  }, [location.pathname]);
  
  return direction;
};
