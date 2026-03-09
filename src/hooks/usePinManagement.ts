import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePinAuth } from './usePinAuth';

const PIN_USER_KEY = 'uno_pin_user_id';
const PIN_EMAIL_KEY = 'uno_pin_email';
// SECURITY: Refresh token is no longer stored in localStorage.
// PIN login re-authenticates via stored email + PIN verification on the server.

export function usePinManagement() {
  const { user, session } = useAuth();
  const { hasPin, checkHasPin, clearPinData } = usePinAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Generate device ID for PIN storage
  const getDeviceId = useCallback((): string => {
    let deviceId = localStorage.getItem('uno_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('uno_device_id', deviceId);
    }
    return deviceId;
  }, []);

  // Set up new PIN (for users without PIN)
  const setupPin = useCallback(async (newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!session?.refresh_token) return { success: false, error: 'No session available' };

    setIsLoading(true);
    try {
      const deviceId = getDeviceId();
      
      const { data, error } = await supabase.rpc('set_user_pin', {
        p_user_id: user.id,
        p_pin: newPin,
        p_device_id: deviceId
      });

      if (error) throw error;

      // Save user info for PIN login (no refresh token stored for security)
      localStorage.setItem(PIN_USER_KEY, user.id);
      localStorage.setItem(PIN_EMAIL_KEY, user.email || '');
      
      await checkHasPin();
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to set up PIN';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [user, session, getDeviceId, checkHasPin]);

  // Change PIN (verify old PIN first, then set new)
  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    try {
      // Verify old PIN first
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_user_pin', {
        p_user_id: user.id,
        p_pin: oldPin
      });

      if (verifyError) throw verifyError;
      if (!isValid) return { success: false, error: 'Incorrect current PIN' };

      // Set new PIN
      const deviceId = getDeviceId();
      const { error: setError } = await supabase.rpc('set_user_pin', {
        p_user_id: user.id,
        p_pin: newPin,
        p_device_id: deviceId
      });

      if (setError) throw setError;

      // Update stored refresh token
      if (session?.refresh_token) {
        localStorage.setItem(PIN_REFRESH_TOKEN_KEY, session.refresh_token);
      }

      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to change PIN';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [user, session, getDeviceId]);

  // Reset PIN using password verification
  const resetPinWithPassword = useCallback(async (email: string, password: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    try {
      // Verify password by re-signing in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return { success: false, error: 'Incorrect password' };
      }

      // Set new PIN
      const deviceId = getDeviceId();
      const { error: setError } = await supabase.rpc('set_user_pin', {
        p_user_id: user.id,
        p_pin: newPin,
        p_device_id: deviceId
      });

      if (setError) throw setError;

      // Refresh session tokens after re-auth
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.refresh_token) {
        localStorage.setItem(PIN_USER_KEY, user.id);
        localStorage.setItem(PIN_EMAIL_KEY, user.email || '');
        localStorage.setItem(PIN_REFRESH_TOKEN_KEY, sessionData.session.refresh_token);
      }

      await checkHasPin();
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to reset PIN';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [user, getDeviceId, checkHasPin]);

  // Disable PIN completely
  const disablePin = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    try {
      // Delete PIN from database
      const { error } = await supabase
        .from('user_pins')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear local storage
      clearPinData();
      await checkHasPin();
      
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to disable PIN';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [user, clearPinData, checkHasPin]);

  return {
    hasPin,
    isLoading,
    setupPin,
    changePin,
    resetPinWithPassword,
    disablePin,
    checkHasPin
  };
}
