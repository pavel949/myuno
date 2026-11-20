import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ExperienceInquiry } from '@/components/experiences/ExperienceInquiry';

const actor = { id: 'test-customer', user_metadata: { full_name: 'Test Guest', phone: '+66000000000' } };
const state = vi.hoisted(() => ({ user: null as typeof actor | null, language: 'en', rpc: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: state.rpc } }));

function Listing() {
  const { id } = useParams();
  const location = useLocation();
  return <>
    <p>{location.search}</p>
    <ExperienceInquiry open onOpenChange={() => {}} listingId={id!} listingTitle="Test island outing" entryPoint="experience_detail:concierge" />
  </>;
}

function SignIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = new URLSearchParams(location.search).get('redirect')!;
  return <button onClick={() => { state.user = actor; navigate(from); }}>Finish test login</button>;
}

const screenFor = (entry = '/experiences/island-a?from=catalogue') => render(
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/experiences/:id" element={<Listing />} />
        <Route path="/auth" element={<SignIn />} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  state.language = 'en';
  state.user = null;
  state.rpc.mockReset();
  sessionStorage.clear();
  vi.stubGlobal('crypto', webcrypto);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('preserves the listing, preferred day and group size across sign-in without automatically sending a lead', async () => {
  state.rpc.mockResolvedValue({ data: 'experience-test-receipt', error: null });
  screenFor();
  fireEvent.change(screen.getByLabelText('Preferred date'), { target: { value: '2099-11-23' } });
  fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '4' } });
  expect(screen.queryByLabelText('Name')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in to continue' }));
  expect(state.rpc).not.toHaveBeenCalled();
  expect(JSON.parse(sessionStorage.getItem('myuno:experience-inquiry:v1:island-a')!)).toEqual({ date: '2099-11-23', guests: 4 });
  fireEvent.click(screen.getByRole('button', { name: 'Finish test login' }));
  expect(screen.getByLabelText('Preferred date')).toHaveValue('2099-11-23');
  expect(screen.getByLabelText('Guests')).toHaveValue(4);
  expect(screen.getByText('?from=catalogue&inquiry=1')).toBeInTheDocument();
  expect(state.rpc).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Send request' }));
  expect(await screen.findByText('Request ID experience-test-receipt')).toBeVisible();
  expect(state.rpc).toHaveBeenCalledExactlyOnceWith('submit_experience_inquiry', {
    payload: expect.objectContaining({
      request_type: 'tour_booking',
      vertical_id: 'tours',
      entry_point: '/experiences/island-a',
      preferred_language: 'en',
      guests_count: 4,
      preferred_dates: [{ date: '2099-11-23', time: '' }],
      vertical_metadata: expect.objectContaining({ listing_id: 'island-a' }),
    }),
  });
  expect(screen.getByRole('link', { name: 'View my requests' })).toHaveAttribute('href', '/me/requests?source=experience#experience-experience-test-receipt');
  expect(sessionStorage.getItem('myuno:experience-inquiry:v1:island-a')).toBeNull();
});

it('keeps an independent selection for a different listing and uses Thai for the request', async () => {
  state.user = actor;
  state.language = 'th';
  sessionStorage.setItem('myuno:experience-inquiry:v1:island-a', JSON.stringify({ date: '2099-11-23', guests: 4 }));
  state.rpc.mockResolvedValueOnce({ data: null, error: new Error('Uncertain transport failure') });
  state.rpc.mockResolvedValueOnce({ data: 'recovered-receipt', error: null });
  screenFor('/experiences/island-b');
  expect(screen.getByLabelText('วันที่ต้องการ')).toHaveValue('');
  expect(screen.getByLabelText('จำนวนผู้เข้าร่วม')).toHaveValue(1);
  fireEvent.change(screen.getByLabelText('วันที่ต้องการ'), { target: { value: '2099-12-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'ส่งคำขอ' }));
  await screen.findByRole('alert');
  await waitFor(() => expect(screen.getByRole('button', { name: 'ส่งคำขอ' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'ส่งคำขอ' }));
  expect(await screen.findByText(/recovered-receipt/)).toBeVisible();
  expect(state.rpc).toHaveBeenCalledTimes(2);
  const [first, second] = state.rpc.mock.calls;
  expect(first).toEqual(second);
  expect(first).toEqual(['submit_experience_inquiry', { payload: expect.objectContaining({ preferred_language: 'th', entry_point: '/experiences/island-b', intake_request_key: expect.any(String) }) }]);
});
