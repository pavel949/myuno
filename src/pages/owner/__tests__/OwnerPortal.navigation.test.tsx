import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OwnerTransparencyDashboard from '../OwnerTransparencyDashboard';
import OwnerPortalPropertyView from '../../owner-portal/OwnerPortalPropertyView';

const state = vi.hoisted(() => ({ language: 'en', role: 'owner' as string | null }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
vi.mock('@/hooks/usePropertyDelegates', () => ({ usePropertyUserRole: () => ({ data: state.role, isLoading: false }) }));
vi.mock('@/hooks/useSupabaseQuery', () => ({ useSupabaseSingle: () => ({ data: { title: 'My property' }, isLoading: false }) }));
vi.mock('@/hooks/useOwnerPortalSettings', () => ({ useOwnerPortalSettings: () => ({ settings: { show_booking_calendar: true, show_financial_statements: true }, isLoading: false }) }));
vi.mock('@/components/owner/transparency/OwnerOverviewTab', () => ({ OwnerOverviewTab: () => null }));
vi.mock('@/components/owner/transparency/OwnerFinanceTab', () => ({ OwnerFinanceTab: () => null }));
vi.mock('@/components/owner/transparency/OwnerBookingsTab', () => ({ OwnerBookingsTab: () => null }));
vi.mock('@/components/owner/transparency/OwnerTermsTab', () => ({ OwnerTermsTab: () => null }));
vi.mock('@/components/owner/transparency/OwnerReportsTab', () => ({ OwnerReportsTab: () => null }));
vi.mock('@/components/owner/transparency/OwnerNotificationBell', () => ({ OwnerNotificationBell: () => null }));
vi.mock('@/components/owner/transparency/ActivityFeed', () => ({ ActivityFeed: () => null }));
vi.mock('@/components/owner-portal/PortalChatTab', () => ({ PortalChatTab: () => null }));
vi.mock('@/components/owner-portal/OwnerStaysTab', () => ({ OwnerStaysTab: () => null }));
vi.mock('@/components/owner-portal/PortalUtilitiesTab', () => ({ PortalUtilitiesTab: () => null }));
vi.mock('@/components/owner-portal/PortalDocumentsTab', () => ({ PortalDocumentsTab: () => null }));
function LocationProbe() { const location = useLocation(); return <output data-testid="location">{location.pathname}</output>; }
function mount(transparency = true) {
  return render(<MemoryRouter initialEntries={[transparency ? '/my-property/transparency/property-123' : '/my-property/property-123']}><Routes>
    <Route path="/my-property/transparency/:propertyId" element={<OwnerTransparencyDashboard />} />
    <Route path="/my-property/:propertyId" element={<OwnerPortalPropertyView />} />
    <Route path="/my-property" element={<p>Owner properties</p>} />
  </Routes><LocationProbe /></MemoryRouter>);
}
afterEach(cleanup);
beforeEach(() => { state.language = 'en'; state.role = 'owner'; });
describe('owner portal navigation continuity', () => {
  it('returns transparency to the same property instead of the operator workspace', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/my-property/property-123');
  });
  it('returns denied transparency access to the owner property list', () => {
    state.role = null; mount(); fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('Owner properties')).toBeInTheDocument();
  });
  it.each(['en', 'ru'])('keeps mobile tab labels named and non-shrinking in %s', language => {
    state.language = language; mount(false);
    const labels = language === 'ru' ? ['Обзор', 'Бронирования', 'Финансы', 'Сообщения'] : ['Overview', 'Bookings', 'Finance', 'Messages'];
    for (const label of labels) {
      const tab = screen.getByRole('tab', { name: label });
      expect(tab).toHaveClass('shrink-0', 'flex-none');
      expect(screen.getByText(label)).not.toHaveClass('hidden');
    }
    expect(screen.getByRole('tablist')).toHaveClass('overflow-x-auto', 'justify-start');
  });
});
