import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AboutPage from '../info/AboutPage';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
afterEach(cleanup);
it.each([
 ['en', 'About myUNO', 'Who we serve', 'Contacts'],
 ['ru', 'О myUNO', 'Для кого мы работаем', 'Контакты'],
 ['th', 'เกี่ยวกับ myUNO', 'เราให้บริการใคร', 'ข้อมูลติดต่อ'],
])('renders About body and actions in %s', (language, title, section, contact) => {
 state.language = language;
 render(<MemoryRouter><AboutPage /></MemoryRouter>);
 expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
 expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
 expect(screen.getByRole('button', { name: contact })).toBeInTheDocument();
 if (language === 'th') {
  expect(screen.getByText(/เราไม่ได้ให้บริการเหล่านี้ด้วยตนเอง/)).toBeInTheDocument();
  expect(screen.getByText(/แชต อีเมล และ WhatsApp ในภาษาอังกฤษและรัสเซีย/)).toBeInTheDocument();
  expect(screen.queryByText('Who we serve')).not.toBeInTheDocument();
 }
});
