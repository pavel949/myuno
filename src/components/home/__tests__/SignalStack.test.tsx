import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalStack } from '../SignalStack';
import type { RoleSignal } from '@/hooks/useRoleSignals';
import type { UserPersona } from '@/hooks/useUserPersonas';

const state = vi.hoisted(() => ({
  language: 'en',
  signals: {} as Partial<Record<UserPersona, RoleSignal>>,
  isLoading: false,
  hasError: false,
  unavailablePersonas: [] as UserPersona[],
  retry: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useRoleSignals', () => ({ useRoleSignals: () => state }));
const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
const props = { personas: ['pet_owner'] as UserPersona[], onRoleSheetOpen: vi.fn() };
const signal: RoleSignal = { lead: 'Pet-service order', leadRu: 'Заказ для питомца', leadTh: 'คำสั่งซื้อบริการสัตว์เลี้ยง', value: '13:20', tail: '19 Oct · pending', tailRu: '19 окт. · pending', tailTh: '19 ต.ค. · pending', isLive: true, state: 'live', href: '/orders/synthetic-pet-order/tracking' };

afterEach(cleanup);
beforeEach(() => {
  state.language = 'en'; state.signals = {}; state.isLoading = false;
  state.hasError = false; state.unavailablePersonas = []; state.retry.mockReset();
});

describe('compact topic-scoped updates', () => {
  it.each([
    ['ru', 'По выбранным темам пока нет обновлений.', 'Открыть «Моё»'],
    ['en', 'No updates for selected topics yet.', 'Open My account'],
    ['th', 'ยังไม่มีอัปเดตสำหรับหัวข้อที่เลือก', 'เปิดบัญชีของฉัน'],
  ])('renders a concise localized empty line and accessible account link in %s', (language, empty, account) => {
    state.language = language;
    render(<SignalStack {...props} />, { wrapper });
    const emptyLine = screen.getByText(empty);
    expect(emptyLine.parentElement).not.toHaveClass('border', 'bg-card', 'p-4');
    expect(screen.getByRole('link', { name: account })).toHaveAttribute('href', '/me');
    expect(screen.getByRole('link', { name: account })).toHaveClass('min-h-11', 'focus-visible:outline');
    expect(screen.queryByText(/all clear|no bookings|no requests|Всё в порядке|заявок нет/i)).not.toBeInTheDocument();
  });

  it('does not imply an empty account when no topics are selected', () => {
    render(<SignalStack {...props} personas={[]} />, { wrapper });
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('keeps loading and failed sources separate from empty results', () => {
    state.isLoading = true;
    const { rerender } = render(<SignalStack {...props} />, { wrapper });
    expect(screen.getByRole('status')).toHaveTextContent('Loading updates for selected topics…');
    expect(screen.queryByText('No updates for selected topics yet.')).not.toBeInTheDocument();
    state.isLoading = false; state.hasError = true;
    rerender(<SignalStack {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent('Some updates for selected topics could not be loaded.');
    expect(screen.queryByText('No updates for selected topics yet.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.retry).toHaveBeenCalledOnce();
  });

  it('preserves live records alongside an error and excludes synthetic records', () => {
    state.hasError = true;
    state.signals = { pet_owner: signal, tourist: { ...signal, value: 'Synthetic 17:00', isLive: false } };
    render(<SignalStack {...props} personas={['pet_owner', 'tourist']} />, { wrapper });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pet-service order.*13:20/ })).toHaveAttribute('href', '/orders/synthetic-pet-order/tracking');
    expect(screen.queryByText('Synthetic 17:00')).not.toBeInTheDocument();
    expect(screen.queryByText('No updates for selected topics yet.')).not.toBeInTheDocument();
  });

  it('labels an unsupported business summary without a false empty or loading result', () => {
    state.isLoading = true;
    state.unavailablePersonas = ['local_services_provider'];
    render(<SignalStack {...props} personas={['local_services_provider']} />, { wrapper });
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('The business summary is not available here yet.');
    expect(screen.getByRole('link', { name: 'Open business workspace' })).toHaveAttribute('href', '/vendor');
    expect(screen.queryByText('No updates for selected topics yet.')).not.toBeInTheDocument();
  });
});
