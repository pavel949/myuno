import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PropertyAmenitiesSection } from './PropertyAmenitiesSection';

const state = vi.hoisted(() => ({ refetch: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePropertyListingQuality', () => ({
  amenityName: (item: { name_en: string }) => item.name_en,
  usePropertyAmenities: () => ({ data: [], isLoading: false, isError: true, refetch: state.refetch }),
}));

afterEach(() => {
  cleanup();
  state.refetch.mockClear();
});

it('does not fall back to legacy amenities after a structured query error and offers retry', () => {
  render(<PropertyAmenitiesSection propertyId="property-1" fallbackAmenities={['Legacy pool']} />);
  expect(screen.getByRole('status')).toHaveTextContent('Amenities are temporarily unavailable.');
  expect(screen.queryByText('Legacy pool')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(state.refetch).toHaveBeenCalledOnce();
});
