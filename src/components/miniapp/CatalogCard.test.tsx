import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { CatalogCard } from './CatalogCard';

const state = vi.hoisted(() => ({ formatPrice: vi.fn((value: number) => `THB ${value}`) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => state }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/ui/optimized-image', () => ({ OptimizedImage: ({ alt }: { alt: string }) => <span>{alt}</span> }));
beforeEach(() => state.formatPrice.mockClear());
afterEach(cleanup);

function Destination() {
  const location = useLocation();
  return <output data-testid="destination">{location.pathname}{location.search}|{JSON.stringify(location.state)}</output>;
}

it('uses one real destination anchor and route state instead of a second click navigation', () => {
  const legacyClick = vi.fn();
  render(<MemoryRouter initialEntries={['/catalogue']}><Routes>
    <Route path="/catalogue" element={<CatalogCard title="Island tour" href="/experiences/island?source=catalogue" navigationState={{ returnTo: '/catalogue?type=tour' }} onClick={legacyClick} autoTranslatedFrom="ru" />} />
    <Route path="/experiences/:id" element={<Destination />} />
  </Routes></MemoryRouter>);
  const link = screen.getByRole('link', { name: 'Island tour' });
  expect(link.tagName).toBe('A');
  expect(link).toHaveAttribute('href', '/experiences/island?source=catalogue');
  expect(link.querySelector('a,button,input')).toBeNull();
  link.focus();
  expect(link).toHaveFocus();
  fireEvent.click(link);
  expect(screen.getByTestId('destination')).toHaveTextContent('/experiences/island?source=catalogue|{"returnTo":"/catalogue?type=tour"}');
  expect(legacyClick).not.toHaveBeenCalled();
});

it('keeps legacy pointer callbacks single and exposes an accessible keyboard target', () => {
  const onClick = vi.fn();
  render(<CatalogCard title="Legacy activity" onClick={onClick} />);
  const card = screen.getByRole('button', { name: 'Legacy activity' });
  expect(card).toHaveAttribute('tabindex', '0');
  expect(card.querySelector('button,a,input')).toBeNull();
  fireEvent.click(screen.getByText('Legacy activity', { selector: 'h3' }));
  expect(onClick).toHaveBeenCalledTimes(1);
});

it.each(['Enter', ' '])('activates a legacy card with %j without repeating or bubbling from a child', key => {
  const onClick = vi.fn();
  render(<CatalogCard title="Legacy activity" onClick={onClick} />);
  const card = screen.getByRole('button', { name: 'Legacy activity' });
  card.focus();
  fireEvent.keyDown(card, { key });
  fireEvent.keyDown(card, { key, repeat: true });
  fireEvent.keyDown(screen.getByRole('heading', { name: 'Legacy activity' }), { key });
  expect(onClick).toHaveBeenCalledTimes(1);
});

it('does not make a noninteractive card a keyboard control', () => {
  const { container } = render(<CatalogCard title="Static summary" />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('link')).toBeNull();
  expect(container.firstElementChild).not.toHaveAttribute('tabindex');
});

it.each(['125 USD', 'Price on request'])('renders complete priceLabel %j without reformatting or legacy suffixes', priceLabel => {
  render(<CatalogCard title="Recorded offer" price={125} priceLabel={priceLabel} pricePrefix="from" priceSuffix="/person" />);
  expect(screen.getByText(priceLabel, { exact: true })).toBeVisible();
  expect(screen.queryByText('/person')).toBeNull();
  expect(screen.queryByText('from')).toBeNull();
  expect(state.formatPrice).not.toHaveBeenCalled();
});

it('shows an explicit unknown label even without a numeric amount', () => {
  render(<CatalogCard title="Unknown amount" priceLabel="Ask for conditions" priceSuffix="/person" />);
  expect(screen.getByText('Ask for conditions')).toBeVisible();
  expect(screen.queryByText('/person')).toBeNull();
  expect(state.formatPrice).not.toHaveBeenCalled();
});

it('retains the legacy numeric formatter and unit, including a recorded zero', () => {
  render(<CatalogCard title="Legacy price" price={0} pricePrefix="from" priceSuffix="/person" />);
  expect(screen.getByText('THB 0', { exact: false })).toBeVisible();
  expect(screen.getByText('from')).toBeVisible();
  expect(screen.getByText('/person')).toBeVisible();
  expect(state.formatPrice).toHaveBeenCalledWith(0);
});
