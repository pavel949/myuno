import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminUnoTeam from '../AdminUnoTeam';
import type { UnoTeamMember } from '@/hooks/useUnoTeamPermissions';

const state = vi.hoisted(() => ({ language: 'en', members: [] as UnoTeamMember[], write: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useUnoTeamPermissions', () => ({
  useUnoTeamMembers: () => ({ members: state.members, isLoading: false, updatePermission: state.write, grantAllPermissions: state.write }),
  VERTICALS: [], VERTICAL_LABELS: {},
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.write, functions: { invoke: state.write } } }));
const view = () => <QueryClientProvider client={new QueryClient()}><MemoryRouter><AdminUnoTeam /></MemoryRouter></QueryClientProvider>;
afterEach(cleanup);
beforeEach(() => {
  state.write.mockClear();
  state.members = [{ user_id: 'synthetic-member', full_name: 'Alex Example', email: 'alex@example.test', avatar_url: null, permissions: [] }];
});
describe('UNO Team filtered empty state', () => {
  it.each(['en', 'ru'])('explains a zero-result search and restores members after clearing (%s)', language => {
    state.language = language;
    const ru = language === 'ru';
    render(view());
    fireEvent.change(screen.getByPlaceholderText(ru ? 'Поиск по имени или email...' : 'Search by name or email...'), { target: { value: 'no-match' } });
    expect(screen.queryByText('Alex Example')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(ru ? 'Сотрудники не найдены' : 'No matching members');
    expect(screen.getByText(ru ? 'Найдено: 0 из 1' : '0 of 1 members')).toBeTruthy();
    expect(screen.queryByText(ru ? 'Нет сотрудников myUNO Team' : 'No myUNO Team members')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: ru ? 'Сбросить поиск' : 'Clear search' }));
    expect(screen.getByText('Alex Example')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    expect(state.write).not.toHaveBeenCalled();
  });
  it('retains the separate first-member empty state', () => {
    state.language = 'en'; state.members = [];
    render(view());
    expect(screen.getByText('No myUNO Team members')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });
});
