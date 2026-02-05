/**
 * Test Mode Utilities
 * 
 * These utilities are ONLY active when VITE_TEST_MODE=true
 * They provide convenience features for Wave testing without
 * bypassing security (RBAC is still enforced server-side).
 */

// Check if test mode is enabled via env var
export const isTestModeEnabled = (): boolean => {
  return import.meta.env.VITE_TEST_MODE === 'true';
};

// LocalStorage keys that should be cleared during clean logout
const PIN_RELATED_KEYS = [
  'myuno_pin_setup',
  'myuno_pin_verified',
  'myuno_pin_attempts',
  'myuno_last_pin_time',
];

const ONBOARDING_RELATED_KEYS = [
  'myuno_onboarding_complete',
  'myuno_onboarding_step',
  'myuno_welcome_dismissed',
  'myuno_hints_dismissed',
];

const SESSION_KEYS = [
  'myuno_maintenance_bypass',
  'myuno_simulation_mode',
  'sb-kakkwibljrjsawxgnupk-auth-token',
];

/**
 * Clear all PIN-related localStorage keys
 */
export const clearPinStorage = (): void => {
  PIN_RELATED_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('[TestMode] PIN storage cleared');
};

/**
 * Clear all onboarding-related localStorage keys
 */
export const clearOnboardingStorage = (): void => {
  ONBOARDING_RELATED_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('[TestMode] Onboarding storage cleared');
};

/**
 * Clear all session-related localStorage keys
 */
export const clearSessionStorage = (): void => {
  SESSION_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  sessionStorage.clear();
  console.log('[TestMode] Session storage cleared');
};

/**
 * Perform a clean logout that clears all test-related state
 */
export const cleanLogoutForTesting = async (
  signOut: () => Promise<void>,
  navigate: (path: string) => void
): Promise<void> => {
  // Clear PIN state
  clearPinStorage();
  
  // Clear session state
  clearSessionStorage();
  
  // Sign out from Supabase
  await signOut();
  
  // Navigate to auth
  navigate('/auth');
  
  console.log('[TestMode] Clean logout complete');
};

/**
 * Get list of available test actions for the UI
 */
export interface TestAction {
  id: string;
  labelEn: string;
  labelRu: string;
  description: string;
  action: () => void | Promise<void>;
  destructive?: boolean;
}
