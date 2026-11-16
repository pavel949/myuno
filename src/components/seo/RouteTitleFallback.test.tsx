import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteTitleFallback, fallbackTitleFromHeading } from './RouteTitleFallback';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

const BRAND = 'myUNO — your home and life in Phuket';

describe('fallbackTitleFromHeading', () => {
  it('uses the brand line when the page has no heading', () => {
    expect(fallbackTitleFromHeading(undefined, BRAND)).toBe(BRAND);
    expect(fallbackTitleFromHeading('   ', BRAND)).toBe(BRAND);
  });

  it('normalises whitespace and appends the brand suffix', () => {
    expect(fallbackTitleFromHeading('  Car\n rental ', BRAND)).toBe('Car rental | myUNO');
  });

  it('clips very long headings', () => {
    const title = fallbackTitleFromHeading('x'.repeat(200), BRAND);
    expect(title.endsWith('… | myUNO')).toBe(true);
    expect(title.length).toBeLessThanOrEqual(70 + ' | myUNO'.length);
  });
});

describe('RouteTitleFallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.head.innerHTML = '<title data-static-title>Static</title>';
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.head.innerHTML = '';
  });

  const staticTitle = () => document.head.querySelector('title[data-static-title]')?.textContent;

  it('titles a page from its H1 when the page declares no title', () => {
    render(<MemoryRouter initialEntries={['/transport']}><RouteTitleFallback /><main><h1>Transport</h1></main></MemoryRouter>);
    expect(staticTitle()).toBe(BRAND);
    act(() => { vi.advanceTimersByTime(250); });
    expect(staticTitle()).toBe('Transport | myUNO');
  });

  it('keeps the brand line when the page has no H1', () => {
    render(<MemoryRouter><RouteTitleFallback /><main><p>Cart</p></main></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(250); });
    expect(staticTitle()).toBe(BRAND);
  });
});
