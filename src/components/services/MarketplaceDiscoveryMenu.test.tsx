import { useCataloguePanelDraft } from "@/hooks/useCataloguePanelDraft";
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

describe('marketplace filter panel draft lifecycle', () => {
  it('keeps edits local across Close and Escape, restores focus, and applies one batch', async () => {
    const commit = vi.fn();
    const initial = new URLSearchParams('district=Rawai&q=travel&ref=campaign');
    function DraftHarness() {
      const panel = useCataloguePanelDraft(['district', 'budget'], initial, commit);
      return <MarketplaceFilterSheet title="Catalogue filters" onApply={() => panel.apply(new URLSearchParams('district=Rawai&q=updated&ref=campaign'))} onOpenChange={panel.openChange}>
        <label>Area<input value={panel.values.get('district') ?? ''} onChange={e => {
          const value = e.target.value;
          panel.setValues(next => { next.set('district', value); return next; });
        }} /></label>
        <label>Budget<input value={panel.values.get('budget') ?? ''} onChange={e => {
          const value = e.target.value;
          panel.setValues(next => { next.set('budget', value); return next; });
        }} /></label>
      </MarketplaceFilterSheet>;
    }
    render(<DraftHarness />);
    const trigger = screen.getByRole('button', { name: 'Catalogue filters' });
    fireEvent.click(trigger);
    fireEvent.change(screen.getByRole('textbox', { name: 'Area' }), { target: { value: 'Kata' } });
    expect(commit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    expect(screen.getByRole('textbox', { name: 'Area' })).toHaveValue('Rawai');
    fireEvent.change(screen.getByRole('textbox', { name: 'Area' }), { target: { value: 'Patong' } });
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole('textbox', { name: 'Area' })).toHaveValue('Rawai');
    fireEvent.change(screen.getByRole('textbox', { name: 'Area' }), { target: { value: 'Kata' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Budget' }), { target: { value: 'low' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show offers' }));
    expect(commit).toHaveBeenCalledOnce();
    expect(commit.mock.calls[0][0].toString()).toBe('district=Kata&q=updated&ref=campaign&budget=low');
  });
});
