import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'br', 'svg', 'path'],
    ALLOWED_ATTR: ['class', 'style', 'fill', 'viewBox', 'd', 'fill-rule', 'clip-rule'],
    USE_PROFILES: { html: true },
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
}): string => {
  const escapedName = escapeHtml(params.name);
  const escapedRating = escapeHtml(params.rating);
  const escapedPrice = escapeHtml(params.price);
  const escapedDescription = escapeHtml(params.description);

  return `
    <div class="p-2 min-w-[150px]">
      <h3 class="font-bold text-sm text-gray-900">${escapedName}</h3>
      ${params.rating ? `
        <div class="flex items-center gap-1 mt-1">
          <span class="text-yellow-500">★</span>
          <span class="text-xs text-gray-600">${escapedRating}</span>
        </div>
      ` : ''}
      ${params.price ? `<p class="text-xs text-primary mt-1">${escapedPrice}</p>` : ''}
      ${params.description ? `<p class="text-xs text-muted-foreground mt-1">${escapedDescription}</p>` : ''}
    </div>
  `;
};
