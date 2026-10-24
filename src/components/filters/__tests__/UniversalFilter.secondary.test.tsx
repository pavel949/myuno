import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { UniversalFilter, type FilterConfig } from '../UniversalFilter';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(cleanup);
const sections: FilterConfig['sections'] = [
  { id: 'guestFeatures', titleEn: 'Home preferences', titleRu: 'Пожелания', type: 'multi', options: [{ id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн' }] },
  { id: 'poolType', titleEn: 'Listing pool', titleRu: 'Бассейн объявления', secondary: true, type: 'multi', options: [{ id: 'shared', labelEn: 'Shared pool', labelRu: 'Общий бассейн' }] },
];
const config = { sections, secondaryGroup: { title: 'Exact listing details', description: 'Additional conditions from listing fields.' } };
it('keeps strict fields collapsed by default and exposes an accessible disclosure', () => {
 render(<UniversalFilter config={config} values={{}} onChange={() => {}} />);
 fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
 const disclosure = screen.getByRole('button', { name: 'Exact listing details' });
 expect(disclosure).toHaveAttribute('aria-expanded', 'false');
 expect(screen.getByRole('button', { name: 'Pool' })).toBeVisible();
 expect(screen.queryByRole('button', { name: 'Shared pool' })).toBeNull();
 fireEvent.click(disclosure);
 expect(screen.getByRole('button', { name: 'Shared pool' })).toBeVisible();
});
it('auto-expands active strict and unknown values, preserving independent predicates until individual removal', () => {
 const change = vi.fn();
 render(<UniversalFilter config={config} values={{ guestFeatures: ['pool'], poolType: ['shared', 'legacy'], future: ['saved'] }} onChange={change} />);
 fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
 expect(screen.getByRole('button', { name: 'Exact listing details (3)' })).toHaveAttribute('aria-expanded', 'true');
 fireEvent.click(screen.getByRole('button', { name: 'legacy' }));
 fireEvent.click(screen.getByRole('button', { name: /future: saved/ }));
 fireEvent.click(screen.getByRole('button', { name: /Apply/ }));
 expect(change).toHaveBeenCalledWith({ guestFeatures: ['pool'], poolType: ['shared'], future: [] });
});
it('keeps non-opted-in consumers flat and explicit reset clears saved unknown criteria', () => {
 const change = vi.fn();
 const view = render(<UniversalFilter config={{ sections }} values={{ poolType: ['shared'] }} onChange={change} />);
 fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
 expect(screen.getByRole('button', { name: 'Shared pool' })).toBeVisible();
 view.unmount();
 render(<UniversalFilter config={config} values={{ future: ['saved'], poolType: ['shared'] }} onChange={change} />);
 fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
 fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
 fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
 expect(change).toHaveBeenLastCalledWith({ guestFeatures: [], poolType: [] });
});

it('exposes an unknown saved budget without silently normalizing it', () => {
 const change = vi.fn();
 render(<UniversalFilter config={{ ...config, sections: [...sections, { id: 'priceLevel', titleEn: 'Budget', titleRu: 'Бюджет', type: 'price-level', options: [] }] }} values={{ priceLevel: 'legacy-budget' }} onChange={change} />);
 fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
 fireEvent.click(screen.getByRole('button', { name: 'priceLevel: legacy-budget' }));
 fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
 expect(change).toHaveBeenCalledWith({ priceLevel: null });
});

it('retains malformed multi-value budget until explicit removal without selecting a canonical tier', () => {
 const change = vi.fn();
 render(<UniversalFilter config={{ ...config, sections: [...sections, { id: 'priceLevel', titleEn: 'Budget', titleRu: 'Бюджет', type: 'price-level', options: [] }] }} values={{ priceLevel: ['1', 'legacy-budget'], guestFeatures: ['pool'] }} onChange={change} />);
 fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
 expect(screen.getByRole('button', { name: '฿' })).toHaveAttribute('aria-pressed', 'false');
 fireEvent.click(screen.getByRole('button', { name: /Apply/ }));
 expect(change).toHaveBeenLastCalledWith({ priceLevel: ['1', 'legacy-budget'], guestFeatures: ['pool'] });
 fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
 fireEvent.click(screen.getByRole('button', { name: 'priceLevel: 1, legacy-budget' }));
 fireEvent.click(screen.getByRole('button', { name: /Apply/ }));
 expect(change).toHaveBeenLastCalledWith({ priceLevel: null, guestFeatures: ['pool'] });
});
