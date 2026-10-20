import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LandingActionLink } from './LandingActionLink';
import { Button } from '@/components/ui/button';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
afterEach(cleanup);
describe('reviewed landing actions', () => {
  it('preserves a verified destination and its query and anchor', () => {
    render(<LandingActionLink href="/vendor/onboarding?persona=providers#application">Apply</LandingActionLink>);
    expect(screen.getByRole('link', { name: 'Apply' })).toHaveAttribute('href', '/vendor/onboarding?persona=providers#application');
  });
  it.each([['ru', 'Недоступно онлайн'], ['en', 'Unavailable online'], ['th', 'ยังไม่พร้อมใช้งานออนไลน์']])('marks an unavailable function in %s without navigation or activation', (language, label) => {
    state.language = language;
    const activate = vi.fn();
    render(<Button asChild><LandingActionLink href="/missing" availability="unavailable" onClick={activate}>Service</LandingActionLink></Button>);
    const entry = screen.getByRole('link', { name: `Service ${label}` });
    expect(entry).toHaveAttribute('aria-disabled', 'true');
    expect(entry).not.toHaveAttribute('href');
    expect(entry).not.toHaveAttribute('tabindex');
    fireEvent.click(entry);
    fireEvent.keyDown(entry, { key: 'Enter' });
    expect(activate).not.toHaveBeenCalled();
  });
  it('distinguishes unverified details from a functioning entity link', () => {
    state.language = 'en';
    render(<LandingActionLink href="/knowledge/pillars/unknown" availability="entity-unverified">Guide</LandingActionLink>);
    expect(screen.getByRole('link', { name: 'Guide Details not verified' })).not.toHaveAttribute('href');
  });
});
