export const PLATFORM_SOCIAL_SETTING = 'org_social_links';
export const PLATFORM_SOCIAL_QUERY_KEY = ['platform-social-links'] as const;
export const SOCIAL_NETWORKS = ['youtube', 'instagram', 'linkedin'] as const;
export type SocialNetwork = typeof SOCIAL_NETWORKS[number];
export type PlatformSocialLinks = Record<SocialNetwork, string>;
export const EMPTY_SOCIAL_LINKS: PlatformSocialLinks = { youtube: '', instagram: '', linkedin: '' };
export const SOCIAL_LABELS: Record<SocialNetwork, string> = { youtube: 'YouTube', instagram: 'Instagram', linkedin: 'LinkedIn' };

/** Public profile URLs only; no credentials, redirects, executable protocols or lookalike hosts. */
export function normalizeSocialUrl(network: SocialNetwork, raw: string): string | null {
  if (!raw.trim()) return '';
  if (raw.length > 2048) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const path = url.pathname.replace(/\/+$/, '');
    if (network === 'youtube' && (!['youtube.com', 'm.youtube.com'].includes(host) || !/^\/(?:@[^/]+|(?:channel|c|user)\/[^/]+)$/.test(path))) return null;
    if (network === 'instagram' && (host !== 'instagram.com' || !/^\/[A-Za-z0-9._]+$/.test(path) || /^\/(?:p|reel|reels|explore|accounts|direct)$/i.test(path))) return null;
    if (network === 'linkedin' && (host !== 'linkedin.com' || !/^\/(?:company|in|school)\/[^/]+$/.test(path))) return null;
    url.search = ''; url.hash = ''; url.pathname = path;
    return url.href;
  } catch { return null; }
}

export function readSocialLinks(value: unknown): PlatformSocialLinks {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !SOCIAL_NETWORKS.includes(key as SocialNetwork))) throw new Error('Invalid social links setting');
  const result = { ...EMPTY_SOCIAL_LINKS };
  for (const network of SOCIAL_NETWORKS) {
    const raw = (value as Record<string, unknown>)[network];
    if (raw !== undefined && typeof raw !== 'string') throw new Error('Invalid social link');
    result[network] = typeof raw === 'string' ? raw : '';
  }
  return result;
}
