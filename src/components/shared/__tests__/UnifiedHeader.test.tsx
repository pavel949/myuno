import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UnifiedHeader } from '../UnifiedHeader';
vi.mock('@/hooks/useFeedbackSettings', () => ({ getFeedbackSettings: () => ({}) }));
afterEach(cleanup);
it('does not present a non-functional search on a read-only header', () => {
 render(<MemoryRouter><UnifiedHeader title="Страница" showBack={false} /></MemoryRouter>);
 expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
});
it('exposes a labelled controlled search when the feature supports it', () => {
 const change = vi.fn();
 render(<MemoryRouter><UnifiedHeader title="Услуги" showBack={false} searchPlaceholder="Поиск услуг" searchValue="" onSearchChange={change} /></MemoryRouter>);
 fireEvent.change(screen.getByRole('searchbox', { name: 'Поиск услуг' }), { target: { value: 'уборка' } });
 expect(change).toHaveBeenCalledWith('уборка');
});
it('keeps focus and the search control mounted when the overview becomes results', () => {
 const change = vi.fn();
 const tree = (overview: boolean) => <MemoryRouter><UnifiedHeader title="Услуги" compactOverview={overview} hideHeading={overview}
   searchPlaceholder="Поиск услуг" searchValue={overview ? '' : 'уборка'} onSearchChange={change}
   rightAction={<button>Фильтры</button>} /></MemoryRouter>;
 const { rerender, container } = render(tree(true));
 const search = screen.getByRole('searchbox', { name: 'Поиск услуг' });
 const toolbar = container.querySelector('[data-marketplace-toolbar]');
 expect(toolbar).toContainElement(search);
 expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Фильтры' }));
 expect(screen.queryByRole('heading')).not.toBeInTheDocument();
 search.focus();
 rerender(tree(false));
 expect(screen.getByRole('searchbox')).toBe(search);
 expect(search).toHaveFocus();
 expect(search).toHaveValue('уборка');
 expect(screen.getByRole('heading', { name: 'Услуги' })).toBeVisible();
 expect(screen.getByRole('button', { name: /назад|back/i })).toBeVisible();
});
