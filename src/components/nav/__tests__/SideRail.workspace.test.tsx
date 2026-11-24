import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SideRail } from '../SideRail';

const media = vi.hoisted(() => ({ mobile: false }));
const ownerRole = { role: 'owner' as const };
const adminRole = { role: 'admin' as const };
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => media.mobile }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useBusinessRole', () => ({ useBusinessRole: () => ({ role: 'property_manager' }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: [] }) }));
afterEach(() => { cleanup(); media.mobile = false; });

function ExternalNavigation() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/mc/bookings-list')}>Open booking list</button>;
}

it('keeps current destination visible after collapse and opens the new active workspace group on desktop', () => {
  render(
    <MemoryRouter initialEntries={['/mc/finance']}>
      <SidebarProvider open>
        <SideRail {...ownerRole} />
        <ExternalNavigation />
      </SidebarProvider>
    </MemoryRouter>,
  );
  expect(screen.getByText('Management workspace')).toBeVisible();
  const section = screen.getByRole('button', { name: 'Finance' });
  expect(section).toHaveAttribute('aria-expanded', 'true');
  expect(section).toHaveAccessibleDescription('Contains current page');
  expect(screen.getByRole('button', { name: 'Finance Hub' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(section);
  expect(section).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('button', { name: 'Finance Hub' })).not.toBeInTheDocument();
  expect(screen.getByText('You are here:')).toHaveTextContent('Finance Hub');

  fireEvent.click(screen.getByRole('button', { name: 'Open booking list' }));
  expect(screen.getByRole('button', { name: 'Daily work' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: 'Bookings' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByText('You are here:')).toHaveTextContent('Bookings');
});

it('shows the current mobile quick link without opening the duplicate list', async () => {
  media.mobile = true;
  render(
    <MemoryRouter initialEntries={['/mc/calendar']}>
      <SidebarProvider>
        <SidebarTrigger />
        <SideRail {...ownerRole} />
      </SidebarProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
  const drawer = await screen.findByRole('dialog');
  const quickLinks = within(drawer).getByRole('button', { name: 'Quick links' });
  expect(quickLinks).toHaveAttribute('aria-expanded', 'false');
  expect(quickLinks).toHaveAccessibleDescription('Contains current page');
  expect(within(drawer).queryByRole('button', { name: 'Calendar' })).not.toBeInTheDocument();
  expect(within(drawer).getByText('You are here:')).toHaveTextContent('Calendar');
  fireEvent.click(quickLinks);
  expect(within(drawer).getAllByRole('button', { name: 'Calendar' })).toHaveLength(1);
});

it('does not attach owner-specific workspace chrome to admin', () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <SidebarProvider open><SideRail {...adminRole} /></SidebarProvider>
    </MemoryRouter>,
  );
  expect(screen.getByText('Navigation')).toBeVisible();
  expect(screen.queryByText('Management workspace')).not.toBeInTheDocument();
  expect(screen.queryByText('Quick links')).not.toBeInTheDocument();
});
