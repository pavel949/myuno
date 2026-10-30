import { webcrypto } from 'node:crypto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NbLeadForm } from './NbLeadForm';
const state = vi.hoisted(() => ({ insert: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ insert: state.insert }) } }));
vi.mock('@/lib/newbuilds/attribution', () => ({ recordAttribution: async () => ({ attributionId: null }) }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
// Use the real leadAttempt helper and actual sessionStorage across component lifetimes.
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => vi.unstubAllGlobals());
function fillAndSubmit(container: HTMLElement) {
  fireEvent.change(screen.getByPlaceholderText('Ваше имя *'), { target: { value: 'Synthetic' } });
  fireEvent.change(screen.getByPlaceholderText('Телефон / WhatsApp *'), { target: { value: '+66000000000' } });
  fireEvent.submit(container.querySelector('form')!);
}
it('retains the real attempt ID after lost acknowledgement, unmount/remount and retry without claiming a receipt', async () => {
  const stored = new Set<string>();
  state.insert.mockImplementation(async (payload: { id: string }) => {
    if (stored.has(payload.id)) return { error: { code: '23505' } };
    stored.add(payload.id);
    throw new Error('Synthetic response lost after persistence');
  });
  const first = render(<NbLeadForm projectId="project" />);
  fillAndSubmit(first.container);
  await waitFor(() => expect(state.error).toHaveBeenCalledTimes(1));
  const firstId = state.insert.mock.calls[0][0].id;
  first.unmount();
  const second = render(<NbLeadForm projectId="project" />);
  fillAndSubmit(second.container);
  await waitFor(() => expect(state.error).toHaveBeenCalledTimes(2));
  expect(state.insert.mock.calls[1][0].id).toBe(firstId);
  expect(stored.size).toBe(1);
  expect(state.success).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Отправить новый запрос' })).not.toBeInTheDocument();
});
it('does not replay an acknowledged enquiry on remount, and allows an explicit identical new enquiry', async () => {
  state.insert.mockResolvedValue({ error: null });
  const first = render(<NbLeadForm projectId="project" />);
  fillAndSubmit(first.container);
  await screen.findByRole('button', { name: 'Отправить новый запрос' });
  const firstId = state.insert.mock.calls[0][0].id;
  first.unmount();
  const second = render(<NbLeadForm projectId="project" />);
  fillAndSubmit(second.container);
  await screen.findByRole('button', { name: 'Отправить новый запрос' });
  expect(state.insert).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Отправить новый запрос' }));
  await screen.findByPlaceholderText('Ваше имя *');
  fillAndSubmit(second.container);
  await waitFor(() => expect(state.insert).toHaveBeenCalledTimes(2));
  await screen.findByRole('button', { name: 'Отправить новый запрос' });
  expect(state.insert.mock.calls[1][0].id).not.toBe(firstId);
  expect(state.success).toHaveBeenCalledTimes(2);
});
