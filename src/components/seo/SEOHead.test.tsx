import { readFileSync } from 'node:fs';
import { render, waitFor, cleanup } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SEOHead } from './SEOHead';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(() => { cleanup(); document.head.innerHTML = ''; window.history.replaceState({}, '', '/'); });
describe('route metadata replaces the static homepage fallback', () => {
  it.each(['/discover', '/property', '/newbuilds', '/legal'])('has one route canonical and description at %s', async path => {
    const shell = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html');
    for (const node of shell.querySelectorAll('link[rel="canonical"], meta[name="description"]')) document.head.appendChild(document.importNode(node, true));
    window.history.replaceState({}, '', `${path}?q=private#details`);
    render(<HelmetProvider><SEOHead title="Published catalogue" description="Explore published offerings." /></HelmetProvider>);
    await waitFor(() => expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', `https://www.myuno.app${path}`));
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', 'Explore published offerings.');
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});
