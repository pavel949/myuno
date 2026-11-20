import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ExperienceDetail from '../ExperienceDetail';
import ExperienceBooking from '../ExperienceBooking';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useExperiences', () => ({ useExperience: () => ({ experience: {
 id: 'hanuman', title_en: 'Flying Hanuman', title_ru: 'Хануман', experience_type: 'activity',
 booking_url: 'https://operator.example/book', currency: 'THB', price: 1990,
 images: [], rating: 0, review_count: 0, highlights: [], includes: [], excludes: [], requirements: [], itinerary: [],
}, isLoading: false }), formatDuration: () => '1h', getDifficultyColor: () => '' }));
vi.mock('@/hooks/useExperiencePricing', () => ({ useExperiencePricing: () => ({ data: [] }) }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: ({ children }: any) => <main>{children}</main> }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createTouristAttractionSchema: () => ({}) }));
vi.mock('@/components/crosssell', () => ({ CrossSellSection: () => null, RelatedServicesSection: () => null }));
vi.mock('@/components/experiences/ExperienceInquiry', () => ({ ExperienceInquiry: ({ open, listingId, entryPoint }: { open: boolean; listingId: string; entryPoint: string }) => open ? <div role="dialog">{listingId} {entryPoint}</div> : null }));
afterEach(cleanup);
function mount(url: string) { render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/experiences/:id" element={<ExperienceDetail />} /><Route path="/experiences/:id/book" element={<ExperienceBooking />} /></Routes></MemoryRouter>); }
describe('myUNO experience concierge', () => {
 it.each(['Ask myUNO concierge', 'Send inquiry'])('opens internal inquiry from %s despite supplier URL', name => {
  const external = vi.spyOn(window, 'open'); mount('/experiences/hanuman');
  expect(screen.getByText(/An inquiry is not a confirmed booking/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name }));
  expect(screen.getByRole('dialog')).toHaveTextContent('hanuman experience_detail:concierge');
  expect(external).not.toHaveBeenCalled(); external.mockRestore();
 });
 it('routes old booking links into inquiry rather than payment', () => {
  mount('/experiences/hanuman/book');
  expect(screen.getByRole('dialog')).toHaveTextContent('hanuman');
  expect(screen.queryByText(/Book with Operator/)).not.toBeInTheDocument();
 });
});
