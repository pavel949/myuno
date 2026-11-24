import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyInquiriesWidget } from './PropertyInquiriesWidget';

const fixture = vi.hoisted(() => ({
  status: 'pending',
  hasWritePermission: true,
  update: vi.fn(),
  from: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'operator-a' } }) }));
vi.mock('@/hooks/useMyProperties', () => ({
  useMyProperties: () => ({ allProperties: [{ property_id: 'villa-1', title: 'Villa One' }] }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fixture.from } }));
vi.mock('sonner', () => ({ toast: { success: fixture.success, error: fixture.error } }));

const request = {
  id: 'request-1', property_id: 'villa-1', status: 'pending', name: 'Guest One',
  created_at: '2026-10-21T12:00:00+07:00', check_in: '2026-11-22', check_out: '2026-11-24',
  guests: 2, message: 'Is late arrival possible?', phone: '+66000000000',
};

beforeEach(() => {
  vi.clearAllMocks();
  fixture.status = 'pending';
  fixture.hasWritePermission = true;
  fixture.from.mockImplementation(() => {
    const read = {
      select: () => read, in: () => read, order: () => read, limit: () => read,
      eq: () => Promise.resolve({ data: fixture.status === 'pending' ? [request] : [], error: null }),
    };
    const change = {
      eq: () => change, in: () => change, select: () => change,
      maybeSingle: async () => ({ data: fixture.hasWritePermission ? { id: request.id } : null, error: null }),
    };
    return {
      ...read,
      select: () => read,
      update: ({ status }: { status: string }) => {
        fixture.update(status);
        if (fixture.hasWritePermission) fixture.status = status;
        return change;
      },
    };
  });
});

afterEach(cleanup);

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter>
    <PropertyInquiriesWidget companyScope={{ id: 'company-a', propertyIds: ['villa-1'] }} />
  </MemoryRouter></QueryClientProvider>);
}

describe('today’s stay requests', () => {
  it('opens the selected request and updates the request without presenting it as a booking', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /Guest One/ }));
    expect(screen.getByText('Is late arrival possible?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Принять запрос' }));
    await waitFor(() => expect(fixture.success).toHaveBeenCalledWith(expect.stringContaining('отдельного подтверждения')));
    expect(fixture.update).toHaveBeenCalledWith('accepted');
    expect(fixture.from.mock.calls.every(([table]) => table === 'property_inquiries')).toBe(true);
  });

  it('never reports success for an update with no readable affected row', async () => {
    fixture.hasWritePermission = false;
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Отклонить запрос' }));
    await waitFor(() => expect(fixture.error).toHaveBeenCalled());
    expect(fixture.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Guest One/ })).toBeInTheDocument();
  });
});
