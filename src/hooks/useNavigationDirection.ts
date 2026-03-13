import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Define tab order for bottom navigation
const tabOrder: Record<string, number> = {
  '/': 0,
  '/discover': 1,
  '/support': 2,
  '/bookings': 3,
  '/profile': 4,
  // MC tabs
  '/mc': 0,
  '/mc/properties': 1,
  '/mc/calendar': 2,
  '/mc/tasks': 3,
  '/mc/modules': 4,
  // Owner tabs
  '/owner': 0,
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

export type NavigationDirection = 'left' | 'right' | 'forward' | 'backward' | 'none';

// Simple module-level store
let storedDirection: NavigationDirection = 'none';
let storedPrevPath = '';

function getTabIndex(path: string): number {
  if (tabOrder[path] !== undefined) {
    return tabOrder[path];
  }
  
  const keys = Object.keys(tabOrder).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (path.startsWith(key) && key !== '/') {
      return tabOrder[key];
    }
  }
  
  return -1;
}

/** Count path segments: /mc/properties = 2, /mc/properties/abc/manage = 4 */
function getPathDepth(path: string): number {
  return path.split('/').filter(Boolean).length;
}

/** Check if two paths share the same root module (e.g. /mc, /vendor) */
function isSameModule(a: string, b: string): boolean {
  const rootA = '/' + (a.split('/').filter(Boolean)[0] || '');
  const rootB = '/' + (b.split('/').filter(Boolean)[0] || '');
  return rootA === rootB;
}

export const getNavigationDirection = (): NavigationDirection => storedDirection;

export const useNavigationDirection = (): NavigationDirection => {
  const location = useLocation();
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      storedPrevPath = currentPath;
      return;
    }
    
    if (storedPrevPath !== currentPath) {
      const prevIndex = getTabIndex(storedPrevPath);
      const currentIndex = getTabIndex(currentPath);
      
      // Tab-level horizontal navigation (left/right slide)
      if (prevIndex !== -1 && currentIndex !== -1 && prevIndex !== currentIndex) {
        storedDirection = currentIndex > prevIndex ? 'right' : 'left';
      } 
      // Depth navigation within the same module (forward/backward push/pop)
      else if (isSameModule(storedPrevPath, currentPath)) {
        const prevDepth = getPathDepth(storedPrevPath);
        const currentDepth = getPathDepth(currentPath);
        
        if (currentDepth > prevDepth) {
          storedDirection = 'forward'; // list → detail (push)
        } else if (currentDepth < prevDepth) {
          storedDirection = 'backward'; // detail → list (pop)
        } else {
          storedDirection = 'none';
        }
      } else {
        storedDirection = 'none';
      }
      
      storedPrevPath = currentPath;
    }
  }, [location.pathname]);
  
  return storedDirection;
};
