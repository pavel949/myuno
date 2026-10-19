import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ language: 'ru', error: null as Error | null, pending: false, rows: [] as { id: string; title: string; title_ru: string; status: string; task_type: string }[], refetch: vi.fn(), complete: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useOperationalTasks', () => ({ useOperationalTasks: () => ({ tasks: state.rows, isLoading: false, error: state.error, refetch: state.refetch, completeTask: { isPending: state.pending, mutate: state.complete } }) }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn(), isTypingKey: () => false }));
import { CalendarTodayTasks } from '../CalendarTodayTasks';
beforeEach(() => { vi.clearAllMocks(); state.language = 'ru'; state.error = null; state.rows = []; state.pending = false; });
afterEach(cleanup);
describe.each(['ru', 'en'])('task error and mutation states (%s)', language => {
  it('shows an error/retry instead of no tasks after a failed source read', () => {
    state.language = language; state.error = new Error('denied');
    render(<CalendarTodayTasks propertyId="synthetic-home" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(language === 'ru' ? 'На сегодня задач нет' : 'No tasks scheduled for today')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Повторить' : 'Retry' }));
    expect(state.refetch).toHaveBeenCalledOnce();
  });
  it('disables duplicate completion and gives the control its task name', () => {
    state.language = language; state.pending = true;
    state.rows = [{ id: 'task-a', title: 'Clean synthetic home', title_ru: 'Уборка тестового объекта', task_type: 'cleaning', status: 'pending' }];
    render(<CalendarTodayTasks propertyId="synthetic-home" />);
    expect(screen.getByRole('button', { name: language === 'ru' ? 'Завершить задачу: Уборка тестового объекта' : 'Complete task: Clean synthetic home' })).toBeDisabled();
    expect(state.complete).not.toHaveBeenCalled();
  });
});
