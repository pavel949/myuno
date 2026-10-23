import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({
  actor: 'actor-a', company: 'company-a', language: 'en',
  state: {} as Record<string, unknown>, mutate: vi.fn(), refetch: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.actor ? { id: fixture.actor } : null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: fixture.company ? { company_id: fixture.company } : null }) }));
vi.mock('@/hooks/useOperatingSpaceSetup', () => ({ useOperatingSpaceSetup: () => ({ ...fixture.state, refetch: fixture.refetch,
  change: { mutateAsync: fixture.mutate, isPending: false } }) }));
// Native select substitutes only Radix's portal; application selection handling remains real.
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: ReactNode; value: string; onValueChange: (value: string) => void }) =>
    <select aria-label="Configure space" value={value} onChange={event => onValueChange(event.target.value)}>{children}</select>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null, SelectValue: () => null,
}));
import { OperatingSpaceSettings } from '../OperatingSpaceSettings';
const row = { id: 'space-a', key: 'synthetic', name_en: 'Synthetic', name_ru: 'Тест', is_active: true };
const empty = () => ({ can_manage: true, spaces: [], members: [], properties: [], grants: [], assignments: [] });
function populated() { return { ...empty(), spaces: [row], members: [
  { id: 'member-a', user_id: 'account-a', display_name: 'Synthetic member', role: 'manager', is_active: true },
], properties: [{ id: 'property-a', title_en: 'Synthetic property', title_ru: null }], grants: [], assignments: [] }; }
beforeEach(() => {
  fixture.actor = 'actor-a'; fixture.company = 'company-a'; fixture.language = 'en';
  fixture.state = { data: empty(), isLoading: false, error: null }; fixture.mutate.mockReset().mockResolvedValue(undefined); fixture.refetch.mockReset();
  vi.stubGlobal('fetch', () => { throw Error('Production network forbidden'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('operating space configuration surface', () => {
  it('allows an empty company without creating staff, properties or spaces on mount', () => {
    render(<OperatingSpaceSettings />);
    expect(screen.getByText('No operating spaces yet. Create your first space below.')).toBeTruthy();
    expect(fixture.mutate).not.toHaveBeenCalled();
  });
  it('submits explicit bilingual space values and clears only after confirmed success', async () => {
    render(<OperatingSpaceSettings />);
    fireEvent.change(screen.getByLabelText('Space key'), { target: { value: 'synthetic' } });
    fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'Synthetic' } });
    fireEvent.change(screen.getByLabelText('Name (RU)'), { target: { value: 'Тест' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create space' }));
    await waitFor(() => expect(fixture.mutate).toHaveBeenCalledWith({ type: 'save', space: {
      key: 'synthetic', name_en: 'Synthetic', name_ru: 'Тест', is_active: true,
    } }));
    await waitFor(() => expect((screen.getByLabelText('Space key') as HTMLInputElement).value).toBe(''));
  });
  it('keeps entered values and shows an error when persistence is not confirmed', async () => {
    fixture.mutate.mockRejectedValue(Error('Synthetic failure'));
    render(<OperatingSpaceSettings />);
    fireEvent.change(screen.getByLabelText('Space key'), { target: { value: 'synthetic' } });
    fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'Synthetic' } });
    fireEvent.change(screen.getByLabelText('Name (RU)'), { target: { value: 'Тест' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create space' }));
    await screen.findByRole('alert');
    expect((screen.getByLabelText('Space key') as HTMLInputElement).value).toBe('synthetic');
    expect(screen.queryByText('Change saved')).toBeNull();
  });
  it('supports rename and explicit deactivation without changing space identity', async () => {
    fixture.state.data = populated(); render(<OperatingSpaceSettings />);
    fireEvent.click(screen.getByRole('button', { name: 'Rename Synthetic' }));
    expect((screen.getByLabelText('Space key') as HTMLInputElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save space' }));
    await waitFor(() => expect(fixture.mutate).toHaveBeenCalledWith({ type: 'save', space: { ...row, name_en: 'Renamed' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Synthetic' }));
    await waitFor(() => expect(fixture.mutate).toHaveBeenCalledWith({ type: 'save', space: { ...row, is_active: false } }));
  });
  it('requires explicit member/property selection and a nonblank assignment reason', async () => {
    fixture.state.data = populated(); render(<OperatingSpaceSettings />);
    fireEvent.change(screen.getByLabelText('Configure space'), { target: { value: 'space-a' } });
    expect(fixture.mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Synthetic member · manager' }));
    await waitFor(() => expect(fixture.mutate).toHaveBeenCalledWith({ type: 'grant', spaceId: 'space-a', memberId: 'member-a', active: true }));
    const assign = screen.getByRole('button', { name: 'Assign selected properties' }) as HTMLButtonElement;
    expect(assign.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Synthetic property' }));
    expect(assign.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Reason for assignment'), { target: { value: 'Explicit synthetic move' } });
    fireEvent.click(assign);
    await waitFor(() => expect(fixture.mutate).toHaveBeenCalledWith({ type: 'assign', spaceId: 'space-a', propertyIds: ['property-a'], reason: 'Explicit synthetic move' }));
  });
  it('separates load failure from empty state and permits retry', () => {
    fixture.state = { error: Error('Denied'), data: undefined, isLoading: false }; render(<OperatingSpaceSettings />);
    expect(screen.getByRole('alert')).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Create space' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(fixture.refetch).toHaveBeenCalledTimes(1);
  });
  it('clears unsaved inputs when actor or company changes', () => {
    const view = render(<OperatingSpaceSettings />);
    fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'Private draft' } });
    fixture.actor = 'actor-b'; view.rerender(<OperatingSpaceSettings />);
    expect((screen.getByLabelText('Name (EN)') as HTMLInputElement).value).toBe('');
    fireEvent.change(screen.getByLabelText('Name (EN)'), { target: { value: 'Other draft' } });
    fixture.company = 'company-b'; view.rerender(<OperatingSpaceSettings />);
    expect((screen.getByLabelText('Name (EN)') as HTMLInputElement).value).toBe('');
  });
  it('renders Russian empty instructions and hides the form when signed out', () => {
    fixture.language = 'ru'; const view = render(<OperatingSpaceSettings />);
    expect(screen.getByText('Рабочих пространств пока нет. Создайте первое ниже.')).toBeTruthy();
    fixture.actor = ''; view.rerender(<OperatingSpaceSettings />);
    expect(screen.queryByLabelText('Ключ пространства')).toBeNull();
  });
});
