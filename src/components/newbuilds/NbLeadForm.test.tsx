import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { NbLeadForm } from './NbLeadForm';
const state = vi.hoisted(() => ({ insert: vi.fn(), attribution: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ insert: state.insert }) } }));
vi.mock('@/lib/newbuilds/attribution', () => ({ recordAttribution: state.attribution }));
vi.mock('@/lib/newbuilds/leadAttempt', () => ({ leadAttempt: async () => ({ id: '11111111-1111-4111-8111-111111111111', state: 'pending' }), completeLeadAttempt: async () => {}, startNewLeadAttempt: async () => {} }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
beforeEach(() => { vi.clearAllMocks(); state.attribution.mockResolvedValue({ attributionId: null }); state.insert.mockResolvedValue({ error: null }); });
function form() {
  const { container } = render(<NbLeadForm projectId="project" />);
  fireEvent.change(screen.getByPlaceholderText('Ваше имя *'), { target: { value: ' Synthetic ' } });
  fireEvent.change(screen.getByPlaceholderText('Телефон / WhatsApp *'), { target: { value: ' +66000000000 ' } });
  return container.querySelector('form')!;
}
it('allows one in-flight submission and sends the persisted attempt ID', async () => {
  let resolve!: (value: unknown) => void;
  state.insert.mockReturnValue(new Promise(done => { resolve = done; }));
  const element = form();
  fireEvent.submit(element); fireEvent.submit(element);
  await waitFor(() => expect(state.insert).toHaveBeenCalledTimes(1));
  expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({ id: '11111111-1111-4111-8111-111111111111', full_name: 'Synthetic', phone: '+66000000000', project_id: 'project' }));
  resolve({ error: null });
  await screen.findByText('Запрос отправлен');
  expect(state.success).toHaveBeenCalledTimes(1);
});
it('does not treat a duplicate constraint response as confirmed success', async () => {
  state.insert.mockResolvedValue({ error: { code: '23505' } });
  fireEvent.submit(form());
  await waitFor(() => expect(state.error).toHaveBeenCalled());
  expect(state.success).not.toHaveBeenCalled();
  expect(screen.queryByText('Запрос отправлен')).not.toBeInTheDocument();
});
