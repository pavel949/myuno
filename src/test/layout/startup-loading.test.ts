import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HTML startup loading', () => {
  const html = readFileSync('index.html', 'utf8');

  it('uses a genuine loading indicator without a decorative logo screen', () => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const status = document.querySelector('#root [role="status"]');
    expect(status?.classList.contains('uno-splash')).toBe(true);
    expect(status?.hasAttribute('data-myuno-bootstrap-splash')).toBe(true);
    expect(document.querySelectorAll('[data-myuno-bootstrap-splash]')).toHaveLength(1);
    expect(status?.getAttribute('aria-label')).toBe('Loading myUNO');
    expect(status?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.querySelector('.uno-boot')).toBeNull();
  });

  it('disables the boot indicator animation for reduced motion', () => {
    expect(html).toContain('@media (prefers-reduced-motion: reduce){.uno-splash svg{animation:none}}');
    expect(html).not.toContain('uno-boot-pulse');
  });
});
