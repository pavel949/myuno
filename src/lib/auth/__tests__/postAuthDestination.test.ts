import { describe, expect, it } from 'vitest';
import { postAuthDestination } from '../postAuthDestination';
import { buildAuthPath, sanitizeAuthReturnPath } from '../redirectToAuth';

const base = { redirectPath: '/', activeRole: 'user' as const, availableRoles: ['user'] as const, needsAccountType: false, isMCPortal: false };
const resolve = (options: Partial<Parameters<typeof postAuthDestination>[0]> = {}) => postAuthDestination({ ...base, availableRoles: ['user'], ...options });

describe('post-login employee continuation', () => {
  it('routes an invited MC staff member to the property workspace using existing context selection', () => {
    expect(resolve({ needsAccountType: true, hasMCMembership: true, availableRoles: ['user', 'property_manager'] })).toEqual({ path: '/mc/properties', activateRole: 'property_manager' });
  });
  it('does not infer MC membership from a standalone role label', () => {
    expect(resolve({ needsAccountType: true, availableRoles: ['user', 'property_manager'] })).toEqual({ path: '/auth/account-type' });
  });
  it('routes a platform content employee to team content, never admin/vendor', () => {
    expect(resolve({ needsAccountType: true, availableRoles: ['user', 'uno_team'] })).toEqual({ path: '/team/content', activateRole: 'uno_team' });
  });
  it('keeps a property deep link after employee context activation', () => {
    expect(resolve({ needsAccountType: true, hasMCMembership: true, availableRoles: ['property_manager'], redirectPath: '/mc/properties/p/editor?tab=photos#media' })).toEqual({ path: '/mc/properties/p/editor?tab=photos#media', activateRole: 'property_manager' });
  });
  it('does not assign any employee identity to an ordinary new account', () => {
    expect(resolve({ needsAccountType: true, redirectPath: '/property/p' })).toEqual({ path: '/auth/account-type?redirect=%2Fproperty%2Fp' });
  });
  it('respects an established customer context instead of forcing a work role', () => {
    expect(resolve({ availableRoles: ['user', 'uno_team', 'staff'] })).toEqual({ path: '/', activateRole: undefined });
  });
  it('keeps the established work context without another write', () => {
    expect(resolve({ activeRole: 'uno_team', needsAccountType: true, availableRoles: ['user', 'uno_team'] })).toEqual({ path: '/team/content', activateRole: undefined });
  });
});

describe('auth return paths', () => {
  it('accepts legacy router Location objects without losing query/hash', () => {
    expect(sanitizeAuthReturnPath({ pathname: '/mc/properties/p/editor', search: '?tab=media', hash: '#photos' })).toBe('/mc/properties/p/editor?tab=media#photos');
  });
  it('persists a guarded path in the URL for reload and OAuth round trips', () => {
    expect(buildAuthPath({ from: '/mc/properties/p/editor?tab=media' })).toBe('/auth?redirect=%2Fmc%2Fproperties%2Fp%2Feditor%3Ftab%3Dmedia');
  });
  it.each(['https://evil.example/mc', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '/auth', '/auth/setup-password?redirect=/mc', '/auth/callback', {}, null])('rejects an external, invalid or looping target: %s', target => {
    expect(sanitizeAuthReturnPath(target)).toBe('/');
  });
});
