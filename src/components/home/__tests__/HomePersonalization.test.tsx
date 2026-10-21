import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalStack } from '../SignalStack';
import { ActiveSituation } from '../ActiveSituation';
import { HomeActivityFeed } from '../HomeActivityFeed';
import { RoleSheet } from '../RoleSheet';

const state = vi.hoisted(() => ({
  language: 'ru',
  signals: {} as Record<string, unknown>, unavailablePersonas: [] as string[], isLoading: false, hasError: false, retry: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useRoleSignals', () => ({ useRoleSignals: () => ({ ...state, isAuthenticated: true }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
afterEach(cleanup);
beforeEach(() => { state.language = 'ru'; state.signals = {}; state.unavailablePersonas = []; state.isLoading = false; state.hasError = false; state.retry.mockReset(); });
const fakeSeed = { lead: 'Vet visit', leadRu: 'Приём ветеринара', value: 'Fri 15:00', tail: 'Dr. Amara', tailRu: 'Д-р Амара', state: 'active', isLive: false };
const realSignal = { lead: 'Transfer', leadRu: 'Трансфер', value: '13:20', tail: 'HKT → hotel', tailRu: 'HKT → отель', state: 'live', isLive: true };
describe('home account facts', () => {
  it('renders an honest empty state instead of seed appointments', () => {
    state.signals = { pet_owner: fakeSeed };
    render(<SignalStack personas={['pet_owner']} onRoleSheetOpen={vi.fn()} />, { wrapper });
    expect(screen.getByText('По выбранным темам пока нет обновлений.')).toBeInTheDocument();
    expect(screen.queryByText('Fri 15:00')).not.toBeInTheDocument();
    expect(screen.queryByText('В норме')).not.toBeInTheDocument();
  });
  it('separates loading, failure and empty states', () => {
    state.isLoading = true;
    const { rerender } = render(<SignalStack personas={['pet_owner']} onRoleSheetOpen={vi.fn()} />, { wrapper });
    expect(screen.getByRole('status')).toHaveTextContent('Загружаем');
    expect(screen.queryByText(/По выбранным темам пока нет/)).not.toBeInTheDocument();
    state.isLoading = false; state.hasError = true;
    rerender(<SignalStack personas={['pet_owner']} onRoleSheetOpen={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('не удалось');
    expect(screen.queryByText(/По выбранным темам пока нет/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(state.retry).toHaveBeenCalledOnce();
  });
  it('shows real secondary data even when primary is empty and guards legacy seed leakage', () => {
    state.signals = { pet_owner: fakeSeed, tourist: realSignal };
    render(<ActiveSituation personas={['pet_owner', 'tourist']} onRoleSheetOpen={vi.fn()} />, { wrapper });
    expect(screen.getByText('13:20')).toBeInTheDocument();
    expect(screen.queryByText('Fri 15:00')).not.toBeInTheDocument();
    expect(screen.queryByText(/В норме|PET|demo/i)).not.toBeInTheDocument();
  });
  it('uses localized real values and does not invent an activity history', () => {
    state.signals = { property_owner: { ...realSignal, value: 'Occupied', valueRu: 'Заселён' } };
    render(<><SignalStack personas={['property_owner']} onRoleSheetOpen={vi.fn()} /><HomeActivityFeed /></>, { wrapper });
    expect(screen.getByText('Заселён')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Мои бронирования и заявки/ })).toHaveAttribute('href', '/me');
    expect(screen.queryByText(/October|Начислен доход|Трансфер подтверждён/)).not.toBeInTheDocument();
  });
});
describe('explicit home customization', () => {
  const callbacks = () => ({ onClose: vi.fn(), onToggle: vi.fn(), onReorder: vi.fn() });
  it('never opens itself', () => {
    render(<RoleSheet open={false} personas={[]} {...callbacks()} />, { wrapper });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('separates contexts/interests and calls the existing preference callbacks', () => {
    const actions = callbacks();
    render(<RoleSheet open personas={['tourist', 'pet_owner']} {...actions} />, { wrapper });
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Настроить главную');
    expect(screen.getByText(/Права доступа/)).toBeInTheDocument();
    expect(screen.getByText(/Порядок отображения сохраняется на этом устройстве/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Контекст' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Интересы и образ жизни' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Выше: Питомцы' }));
    expect(actions.onReorder).toHaveBeenCalledWith(['pet_owner', 'tourist']);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить: Семья' }));
    expect(actions.onToggle).toHaveBeenCalledWith('family');
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(actions.onClose).toHaveBeenCalledOnce();
  });
  it.each(['busy', 'error'])('disables preference changes during %s but permits closing', status => {
    const actions = callbacks();
    render(<RoleSheet open personas={['tourist', 'pet_owner']} isBusy={status === 'busy'} hasError={status === 'error'} {...actions} />, { wrapper });
    expect(screen.getByRole('button', { name: 'Выше: Питомцы' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Добавить: Семья' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Убрать: Питомцы' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(actions.onClose).toHaveBeenCalledOnce();
  });
  it('localizes the same controls in English', () => {
    state.language = 'en';
    render(<RoleSheet open personas={['pet_owner']} {...callbacks()} />, { wrapper });
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Customize home');
    expect(screen.getByRole('button', { name: 'Remove: Pets' })).toBeInTheDocument();
    expect(screen.getByText(/Display order is saved on this device/)).toBeInTheDocument();
    expect(screen.queryByText('Your roles')).not.toBeInTheDocument();
  });
});

it('supports explicit open, Escape dismissal and reopening without changing selections', () => {
  const toggle = vi.fn();
  function ControlledSheet() {
    const [open, setOpen] = React.useState(false);
    return <><button onClick={() => setOpen(true)}>Open preferences</button><RoleSheet open={open} personas={['pet_owner']} onClose={() => setOpen(false)} onToggle={toggle} onReorder={vi.fn()} /></>;
  }
  render(<ControlledSheet />, { wrapper });
  fireEvent.click(screen.getByRole('button', { name: 'Open preferences' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Open preferences' }));
  expect(screen.getByRole('button', { name: 'Убрать: Питомцы' })).toBeInTheDocument();
  expect(toggle).not.toHaveBeenCalled();
});

it('distinguishes unavailable business summaries from an empty business account', () => {
  state.unavailablePersonas = ['local_services_provider'];
  render(<SignalStack personas={['local_services_provider']} onRoleSheetOpen={vi.fn()} />, { wrapper });
  expect(screen.getByText('Сводка бизнеса здесь пока недоступна.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Открыть рабочий кабинет' })).toHaveAttribute('href', '/vendor');
  expect(screen.queryByText(/По выбранным темам пока нет/)).not.toBeInTheDocument();
});


it('localizes preference controls and source states in Thai', () => {
  state.language = 'th';
  const { rerender } = render(<RoleSheet open personas={['pet_owner']} onClose={vi.fn()} onToggle={vi.fn()} onReorder={vi.fn()} />, { wrapper });
  expect(screen.getByRole('dialog')).toHaveAccessibleName('ปรับแต่งหน้าหลัก');
  expect(screen.getByRole('button', { name: 'นำออก: สัตว์เลี้ยง' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'ความสนใจและไลฟ์สไตล์' })).toBeInTheDocument();
  expect(screen.getByText(/ลำดับการแสดงผลจะบันทึกไว้บนอุปกรณ์นี้/)).toBeInTheDocument();
  expect(screen.getByText(/สิทธิ์เข้าถึงบัญชีและพื้นที่ทำงานจะไม่เปลี่ยนแปลง/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'เสร็จสิ้น' })).toBeEnabled();
  rerender(<><SignalStack personas={['pet_owner']} onRoleSheetOpen={vi.fn()} /><HomeActivityFeed /></>);
  expect(screen.getByText('ยังไม่มีอัปเดตสำหรับหัวข้อที่เลือก')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /การจองและคำขอของฉัน/ })).toHaveAttribute('href', '/me');
  state.isLoading = true;
  rerender(<SignalStack personas={['pet_owner']} onRoleSheetOpen={vi.fn()} />);
  expect(screen.getByRole('status')).toHaveTextContent('กำลังโหลดอัปเดตสำหรับหัวข้อที่เลือก…');
  state.isLoading = false; state.hasError = true;
  state.signals = { pet_owner: { ...realSignal, leadTh: 'รถรับส่ง 19 ต.ค.', valueTh: '13:20', tailTh: 'โรงแรม → HKT' } };
  rerender(<SignalStack personas={['pet_owner']} onRoleSheetOpen={vi.fn()} />);
  expect(screen.getByText('รถรับส่ง 19 ต.ค.')).toBeInTheDocument();
  expect(screen.getByText('โรงแรม → HKT')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('ไม่สามารถโหลดอัปเดตบางรายการสำหรับหัวข้อที่เลือกได้');
  fireEvent.click(screen.getByRole('button', { name: 'ลองอีกครั้ง' }));
  expect(state.retry).toHaveBeenCalledOnce();
});
