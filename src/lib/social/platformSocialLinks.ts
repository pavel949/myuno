export const PLATFORM_SOCIAL_SETTING = 'org_social_links';
export const PLATFORM_SOCIAL_QUERY_KEY = ['platform-social-links'] as const;
export const SOCIAL_NETWORKS = ['youtube', 'instagram', 'linkedin', 'facebook'] as const;
export type SocialNetwork = typeof SOCIAL_NETWORKS[number];
export type PlatformSocialLinks = Record<SocialNetwork, string>;
export const EMPTY_SOCIAL_LINKS: PlatformSocialLinks = { youtube: '', instagram: '', linkedin: '', facebook: '' };
export const SOCIAL_LABELS: Record<SocialNetwork, string> = { youtube: 'YouTube', instagram: 'Instagram', linkedin: 'LinkedIn', facebook: 'Facebook' };

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
    let facebookId = '';
    if (network === 'facebook') {
      if (!['facebook.com', 'm.facebook.com', 'web.facebook.com'].includes(host)) return null;
      if (path === '/profile.php') {
        facebookId = url.searchParams.get('id') || '';
        if (!/^\d+$/.test(facebookId)) return null;
      } else {
        const vanity = /^\/[A-Za-z0-9._-]+$/.test(path) && !/^\/(?:login|logout|settings|help|watch|reel|reels|marketplace|share|sharer|sharer.php|l.php|dialog|plugins|photo|photos|video|videos|story.php|permalink.php|events|groups|pages|people|home.php|profile.php|privacy|policies|business|notifications|friends)$/i.test(path);
        const namedPage = /^\/(?:people|pages)\/[^/]+\/\d+$/.test(path);
        if (!vanity && !namedPage) return null;
      }
    }
    url.search = ''; if (facebookId) url.searchParams.set('id', facebookId);
    url.hash = ''; url.pathname = path;
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
