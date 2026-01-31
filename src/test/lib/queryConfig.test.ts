import { describe, it, expect } from 'vitest';
import { TIME, CACHE_PROFILES, queryKeys } from '@/lib/queryConfig';

describe('queryConfig', () => {
  describe('TIME utilities', () => {
    it('calculates seconds correctly', () => {
      expect(TIME.SECONDS(1)).toBe(1000);
      expect(TIME.SECONDS(30)).toBe(30000);
    });

    it('calculates minutes correctly', () => {
      expect(TIME.MINUTES(1)).toBe(60000);
      expect(TIME.MINUTES(5)).toBe(300000);
    });

    it('calculates hours correctly', () => {
      expect(TIME.HOURS(1)).toBe(3600000);
      expect(TIME.HOURS(24)).toBe(86400000);
    });
  });

  describe('CACHE_PROFILES', () => {
    it('has correct STATIC profile settings', () => {
      expect(CACHE_PROFILES.STATIC.staleTime).toBe(TIME.MINUTES(5));
      expect(CACHE_PROFILES.STATIC.gcTime).toBe(TIME.MINUTES(30));
      expect(CACHE_PROFILES.STATIC.refetchOnWindowFocus).toBe(false);
    });

    it('has correct REALTIME profile settings', () => {
      expect(CACHE_PROFILES.REALTIME.staleTime).toBe(TIME.SECONDS(30));
      expect(CACHE_PROFILES.REALTIME.gcTime).toBe(TIME.MINUTES(2));
      expect(CACHE_PROFILES.REALTIME.refetchOnWindowFocus).toBe(true);
    });

    it('has correct DYNAMIC profile settings', () => {
      expect(CACHE_PROFILES.DYNAMIC.staleTime).toBe(TIME.MINUTES(1));
      expect(CACHE_PROFILES.DYNAMIC.refetchOnWindowFocus).toBe(true);
    });
  });

  describe('queryKeys factories', () => {
    it('generates user query keys correctly', () => {
      expect(queryKeys.user.all).toEqual(['user']);
      expect(queryKeys.user.profile('123')).toEqual(['profile', '123']);
      expect(queryKeys.user.roles('456')).toEqual(['user-roles', '456']);
    });

    it('generates property query keys correctly', () => {
      expect(queryKeys.properties.all).toEqual(['properties']);
      expect(queryKeys.properties.detail('prop-1')).toEqual(['property', 'prop-1']);
      expect(queryKeys.properties.list({ type: 'villa' })).toEqual(['properties', { type: 'villa' }]);
    });

    it('generates booking query keys correctly', () => {
      expect(queryKeys.bookings.all).toEqual(['bookings']);
      expect(queryKeys.bookings.detail('book-1')).toEqual(['booking', 'book-1']);
    });

    it('generates notification query keys correctly', () => {
      expect(queryKeys.notifications.list('user-1')).toEqual(['notifications', 'user-1']);
      expect(queryKeys.notifications.preferences('user-1')).toEqual(['notification-preferences', 'user-1']);
    });
  });
});
