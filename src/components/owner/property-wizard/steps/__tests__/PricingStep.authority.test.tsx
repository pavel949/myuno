import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PricingStep } from '../PricingStep';
import { initialFormData } from '@/hooks/property-wizard/initialData';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
// These closed panels have independent tests; authority of the host inputs is real.
vi.mock('@/components/property/SeasonalPricing', () => ({ SeasonalPricing: () => null }));
afterEach(cleanup);
describe('explicit managed pricing and booking permissions', () => {
  it.each([[false, false], [true, false], [false, true], [true, true]])('pricing=%s and bookings=%s remain independent', (pricing, bookings) => {
    render(<PricingStep formData={initialFormData} updateFormData={vi.fn()} authoringOnly canEditPricing={pricing} canEditBookingTerms={bookings} />);
    const price = screen.getByRole('spinbutton', { name: 'Price per night' });
    const instant = screen.getByRole('switch', { name: 'Instant booking' });
    expect(price.hasAttribute('disabled')).toBe(!pricing);
    expect(instant.hasAttribute('disabled')).toBe(!bookings);
    expect(screen.queryByText('Ownership Structure')).not.toBeInTheDocument();
    expect(screen.queryByText('10% platform fee per successful booking')).not.toBeInTheDocument();
  });
});
