import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ForBusinessPage from '../ForBusinessPage';
import { LEGAL_SERVICES } from '@/lib/landings/legalServices';
import { PUBLIC_CONTENT_LAYOUT } from '@/design-system/ecosystemLayout';

const state = vi.hoisted(() => ({ language: 'ru', write: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.write } }));
afterEach(cleanup);

describe('business entry routes', () => {
  it.each(['ru', 'en', 'th'])('provides the existing consultation routes in %s without writing data', (language) => {
    state.language = language;
    render(<HelmetProvider><MemoryRouter><ForBusinessPage /></MemoryRouter></HelmetProvider>);
    const links = screen.getAllByRole('link').map(link => link.getAttribute('href'));
    expect(links).toContain('/legal/company');
    expect(links).toContain('/legal/tax');
    expect(links).toContain('/legal');
    expect(state.write).not.toHaveBeenCalled();
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toHaveClass('h-4', 'w-4', 'min-h-4', 'shrink-0', 'focus-visible:ring-2');
    }
  });
  it('does not promote nominee ownership or unverified fixed formation fees', () => {
    const copy = JSON.stringify(LEGAL_SERVICES.company);
    expect(copy).not.toMatch(/номинал|nominee|นอมินี|35,000|35 000/iu);
    expect(LEGAL_SERVICES.company.bullets.en).toContain('Legal review of the proposed ownership structure');
  });
  it.each(['ru', 'en', 'th'])('keeps the measured consultation anchor and narrow shared frame in %s', language => {
    state.language = language;
    const { container } = render(<HelmetProvider><MemoryRouter><ForBusinessPage /></MemoryRouter></HelmetProvider>);
    const form = container.querySelector<HTMLElement>('#b2b-inquiry-form')!;
    const scroll = vi.fn();
    form.scrollIntoView = scroll;
    expect(form).toHaveClass('max-w-2xl', 'scroll-mt-[calc(var(--consumer-header-height,0px)+1rem)]');
    expect(form).not.toHaveClass('max-w-[1280px]');
    const hero = container.querySelector('section')!;
    expect(hero.querySelector('.max-w-3xl')).not.toBeNull();
    for (const token of PUBLIC_CONTENT_LAYOUT.marketing.split(' ')) expect(hero.firstElementChild).toHaveClass(token);
    const actions = hero.querySelectorAll('button');
    expect(actions).toHaveLength(2);
    expect(actions[0].parentElement).toHaveClass('sm:flex-wrap');
    for (const action of actions) expect(action).toHaveClass('whitespace-normal', 'h-auto', 'max-w-full');
    fireEvent.click(actions[0]);
    expect(scroll).toHaveBeenCalledOnce();
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(state.write).not.toHaveBeenCalled();
  });
});
