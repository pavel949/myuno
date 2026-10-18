import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ForBusinessPage from '../ForBusinessPage';
import { LEGAL_SERVICES } from '@/lib/landings/legalServices';

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
  });
  it('does not promote nominee ownership or unverified fixed formation fees', () => {
    const copy = JSON.stringify(LEGAL_SERVICES.company);
    expect(copy).not.toMatch(/номинал|nominee|นอมินี|35,000|35 000/iu);
    expect(LEGAL_SERVICES.company.bullets.en).toContain('Legal review of the proposed ownership structure');
  });
});
