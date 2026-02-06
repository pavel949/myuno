import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const GUEST_STATE_KEY = 'uno_guest_checkout_state';

export interface GuestCheckoutState {
  formData?: Record<string, unknown>;
  selectedItems?: unknown[];
  returnPath?: string;
  context?: 'booking' | 'order' | 'purchase';
  timestamp?: number;
}

/**
 * Hook to manage guest checkout state across login boundary.
 * Preserves form data and selections when guest is prompted to login.
 */
export function useGuestCheckout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check if we have preserved state from before login
  const getPreservedState = useCallback((): GuestCheckoutState | null => {
    try {
      const stored = sessionStorage.getItem(GUEST_STATE_KEY);
      if (!stored) return null;
      
      const state = JSON.parse(stored) as GuestCheckoutState;
      
      // Expire after 30 minutes
      if (state.timestamp && Date.now() - state.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem(GUEST_STATE_KEY);
        return null;
      }
      
      return state;
    } catch {
      return null;
    }
  }, []);

  // Save state before redirecting to login
  const saveStateForLogin = useCallback((state: Omit<GuestCheckoutState, 'timestamp'>) => {
    sessionStorage.setItem(GUEST_STATE_KEY, JSON.stringify({
      ...state,
      timestamp: Date.now(),
    }));
  }, []);

  // Clear preserved state
  const clearPreservedState = useCallback(() => {
    sessionStorage.removeItem(GUEST_STATE_KEY);
  }, []);

  // Check if user needs to login to proceed
  const requireLogin = useCallback((
    state: Omit<GuestCheckoutState, 'timestamp' | 'returnPath'>,
    context: GuestCheckoutState['context'] = 'order'
  ): boolean => {
    if (user) return false; // Already logged in
    
    // Save state and show modal
    saveStateForLogin({
      ...state,
      returnPath: location.pathname,
      context,
    });
    
    setShowLoginModal(true);
    return true;
  }, [user, location.pathname, saveStateForLogin]);

  // Auto-restore state after login
  useEffect(() => {
    if (!isLoading && user) {
      // Check if we came back from auth with preserved state
      const preserved = getPreservedState();
      if (preserved) {
        // State will be available via getPreservedState()
        // Component should call getPreservedState() and apply it
      }
    }
  }, [user, isLoading, getPreservedState]);

  return {
    isGuest: !isLoading && !user,
    showLoginModal,
    setShowLoginModal,
    requireLogin,
    getPreservedState,
    saveStateForLogin,
    clearPreservedState,
    context: getPreservedState()?.context || 'order',
  };
}
