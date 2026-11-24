import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import OwnerProperties from '../OwnerProperties';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'operator' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@/hooks/usePropertyComplexes', () => ({ readPropertyComplexNames: async () => [] }));
const { update, byId, visible, readReceipt, successToast, errorToast } = vi.hoisted(() => ({
  update: vi.fn(),
  byId: vi.fn(),
  visible: vi.fn(),
  readReceipt: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: Object.assign(successToast, { error: errorToast }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ update, select: () => ({ order: async () => ({ data: [] }) }) }) },
}));
vi.mock('@/hooks/useMyProperties', () => ({
  useMyProperties: () => ({
    allProperties: [
      { id: 'one', property_id: 'one', title: 'Villa by the beach', title_ru: 'Вилла у моря', district: 'Bang Tao', is_active: true },
      { id: 'two', property_id: 'two', title: 'Archived villa', district: 'Layan', is_active: false },
    ],
    isLoading: false,
  }),
}));
vi.mock('@/components/property/PropertyCard', () => ({
  PropertyCard: ({ property, onToggleActive }: {
    property: { title: string; property_id: string };
    onToggleActive: (id: string, active: boolean) => void;
  }) => (
    <div>
      <p>{property.title}</p>
      <button type="button" onClick={() => onToggleActive(property.property_id, false)}>
        Deactivate {property.title}
      </button>
    </div>
  ),
  PropertyCardSkeleton: () => null,
}));
vi.mock('@/components/property/PropertyMapView', () => ({ PropertyMapView: () => null }));
vi.mock('@/components/owner/ManagedPropertyDrafts', () => ({ ManagedPropertyDrafts: () => null }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) => (
    <select aria-label="Filter value" value={value} onChange={event => onValueChange(event.target.value)}>{children}</select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => children,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => <option value={value}>{children}</option>,
}));

it('filters canonical districts against legacy labels and supports empty districts and localized search', () => {
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><MemoryRouter><OwnerProperties /></MemoryRouter></QueryClientProvider>);
  expect(screen.queryByRole('option', { name: 'Patong' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
  const district = screen.getByRole('option', { name: 'Patong' }).closest('select')!;
  fireEvent.change(district, { target: { value: 'patong' } });
  expect(screen.getByText('No properties match your filters')).toBeInTheDocument();
  fireEvent.change(district, { target: { value: 'layan' } });
  expect(screen.getByText('Archived villa')).toBeInTheDocument();
  expect(screen.queryByText('Villa by the beach')).not.toBeInTheDocument();
  fireEvent.change(district, { target: { value: 'bang-tao' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Search properties' }), { target: { value: 'вилла у моря' } });
  expect(screen.getByText('Villa by the beach')).toBeInTheDocument();
});


it('does not toast success for an unconfirmed change and refreshes the property queries', async () => {
  update.mockReturnValue({ eq: byId });
  byId.mockReturnValue({ is: visible });
  visible.mockReturnValue({ select: readReceipt });
  readReceipt.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: [{ id: 'one' }], error: null });

  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(<QueryClientProvider client={client}><MemoryRouter><OwnerProperties /></MemoryRouter></QueryClientProvider>);
  const action = screen.getByRole('button', { name: 'Deactivate Villa by the beach' });
  fireEvent.click(action);
  await waitFor(() => expect(errorToast).toHaveBeenCalledWith('Change not confirmed', expect.any(Object)));
  expect(successToast).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith({ is_active: false });
  expect(byId).toHaveBeenCalledWith('id', 'one');
  expect(visible).toHaveBeenCalledWith('deleted_at', null);
  expect(readReceipt).toHaveBeenCalledWith('id');
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['owner-properties'] });

  fireEvent.click(action);
  await waitFor(() => expect(successToast).toHaveBeenCalledWith('Property deactivated'));
});
