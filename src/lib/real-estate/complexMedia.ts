/** Accept stored web media only; never substitute invented project imagery. */
export function complexMediaUrl(value?: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

export function complexVideoSource(value?: string | null): { url: string; kind: 'file' | 'embed' | 'link' } | null {
  const safe = complexMediaUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return { url: safe, kind: 'file' };
  const host = url.hostname.replace(/^www\./, '');
  const youtubeId = host === 'youtu.be' ? url.pathname.slice(1) :
    ['youtube.com', 'm.youtube.com'].includes(host) ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] : null;
  if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) return { url: `https://www.youtube-nocookie.com/embed/${youtubeId}`, kind: 'embed' };
  if (host === 'vimeo.com' && /^\/\d+$/.test(url.pathname)) return { url: `https://player.vimeo.com/video${url.pathname}`, kind: 'embed' };
  return { url: safe, kind: 'link' };
}

