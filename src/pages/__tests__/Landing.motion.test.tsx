import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const language = vi.hoisted(() => ({ current: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: language.current }),
}));
vi.mock('@/components/nav/ConsumerHeader', () => ({ ConsumerHeader: () => null }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/legal/LegalEntityInfo', () => ({ LegalCopyright: () => null }));
vi.mock('@/components/concierge/ConciergeHelpSheet', () => ({ ConciergeHelpSheet: () => null }));
vi.mock('@/components/home/HomeDiscoverySearch', () => ({ HomeDiscoverySearch: () => null }));

// Navigation composition is covered by Landing.anonymous-home.test.tsx.
vi.mock('@/components/nav/BottomBar', () => ({ BottomBar: () => null }));

import Landing from '../Landing';

let reducedMotion = false;
let mediaListeners: Set<(event: MediaQueryListEvent) => void>;

function changeReducedMotion(matches: boolean) {
  act(() => {
    reducedMotion = matches;
    mediaListeners.forEach(listener => listener({ matches } as MediaQueryListEvent));
  });
}

function renderLanding() {
  const { container } = render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Landing /></MemoryRouter>);
  return container.querySelector<HTMLImageElement>('.home-hero-image')!;
}

function loadHero(image: HTMLImageElement) {
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1920 });
  fireEvent.load(image);
}

function animationEvent(image: HTMLImageElement, type: string, name = 'home-drift') {
  // jsdom has no native AnimationEvent constructor or CSS animation engine.
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: name });
  fireEvent(image, event);
}

const startAnimation = (image: HTMLImageElement, name?: string) => animationEvent(image, 'animationstart', name);

beforeEach(() => {
  language.current = 'en';
  reducedMotion = false;
  mediaListeners = new Set();
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    get matches() { return reducedMotion; },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_type, listener) => mediaListeners.add(listener as (event: MediaQueryListEvent) => void),
    removeEventListener: (_type, listener) => mediaListeners.delete(listener as (event: MediaQueryListEvent) => void),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Landing hero motion', () => {
  it('waits for both a loaded photo and its real CSS animation start', () => {
    const image = renderLanding();
    expect(image).not.toHaveClass('is-motion-enabled');
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();

    loadHero(image);
    expect(image).toHaveClass('is-motion-enabled');
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();

    startAnimation(image, 'another-animation');
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();
    startAnimation(image);
    expect(screen.getByRole('button', { name: 'Pause motion' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('pauses and resumes the photo without removing or restarting its animation', () => {
    const image = renderLanding();
    loadHero(image);
    startAnimation(image);
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }));
    expect(image).toHaveClass('is-motion-enabled', 'is-paused');
    expect(screen.getByRole('button', { name: 'Resume motion' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Resume motion' }));
    expect(image).toHaveClass('is-motion-enabled');
    expect(image).not.toHaveClass('is-paused');
    expect(screen.getByRole('button', { name: 'Pause motion' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not animate an unsuccessful load', () => {
    const image = renderLanding();
    fireEvent.load(image); // naturalWidth is zero for an unavailable image.
    expect(image).not.toHaveClass('is-motion-enabled');
    startAnimation(image);
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();
  });

  it('removes motion and its control when the photo fails', () => {
    const image = renderLanding();
    loadHero(image);
    startAnimation(image);
    fireEvent.error(image);
    expect(image).not.toHaveClass('is-motion-enabled');
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();
  });

  it.each(['animationcancel', 'animationend'])('hides the control when the animation stops (%s)', type => {
    const image = renderLanding();
    loadHero(image);
    startAnimation(image);
    animationEvent(image, type);
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();
  });

  it('handles a cached image whose load event preceded mounting', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1920);
    const image = renderLanding();
    expect(image).toHaveClass('is-motion-enabled');
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();
    startAnimation(image);
    expect(screen.getByRole('button', { name: 'Pause motion' })).toBeInTheDocument();
  });

  it('keeps the photo static and omits the control for reduced motion', () => {
    reducedMotion = true;
    const image = renderLanding();
    loadHero(image);
    expect(image).not.toHaveClass('is-motion-enabled');
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();
  });

  it('responds to motion-preference changes and waits for the restarted animation', () => {
    const image = renderLanding();
    loadHero(image);
    startAnimation(image);
    changeReducedMotion(true);
    expect(image).not.toHaveClass('is-motion-enabled');
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();

    changeReducedMotion(false);
    expect(image).toHaveClass('is-motion-enabled');
    expect(screen.queryByRole('button', { name: 'Pause motion' })).not.toBeInTheDocument();
    startAnimation(image);
    expect(screen.getByRole('button', { name: 'Pause motion' })).toBeInTheDocument();
  });

  it('preserves an explicit pause across reduced-motion preference changes', () => {
    const image = renderLanding();
    loadHero(image);
    startAnimation(image);
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }));
    changeReducedMotion(true);
    changeReducedMotion(false);
    startAnimation(image);
    expect(image).toHaveClass('is-paused');
    expect(screen.getByRole('button', { name: 'Resume motion' })).toBeInTheDocument();
  });

  it.each([
    ['ru', 'Остановить движение', 'Включить движение'],
    ['th', 'หยุดภาพเคลื่อนไหว', 'เปิดภาพเคลื่อนไหว'],
  ])('keeps pause and resume labels localized in %s', (locale, pause, resume) => {
    language.current = locale;
    const image = renderLanding();
    loadHero(image);
    startAnimation(image);
    fireEvent.click(screen.getByRole('button', { name: pause }));
    expect(screen.getByRole('button', { name: resume })).toBeInTheDocument();
  });
});
