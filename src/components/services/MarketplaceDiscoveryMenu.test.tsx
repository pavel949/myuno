import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MarketplaceDiscoveryMenu } from './MarketplaceDiscoveryMenu';
import { MarketplaceFilterSheet } from './MarketplaceFilterSheet';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
const items = Array.from({ length: 9 }, (_, index) => ({ id: `record-${index}`, label: `Category ${index}` }));
describe('shared marketplace discovery', () => {
  it('keeps six primary records visible and exposes every remaining record through the actual sheet', async () => {
    const select = vi.fn();
    render(<MemoryRouter><MarketplaceDiscoveryMenu title="Categories" items={items} onSelect={select} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Category 5' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Category 8' })).toBeNull();
    const all = screen.getByRole('button', { name: 'All categories' });
    fireEvent.click(all);
    const dialog = screen.getByRole('dialog', { name: 'Categories' });
    expect(within(dialog).getAllByRole('button', { name: /^Category/ })).toHaveLength(9);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Category 8' }));
    expect(select).toHaveBeenCalledExactlyOnceWith('record-8');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(all).toHaveFocus());
  });
  it('preserves native navigation links instead of turning category routes into fake offerings', () => {
    render(<MemoryRouter><MarketplaceDiscoveryMenu title="Categories" items={[{ id: 'yachts', label: 'Yachts', href: '/yachts' }]} onSelect={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Yachts' })).toHaveAttribute('href', '/yachts');
    expect(screen.queryByRole('button', { name: 'All categories' })).toBeNull();
    expect(screen.queryByText(/available|confirmed|free/i)).toBeNull();
  });
  it('does not invent categories when the recorded category list is empty', () => {
    render(<MemoryRouter><MarketplaceDiscoveryMenu title="Categories" items={[]} onSelect={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByRole('region')).toBeNull();
  });
  it('keeps filter controls out of the entry screen and restores trigger focus on Escape', async () => {
    render(<MarketplaceFilterSheet title="Experience filters" activeCount={2}><label>Sort<select defaultValue="price"><option value="price">Price</option></select></label></MarketplaceFilterSheet>);
    expect(screen.queryByRole('combobox')).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Experience filters' });
    fireEvent.click(trigger);
    expect(screen.getByRole('combobox', { name: 'Sort' })).toBeVisible();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
