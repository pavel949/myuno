import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ConvertLeadToDealButton } from './ConvertLeadToDealButton';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
afterEach(cleanup);

const view = (id: string | null) => <MemoryRouter><ConvertLeadToDealButton convertedDealId={id} /></MemoryRouter>;

it('does not offer creation or navigate with missing or malformed deal links', () => {
  const mounted = render(view(null));
  expect(screen.queryByRole('button')).toBeNull();
  mounted.rerender(view('../another-company'));
  expect(screen.queryByRole('link')).toBeNull();
});

it('only opens a previously linked canonical deal', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  render(view(id));
  expect(screen.getByRole('link', { name: 'Открыть связанную сделку' })).toHaveAttribute('href', '/mc/sales/' + id);
});
