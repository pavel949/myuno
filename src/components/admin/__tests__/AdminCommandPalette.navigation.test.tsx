import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminCommandPalette } from '../AdminCommandPalette';

const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/ui/command', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return {
    CommandDialog: Wrapper, CommandEmpty: Wrapper, CommandList: Wrapper,
    CommandSeparator: () => null, CommandInput: ({ placeholder }: { placeholder: string }) => <input placeholder={placeholder} />,
    CommandGroup: ({ children, heading }: { children: React.ReactNode; heading: string }) => <section aria-label={heading}>{children}</section>,
    CommandItem: ({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) => <button onClick={onSelect}>{children}</button>,
  };
});
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function setup() {
  const close = vi.fn();
  render(<MemoryRouter><AdminCommandPalette open onOpenChange={close} /><Location /></MemoryRouter>);
  return close;
}
afterEach(() => { cleanup(); state.language = 'en'; });

describe('admin command destinations', () => {
  it.each([
    ['en', 'Navigation', ['Today', 'Inbox', 'Orders', 'Catalog', 'Participants']],
    ['ru', 'Навигация', ['Сегодня', 'Входящие', 'Заказы', 'Каталог', 'Участники']],
    ['th', 'การนำทาง', ['วันนี้', 'กล่องขาเข้า', 'คำสั่งซื้อ', 'แคตตาล็อก', 'ผู้เข้าร่วม']],
  ])('uses the workspace main destinations in %s', (language, heading, labels) => {
    state.language = language as string;
    setup();
    const navigation = screen.getByRole('region', { name: heading as string });
    expect(within(navigation).getAllByRole('button').map(button => button.textContent)).toEqual(labels);
    fireEvent.click(within(navigation).getByRole('button', { name: (labels as string[])[1] }));
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/inbox');
  });

  it.each(['/admin/review', '/admin/analytics', '/admin/tickets'])('opens the existing specialist destination %s and closes the palette', path => {
    const close = setup();
    const tools = screen.getByRole('region', { name: 'Tools & Pages' });
    const button = within(tools).getAllByRole('button').find(item => item.textContent?.endsWith(path));
    expect(button).toBeDefined();
    fireEvent.click(button!);
    expect(close).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('location')).toHaveTextContent(path);
  });

  it('retains creation commands and legacy deep-tool links', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Add New Provider' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/providers?action=new');
    fireEvent.click(screen.getByRole('button', { name: 'Add Service to Catalog' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/catalog?tab=services&action=new');
    const legacy = screen.getAllByRole('button').find(button => button.textContent?.endsWith('/admin/taxonomy'));
    expect(legacy).toBeDefined();
    fireEvent.click(legacy!);
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/taxonomy');
  });
});
