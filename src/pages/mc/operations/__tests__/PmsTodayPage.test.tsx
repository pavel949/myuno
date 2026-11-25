import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { todayFixtures, type TodayScenario } from './today.fixtures';
import { APP_ROUTES } from '@/lib/config/routes';

const mocks = vi.hoisted(() => ({ language: 'ru' as 'ru' | 'en' | 'th', scenario: 'populated' as TodayScenario, unknownGuests: false, refetch: vi.fn(), database: vi.fn(() => { throw new Error('Real database forbidden'); }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/hooks/usePmsToday', () => ({ usePmsToday: () => { const data = todayFixtures(mocks.language, mocks.scenario); if (mocks.unknownGuests) data.arrivals = data.arrivals.map(booking => ({...booking,guests_count:null})); return { ...data, refetch: mocks.refetch }; } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get: () => mocks.database() }) }));
vi.mock('@/hooks/useBookingStatusHistory', () => ({ useBookingStatusHistory: () => ({ events: [], highlightIds: new Set() }) }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn() }));
import PmsTodayPage from '../PmsTodayPage';
function Boundary() {
  const { pathname, search, hash, state } = useLocation();
  return <><output data-testid="route-boundary">{pathname}{search}{hash}</output><output data-testid="chat-return">{state?.bookingChatReturnTo}</output></>;
}
function mount(entry: string = APP_ROUTES.MC_TODAY) { render(<MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><PmsTodayPage /><Boundary /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); mocks.scenario = 'populated'; mocks.unknownGuests = false; });
afterEach(() => { expect(mocks.database).not.toHaveBeenCalled(); cleanup(); });

describe.each(['ru', 'en'] as const)('isolated Today (%s)', language => {
  beforeEach(() => { mocks.language = language; });
  it('opens the exact stay and its conversation from Today', () => {
    mount('/mc/today?keep=yes');
    fireEvent.click(screen.getAllByRole('button', { name: /Открыть бронирование|Open booking/ })[0]);
    const booking = within(screen.getByRole('dialog'));
    expect(booking.getByRole('link', { name: /переписку с гостем|guest conversation/ }))
      .toHaveAttribute('href', '/mc/chat/booking/synthetic-booking');
    expect(booking.getByRole('link', { name: /Календарь и задачи|Property calendar/ }))
      .toHaveAttribute('href', '/mc/calendar?property=synthetic-property&date=2026-10-17');
    fireEvent.click(booking.getByRole('link', { name: /переписку с гостем|guest conversation/ }));
    expect(screen.getByTestId('route-boundary')).toHaveTextContent('/mc/chat/booking/synthetic-booking');
    expect(screen.getByTestId('chat-return')).toHaveTextContent('/mc/today?keep=yes');
  });
  it('keeps property destinations for request and unit rows', () => {
    mount();
    for (const element of [screen.getByText('synthetic urgent request'), screen.getAllByText(todayFixtures(language).units[0].title)[0]]) {
      fireEvent.click(element);
      expect(screen.getByTestId('route-boundary')).toHaveTextContent(APP_ROUTES.MC_PROPERTY_DETAIL('synthetic-property'));
    }
  });
  it('preserves phone action and safe utility navigation/refetch', () => {
    mount();
    expect(screen.getAllByRole('link', { name: /Позвонить гостю|Call guest/ })[0]).toHaveAttribute('href', 'tel:+000000000');
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Обновить' : 'Refresh' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
    for (const [name, path] of [[language === 'ru' ? 'Календарь' : 'Calendar', APP_ROUTES.MC_CALENDAR], [language === 'ru' ? 'Задачи' : 'Tasks', APP_ROUTES.MC_TASKS]]) {
      fireEvent.click(screen.getByRole('link', { name }));
      expect(screen.getByTestId('route-boundary')).toHaveTextContent(path);
    }
  });
  it('uses the shared page header and retains the named operational navigation', () => {
    mount();
    const header = screen.getByRole('heading', { level: 1, name: language === 'ru' ? 'Сегодня' : 'Today' }).closest('header')!;
    expect(header).toHaveClass('ds-section');
    expect(within(header).getByText(/ · (Phuket|Пхукет)$/)).toBeVisible();
    const navigation = within(header).getByRole('navigation', { name: language === 'ru' ? 'Навигация по операциям' : 'Operational navigation' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(3);
    fireEvent.click(within(navigation).getByRole('button', { name: language === 'ru' ? 'Обновить' : 'Refresh' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
  it('loading exposes no booking/request actions', () => {
    mocks.scenario = 'loading'; mount();
    expect(screen.getByRole('status', { name: language === 'ru' ? 'Загрузка сведений на сегодня' : 'Loading today’s data' })).toBeInTheDocument();
    expect(screen.queryAllByRole('link', { name: /Открыть объект|Open property/ })).toHaveLength(0);
  });
  it('query failure suppresses stale projections and all-clear data', () => {
    mocks.scenario = 'error'; mount();
    const alert = screen.getByRole('alert');
    fireEvent.click(within(alert).getByRole('button', { name: /Retry loading|Повторить загрузку/ }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
    expect(screen.queryAllByRole('link', { name: /Открыть объект|Open property/ })).toHaveLength(0);
    expect(screen.queryByRole('region', { name: language === 'ru' ? 'Требует внимания' : 'Needs attention' })).not.toBeInTheDocument();
  });
  it('empty fixture has no item destinations', () => {
    mocks.scenario = 'empty'; mount();
    expect(screen.queryAllByRole('link', { name: /Открыть объект|Open property/ })).toHaveLength(0);
    expect(within(screen.getByRole('navigation')).getAllByRole('link')).toHaveLength(3);
  });
  it('no-properties destination is the existing properties route', () => {
    mocks.scenario = 'no-properties'; mount();
    fireEvent.click(screen.getByRole('link', { name: language === 'ru' ? 'Перейти к объектам' : 'Go to properties' }));
    expect(screen.getByTestId('route-boundary')).toHaveTextContent(APP_ROUTES.MC_PROPERTIES);
  });
});

describe.each(['en', 'ru', 'th'] as const)('Today task links (%s)', language => {
  beforeEach(() => { mocks.language = language; });
  it('supports section jumping with focus and query preservation', () => {
    const entry = '/mc/today?keep=yes';
    mount(entry);
    const labels = language === 'ru' ? ['Перейти к разделу', 'Заезды'] : language === 'th' ? ['ไปที่ส่วนงาน', 'เช็คอิน'] : ['Jump to a work area', 'Arrivals'];
    const summary = screen.getByRole('list', { name: labels[0] });
    expect(within(summary).getAllByRole('link')).toHaveLength(6);
    fireEvent.click(within(summary).getByRole('link', { name: new RegExp(labels[1]) }));
    expect(screen.getByRole('heading', { level: 3, name: labels[1] })).toHaveFocus();
    expect(screen.getByTestId('route-boundary')).toHaveTextContent('/mc/today?keep=yes#today-arrivals');
  });
  it('routes preparation and CRM tasks with distinct source identity and exact return context', () => {
    const entry = '/mc/today?property=synthetic-property&keep=yes#work';
    mount(entry);
    const title = language === 'ru' ? 'Уборка перед заездом' : 'Pre-arrival cleaning';
    const tasks = [screen.getByText(title), screen.getByText('Contact guest')];
    for (const [i, element] of tasks.entries()) {
      const href = element.closest('a')!.getAttribute('href')!;
      const url = new URL(href, 'https://synthetic.invalid');
      expect(url.pathname).toBe('/mc/tasks');
      expect(url.searchParams.get('id')).toBe('shared-id');
      expect(url.searchParams.get('source')).toBe(i === 0 ? 'ops' : 'crm');
      expect(url.searchParams.get('company')).toBe('synthetic-company');
      expect(url.searchParams.get('returnTo')).toBe(entry);
    }
  });
  it('labels source and undated work without inventing a scheduled date', () => {
    mount();
    expect(screen.getByText(language === 'ru' ? 'Операции' : language === 'th' ? 'งานปฏิบัติการ' : 'Operations')).toBeVisible();
    expect(screen.getByText(language === 'ru' ? 'Дата не указана' : language === 'th' ? 'ไม่ได้บันทึกวันที่' : 'Date not recorded')).toBeVisible();
  });
  it.each(['error', 'loading', 'truncated', 'unknown-count'] as const)('does not expose task destinations or all-clear counts on %s', scenario => {
    mocks.scenario = scenario; mount();
    expect(screen.queryAllByRole('link', { name: /Open task|Открыть задачу|เปิดงาน/ })).toHaveLength(0);
    expect(screen.queryByText('Pre-arrival cleaning')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Tasks to act on|Задачи к выполнению|งานที่ต้องดำเนินการ/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /Jump to a work area|Перейти к разделу|ไปที่ส่วนงาน/ })).not.toBeInTheDocument();
    if (scenario === 'truncated' || scenario === 'unknown-count') expect(screen.getByRole('alert')).toHaveTextContent(language === 'ru' ? 'неполная' : language === 'th' ? 'ไม่ครบถ้วน' : 'incomplete');
  });
});

it('does not invent one guest when the arrival count is unknown', () => {
 mocks.language='en';mocks.unknownGuests=true;
 render(<MemoryRouter><PmsTodayPage /></MemoryRouter>);
 const arrivals=screen.getByRole('heading',{name:/Arrivals/}).closest('section')!;
 expect(arrivals.textContent).not.toContain('1 guests');
 expect(mocks.database).not.toHaveBeenCalled();
});
