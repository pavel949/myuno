import { publicProjectMediaUrl } from './projectEditorialMedia';

const publicFile = /\.(?:pdf|avif|gif|jpe?g|png|webp|docx|xlsx|pptx)$/i;
const firstPartyPath = /^\/(?:assets|images|catalog)\/[a-z0-9._/-]+$/i;

/** This only validates the renderable URL. Document visibility is checked separately. */
export function projectPublicDocumentUrl(value: string | null | undefined, publicDoc?: { projectId: string; category: string }): string | null {
  const url = value?.trim();
  if (!url || url.includes('\\') || url.includes('..') || Array.from(url).some(char => char.charCodeAt(0) <= 32)) return null;
  if (firstPartyPath.test(url) && publicFile.test(url)) return url;
  const image = publicProjectMediaUrl(url);
  if (image) return image;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port || parsed.hash || !publicFile.test(parsed.pathname)) return null;
    if (['myuno.app', 'www.myuno.app'].includes(parsed.hostname)) {
      return !parsed.search && firstPartyPath.test(parsed.pathname) ? url : null;
    }
    if (!publicDoc || !/^[a-z0-9]+\.supabase\.co$/.test(parsed.hostname)) return null;
    const [, projectId, category, file] = /^\/storage\/v1\/object\/sign\/project-documents\/([a-z0-9-]+)\/([a-z_]+)\/([a-z0-9._-]+)$/i.exec(parsed.pathname) ?? [];
    if (!file || projectId !== publicDoc.projectId || category !== publicDoc.category) return null;
    const params = [...parsed.searchParams.entries()];
    return params.length === 1 && params[0][0] === 'token' && /^[A-Za-z0-9._-]+$/.test(params[0][1]) ? url : null;
  } catch {
    return null;
  }
}
