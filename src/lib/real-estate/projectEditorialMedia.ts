export type ProjectMedia = {
  cover_image?: string | null;
  gallery_urls?: string[] | null;
  images?: string[] | null;
  video_url?: string | null;
};

export function projectGalleryField(media: ProjectMedia): 'gallery_urls' | 'images' {
  return Array.isArray(media.gallery_urls) ? 'gallery_urls' : 'images';
}

const photoExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
const projectUpload = /^\/storage\/v1\/object\/public\/vendor-uploads\/[a-z0-9-]+\/projects(?:-covers)?\/[a-z0-9._-]+$/i;
const publicPropertyImage = /^\/storage\/v1\/object\/public\/property-images\/[a-z0-9._/-]+$/i;

export function publicProjectMediaUrl(value?: string | null, kind: 'photo' | 'cover' | 'video' = 'photo'): string | null {
  const url = value?.trim();
  if (!url || url.includes('\\') || Array.from(url).some(char => char.charCodeAt(0) <= 32)) return null;
  if (kind !== 'video' && /^\/[a-z0-9._/-]+$/i.test(url) && !url.startsWith('//') && !url.includes('..') && photoExtension.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port || parsed.hash) return null;
    if (kind === 'video') {
      const host = parsed.hostname;
      if (host === 'www.youtube.com' || host === 'youtube.com') {
        if (parsed.pathname === '/watch' && [...parsed.searchParams.keys()].join('') === 'v' &&
            /^[\w-]{11}$/.test(parsed.searchParams.get('v') ?? '')) return url;
        return !parsed.search && /^\/(?:shorts|embed)\/[\w-]{11}$/.test(parsed.pathname) ? url : null;
      }
      if (parsed.search) return null;
      if (host === 'youtu.be') return /^\/[\w-]{11}$/.test(parsed.pathname) ? url : null;
      if (host === 'vimeo.com' || host === 'www.vimeo.com') return /^\/\d+$/.test(parsed.pathname) ? url : null;
      if (host === 'player.vimeo.com') return /^\/video\/\d+$/.test(parsed.pathname) ? url : null;
      return null;
    }
    if (parsed.search || !photoExtension.test(parsed.pathname) || /%|\.\./.test(parsed.pathname)) return null;
    if (parsed.hostname === 'myuno.app' || parsed.hostname === 'www.myuno.app') return /^\/(?:assets|images|catalog)\//.test(parsed.pathname) ? url : null;
    return /^[a-z0-9]+\.supabase\.co$/.test(parsed.hostname) &&
      (projectUpload.test(parsed.pathname) || (kind === 'cover' && publicPropertyImage.test(parsed.pathname))) ? url : null;
  } catch {
    return null;
  }
}

export function projectEditorialImages(media: ProjectMedia): string[] {
  const gallery = (media[projectGalleryField(media)] ?? []).map(url => publicProjectMediaUrl(url));
  return [...new Set([publicProjectMediaUrl(media.cover_image, 'cover'), ...gallery].filter((url): url is string => !!url))];
}

export function reorderProjectImages(images: string[], index: number, offset: -1 | 1): string[] {
  const destination = index + offset;
  if (!Number.isInteger(index) || index < 0 || index >= images.length || destination < 0 || destination >= images.length) return images;
  const next = [...images];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}
