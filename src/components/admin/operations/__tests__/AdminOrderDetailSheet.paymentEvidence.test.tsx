import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminOrderDetailSheet } from '../AdminOrderDetailSheet';
import { en } from '@/i18n/en';
import { ru } from '@/i18n/ru';

const state = vi.hoisted(() => ({
  language: 'en',
  metadata: null as unknown,
  clipboard: vi.fn(),
  mutate: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (state.language === 'ru' ? ru : en)[key] ?? key,
  }),
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      id: 'synthetic-order', order_number: 'TEST-001', status: 'confirmed', order_type: 'property',
      total_amount: 693000, currency: 'THB', metadata: state.metadata,
      order_items: [], order_participants: [], order_addresses: [], _profile: null,
    },
    isLoading: false,
  }),
  useMutation: () => ({ isPending: false, mutate: state.mutate }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => { throw new Error('This presentation test must not access Supabase'); } },
}));
vi.mock('sonner', () => ({ toast: vi.fn() }));

beforeEach(() => {
  state.metadata = null;
  state.clipboard.mockReset();
  state.mutate.mockReset();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: state.clipboard },
  });
});
afterEach(cleanup);

const renderOrder = () => render(
  <AdminOrderDetailSheet orderId="synthetic-order" onClose={vi.fn()} onStatusChanged={vi.fn()} />,
);

describe.each(['en', 'ru'])('recorded payment evidence (%s)', (language) => {
  const copy = language === 'ru' ? ru : en;
  beforeEach(() => { state.language = language; });

  it.each([
    undefined, null, {}, { payment_method: null }, { payment_method: '' },
    { payment_method: '   ' }, { payment_method: false }, { payment_method: 42 },
  ])('keeps missing or invalid payment method unknown in detail and copied text: %j', (metadata) => {
    state.metadata = metadata;
    renderOrder();
    const expected = `${copy['admin.orders.detail.paymentMethod']}: ${copy['admin.orders.detail.payment.unknown']}`;
    expect(screen.getByText(expected)).toBeVisible();
    expect(screen.queryByText(/💵/)).not.toBeInTheDocument();
    expect(screen.getByText('693000 THB')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: copy['admin.orders.detail.copyForSupplier'] }));
    expect(state.clipboard).toHaveBeenCalledOnce();
    expect(state.clipboard.mock.calls[0][0]).toContain(expected);
    expect(state.clipboard.mock.calls[0][0]).not.toContain(copy['admin.orders.detail.payment.cash']);
    expect(state.mutate).not.toHaveBeenCalled();
  });

  it.each(['cash', 'wallet', 'stripe', 'bank_transfer', 'concierge_advance'])('preserves the recorded %s method', (method) => {
    state.metadata = { payment_method: method };
    renderOrder();
    const expected = `${copy['admin.orders.detail.paymentMethod']}: ${copy[`admin.orders.detail.payment.${method}`]}`;
    expect(screen.getByText(expected)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: copy['admin.orders.detail.copyForSupplier'] }));
    expect(state.clipboard.mock.calls[0][0]).toContain(expected);
  });

  it('preserves an unrecognized recorded method instead of substituting cash', () => {
    state.metadata = { payment_method: 'external_invoice' };
    renderOrder();
    expect(screen.getByText(`${copy['admin.orders.detail.paymentMethod']}: external_invoice`)).toBeVisible();
    expect(screen.queryByText(/💵/)).not.toBeInTheDocument();
  });
});
