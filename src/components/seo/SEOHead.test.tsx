import { readFileSync } from 'node:fs';
import { render, waitFor, cleanup } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SEOHead } from './SEOHead';
const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
afterEach(() => { locale.language = 'en'; cleanup(); document.head.innerHTML = ''; window.history.replaceState({}, '', '/'); });
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

it.each([['en', 'en_US'], ['ru', 'ru_RU'], ['th', 'th_TH']])('keeps actual %s page language for assistive technology', async (language, ogLocale) => {
 locale.language = language;
 render(<HelmetProvider><SEOHead title="Localized page" description="Localized description" /></HelmetProvider>);
 await waitFor(() => expect(document.documentElement.lang).toBe(language));
 expect(document.head.querySelector('meta[property="og:locale"]')).toHaveAttribute('content', ogLocale);
 expect([...document.head.querySelectorAll('meta[property="og:locale:alternate"]')].map(node => node.getAttribute('content'))).toEqual(['en_US', 'ru_RU', 'th_TH'].filter(value => value !== ogLocale));
});
