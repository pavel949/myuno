import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PIN_USER_KEY = 'uno_pin_user_id';
const PIN_EMAIL_KEY = 'uno_pin_email';
const PIN_REFRESH_TOKEN_KEY = 'uno_pin_refresh_token';

export function usePinAuth() {
  const { user, session } = useAuth();
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [hasRefreshToken, setHasRefreshToken] = useState(false);

  // Check for saved PIN login data on mount
  useEffect(() => {
    const userId = localStorage.getItem(PIN_USER_KEY);
    const email = localStorage.getItem(PIN_EMAIL_KEY);
    const refreshToken = localStorage.getItem(PIN_REFRESH_TOKEN_KEY);
    
    setSavedUserId(userId);
    setSavedEmail(email);
    setHasRefreshToken(!!refreshToken);
  }, []);

  // Check if user has PIN when authenticated
  useEffect(() => {
    let isMounted = true;
    
    const checkPinStatus = async () => {
      if (!user) {
        if (isMounted) {
          setHasPin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_pins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (isMounted) setHasPin(!!data);
      } catch (error) {
        console.error('Error checking PIN:', error);
        if (isMounted) setHasPin(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    checkPinStatus();
    return () => { isMounted = false; };
  }, [user]);

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
    } catch (error) {
      console.error('Error checking PIN:', error);
      setHasPin(false);
    }
  }, [user]);

  // Clear saved PIN data (for logout or switching users)
  // IMPORTANT: Declared BEFORE verifyPin to fix closure issues
  const clearPinData = useCallback(() => {
    localStorage.removeItem(PIN_USER_KEY);
    localStorage.removeItem(PIN_EMAIL_KEY);
    localStorage.removeItem(PIN_REFRESH_TOKEN_KEY);
    setSavedUserId(null);
    setSavedEmail(null);
    setHasRefreshToken(false);
  }, []);

  // Set up PIN for current user
  const setupPin = useCallback(async (pin: string) => {
    if (!user) throw new Error('Not authenticated');
    if (!session?.refresh_token) throw new Error('No session available');

    const deviceId = getDeviceId();
    
    const { data, error } = await supabase.rpc('set_user_pin', {
      p_user_id: user.id,
      p_pin: pin,
      p_device_id: deviceId
    });

    if (error) throw error;

    // Save user info and refresh token for PIN login
    localStorage.setItem(PIN_USER_KEY, user.id);
    localStorage.setItem(PIN_EMAIL_KEY, user.email || '');
    localStorage.setItem(PIN_REFRESH_TOKEN_KEY, session.refresh_token);
    setSavedUserId(user.id);
    setSavedEmail(user.email || '');
    setHasRefreshToken(true);
    setHasPin(true);

    return data;
  }, [user, session]);

  // Verify PIN and restore session
  const verifyPin = useCallback(async (pin: string) => {
    const userId = localStorage.getItem(PIN_USER_KEY);
    const refreshToken = localStorage.getItem(PIN_REFRESH_TOKEN_KEY);
    
    if (!userId) throw new Error('No saved user for PIN login');
    if (!refreshToken) {
      clearPinData();
      throw new Error('Session expired. Please login with password.');
    }

    // First verify PIN
    const { data, error } = await supabase.rpc('verify_user_pin', {
      p_user_id: userId,
      p_pin: pin
    });

    if (error) throw error;
    if (!data) throw new Error('Invalid PIN');

    // PIN is valid - restore session using saved refresh token
    const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (sessionError || !sessionData.session) {
      // Refresh token expired, clear PIN data
      clearPinData();
      throw new Error('Session expired. Please login with password.');
    }

    // Update stored refresh token with the new one
    if (sessionData.session.refresh_token) {
      localStorage.setItem(PIN_REFRESH_TOKEN_KEY, sessionData.session.refresh_token);
      setHasRefreshToken(true);
    }

    return true;
  }, [clearPinData]);

  // Check if PIN login is available - requires BOTH user_id AND refresh_token
  const canUsePinLogin = savedUserId !== null && hasRefreshToken;

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
