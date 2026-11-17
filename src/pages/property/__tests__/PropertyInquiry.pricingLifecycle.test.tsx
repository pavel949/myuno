import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import PropertyInquiry from '../PropertyInquiry';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), createOrder: vi.fn(), reads: 0, language: 'en' }));
const property = { id: 'unit', title_en: 'Synthetic home', listing_type: 'rent', listing_modes: ['rent'], tenancy_modes: ['short'], price_per_night: 1000, currency: 'THB', rentalTerms: { price_per_night: 1000, currency: 'THB', included_services: [], extra_services: [] } };
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('@/hooks/useProperties', () => ({ usePropertyWithRentalTerms: () => {
  // Fail boundedly on the original render loop rather than hanging the suite.
  if (++mocks.reads > 80) throw new Error('Inquiry pricing render loop');
  return { data: property, isLoading: false, isError: false };
} }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `THB ${n}` }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/contexts/AuthSheetContext', () => ({ useAuthSheet: () => ({ openAuthSheet: vi.fn() }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: null }) }));
vi.mock('@/hooks/useOrders', () => ({ useOrders: () => ({ createOrder: mocks.createOrder }) }));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({ usePropertyRateSeasons: () => ({ data: [] }) }));
vi.mock('@/hooks/useRareFindBadge', () => ({ useRareFindBadge: () => ({ data: false }) }));
vi.mock('@/components/property/DepositPaymentOptions', () => ({ DepositPaymentOptions: () => null }));
vi.mock('@/components/property/PayWhenSelector', () => ({ PayWhenSelector: () => null }));
vi.mock('@/components/property/InquiryConfirmation', () => ({ InquiryConfirmation: () => null }));
vi.mock('@/components/uno/BackButton', () => ({ BackButton: () => null }));

function Navigation() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/property/unit/inquiry?checkIn=2099-12-05&checkOut=2099-12-07&guests=1')}>Change URL dates</button>;
}
function Harness({ dates = true }: { dates?: boolean }) {
  return <MemoryRouter initialEntries={[`/property/unit/inquiry${dates ? '?checkIn=2099-12-01&checkOut=2099-12-03&guests=1' : ''}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Navigation/><Routes><Route path="/property/:id/inquiry" element={<PropertyInquiry/>}/></Routes></MemoryRouter>;
}
function deferred() {
  let resolve!: (result: { data: { date: string; price_override: number }[] | null; error: unknown }) => void;
  const promise = new Promise<Parameters<typeof resolve>[0]>(r => { resolve = r; });
  return { promise, resolve };
}
beforeEach(() => { vi.clearAllMocks(); mocks.reads = 0; mocks.language = 'en'; mocks.rpc.mockResolvedValue({ data: [], error: null }); });
afterEach(() => { cleanup(); localStorage.clear(); });
const loading = 'Checking the price for your selected dates…';

describe('inquiry date-price lifecycle', () => {
  it('settles one price read and does not restart it on contact edits or parent renders', async () => {
    const response = deferred(); mocks.rpc.mockReturnValue(response.promise);
    const view = render(<Harness/>);
    expect(screen.getByText(loading)).toBeVisible();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('get_property_date_prices', { _property_id: 'unit', _from: '2099-12-01', _to: '2099-12-03' });
    await act(async () => response.resolve({ data: [], error: null }));
    expect(screen.queryByText(loading)).not.toBeInTheDocument();
    expect(screen.getAllByText('THB 2000').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Synthetic Guest' } });
    view.rerender(<Harness/>);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });
  it('restarts on URL date changes and ignores a stale response', async () => {
    const oldResponse = deferred(), nextResponse = deferred();
    mocks.rpc.mockReturnValueOnce(oldResponse.promise).mockReturnValueOnce(nextResponse.promise);
    render(<Harness/>);
    fireEvent.click(screen.getByText('Change URL dates'));
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).toHaveBeenLastCalledWith('get_property_date_prices', { _property_id: 'unit', _from: '2099-12-05', _to: '2099-12-07' });
    await act(async () => oldResponse.resolve({ data: [{ date: '2099-12-01', price_override: 9999 }], error: null }));
    expect(screen.getByText(loading)).toBeVisible();
    await act(async () => nextResponse.resolve({ data: [{ date: '2099-12-05', price_override: 1500 }], error: null }));
    expect(screen.queryByText(loading)).not.toBeInTheDocument();
    expect(screen.getAllByText('THB 2500').length).toBeGreaterThan(0);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
  it('preserves failed-quote state and permits an explicit retry without looping', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error('synthetic failure') });
    render(<Harness/>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible());
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument());
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('THB 2000').length).toBeGreaterThan(0);
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });
  it('does not read prices without dates', () => {
    render(<Harness dates={false}/>);
    expect(screen.getByRole('heading', { name: 'Select your dates' })).toBeVisible();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe('myUNO inquiry operator copy', () => {
  it.each([
    ['ru', 'Сообщение команде myUNO (необязательно)', 'Уточните условия у команды myUNO', 'Запрос не подтверждает бронирование.'],
    ['en', 'Message to the myUNO team (optional)', 'Check the terms with the myUNO team', 'This request does not confirm a booking.'],
    ['th', 'ข้อความถึงทีม myUNO (ไม่บังคับ)', 'สอบถามเงื่อนไขกับทีม myUNO', 'คำขอนี้ยังไม่ใช่การยืนยันการจอง'],
  ])('identifies myUNO and preserves request-only meaning in %s', async (language, label, cancellation, disclaimer) => {
    mocks.language = language;
    render(<Harness/>);
    await waitFor(() => expect(screen.getByLabelText(label)).toBeVisible());
    expect(screen.getByText(cancellation)).toBeVisible();
    expect(screen.getByText(disclaimer, { exact: false })).toBeVisible();
    expect(document.body.textContent).not.toMatch(/хозяин|хозяину|host|24 hours|24 часов|24h|30 min|30 минут/i);
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it.each([
    ['ru', 'Команда myUNO свяжется с вами, чтобы согласовать время просмотра.'],
    ['en', 'The myUNO team will contact you to arrange your viewing time.'],
    ['th', 'ทีม myUNO จะติดต่อคุณเพื่อนัดหมายเวลาเข้าชม'],
  ])('confirms a viewing request without a response deadline in %s', async (language, message) => {
    mocks.language = language;
    const { InquiryConfirmation } = await vi.importActual<typeof import('@/components/property/InquiryConfirmation')>('@/components/property/InquiryConfirmation');
    render(<MemoryRouter><InquiryConfirmation orderId="synthetic-order"/></MemoryRouter>);
    expect(screen.getByText(message)).toBeVisible();
    expect(document.body.textContent).not.toMatch(/24|30|host|хозя/i);
  });
});
