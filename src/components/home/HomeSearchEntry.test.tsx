import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeSearchEntry } from './HomeSearchEntry';
const homeSearchIntents = [
  { id: 'holiday', query: 'mode=rent&tenancy=short', title: { ru: 'Для отдыха' } },
  { id: 'monthly', query: 'mode=rent&tenancy=medium', title: { ru: 'Пожить несколько месяцев' } },
  { id: 'long', query: 'mode=rent&tenancy=long', title: { ru: 'Поселиться надолго' } },
  { id: 'buy', query: 'mode=buy', title: { ru: 'Купить недвижимость' } },
];
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
afterEach(cleanup);
function Location() { const loc = useLocation(); const nav = useNavigate(); return <><output>{loc.pathname + loc.search}</output><button onClick={() => nav(-1)}>Back</button></>; }
it.each(homeSearchIntents)('navigates $id straight to canonical results and preserves it in history', intent => {
  render(<MemoryRouter><HomeSearchEntry /><Location /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Найти жильё на Пхукете/ }));
  expect(screen.getAllByRole('link').filter(a => a.getAttribute('href')?.startsWith('/property/search'))).toHaveLength(4);
  expect(screen.queryByRole('form')).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: new RegExp(intent.title.ru) }));
  expect(screen.getByRole('status')).toHaveTextContent(`/property/search?${intent.query}`);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('status')).toHaveTextContent('/');
});
it.each([{ title: 'Хочу сдавать в аренду', intent: 'rent' }, { title: 'Обсудить управление', intent: 'management' }])('routes owner $intent without authentication or premature onboarding', ({ title, intent }) => {
 render(<MemoryRouter><HomeSearchEntry /><Location /></MemoryRouter>);
 fireEvent.click(screen.getByRole('button', { name: /Найти жильё на Пхукете/ }));
 expect(screen.getByRole('heading', { name: 'У меня есть недвижимость' })).toBeVisible();
 fireEvent.click(screen.getByRole('link', { name: title }));
 expect(screen.getByRole('status')).toHaveTextContent(`/owner/management-landing?intent=${intent}`);
 expect(screen.queryByRole('dialog')).toBeNull();
});
