import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { UniversalFilter } from '@/components/filters/UniversalFilter';
import { propertyFilterOptions } from '../../../../scripts/qa/combined-layout-fixture-data.mjs';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(cleanup);

it('renders and opens the real filter using the exact layout fixture hook payload', () => {
 const onChange = vi.fn();
 render(<UniversalFilter config={propertyFilterOptions.filterConfig} values={{}} onChange={onChange}>
  <button>Open fixture filters</button>
 </UniversalFilter>);
 fireEvent.click(screen.getByRole('button', { name: 'Open fixture filters' }));
 expect(screen.getByRole('dialog')).toBeVisible();
 // An invalid config:[] used by the previous harness throws during rendering,
 // before any geometry could be checked. Exercise submit too, not just shape.
 fireEvent.click(screen.getByRole('button', { name: /^Apply$/ }));
 expect(onChange).toHaveBeenCalledWith({});
});
