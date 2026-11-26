import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ControlUsersTab } from './ControlUsersTab';
import { en } from '@/i18n/en';

const state = vi.hoisted(() => ({ rolesFailed: false, invoke: vi.fn() }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => en[key] ?? key }),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'current-admin' } }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from(table: string) {
      if (table === 'profiles') {
        return {
          select: () => ({
            order: () => ({
              limit: async () => ({
                data: [{ id: 'other-admin', full_name: 'Example administrator', email: 'example@myuno.test', phone: null, created_at: null, status: null }],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'user_roles') {
        return {
          select: () => ({
            in: async () => state.rolesFailed
              ? { data: null, error: new Error('Synthetic role read failure'), count: null }
              : { data: [{ user_id: 'other-admin', role: 'admin' }], error: null, count: 1 },
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    },
    functions: { invoke: state.invoke },
  },
}));

function showAccess() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<ControlUsersTab />, { wrapper });
}

beforeEach(() => {
  state.rolesFailed = false;
  state.invoke.mockReset();
});

it('withholds the account editor when the role lookup fails and restores it after retry', async () => {
  state.rolesFailed = true;
  showAccess();
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load data');
  expect(screen.queryByRole('button', { name: /Example administrator/ })).toBeNull();

  state.rolesFailed = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByRole('button', { name: /Example administrator/ })).toHaveTextContent('admin');
  expect(state.invoke).not.toHaveBeenCalled();
});

it('presents an unrecorded status and opens the account with a native button', async () => {
  showAccess();
  const editor = await screen.findByRole('button', { name: /Example administrator/ });
  expect(editor).toHaveTextContent('Status unavailable');
  expect(editor.tagName).toBe('BUTTON');
  fireEvent.click(editor);
  expect(editor).toHaveAttribute('aria-expanded', 'true');
  expect(screen.queryByRole('button', { name: en['admin.users.actions.suspend'] })).toBeNull();
  expect(state.invoke).not.toHaveBeenCalled();
});
