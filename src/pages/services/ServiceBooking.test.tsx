import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CatalogueState } from '@/hooks/useServiceBookingCatalogue';
import type { ReactNode } from 'react';

let catalogue: CatalogueState = { status: 'loading' };
let user: { id: string } | null = { id: 'u1' };
const redirectToAuth = vi.fn();
const clearByProvider = vi.fn();
const createBooking = vi.fn();

vi.mock('react-router-dom', () => ({ useParams: () => ({ id: 'prov-1' }), useNavigate: () => vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ getItemsByProvider: () => [], clearByProvider }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user, isLoading: false }) }));
vi.mock('@/hooks/useBooking', () => ({ useBooking: () => ({ createBooking, isSubmitting: false }) }));
vi.mock('@/hooks/useServiceBookingCatalogue', () => ({ useServiceBookingCatalogue: () => catalogue }));
vi.mock('@/lib/auth/redirectToAuth', () => ({ redirectToAuth: (...a: unknown[]) => redirectToAuth(...a) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/booking', () => ({
  BookingDateTimeSelect: () => null, BookingContactForm: () => null, BookingPaymentSelect: () => null,
  BookingBottomBar: () => <button>submit</button>, BookingConfirmation: () => null,
}));

import ServiceBooking from './ServiceBooking';

const provider = { id: 'prov-1', name: 'Phuket Plumbing', logo_url: null, business_category: null, is_active: true, approval_status: 'approved', is_demo: false };
const offerings = [{ id: 'svc-1', nameEn: 'Leak repair', nameRu: 'Устранение протечки', price: 1200, currency: 'THB' as const }];

beforeEach(() => { user = { id: 'u1' }; redirectToAuth.mockReset(); createBooking.mockReset(); clearByProvider.mockReset(); });

describe('ServiceBooking page', () => {
  it.each([
    ['missing', { status: 'missing' }, 'service-booking-missing'],
    ['inactive', { status: 'inactive', provider: { ...provider, is_active: false } }, 'service-booking-inactive'],
    ['error', { status: 'error', message: 'x' }, 'service-booking-error'],
    ['empty', { status: 'empty', provider, org: { status: 'unmapped' } }, 'service-booking-empty'],
  ] as const)('shows %s state and no invented services', (_n, state, testId) => {
    catalogue = state as CatalogueState;
    render(<ServiceBooking />);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByText('Установка смесителя')).toBeNull();
    expect(screen.queryByText('submit')).toBeNull();
  });

  it.each([['unmapped', { status: 'unmapped' }], ['ambiguous', { status: 'ambiguous', candidateCount: 2 }]] as const)(
    'blocks booking when org is %s but shows real prices', (_n, org) => {
      catalogue = { status: 'ready', provider, offerings, org } as CatalogueState;
      render(<ServiceBooking />);
      expect(screen.getByTestId('service-booking-blocked')).toBeInTheDocument();
      expect(screen.getByText('Устранение протечки')).toBeInTheDocument();
      expect(screen.queryByText('submit')).toBeNull();
      expect(createBooking).not.toHaveBeenCalled();
    });

  it('enables the form when an org is mapped', () => {
    catalogue = { status: 'ready', provider, offerings, org: { status: 'mapped', orgId: 'org-9' } };
    render(<ServiceBooking />);
    expect(screen.queryByTestId('service-booking-blocked')).toBeNull();
    expect(screen.getByText('submit')).toBeInTheDocument();
  });

  it('redirects signed-out users from an effect and renders nothing', () => {
    user = null;
    catalogue = { status: 'loading' };
    const { container } = render(<ServiceBooking />);
    expect(container).toBeEmptyDOMElement();
    expect(redirectToAuth).toHaveBeenCalledTimes(1);
  });
});
