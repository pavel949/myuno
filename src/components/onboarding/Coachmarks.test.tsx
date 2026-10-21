import React from 'react';
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Coachmarks } from './Coachmarks';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

const STORAGE_KEY = 'myuno.coach.home_v2';

function Fixture({ finalTarget = true }: { finalTarget?: boolean }) {
  return <>
    <div data-coach="why-chip">Role</div>
    <div data-coach="next-best-action">Action</div>
    {finalTarget && <div data-coach="all-apps">Apps</div>}
    <Coachmarks />
  </>;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
  localStorage.clear();
  document.body.style.overflow = 'auto';
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function openTour() {
  act(() => { vi.advanceTimersByTime(400); });
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(document.body.style.overflow).toBe('hidden');
}

describe('Coachmarks target lifecycle', () => {
  it('completes without a hook-order failure when the last target is absent', () => {
    render(<Fixture finalTarget={false} />);
    openTour();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('What to do now')).toBeTruthy();
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Next' }))).not.toThrow();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ completed_at: Date.now() });
    expect(document.body.style.overflow).toBe('auto');
  });

  it('survives a final-target removal and measurement rerender, retaining completion persistence', () => {
    const view = render(<Fixture />);
    openTour();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('All apps at hand')).toBeTruthy();
    view.rerender(<Fixture finalTarget={false} />);
    expect(() => fireEvent(window, new Event('resize'))).not.toThrow();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ completed_at: Date.now() });
    expect(document.body.style.overflow).toBe('auto');
    view.unmount();
    render(<Fixture />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the normal final confirmation action and restores body scrolling', () => {
    render(<Fixture />);
    openTour();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ completed_at: Date.now() });
    expect(document.body.style.overflow).toBe('auto');
  });
});



describe('Coachmarks missing target safety', () => {
  it('skips a missing first target and shows an actionable next step', () => {
    render(<><div data-coach="next-best-action">Action</div><div data-coach="all-apps">Apps</div><Coachmarks /></>);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByRole('dialog', { name: 'What to do now' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close tip' })).toBeTruthy();
  });

  it('skips a missing middle target without an empty overlay', () => {
    render(<><div data-coach="why-chip">Role</div><div data-coach="all-apps">Apps</div><Coachmarks /></>);
    openTour();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'All apps at hand' })).toBeTruthy();
  });

  it('never blocks the page when every target is missing', () => {
    render(<Coachmarks />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('allows Escape to dismiss and restores scrolling', () => {
    render(<Fixture />);
    openTour();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ dismissed_at: Date.now() });
  });
});
