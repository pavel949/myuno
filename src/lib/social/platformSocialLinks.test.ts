import { describe, expect, it } from 'vitest';
import { EMPTY_SOCIAL_LINKS, normalizeSocialUrl, readSocialLinks } from './platformSocialLinks';

describe('public platform social profiles', () => {
  it.each([
    ['youtube', 'https://www.youtube.com/@myuno?utm_source=test#about', 'https://www.youtube.com/@myuno'],
    ['instagram', 'https://instagram.com/myuno.app/', 'https://instagram.com/myuno.app'],
    ['linkedin', 'https://www.linkedin.com/company/myuno/', 'https://www.linkedin.com/company/myuno'],
    ['facebook', 'https://www.facebook.com/myuno?ref=test', 'https://www.facebook.com/myuno'],
    ['facebook', 'https://facebook.com/profile.php?id=123456&tracking=remove', 'https://facebook.com/profile.php?id=123456'],
    ['facebook', 'https://www.facebook.com/people/MyUNO/123456/', 'https://www.facebook.com/people/MyUNO/123456'],
  ] as const)('normalizes %s profile URL', (network, raw, expected) => expect(normalizeSocialUrl(network, raw)).toBe(expected));
  it.each([
    ['youtube', 'javascript:alert(1)'], ['youtube', 'https://youtube.com.evil.example/@x'],
    ['youtube', 'https://youtube.com/redirect?url=https://example.com'], ['youtube', 'https://user:password@youtube.com/@x'],
    ['instagram', 'https://youtube.com/@x'], ['instagram', 'http://instagram.com/x'],
    ['instagram', 'https://instagram.com/p'], ['linkedin', 'https://www.linkedin.com/'],
    ['linkedin', 'https://linkedin.com:8443/company/x'],
    ['facebook', 'https://facebook.com.evil.example/myuno'],
    ['facebook', 'https://facebook.com/l.php?u=https://evil.example'],
    ['facebook', 'https://facebook.com/profile.php'],
    ['facebook', 'https://facebook.com/profile.php?id=not-a-number'],
    ['facebook', 'https://facebook.com/'],
  ] as const)('rejects unsafe or non-profile %s URL %s', (network, raw) => expect(normalizeSocialUrl(network, raw)).toBeNull());
  it('allows clearing and reads no fabricated profiles', () => {
    expect(normalizeSocialUrl('youtube', '  ')).toBe('');
    expect(readSocialLinks({})).toEqual(EMPTY_SOCIAL_LINKS);
    expect(readSocialLinks({ youtube: 'https://youtube.com/@x' }).instagram).toBe('');
  });
  it.each([null, [], 'bad', { instagram: false }, { unknown: 'private' }])('rejects malformed stored metadata %j', value => expect(() => readSocialLinks(value)).toThrow());
});
