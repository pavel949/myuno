import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import OwnerPortfolio from '../OwnerPortfolio';
import { TransactionCard } from '@/components/owner/financials/TransactionCard';

const mocks = vi.hoisted(() => ({ bookings: [] as unknown[], error: null as Error | null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'actor' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePropertyCare', () => ({
  useOwnerProperties: () => ({ data: [{ id: 'a', title: 'Fixture Villa' }], isLoading: false }),
}));
vi.mock('@/hooks/usePropertyBookings', () => ({
  useAllPropertyBookings: () => ({ bookings: mocks.bookings, isLoading: false, error: mocks.error }),
}));
vi.mock('@/components/uno/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('@/components/uno/BackButton', () => ({ BackButton: () => null }));

describe('historical finance data', () => {
  it('retains linked operational properties without guessing portfolio profit', () => {
    render(<MemoryRouter><OwnerPortfolio /></MemoryRouter>);
    expect(screen.getByText('Financial results are not reconciled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open transaction records' })).toHaveAttribute('href', '/mc/financials');
    expect(screen.getByRole('link', { name: /Fixture Villa/ })).toHaveAttribute('href', '/mc/properties/a');
    expect(screen.queryByText(/Net Profit|Total Income/)).not.toBeInTheDocument();
  });

  it('does not turn booking read failure into zero nights', () => {
    mocks.error = new Error('synthetic failure');
    render(<MemoryRouter><OwnerPortfolio /></MemoryRouter>);
    expect(screen.getByText('Booking data unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Nights: 0 of 30')).not.toBeInTheDocument();
    mocks.error = null;
  });

  it('renders the stored currency and civil date, without labelling the booking reference a ledger row', () => {
    render(<TransactionCard
      item={{ id: 'fixture-transaction', property_id: 'a', owner_id: 'actor', amount: 200, currency: 'USD',
        transaction_type: 'income', transaction_date: '2026-11-01', created_at: '',
        reference_type: 'booking', reference_id: 'fixture-booking', status: 'paid' }}
      isRu={false}
      getCategoryLabel={() => 'Rental charge'}
      onEdit={() => {}}
      onDelete={() => {}}
    />);
    expect(screen.getByText('200 USD')).toBeInTheDocument();
    expect(screen.getByText('1 Nov 2026')).toBeInTheDocument();
    expect(screen.getByText(/booking · fixture-/)).toBeInTheDocument();
    expect(screen.queryByText(/ledger|฿/)).not.toBeInTheDocument();
  });
});
