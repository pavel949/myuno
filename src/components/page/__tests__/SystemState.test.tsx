import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SystemState, SYSTEM_STATE_SPECS } from '../SystemState';

const lang = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => lang }));
afterEach(cleanup);

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('SystemState (Round 4A · S1)', () => {
  it('loading renders skeletons with a busy status, never a spinner', () => {
    wrap(<SystemState variant="loading" rows={3} />);
    const status = screen.getByRole('status', { name: 'Loading' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status.children).toHaveLength(3);
  });

  it('recoverable error is an alert with a retry action', () => {
    const retry = vi.fn();
    wrap(<SystemState variant="error" onAction={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load this');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('404 links home by default and empty states can link to the next action', () => {
    wrap(<SystemState variant="not_found" />);
    expect(screen.getByRole('link', { name: 'Go to main page' })).toHaveAttribute('href', '/');
    cleanup();
    wrap(<SystemState variant="empty" title="Nothing saved yet" actionLabel="Explore rentals" actionHref="/rent" />);
    expect(screen.getByRole('link', { name: 'Explore rentals' })).toHaveAttribute('href', '/rent');
  });

  it('every variant ships bilingual copy', () => {
    for (const spec of Object.values(SYSTEM_STATE_SPECS)) {
      expect(spec.en.title && spec.ru.title && spec.en.description && spec.ru.description).toBeTruthy();
    }
    lang.language = 'ru';
    wrap(<SystemState variant="offline" />);
    expect(screen.getByRole('status')).toHaveTextContent('Нет соединения');
  });
});
