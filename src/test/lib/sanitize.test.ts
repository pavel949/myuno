import { describe, it, expect } from 'vitest';
import { createMapPopupHtml, sanitizeHtml } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('allows safe HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello <strong>World</strong></p>');
  });

  it('removes script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello</p>');
  });

  it('removes onclick handlers', () => {
    const input = '<div onclick="alert(1)">Click me</div>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<div>Click me</div>');
  });

  it('removes javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('allows class and style attributes', () => {
    const input = '<div class="test" style="color: red">Text</div>';
    const result = sanitizeHtml(input);
    expect(result).toContain('class="test"');
    expect(result).toContain('style="color: red"');
  });

  it('allows SVG elements with safe attributes', () => {
    const input = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/></svg>';
    const result = sanitizeHtml(input);
    expect(result).toContain('svg');
    expect(result).toContain('path');
    expect(result).toContain('viewBox');
  });

  it('handles empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('handles plain text', () => {
    const input = 'Just some text without HTML';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('keeps raw-text and SVG attack markup inert after HTML reparsing', () => {
    const input = '<style></style><img src=x onerror="alert(1)">' +
      '<svg><g onload="alert(1)"><script>alert(1)</script></g></svg>';
    const container = document.createElement('div');
    container.innerHTML = sanitizeHtml(input);

    expect(container.querySelector('script, style, img, [onerror], [onload]')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('escapes map-popup fields without turning user text into HTML', () => {
    const container = document.createElement('div');
    container.innerHTML = createMapPopupHtml({
      name: '<img src=x onerror="alert(1)">',
      description: '<svg onload="alert(1)"></svg>',
      price: '<script>alert(1)</script>',
    });

    expect(container.querySelector('img, svg, script, [onerror], [onload]')).toBeNull();
    expect(container.querySelector('h3')?.textContent).toBe('<img src=x onerror="alert(1)">');
  });

  it('retains a safe map image while blocking injected image attributes', () => {
    const container = document.createElement('div');
    container.innerHTML = createMapPopupHtml({
      name: 'Safe name',
      image: 'https://example.com/image.png" onerror="alert(1)',
    });

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://example.com/image.png" onerror="alert(1)',
    );
    expect(container.querySelector('[onerror]')).toBeNull();
  });
});
