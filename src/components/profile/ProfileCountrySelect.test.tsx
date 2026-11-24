import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { ProfileCountrySelect } from './ProfileCountrySelect';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);

it('finds existing countries by code or name and commits only the selected ISO code', async () => {
  const change = vi.fn();
  render(<><label htmlFor="country-field">Nationality</label><ProfileCountrySelect id="country-field" value="TH" onChange={change} /></>);
  const trigger = screen.getByRole('button', { name: 'Nationality' });
  expect(trigger).toHaveTextContent('Thailand');
  fireEvent.click(trigger);
  const input = await screen.findByRole('combobox', { name: 'Search countries' });
  fireEvent.change(input, { target: { value: 'nonsense' } });
  expect(await screen.findByText('No matching countries')).toBeVisible();
  expect(change).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: 'GB' } });
  expect(await screen.findByRole('option', { name: 'United Kingdom' })).toBeVisible();
  fireEvent.change(input, { target: { value: 'United States' } });
  fireEvent.click(await screen.findByRole('option', { name: 'USA' }));
  expect(change).toHaveBeenCalledExactlyOnceWith('US');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
