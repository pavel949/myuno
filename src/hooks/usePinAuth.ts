import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PIN_USER_KEY = 'uno_pin_user_id';
const PIN_EMAIL_KEY = 'uno_pin_email';

// Read localStorage synchronously to prevent flicker
function getInitialPinState() {
  try {
    const userId = localStorage.getItem(PIN_USER_KEY);
    const email = localStorage.getItem(PIN_EMAIL_KEY);
    return { userId, email };
  } catch {
    return { userId: null, email: null };
  }
}

export function usePinAuth() {
  const { user, session } = useAuth();
  
  // Initialize synchronously from localStorage to prevent flash
  const initialState = getInitialPinState();
  
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(!!initialState.userId); // Only load if there's a user to check
  const [savedUserId, setSavedUserId] = useState<string | null>(initialState.userId);
  const [savedEmail, setSavedEmail] = useState<string | null>(initialState.email);
  const [pinCheckComplete, setPinCheckComplete] = useState(!initialState.userId); // Complete immediately if no user

  // Persist only user metadata for PIN UX, never session tokens.
  useEffect(() => {
    if (session && user?.id && hasPin && !savedUserId) {
      localStorage.setItem(PIN_USER_KEY, user.id);
      localStorage.setItem(PIN_EMAIL_KEY, user.email || '');
      setSavedUserId(user.id);
      setSavedEmail(user.email || '');
    }
  }, [session, user?.id, user?.email, hasPin, savedUserId]);

  // Check if user has PIN - prioritize savedUserId for returning users
  useEffect(() => {
    let isMounted = true;
    
    const checkPinStatus = async () => {
      const userIdToCheck = savedUserId || user?.id;
      
      if (!userIdToCheck) {
        if (isMounted) {
          setHasPin(false);
          setIsLoading(false);
          setPinCheckComplete(true);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_pins')
          .select('id')
          .eq('user_id', userIdToCheck)
          .maybeSingle();

        if (error) throw error;
        
        if (isMounted) {
          setHasPin(!!data);
          setPinCheckComplete(true);
        }
      } catch (error) {
        if (isMounted) {
          setHasPin(false);
          setPinCheckComplete(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    checkPinStatus();
    return () => { isMounted = false; };
  }, [user?.id, savedUserId]);

  // Manual check function for external use
  const checkHasPin = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_pins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasPin(!!data);
    } catch {
      setHasPin(false);
    }
  }, [user]);

  // Clear saved PIN data (for logout or switching users)
  // IMPORTANT: Declared BEFORE verifyPin to fix closure issues
  const clearPinData = useCallback(() => {
    localStorage.removeItem(PIN_USER_KEY);
    localStorage.removeItem(PIN_EMAIL_KEY);
    setSavedUserId(null);
    setSavedEmail(null);
  }, []);

  // Set up PIN for current user
  const setupPin = useCallback(async (pin: string) => {
    if (!user) throw new Error('Not authenticated');
    if (!session) throw new Error('No session available');

    const deviceId = getDeviceId();
    
    const { data, error } = await supabase.rpc('set_user_pin', {
      p_user_id: user.id,
      p_pin: pin,
      p_device_id: deviceId
    });

    if (error) throw error;

    // Save only user metadata for PIN UX.
    localStorage.setItem(PIN_USER_KEY, user.id);
    localStorage.setItem(PIN_EMAIL_KEY, user.email || '');
    setSavedUserId(user.id);
    setSavedEmail(user.email || '');
    setHasPin(true);

    return data;
  }, [user, session]);

  // Verify PIN for the currently authenticated user session.
  const verifyPin = useCallback(async (pin: string) => {
    const userId = savedUserId || user?.id || null;
    if (!userId) throw new Error('No saved user for PIN login');
    if (!session || !user?.id) {
      throw new Error('Session expired. Please login with password.');
    }
    if (user.id !== userId) {
      clearPinData();
      throw new Error('Saved PIN user does not match current session.');
    }

    // Verify PIN against the active authenticated user.
    const { data, error } = await supabase.rpc('verify_user_pin', {
      p_user_id: userId,
      p_pin: pin
    });

    if (error) throw error;
    if (!data) throw new Error('Invalid PIN');

    return true;
  }, [clearPinData, savedUserId, session, user?.id]);

  // PIN quick unlock is only available for the active session user.
  const canUsePinLogin = savedUserId !== null && user?.id === savedUserId && !!session;

  return {
    hasPin,
    isLoading,
    setupPin,
    verifyPin,
    clearPinData,
    canUsePinLogin,
    savedEmail,
    savedUserId,
    checkHasPin
  };
}

// Generate a simple device ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem('uno_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('uno_device_id', deviceId);
  }
  return deviceId;
}
