import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { todayFixtures, type TodayScenario } from './today.fixtures';
import { APP_ROUTES } from '@/lib/config/routes';

const mocks = vi.hoisted(() => ({ language: 'ru' as 'ru' | 'en', scenario: 'populated' as TodayScenario, refetch: vi.fn(), database: vi.fn(() => { throw new Error('Real database forbidden'); }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/hooks/usePmsToday', () => ({ usePmsToday: () => ({ ...todayFixtures(mocks.language, mocks.scenario), refetch: mocks.refetch }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get: () => mocks.database() }) }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn() }));
import PmsTodayPage from '../PmsTodayPage';
function Boundary() { return <output data-testid="route-boundary">{useLocation().pathname}</output>; }
function mount() { render(<MemoryRouter initialEntries={[APP_ROUTES.MC_TODAY]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><PmsTodayPage /><Boundary /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); mocks.scenario = 'populated'; });
afterEach(() => { expect(mocks.database).not.toHaveBeenCalled(); cleanup(); });

describe.each(['ru', 'en'] as const)('isolated Today (%s)', language => {
  beforeEach(() => { mocks.language = language; });
  it('dispatches booking, request and unit links to the existing property boundary', () => {
    mount();
    for (const element of [screen.getByText(todayFixtures(language).arrivals[0].guest_name ?? '', { selector: 'p' }), screen.getByText('synthetic urgent request'), screen.getAllByText(todayFixtures(language).units[0].title)[0]]) {
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
      fireEvent.click(screen.getByRole('link', { name, exact: true }));
      expect(screen.getByTestId('route-boundary')).toHaveTextContent(path);
    }
  });
  it('loading exposes no booking/request actions', () => {
    mocks.scenario = 'loading'; mount();
    expect(screen.getByRole('status')).toBeInTheDocument();
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