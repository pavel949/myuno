import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, useLocation } from 'react-router-dom';
import ServiceRequest from '../ServiceRequest';
import InspectionRequest from '../InspectionRequest';

const fixture = vi.hoisted(() => ({
  isLoading: false,
  serviceMutation: vi.fn(),
  inspectionMutation: vi.fn(),
  allProperties: [] as { property_id: string; title: string; title_ru: string; source: string }[],
}));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => fixture }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: String }) }));
vi.mock('@/hooks/usePropertyCare', () => ({
  useCreateServiceRequest: () => ({ mutateAsync: fixture.serviceMutation, isPending: false }),
  useCreateInspection: () => ({ mutateAsync: fixture.inspectionMutation, isPending: false }),
}));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/ui/voice-input-button', () => ({ VoiceInputButton: () => null, appendTranscript: () => '' }));
vi.mock('@/components/ui/calendar', () => ({ Calendar: ({ onSelect }: { onSelect: (date: Date) => void }) => <button type="button" onClick={() => onSelect(new Date(2026, 9, 20))}>Select test date</button> }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => <select aria-label="Form selection" value={value} onChange={e => onValueChange(e.target.value)}>{children}</select>,
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <><option value="">Select an option</option>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}));
const available = ['property-a', 'property-b'].map(property_id => ({ property_id, title: property_id, title_ru: property_id, source: 'owned' }));
const propertySelect = () => screen.getAllByRole('combobox').find(el => el.querySelector('option[value="property-a"]')) as HTMLSelectElement;

const Location = () => <output aria-label="Current route">{useLocation().pathname}</output>;
const deferred = () => {
  let resolve!: (value: object) => void;
  const promise = new Promise<object>(done => { resolve = done; });
  return { promise, resolve };
};

afterEach(cleanup);
beforeEach(() => { fixture.allProperties = [...available]; fixture.isLoading = false; fixture.serviceMutation.mockReset().mockResolvedValue({}); fixture.inspectionMutation.mockReset().mockResolvedValue({}); });
for (const [name, Page] of [['service', ServiceRequest], ['inspection', InspectionRequest]] as const) {
  describe(`${name} property context`, () => {
    const view = (query: string, mounted = true) => <MemoryRouter initialEntries={[`/mc/${name}?${query}`]}><Location /><Link to="/mc/calendar">Leave request</Link><Link to={`?property=property-a`}>Change request context</Link>{mounted && <Page />}</MemoryRouter>;
    const submit = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pick a date' }));
      fireEvent.click(screen.getByRole('button', { name: 'Select test date' }));
      fireEvent.click(screen.getByRole('button', { name: name === 'service' ? 'Create Request' : 'Order Inspection' }));
    };
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
    it('returns to the accessible selected property and ignores arbitrary return URLs', () => {
      render(view('property=property-b&returnTo=https://evil.test'));
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
      expect(screen.getByLabelText('Current route')).toHaveTextContent('/mc/properties/property-b');
    });
    it.each(['', 'property=unavailable-property'])('returns safely to management without accessible context: %s', query => {
      render(view(query));
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
      expect(screen.getByLabelText('Current route').textContent).toBe('/mc');
    });
    it('returns safely if the selected property is no longer available', () => {
      const result = render(view('property=property-b'));
      fixture.allProperties = [available[0]];
      result.rerender(view('property=property-b'));
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
      expect(screen.getByLabelText('Current route').textContent).toBe('/mc');
    });
    it('returns to the submitted property only after the existing writer succeeds', async () => {
      const mutation = name === 'service' ? fixture.serviceMutation : fixture.inspectionMutation;
      let resolve: (value: object) => void = () => {};
      mutation.mockImplementation(() => new Promise(done => { resolve = done; }));
      render(view('property=property-b&type=cleaning'));
      fireEvent.change(propertySelect(), { target: { value: 'property-a' } });
      fireEvent.click(screen.getByRole('button', { name: 'Pick a date' }));
      fireEvent.click(screen.getByRole('button', { name: 'Select test date' }));
      fireEvent.click(screen.getByRole('button', { name: name === 'service' ? 'Create Request' : 'Order Inspection' }));
      await waitFor(() => expect(mutation).toHaveBeenCalledOnce());
      expect(mutation).toHaveBeenCalledWith(expect.objectContaining({ property_id: 'property-a' }));
      expect(screen.getByLabelText('Current route').textContent).toBe(`/mc/${name}`);
      await act(async () => resolve({}));
      expect(screen.getByLabelText('Current route').textContent).toBe('/mc/properties/property-a');
    });
    it('preserves a manual choice when properties refetch', () => {
      const result = render(view('property=property-b'));
      fireEvent.change(propertySelect(), { target: { value: 'property-a' } });
      fixture.allProperties = [...available];
      result.rerender(view('property=property-b'));
      expect(propertySelect().value).toBe('property-a');
    });
    it.each(['removed', 'loading'] as const)('rechecks access after a deferred success (%s)', async access => {
      const pending = deferred();
      const mutation = name === 'service' ? fixture.serviceMutation : fixture.inspectionMutation;
      mutation.mockReturnValue(pending.promise);
      const result = render(view('property=property-b'));
      submit();
      expect(mutation).toHaveBeenCalledWith(expect.objectContaining({ property_id: 'property-b' }));
      if (access === 'removed') fixture.allProperties = [available[0]];
      else fixture.isLoading = true;
      result.rerender(view('property=property-b'));
      await act(async () => pending.resolve({}));
      expect(screen.getByLabelText('Current route').textContent).toBe('/mc');
    });
    it('does not navigate after the form unmounts while a writer is pending', async () => {
      const pending = deferred();
      (name === 'service' ? fixture.serviceMutation : fixture.inspectionMutation).mockReturnValue(pending.promise);
      const result = render(view('property=property-b'));
      submit();
      result.rerender(view('property=property-b', false));
      await act(async () => pending.resolve({}));
      expect(screen.getByLabelText('Current route').textContent).toBe(`/mc/${name}`);
    });
    it.each(['Leave request', 'Change request context'])('does not override newer navigation: %s', async link => {
      const pending = deferred();
      (name === 'service' ? fixture.serviceMutation : fixture.inspectionMutation).mockReturnValue(pending.promise);
      render(view('property=property-b'));
      submit();
      fireEvent.click(screen.getByRole('link', { name: link }));
      await act(async () => pending.resolve({}));
      expect(screen.getByLabelText('Current route').textContent).toBe(link === 'Leave request' ? '/mc/calendar' : `/mc/${name}`);
    });
    it('does not override a newer property selection, even if changed back', async () => {
      const pending = deferred();
      (name === 'service' ? fixture.serviceMutation : fixture.inspectionMutation).mockReturnValue(pending.promise);
      render(view('property=property-b'));
      submit();
      fireEvent.change(propertySelect(), { target: { value: 'property-a' } });
      fireEvent.change(propertySelect(), { target: { value: 'property-b' } });
      await act(async () => pending.resolve({}));
      expect(screen.getByLabelText('Current route').textContent).toBe(`/mc/${name}`);
    });
    it('ignores an older success while a newer request is still pending', async () => {
      const first = deferred(); const second = deferred();
      const mutation = name === 'service' ? fixture.serviceMutation : fixture.inspectionMutation;
      mutation.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
      render(view('property=property-b'));
      submit();
      fireEvent.click(screen.getByRole('button', { name: name === 'service' ? 'Create Request' : 'Order Inspection' }));
      expect(mutation).toHaveBeenCalledTimes(2);
      await act(async () => first.resolve({}));
      expect(screen.getByLabelText('Current route').textContent).toBe(`/mc/${name}`);
      await act(async () => second.resolve({}));
      expect(screen.getByLabelText('Current route').textContent).toBe('/mc/properties/property-b');
    });
  });
}
