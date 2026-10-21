import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CrossSellSection } from '../CrossSellSection';
vi.mock('framer-motion', () => ({ motion: { button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => <button onClick={onClick}>{children}</button> } }));
const state = vi.hoisted(() => ({ language: 'th' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/components/shared/ExploreVerticalsSheet', () => ({ ExploreVerticalsSheet: ({ trigger }: { trigger: React.ReactNode }) => trigger }));
afterEach(cleanup);
describe('property search cross-sell locale', () => {
  it.each([
    ['th', 'คุณอาจสนใจ', 'ทั้งหมด', 'บริการสำหรับบ้าน', 'กฎหมาย', 'การเดินทาง', 'ร้านค้า'],
    ['ru', 'Вам также понравится', 'Все', 'Домашний сервис', 'Юристы', 'Транспорт', 'Маркет'],
  ])('renders the property recommendations in %s', (language, heading, all, ...labels) => {
    state.language = language;
    render(<MemoryRouter><CrossSellSection currentVertical="property" /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: all })).toBeInTheDocument();
    labels.forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
  });
});
