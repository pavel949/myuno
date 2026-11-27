import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HomeUrgentHelp } from '@/components/home/HomeUrgentHelp';
import { APP_ROUTES } from '@/lib/config/routes';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'ru' }),
}));

describe('HomeUrgentHelp', () => {
  it('shows direct phone links and closes the help dialog', async () => {
    render(<MemoryRouter><HomeUrgentHelp /></MemoryRouter>);
    const trigger = screen.getByRole('button', { name: 'Срочная помощь' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Срочная помощь в Таиланде' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Скорая помощь 1669' })).toHaveAttribute('href', 'tel:1669');
    expect(screen.getByRole('link', { name: 'Полиция и экстренные службы 191' })).toHaveAttribute('href', 'tel:191');
    expect(screen.getByRole('link', { name: 'Туристическая полиция 1155' })).toHaveAttribute('href', 'tel:1155');
    expect(screen.getByRole('link', { name: 'Все экстренные контакты' })).toHaveAttribute('href', APP_ROUTES.SOS);
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
