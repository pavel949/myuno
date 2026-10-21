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
