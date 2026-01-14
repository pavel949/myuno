import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PIN_USER_KEY = 'uno_pin_user_id';
const PIN_EMAIL_KEY = 'uno_pin_email';

export function usePinAuth() {
  const { user, session } = useAuth();
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  // Check if current user has PIN set up
  const checkHasPin = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

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
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check for saved PIN login data on mount
  useEffect(() => {
    const userId = localStorage.getItem(PIN_USER_KEY);
    const email = localStorage.getItem(PIN_EMAIL_KEY);
    setSavedUserId(userId);
    setSavedEmail(email);
  }, []);

  // Check if user has PIN when authenticated
  useEffect(() => {
    if (user) {
      checkHasPin();
    } else {
      setHasPin(false);
      setIsLoading(false);
    }
  }, [user, checkHasPin]);

  // Set up PIN for current user
  const setupPin = useCallback(async (pin: string) => {
    if (!user) throw new Error('Not authenticated');

    const deviceId = getDeviceId();
    
    const { data, error } = await supabase.rpc('set_user_pin', {
      p_user_id: user.id,
      p_pin: pin,
      p_device_id: deviceId
    });

    if (error) throw error;

    // Save user info for PIN login
    localStorage.setItem(PIN_USER_KEY, user.id);
    localStorage.setItem(PIN_EMAIL_KEY, user.email || '');
    setSavedUserId(user.id);
    setSavedEmail(user.email || '');
    setHasPin(true);

    return data;
  }, [user]);

  // Verify PIN and return session token
  const verifyPin = useCallback(async (pin: string) => {
    const userId = localStorage.getItem(PIN_USER_KEY);
    if (!userId) throw new Error('No saved user for PIN login');

    const { data, error } = await supabase.rpc('verify_user_pin', {
      p_user_id: userId,
      p_pin: pin
    });

    if (error) throw error;
    if (!data) throw new Error('Invalid PIN');

    return true;
  }, []);

  // Clear saved PIN data (for logout or switching users)
  const clearPinData = useCallback(() => {
    localStorage.removeItem(PIN_USER_KEY);
    localStorage.removeItem(PIN_EMAIL_KEY);
    setSavedUserId(null);
    setSavedEmail(null);
  }, []);

  // Check if PIN login is available for this device
  const canUsePinLogin = savedUserId !== null;

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
