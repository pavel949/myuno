import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'br', 'a', 'ul', 'ol', 'li', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g'],
    ALLOWED_ATTR: ['class', 'style', 'fill', 'viewBox', 'd', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'href', 'target', 'rel', 'xmlns'],
    ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g'],
    ADD_ATTR: ['viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'xmlns'],
  });
};

/**
 * Escapes text for safe insertion into HTML
 * @param text - The text to escape
 * @returns Escaped text safe for HTML insertion
 */
export const escapeHtml = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return '';
  const str = String(text);
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
};

/** Allowed URL protocols for img src in map popups (XSS prevention). */
const ALLOWED_IMAGE_PROTOCOLS = ['https:', 'http:', 'data:'];

function isAllowedImageUrl(url: string | null | undefined): boolean {
  if (url == null || url === '') return false;
  try {
    const base = typeof window !== 'undefined' ? window.location.href : 'https://myuno.app';
    const parsed = new URL(url, base);
    return ALLOWED_IMAGE_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Creates a safe popup HTML content for map markers
 * @param params - Object with name, rating, and price
 * @returns Sanitized HTML string
 */
export const createMapPopupHtml = (params: {
  name: string;
  rating?: number | null;
  price?: string;
  description?: string;
  image?: string;
}): string => {
  const escapedName = escapeHtml(params.name);
  const escapedRating = escapeHtml(params.rating);
  const escapedPrice = escapeHtml(params.price);
  const escapedDescription = escapeHtml(params.description);
  const safeImageUrl =
    params.image && isAllowedImageUrl(params.image)
      ? escapeHtml(params.image)
      : '';

  const html = `
    <div class="p-2 min-w-[180px] max-w-[220px]">
      ${safeImageUrl ? `
        <img
          src="${safeImageUrl}"
          alt="${escapedName}"
          class="w-full h-24 object-cover rounded-lg mb-2"
          onerror="this.style.display='none'"
        />
      ` : ''}
      <h3 class="font-bold text-sm text-gray-900 line-clamp-2">${escapedName}</h3>
      <div class="flex items-center gap-2 mt-1">
        ${params.rating ? `
          <span class="text-yellow-500 text-xs">★ ${escapedRating}</span>
        ` : ''}
        ${params.price ? `<span class="text-xs font-medium text-emerald-600">${escapedPrice}</span>` : ''}
      </div>
      ${params.description ? `<p class="text-xs text-gray-500 mt-1 line-clamp-2">${escapedDescription}</p>` : ''}
    </div>
  `;

  // Final sanitization pass on the assembled HTML
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'img', 'h3', 'span', 'p'],
    ALLOWED_ATTR: ['class', 'src', 'alt', 'onerror'],
  });
};
