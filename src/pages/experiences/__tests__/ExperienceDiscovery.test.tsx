import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ExperienceDetail from '../ExperienceDetail';
import ExperienceBooking from '../ExperienceBooking';

const state = vi.hoisted(() => ({ language: 'en', source: 'https://operator.example/programme', pricing: vi.fn(), order: vi.fn(), availability: vi.fn(), redirect: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null, isLoading: false }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: String }) }));
vi.mock('@/hooks/useExperiences', () => ({ useExperience: () => ({ experience: { id: 'synthetic', discovery_only: true, title_en: 'Jungle discovery', title_ru: 'Прогулка в джунглях', description_en: 'Operator programme', description_ru: 'Программа оператора', cover_image: 'https://operator.example/photo.webp', source_page_url: state.source, price: 9999 }, isLoading: false }), formatDuration: vi.fn(), getDifficultyColor: vi.fn() }));
vi.mock('@/hooks/useExperiencePricing', () => ({ useExperiencePricing: (id?: string) => { state.pricing(id); return { data: [{ price_thb: 9999 }] }; } }));
vi.mock('@/hooks/useOrders', () => ({ useOrders: () => ({ createOrder: state.order }) }));
vi.mock('@/hooks/useAvailabilityCheck', () => ({ useAvailabilityCheck: () => ({ checkTourAvailability: state.availability }) }));
vi.mock('@/lib/auth/redirectToAuth', () => ({ redirectToAuth: state.redirect }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: ({ children, title }: { children: React.ReactNode; title: string }) => <main><h1>{title}</h1>{children}</main> }));
vi.mock('@/components/ui/optimized-image', () => ({ OptimizedImage: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
vi.mock('@/components/crosssell', () => ({ CrossSellSection: () => null, RelatedServicesSection: () => null }));
vi.mock('@/components/booking', () => ({}));
vi.mock('@/components/vertical-wizard/InquiryForm', () => ({ InquiryForm: ({ open, listingId, entryPoint }: { open: boolean; listingId: string; entryPoint: string }) => open ? <div role="dialog" data-listing={listingId} data-entry={entryPoint}>myUNO inquiry</div> : null }));
beforeEach(() => { vi.clearAllMocks(); state.language = 'en'; state.source = 'https://operator.example/programme'; });
afterEach(cleanup);
it.each(['en', 'ru', 'th'])('shows editorial information and concierge inquiry in %s, without inherited tariff options', language => {
  state.language = language;
  render(<MemoryRouter><ExperienceDetail /></MemoryRouter>);
  expect(screen.queryByRole('link')).toBeNull();
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('dialog')).toHaveAttribute('data-listing', 'synthetic');
  expect(screen.getByRole('dialog')).toHaveAttribute('data-entry', 'experience_discovery:concierge');
  expect(screen.queryByText(/9.?999/)).toBeNull();
  expect(state.pricing).toHaveBeenCalledWith(undefined);
  expect(screen.getByRole('img')).toHaveAttribute('src', 'https://operator.example/photo.webp');
});
it('keeps a direct booking URL in discovery mode without auth, availability or order actions', () => {
  render(<MemoryRouter initialEntries={['/experiences/synthetic/book']}><Routes><Route path='/experiences/:id/book' element={<ExperienceBooking />} /><Route path='/experiences/:id' element={<ExperienceDetail />} /></Routes></MemoryRouter>);
  expect(screen.getByRole('dialog')).toHaveAttribute('data-listing', 'synthetic');
  expect(screen.queryByRole('link')).toBeNull();
  expect(state.order).not.toHaveBeenCalled(); expect(state.availability).not.toHaveBeenCalled(); expect(state.redirect).not.toHaveBeenCalled();
  expect(screen.queryByText(/9.?999/)).toBeNull();
});
it('does not turn an unsafe source into an actionable link', () => {
  state.source = 'javascript:alert(1)';
  render(<MemoryRouter><ExperienceDetail /></MemoryRouter>);
  expect(screen.queryByRole('link')).toBeNull();
});
