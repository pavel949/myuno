import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isFeatureEnabled, getAllFlags } from '@/lib/featureFlags';

describe('featureFlags', () => {
  beforeEach(() => {
    vi.stubGlobal('import.meta', { env: { DEV: true } });
  });

  describe('isFeatureEnabled', () => {
    it('returns true for enabled flags without restrictions', () => {
      expect(isFeatureEnabled('DARK_MODE')).toBe(true);
      expect(isFeatureEnabled('PWA_INSTALL_PROMPT')).toBe(true);
    });

    it('returns false for disabled flags', () => {
      expect(isFeatureEnabled('BETA_CHAT_V2')).toBe(false);
    });

    it('respects role restrictions', () => {
      // Without roles - should be false
      expect(isFeatureEnabled('AI_VENDOR_ACQUISITION', { userRoles: [] })).toBe(false);
      
      // With admin role - should be true
      expect(isFeatureEnabled('AI_VENDOR_ACQUISITION', { userRoles: ['admin'] })).toBe(true);
      
      // With uno_team role - should be true
      expect(isFeatureEnabled('AI_VENDOR_ACQUISITION', { userRoles: ['uno_team'] })).toBe(true);
    });

    it('handles unknown flags gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Testing unknown flag - cast to any to bypass type checking
      expect(isFeatureEnabled('UNKNOWN_FLAG' as any)).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[FeatureFlags] Unknown flag: UNKNOWN_FLAG');
      consoleSpy.mockRestore();
    });
  });

  describe('getAllFlags', () => {
    it('returns all flags with boolean values', () => {
      const flags = getAllFlags();
      
      expect(typeof flags.DARK_MODE).toBe('boolean');
      expect(typeof flags.AI_SMART_SEARCH).toBe('boolean');
      expect(typeof flags.STRIPE_PAYMENTS).toBe('boolean');
    });

    it('considers user context for role-restricted flags', () => {
      const flagsWithoutRoles = getAllFlags({ userRoles: [] });
      const flagsWithAdmin = getAllFlags({ userRoles: ['admin'] });
      
      expect(flagsWithoutRoles.AI_VENDOR_ACQUISITION).toBe(false);
      expect(flagsWithAdmin.AI_VENDOR_ACQUISITION).toBe(true);
    });
  });
});
