import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { todayFixtures, type TodayScenario } from './today.fixtures';
import { APP_ROUTES } from '@/lib/config/routes';

const mocks = vi.hoisted(() => ({ language: 'ru' as 'ru' | 'en' | 'th', scenario: 'populated' as TodayScenario, refetch: vi.fn(), database: vi.fn(() => { throw new Error('Real database forbidden'); }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/hooks/usePmsToday', () => ({ usePmsToday: () => ({ ...todayFixtures(mocks.language, mocks.scenario), refetch: mocks.refetch }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get: () => mocks.database() }) }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn() }));
import PmsTodayPage from '../PmsTodayPage';
function Boundary() { return <output data-testid="route-boundary">{useLocation().pathname}</output>; }
function mount(entry = APP_ROUTES.MC_TODAY) { render(<MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><PmsTodayPage /><Boundary /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); mocks.scenario = 'populated'; });
afterEach(() => { expect(mocks.database).not.toHaveBeenCalled(); cleanup(); });

describe.each(['ru', 'en'] as const)('isolated Today (%s)', language => {
  beforeEach(() => { mocks.language = language; });
  it('dispatches booking, request and unit links to the existing property boundary', () => {
    mount();
    for (const element of [screen.getAllByText(todayFixtures(language).arrivals[0].guest_name ?? '', { selector: 'p' })[0], screen.getByText('synthetic urgent request'), screen.getAllByText(todayFixtures(language).units[0].title)[0]]) {
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
  it('loading exposes no booking/request actions', () => {
    mocks.scenario = 'loading'; mount();
    expect(screen.getByRole('status', { name: language === 'ru' ? 'Загрузка сведений на сегодня' : 'Loading today’s data' })).toBeInTheDocument();
    expect(screen.queryAllByRole('link', { name: /Открыть объект|Open property/ })).toHaveLength(0);
  });
  it('query failure suppresses stale projections and all-clear data', () => {
    mocks.scenario = 'error'; mount();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryAllByRole('link', { name: /Открыть объект|Open property/ })).toHaveLength(0);
    expect(screen.queryByRole('region', { name: language === 'ru' ? 'Требует внимания' : 'Needs attention' })).not.toBeInTheDocument();
  });
  it('empty fixture has no item destinations', () => {
    mocks.scenario = 'empty'; mount();
    expect(screen.queryAllByRole('link', { name: /Открыть объект|Open property/ })).toHaveLength(0);
    expect(within(screen.getByRole('navigation')).getAllByRole('link')).toHaveLength(2);
  });
  it('no-properties destination is the existing properties route', () => {
    mocks.scenario = 'no-properties'; mount();
    fireEvent.click(screen.getByRole('link', { name: language === 'ru' ? 'Перейти к объектам' : 'Go to properties' }));
    expect(screen.getByTestId('route-boundary')).toHaveTextContent(APP_ROUTES.MC_PROPERTIES);
  });
});

describe.each(['en', 'ru', 'th'] as const)('Today task links (%s)', language => {
  beforeEach(() => { mocks.language = language; });
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
    if (scenario === 'truncated' || scenario === 'unknown-count') expect(screen.getByRole('alert')).toHaveTextContent(language === 'ru' ? 'неполная' : language === 'th' ? 'ไม่ครบถ้วน' : 'incomplete');
  });
});
