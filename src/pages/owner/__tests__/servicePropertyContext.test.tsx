import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ServiceRequest from '../ServiceRequest';
import InspectionRequest from '../InspectionRequest';

const fixture = vi.hoisted(() => ({
  isLoading: false,
  allProperties: [] as { property_id: string; title: string; title_ru: string; source: string }[],
}));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => fixture }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: String }) }));
vi.mock('@/hooks/usePropertyCare', () => ({
  useCreateServiceRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateInspection: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/uno/BackButton', () => ({ BackButton: () => null }));
vi.mock('@/components/ui/voice-input-button', () => ({ VoiceInputButton: () => null, appendTranscript: () => '' }));
vi.mock('@/components/ui/calendar', () => ({ Calendar: () => null }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => <select aria-label="Form selection" value={value} onChange={e => onValueChange(e.target.value)}>{children}</select>,
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <><option value="">Select an option</option>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}));
const available = ['property-a', 'property-b'].map(property_id => ({ property_id, title: property_id, title_ru: property_id, source: 'owned' }));
const propertySelect = () => screen.getAllByRole('combobox').find(el => el.querySelector('option[value="property-a"]')) as HTMLSelectElement;

afterEach(cleanup);
beforeEach(() => { fixture.allProperties = [...available]; fixture.isLoading = false; });
for (const [name, Page] of [['service', ServiceRequest], ['inspection', InspectionRequest]] as const) {
  describe(`${name} property context`, () => {
    const view = (query: string) => <MemoryRouter initialEntries={[`/mc/${name}?${query}`]}><Page /></MemoryRouter>;
    it('prefills a property present in the selectable collection', () => {
      render(view('property=property-b'));
      expect(propertySelect().value).toBe('property-b');
    });
    it.each(['', 'property=unavailable-property'])('leaves the selection empty for missing or unavailable context: %s', query => {
      render(view(query));
      expect(propertySelect().value).toBe('');
    });
    it('waits for available properties before prefilling', () => {
      fixture.isLoading = true; fixture.allProperties = [];
      const result = render(view('property=property-b'));
      fixture.isLoading = false; fixture.allProperties = [...available];
      result.rerender(view('property=property-b'));
      expect(propertySelect().value).toBe('property-b');
    });
    it('preserves a manual choice when properties refetch', () => {
      const result = render(view('property=property-b'));
      fireEvent.change(propertySelect(), { target: { value: 'property-a' } });
      fixture.allProperties = [...available];
      result.rerender(view('property=property-b'));
      expect(propertySelect().value).toBe('property-a');
    });
  });
}
