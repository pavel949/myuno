import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { it, expect, vi } from 'vitest';
import TransportIndex from './TransportIndex';

const vehicles = vi.hoisted(() => [
  { id: 'unknown', label: 'Unknown price', price_per_day: null, currency: 'THB', vehicle_type: 'sedan', transmission: 'automatic' },
  { id: 'low', label: 'Basic sedan', price_per_day: 1200, currency: 'THB', vehicle_type: 'sedan', transmission: 'automatic' },
  { id: 'high', label: 'Luxury sedan', price_per_day: 6200, currency: 'THB', vehicle_type: 'sedan', transmission: 'automatic' },
  { id: 'foreign', label: 'Foreign currency', price_per_day: 120, currency: 'USD', vehicle_type: 'sedan' },
]);
vi.mock('@/hooks/useVehicles', () => ({ useVehicles: () => ({ vehicles, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/crosssell', () => ({ CrossSellSection: () => null }));
vi.mock('@/components/transport/TransportHeroSearch', () => ({ TransportHeroSearch: () => null }));
vi.mock('@/components/transport/VehicleCard', () => ({ VehicleCard: ({ vehicle }: { vehicle: { label: string } }) => <article>{vehicle.label}</article> }));

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.search}{location.hash}</output><button onClick={() => navigate(-1)}>Back in history</button></>;
}
function mount(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><LocationProbe /><TransportIndex /></MemoryRouter>);
}
const rows = () => screen.queryAllByRole('article', { hidden: true }).map(row => row.textContent);

it('shows expensive and unquoted vehicles without a price filter; sorts known THB prices first in either direction', () => {
  const view = mount('/transport?sort=price_asc');
  expect(rows()).toEqual(['Basic sedan', 'Luxury sedan', 'Unknown price', 'Foreign currency']);
  view.unmount();
  mount('/transport?sort=price_desc');
  expect(rows()).toEqual(['Luxury sedan', 'Basic sedan', 'Unknown price', 'Foreign currency']);
});

it('reads price from a link, preserves unrelated params and hash on reset, and restores the range on browser back', async () => {
  mount('/transport?utm_campaign=holiday&maxPrice=5000#catalog');
  expect(rows()).toEqual(['Basic sedan']);
  fireEvent.click(screen.getByRole('button', { name: /filters/i }));
  const dialog = screen.getByRole('dialog', { name: 'Vehicle filters' });
  expect(within(dialog).getByRole('textbox', { name: 'Maximum' })).toHaveValue('5000');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Reset' }));
  expect(rows()).toEqual(['Basic sedan']);
  expect(screen.getByTestId('location')).toHaveTextContent('?utm_campaign=holiday&maxPrice=5000#catalog');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const trigger = screen.getByRole('button', { name: 'Vehicle filters' });
  await waitFor(() => expect(trigger).toHaveFocus());
  fireEvent.click(trigger);
  const reopened = screen.getByRole('dialog', { name: 'Vehicle filters' });
  expect(within(reopened).getByRole('textbox', { name: 'Maximum' })).toHaveValue('5000');
  fireEvent.click(within(reopened).getByRole('button', { name: 'Reset' }));
  fireEvent.click(within(reopened).getByRole('button', { name: 'Show vehicles' }));
  expect(rows()).toEqual(['Unknown price', 'Basic sedan', 'Luxury sedan', 'Foreign currency']);
  expect(screen.getByTestId('location')).toHaveTextContent('?utm_campaign=holiday#catalog');
  expect(screen.getByRole('button', { name: 'Vehicle filters' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Back in history' }));
  expect(rows()).toEqual(['Basic sedan']);
});

it('does not silently drop a reversed price filter or pass unquoted vehicles as zero-price matches', () => {
  const view = mount('/transport?minPrice=6000&maxPrice=2000');
  expect(screen.getByText('Invalid price range')).toBeVisible();
  expect(rows()).toEqual([]);
  view.unmount();
  mount('/transport?maxPrice=0');
  expect(screen.getByText('No vehicles found')).toBeVisible();
  expect(rows()).toEqual([]);
});

it('prevents applying an invalid draft, discards on Cancel, and commits a valid range with two repeated choices together', () => {
  mount('/transport?sort=price_asc&ref=campaign');
  const trigger = screen.getByRole('button', { name: 'Vehicle filters' });
  fireEvent.click(trigger);
  let dialog = screen.getByRole('dialog', { name: 'Vehicle filters' });
  const edit = (label: string, value: string) => fireEvent.change(within(dialog).getByRole('textbox', { name: label }), { target: { value } });
  edit('Minimum', '6000');
  edit('Maximum', '2000');
  expect(within(dialog).getByRole('button', { name: 'Show vehicles' })).toBeDisabled();
  expect(screen.getByTestId('location')).toHaveTextContent('?sort=price_asc&ref=campaign');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(rows()).toEqual(['Basic sedan', 'Luxury sedan', 'Unknown price', 'Foreign currency']);
  fireEvent.click(trigger);
  dialog = screen.getByRole('dialog', { name: 'Vehicle filters' });
  expect(within(dialog).getByRole('textbox', { name: 'Minimum' })).toHaveValue('');
  edit('Maximum', '5000');
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Automatic' }));
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Manual' }));
  expect(screen.getByTestId('location')).not.toHaveTextContent('transmission=');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Show vehicles' }));
  const url = new URLSearchParams(screen.getByTestId('location').textContent ?? '');
  expect(url.get('maxPrice')).toBe('5000');
  expect(url.getAll('transmission')).toEqual(['automatic', 'manual']);
  expect(url.get('sort')).toBe('price_asc');
  expect(url.get('ref')).toBe('campaign');
  expect(rows()).toEqual(['Basic sedan']);
});
